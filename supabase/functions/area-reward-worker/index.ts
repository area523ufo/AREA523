import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import {
  createBurnCheckedInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import { createClient } from "@supabase/supabase-js";

import bs58 from "bs58";

type RewardRow = {
  id: string;
  user_id: string;
  wallet_address: string;
  reward_type: string;
  source_id: string;
  amount: string | number;
  burn_amount: string | number;
  retry_count: number;
};

type RewardLedgerState = {
  transaction_signature: string | null;
};

function requireEnv(
  name: string,
): string {
  const value =
    Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing`,
    );
  }

  return value;
}

function getPositiveIntegerEnv(
  name: string,
  fallback: number,
): number {
  const raw =
    Deno.env.get(name)?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed =
    Number(raw);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `${name} must be a positive integer`,
    );
  }

  return parsed;
}

function loadKeypair(
  secretValue: string,
): Keypair {
  const trimmed =
    secretValue.trim();

  if (!trimmed) {
    throw new Error(
      "REWARDS_WALLET_SECRET_KEY is empty",
    );
  }

  if (
    trimmed.startsWith("[")
  ) {
    let parsed: unknown;

    try {
      parsed =
        JSON.parse(trimmed);
    } catch {
      throw new Error(
        "REWARDS_WALLET_SECRET_KEY is not valid JSON",
      );
    }

    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (value) =>
          typeof value ===
            "number" &&
          Number.isInteger(
            value,
          ) &&
          value >= 0 &&
          value <= 255,
      )
    ) {
      throw new Error(
        "Secret-key JSON must be an array of integers from 0 to 255",
      );
    }

    const bytes =
      Uint8Array.from(
        parsed,
      );

    if (
      bytes.length === 64
    ) {
      return Keypair.fromSecretKey(
        bytes,
      );
    }

    if (
      bytes.length === 32
    ) {
      return Keypair.fromSeed(
        bytes,
      );
    }

    throw new Error(
      `Invalid secret-key byte length: ${bytes.length}`,
    );
  }

  let decoded:
    Uint8Array;

  try {
    decoded =
      bs58.decode(trimmed);
  } catch (error) {
    throw new Error(
      `Unable to decode reward wallet secret: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }

  if (
    decoded.length === 64
  ) {
    return Keypair.fromSecretKey(
      decoded,
    );
  }

  if (
    decoded.length === 32
  ) {
    return Keypair.fromSeed(
      decoded,
    );
  }

  throw new Error(
    `Invalid secret-key length: ${decoded.length}`,
  );
}

function toBigIntAmount(
  value: string | number,
  fieldName: string,
): bigint {
  try {
    const amount =
      BigInt(String(value));

    if (amount < 0n) {
      throw new Error();
    }

    return amount;
  } catch {
    throw new Error(
      `${fieldName} is not a valid non-negative integer`,
    );
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return String(error);
}

function isValidRewardRow(
  value: unknown,
): value is RewardRow {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const row =
    value as Partial<RewardRow>;

  return (
    typeof row.id ===
      "string" &&
    typeof row.user_id ===
      "string" &&
    typeof row.wallet_address ===
      "string" &&
    typeof row.reward_type ===
      "string" &&
    typeof row.source_id ===
      "string" &&
    (
      typeof row.amount ===
        "string" ||
      typeof row.amount ===
        "number"
    ) &&
    (
      typeof row.burn_amount ===
        "string" ||
      typeof row.burn_amount ===
        "number"
    ) &&
    typeof row.retry_count ===
      "number"
  );
}

Deno.serve(
  async (request) => {
    if (
      request.method !==
      "POST"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Method not allowed",
        },
        {
          status: 405,
        },
      );
    }

    try {
      /*
       * ---------------------------------------
       * Worker authentication
       * ---------------------------------------
       */

      const workerSecret =
        requireEnv(
          "AREA_WORKER_SECRET",
        );

      const suppliedSecret =
        request.headers.get(
          "x-area-worker-secret",
        );

      if (
        suppliedSecret !==
        workerSecret
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "Unauthorized",
          },
          {
            status: 401,
          },
        );
      }

      /*
       * ---------------------------------------
       * Environment
       * ---------------------------------------
       */

      const supabaseUrl =
        requireEnv(
          "SUPABASE_URL",
        );

      const serviceRoleKey =
        requireEnv(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

      const rpc =
        Deno.env.get(
          "SOLANA_RPC_URL",
        )?.trim() ||
        clusterApiUrl(
          "mainnet-beta",
        );

      const mintAddress =
        requireEnv(
          "AREA_MINT_ADDRESS",
        );

      const expectedWalletAddress =
        requireEnv(
          "REWARDS_WALLET_ADDRESS",
        );

      const rewardWalletSecret =
        requireEnv(
          "REWARDS_WALLET_SECRET_KEY",
        );

      const maxRetries =
        getPositiveIntegerEnv(
          "REWARD_MAX_RETRIES",
          5,
        );

      const supabase =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession:
                false,
              autoRefreshToken:
                false,
            },
          },
        );

      const connection =
        new Connection(
          rpc,
          "confirmed",
        );

      let claimedReward:
        RewardRow | null =
        null;

      let transactionBroadcast =
        false;

      /*
       * ---------------------------------------
       * DB helpers
       * ---------------------------------------
       */

      async function recoverStaleRewards() {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "recover_stale_rewards",
            {
              p_stale_minutes:
                10,
            },
          );

        if (error) {
          throw new Error(
            `recover_stale_rewards failed: ${error.message}`,
          );
        }

        return Number(
          data ?? 0,
        );
      }

      async function claimNextReward():
        Promise<RewardRow | null> {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "claim_next_reward",
          );

        if (error) {
          throw new Error(
            `claim_next_reward failed: ${error.message}`,
          );
        }

        if (
          !Array.isArray(data)
        ) {
          throw new Error(
            "claim_next_reward returned an unexpected result",
          );
        }

        if (
          data.length === 0
        ) {
          return null;
        }

        const reward =
          data[0];

        if (
          !isValidRewardRow(
            reward,
          )
        ) {
          throw new Error(
            "claim_next_reward returned an invalid reward row",
          );
        }

        return reward;
      }

      async function getRewardLedgerState(
        rewardId: string,
      ): Promise<RewardLedgerState> {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "reward_ledger",
            )
            .select(
              "transaction_signature",
            )
            .eq(
              "id",
              rewardId,
            )
            .single();

        if (error) {
          throw new Error(
            `Unable to read reward ledger state: ${error.message}`,
          );
        }

        return {
          transaction_signature:
            typeof data
              .transaction_signature ===
            "string"
              ? data
                  .transaction_signature
              : null,
        };
      }

      async function saveTransactionSignature(
        rewardId: string,
        signature: string,
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "reward_ledger",
            )
            .update({
              transaction_signature:
                signature,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              rewardId,
            )
            .eq(
              "status",
              "processing",
            );

        if (error) {
          throw new Error(
            `Unable to save transaction signature: ${error.message}`,
          );
        }
      }

      async function clearTransactionSignature(
        rewardId: string,
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "reward_ledger",
            )
            .update({
              transaction_signature:
                null,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              rewardId,
            )
            .eq(
              "status",
              "processing",
            );

        if (error) {
          throw new Error(
            `Unable to clear transaction signature: ${error.message}`,
          );
        }
      }

      async function completeReward(
        rewardId: string,
        signature: string,
      ) {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "complete_reward",
            {
              p_reward_id:
                rewardId,

              p_transaction_signature:
                signature,
            },
          );

        if (error) {
          throw new Error(
            `complete_reward failed: ${error.message}`,
          );
        }

        const result =
          String(
            data ?? "",
          );

        if (
          result !==
            "completed" &&
          result !==
            "already_completed"
        ) {
          throw new Error(
            `complete_reward returned: ${result}`,
          );
        }

        return result;
      }

      async function failReward(
        rewardId: string,
        errorMessage: string,
        retryable: boolean,
      ) {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            "fail_reward",
            {
              p_reward_id:
                rewardId,

              p_error_message:
                errorMessage.slice(
                  0,
                  2000,
                ),

              p_retryable:
                retryable,

              p_max_retries:
                maxRetries,
            },
          );

        if (error) {
          throw new Error(
            `fail_reward failed: ${error.message}`,
          );
        }

        return String(
          data ?? "",
        );
      }

      async function recoverExistingTransaction(
        reward: RewardRow,
      ) {
        const state =
          await getRewardLedgerState(
            reward.id,
          );

        const signature =
          state
            .transaction_signature
            ?.trim();

        if (!signature) {
          return false;
        }

        const response =
          await connection
            .getSignatureStatuses(
              [
                signature,
              ],
              {
                searchTransactionHistory:
                  true,
              },
            );

        const status =
          response.value[0];

        if (
          status &&
          status.err ===
            null &&
          (
            status.confirmationStatus ===
              "confirmed" ||
            status.confirmationStatus ===
              "finalized"
          )
        ) {
          await completeReward(
            reward.id,
            signature,
          );

          return true;
        }

        if (
          status &&
          status.err !==
            null
        ) {
          await clearTransactionSignature(
            reward.id,
          );

          return false;
        }

        throw new Error(
          [
            "An existing transaction signature is unresolved.",
            `Signature: ${signature}`,
            "Worker stopped to prevent duplicate payment.",
          ].join("\n"),
        );
      }

      /*
       * ---------------------------------------
       * Reward processing
       * ---------------------------------------
       */

      try {
        const wallet =
          loadKeypair(
            rewardWalletSecret,
          );

        const actualWalletAddress =
          wallet.publicKey
            .toBase58();

        if (
          actualWalletAddress !==
          expectedWalletAddress
        ) {
          throw new Error(
            "Rewards wallet address mismatch",
          );
        }

        const mintPublicKey =
          new PublicKey(
            mintAddress,
          );

        const mint =
          await getMint(
            connection,
            mintPublicKey,
          );

        const solBalance =
          await connection
            .getBalance(
              wallet.publicKey,
            );

        if (
          solBalance <= 0
        ) {
          throw new Error(
            "Rewards wallet has no SOL for transaction fees",
          );
        }

        console.log(
          "[AREA REWARD WORKER] SOL:",
          solBalance /
            LAMPORTS_PER_SOL,
        );

        const rewardsAta =
          await getAssociatedTokenAddress(
            mintPublicKey,
            wallet.publicKey,
          );

        const rewardsAtaInfo =
          await connection
            .getAccountInfo(
              rewardsAta,
            );

        if (!rewardsAtaInfo) {
          throw new Error(
            "Rewards wallet AREA token account does not exist",
          );
        }

        const recoveredCount =
          await recoverStaleRewards();

        claimedReward =
          await claimNextReward();

        if (!claimedReward) {
          return Response.json({
            ok: true,
            recovered:
              recoveredCount,
            reward: {
              found: false,
            },
          });
        }

        const recovered =
          await recoverExistingTransaction(
            claimedReward,
          );

        if (recovered) {
          return Response.json({
            ok: true,
            recovered:
              recoveredCount,
            reward: {
              found: true,
              id:
                claimedReward.id,
              state:
                "recovered_completed",
            },
          });
        }

        let recipientWallet:
          PublicKey;

        try {
          recipientWallet =
            new PublicKey(
              claimedReward
                .wallet_address,
            );
        } catch {
          throw new Error(
            `Invalid recipient wallet address: ${claimedReward.wallet_address}`,
          );
        }

        const rewardAmount =
          toBigIntAmount(
            claimedReward.amount,
            "amount",
          );

        const burnAmount =
          toBigIntAmount(
            claimedReward
              .burn_amount,
            "burn_amount",
          );

        if (
          rewardAmount <= 0n
        ) {
          throw new Error(
            "Reward amount must be greater than zero",
          );
        }

        const tokenBase =
          10n **
          BigInt(
            mint.decimals,
          );

        const rewardRawAmount =
          rewardAmount *
          tokenBase;

        const burnRawAmount =
          burnAmount *
          tokenBase;

        const totalRequired =
          rewardRawAmount +
          burnRawAmount;

        const sourceBalance =
          await connection
            .getTokenAccountBalance(
              rewardsAta,
            );

        const sourceRawBalance =
          BigInt(
            sourceBalance
              .value.amount,
          );

        if (
          sourceRawBalance <
          totalRequired
        ) {
          throw new Error(
            "Insufficient AREA balance",
          );
        }

        const recipientTokenAccount =
          await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mintPublicKey,
            recipientWallet,
            false,
            "confirmed",
          );

        const latestBlockhash =
          await connection
            .getLatestBlockhash(
              "confirmed",
            );

        const transaction =
          new Transaction({
            feePayer:
              wallet.publicKey,

            blockhash:
              latestBlockhash
                .blockhash,

            lastValidBlockHeight:
              latestBlockhash
                .lastValidBlockHeight,
          });

        transaction.add(
          createTransferCheckedInstruction(
            rewardsAta,
            mintPublicKey,
            recipientTokenAccount
              .address,
            wallet.publicKey,
            rewardRawAmount,
            mint.decimals,
          ),
        );

        if (
          burnAmount > 0n
        ) {
          transaction.add(
            createBurnCheckedInstruction(
              rewardsAta,
              mintPublicKey,
              wallet.publicKey,
              burnRawAmount,
              mint.decimals,
            ),
          );
        }

        transaction.sign(
          wallet,
        );

        if (
          !transaction.signature
        ) {
          throw new Error(
            "Transaction signature was not generated",
          );
        }

        const expectedSignature =
          bs58.encode(
            transaction.signature,
          );

        /*
         * Critical:
         * persist deterministic signature
         * BEFORE network broadcast.
         */

        await saveTransactionSignature(
          claimedReward.id,
          expectedSignature,
        );

        const actualSignature =
          await connection
            .sendRawTransaction(
              transaction.serialize(),
              {
                skipPreflight:
                  false,

                maxRetries:
                  5,
              },
            );

        transactionBroadcast =
          true;

        if (
          actualSignature !==
          expectedSignature
        ) {
          throw new Error(
            "Transaction signature mismatch",
          );
        }

        const confirmation =
          await connection
            .confirmTransaction(
              {
                signature:
                  actualSignature,

                blockhash:
                  latestBlockhash
                    .blockhash,

                lastValidBlockHeight:
                  latestBlockhash
                    .lastValidBlockHeight,
              },
              "confirmed",
            );

        if (
          confirmation
            .value.err
        ) {
          throw new Error(
            `Solana transaction failed: ${JSON.stringify(
              confirmation
                .value.err,
            )}`,
          );
        }

        const completionResult =
          await completeReward(
            claimedReward.id,
            actualSignature,
          );

        return Response.json({
          ok: true,

          recovered:
            recoveredCount,

          reward: {
            found: true,

            id:
              claimedReward.id,

            state:
              completionResult,

            amount:
              rewardAmount
                .toString(),

            burned:
              burnAmount
                .toString(),

            transactionSignature:
              actualSignature,
          },
        });
      } catch (error) {
        const message =
          getErrorMessage(
            error,
          );

        console.error(
          "[AREA REWARD WORKER]",
          message,
        );

        if (
          claimedReward
        ) {
          try {
            /*
             * Never auto-retry once
             * broadcast may have happened.
             */

            const retryable =
              !transactionBroadcast &&
              !message.includes(
                "unresolved",
              ) &&
              !message.includes(
                "Invalid recipient wallet",
              ) &&
              !message.includes(
                "must be greater than zero",
              );

            const failureResult =
              await failReward(
                claimedReward.id,
                message,
                retryable,
              );

            console.error(
              "[AREA REWARD WORKER] Failure state:",
              failureResult,
            );
          } catch (
            failureError
          ) {
            console.error(
              "[AREA REWARD WORKER] Could not record failure:",
              getErrorMessage(
                failureError,
              ),
            );
          }
        }

        return Response.json(
          {
            ok: false,
            error:
              message,

            transactionBroadcast,

            rewardId:
              claimedReward?.id ??
              null,
          },
          {
            status: 500,
          },
        );
      }
    } catch (error) {
      console.error(
        "[AREA REWARD WORKER] Fatal:",
        error,
      );

      return Response.json(
        {
          ok: false,
          error:
            getErrorMessage(
              error,
            ),
        },
        {
          status: 500,
        },
      );
    }
  },
);