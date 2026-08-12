import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import {
  createBurnCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import bs58 from "bs58";

const AREA_MINT_ADDRESS =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

const AREA_DECIMALS = 9;

const CONFIRM_TIMEOUT_MS = 60_000;
const CONFIRM_POLL_MS = 1_500;

type ClaimedBurn = {
  id: string;
  amount: number | string;
  raw_amount: number | string;
  retry_count: number;
};

type ReconcileBurn = {
  id: string;
  transaction_signature: string;
};

function requireEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(
      `${name} is missing`,
    );
  }

  return value;
}

function parseSecretKey(
  value: string,
): Uint8Array {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      "REWARDS_WALLET_SECRET_KEY must be a JSON array",
    );
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every(
      (item) =>
        Number.isInteger(item) &&
        item >= 0 &&
        item <= 255,
    )
  ) {
    throw new Error(
      "REWARDS_WALLET_SECRET_KEY must contain exactly 64 bytes",
    );
  }

  return new Uint8Array(
    parsed as number[],
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          "application/json",
      },
    },
  );
}

function sleep(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms,
      );
    },
  );
}

function createAdminClient() {
  return createClient(
    requireEnv(
      "SUPABASE_URL",
    ),
    requireEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

async function waitForConfirmation(
  connection: Connection,
  signature: string,
): Promise<void> {
  const startedAt =
    Date.now();

  while (
    Date.now() -
      startedAt <
    CONFIRM_TIMEOUT_MS
  ) {
    const response =
      await connection
        .getSignatureStatuses(
          [signature],
          {
            searchTransactionHistory:
              true,
          },
        );

    const status =
      response.value[0];

    if (status) {
      if (status.err) {
        throw new Error(
          `Solana burn transaction failed: ${JSON.stringify(
            status.err,
          )}`,
        );
      }

      if (
        status.confirmationStatus ===
          "confirmed" ||
        status.confirmationStatus ===
          "finalized"
      ) {
        return;
      }
    }

    await sleep(
      CONFIRM_POLL_MS,
    );
  }

  throw new Error(
    "Timed out waiting for burn transaction confirmation",
  );
}

async function reconcileBurns(
  supabase: SupabaseClient,
  connection: Connection,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "area_burns",
      )
      .select(
        "id, transaction_signature",
      )
      .eq(
        "status",
        "processing",
      )
      .not(
        "transaction_signature",
        "is",
        null,
      )
      .order(
        "processing_started_at",
        {
          ascending: true,
        },
      )
      .limit(10);

  if (error) {
    throw new Error(
      `Burn reconciliation query failed: ${error.message}`,
    );
  }

  const rows =
    (data ??
      []) as ReconcileBurn[];

  const results: Array<
    Record<string, unknown>
  > = [];

  for (const row of rows) {
    const signature =
      row.transaction_signature;

    try {
      const transaction =
        await connection
          .getTransaction(
            signature,
            {
              commitment:
                "confirmed",

              maxSupportedTransactionVersion:
                0,
            },
          );

      /*
       * null does NOT prove failure.
       *
       * Never retry a burn merely because
       * the RPC cannot currently find it.
       */
      if (!transaction) {
        results.push({
          burnId: row.id,
          state: "unresolved",
        });

        continue;
      }

      /*
       * Existing transaction succeeded.
       * Complete DB state without burning again.
       */
      if (
        transaction.meta &&
        transaction.meta.err ===
          null
      ) {
        const {
          data:
            completionResult,
          error:
            completionError,
        } =
          await supabase.rpc(
            "complete_area_burn",
            {
              p_burn_id:
                row.id,

              p_transaction_signature:
                signature,
            },
          );

        if (
          completionError
        ) {
          throw new Error(
            `complete_area_burn reconciliation failed: ${completionError.message}`,
          );
        }

        results.push({
          burnId: row.id,
          state: "completed",
          completionResult,
        });

        continue;
      }

      /*
       * Existing transaction is confirmed
       * failed on-chain.
       *
       * Only now is retry potentially safe.
       */
      const {
        data:
          failureResult,
        error:
          failureError,
      } =
        await supabase.rpc(
          "fail_area_burn",
          {
            p_burn_id:
              row.id,

            p_error_message:
              `Confirmed Solana burn failure: ${JSON.stringify(
                transaction.meta
                  ?.err ??
                  "unknown",
              )}`,

            p_retryable:
              true,

            p_max_retries:
              5,
          },
        );

      if (failureError) {
        throw new Error(
          `fail_area_burn reconciliation failed: ${failureError.message}`,
        );
      }

      results.push({
        burnId: row.id,

        state:
          "failed_retryable",

        failureResult,
      });
    } catch (error) {
      results.push({
        burnId: row.id,

        state:
          "reconciliation_error",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return results;
}

async function processNextBurn(
  supabase: SupabaseClient,
  connection: Connection,
) {
  let burn:
    ClaimedBurn |
    null = null;

  let transactionSignature:
    string | null = null;

  try {
    /*
     * ========================================
     * 1. Claim one pending burn
     * ========================================
     */

    const {
      data:
        claimData,
      error:
        claimError,
    } =
      await supabase.rpc(
        "claim_next_area_burn",
      );

    if (claimError) {
      throw new Error(
        `claim_next_area_burn failed: ${claimError.message}`,
      );
    }

    const rows =
      (claimData ??
        []) as ClaimedBurn[];

    burn =
      rows[0] ??
      null;

    if (!burn) {
      return {
        found: false as const,
      };
    }

    /*
     * ========================================
     * 2. Amount / decimals guard
     * ========================================
     */

    const areaAmount =
      BigInt(
        burn.amount,
      );

    const rawAmount =
      BigInt(
        burn.raw_amount,
      );

    const expectedRawAmount =
      areaAmount *
      10n **
        BigInt(
          AREA_DECIMALS,
        );

    /*
     * This prevents the old bug:
     *
     * 1 AREA = 1,000,000,000 raw
     * NOT raw amount 1.
     */
    if (
      rawAmount !==
      expectedRawAmount
    ) {
      throw new Error(
        [
          "Burn raw amount mismatch.",
          `AREA=${areaAmount.toString()}`,
          `expectedRaw=${expectedRawAmount.toString()}`,
          `storedRaw=${rawAmount.toString()}`,
        ].join(" "),
      );
    }

    if (
      areaAmount <= 0n
    ) {
      throw new Error(
        "Burn amount must be positive",
      );
    }

    /*
     * ========================================
     * 3. Treasury signer
     * ========================================
     */

    const treasury =
      new PublicKey(
        requireEnv(
          "REWARDS_WALLET_ADDRESS",
        ),
      );

    const treasuryKeypair =
      Keypair
        .fromSecretKey(
          parseSecretKey(
            requireEnv(
              "REWARDS_WALLET_SECRET_KEY",
            ),
          ),
        );

    if (
      !treasuryKeypair
        .publicKey
        .equals(
          treasury,
        )
    ) {
      throw new Error(
        "Rewards secret key does not match REWARDS_WALLET_ADDRESS",
      );
    }

    /*
     * ========================================
     * 4. AREA mint / treasury ATA
     * ========================================
     */

    const mint =
      new PublicKey(
        AREA_MINT_ADDRESS,
      );

    const treasuryAta =
      getAssociatedTokenAddressSync(
        mint,
        treasury,
        false,
        TOKEN_PROGRAM_ID,
      );

    /*
     * ========================================
     * 5. Treasury preflight
     * ========================================
     */

    const solLamports =
      await connection
        .getBalance(
          treasury,
          "confirmed",
        );

    if (
      solLamports <= 0
    ) {
      throw new Error(
        "Treasury does not have SOL for burn transaction fees",
      );
    }

    const treasuryAccount =
      await getAccount(
        connection,
        treasuryAta,
        "confirmed",
        TOKEN_PROGRAM_ID,
      );

    if (
      treasuryAccount
        .amount <
      rawAmount
    ) {
      throw new Error(
        `Treasury does not have enough AREA to burn. Required: ${areaAmount.toString()} AREA`,
      );
    }

    /*
     * ========================================
     * 6. BurnChecked
     * ========================================
     */

    const burnInstruction =
      createBurnCheckedInstruction(
        treasuryAta,
        mint,
        treasury,
        rawAmount,
        AREA_DECIMALS,
        [],
        TOKEN_PROGRAM_ID,
      );

    /*
     * ========================================
     * 7. Blockhash
     * ========================================
     */

    const latestBlockhash =
      await connection
        .getLatestBlockhash(
          "confirmed",
        );

    /*
     * ========================================
     * 8. Build transaction
     * ========================================
     */

    const transaction =
      new Transaction({
        feePayer:
          treasury,

        blockhash:
          latestBlockhash
            .blockhash,

        lastValidBlockHeight:
          latestBlockhash
            .lastValidBlockHeight,
      });

    transaction.add(
      burnInstruction,
    );

    transaction.sign(
      treasuryKeypair,
    );

    /*
     * ========================================
     * 9. Predetermined transaction signature
     * ========================================
     */

    const signatureBytes =
      transaction
        .signatures[0]
        ?.signature;

    if (!signatureBytes) {
      throw new Error(
        "Failed to generate burn transaction signature",
      );
    }

    /*
     * IMPORTANT:
     * confirmedSignature is always string.
     *
     * This removes the string|null TS error.
     */
    const confirmedSignature =
      bs58.encode(
        signatureBytes,
      );

    transactionSignature =
      confirmedSignature;

    /*
     * ========================================
     * 10. Idempotency barrier
     *
     * Record signature BEFORE broadcast.
     * ========================================
     */

    const {
      data:
        signatureResult,
      error:
        signatureError,
    } =
      await supabase.rpc(
        "record_area_burn_signature",
        {
          p_burn_id:
            burn.id,

          p_transaction_signature:
            confirmedSignature,
        },
      );

    if (
      signatureError
    ) {
      throw new Error(
        `record_area_burn_signature failed: ${signatureError.message}`,
      );
    }

    if (
      signatureResult !==
        "signature_recorded" &&
      signatureResult !==
        "already_recorded"
    ) {
      throw new Error(
        `Burn signature was not recorded: ${String(
          signatureResult,
        )}`,
      );
    }

    /*
     * ========================================
     * 11. Broadcast
     * ========================================
     */

    const serializedTransaction =
      transaction.serialize();

    const rpcSignature =
      await connection
        .sendRawTransaction(
          serializedTransaction,
          {
            skipPreflight:
              false,

            preflightCommitment:
              "confirmed",

            maxRetries:
              3,
          },
        );

    if (
      rpcSignature !==
      confirmedSignature
    ) {
      throw new Error(
        "RPC returned a different burn transaction signature",
      );
    }

    /*
     * ========================================
     * 12. Confirm
     * ========================================
     */

    await waitForConfirmation(
      connection,
      confirmedSignature,
    );

    /*
     * ========================================
     * 13. Complete DB state
     * ========================================
     */

    const {
      data:
        completionResult,
      error:
        completionError,
    } =
      await supabase.rpc(
        "complete_area_burn",
        {
          p_burn_id:
            burn.id,

          p_transaction_signature:
            confirmedSignature,
        },
      );

    if (
      completionError
    ) {
      throw new Error(
        `complete_area_burn failed: ${completionError.message}`,
      );
    }

    return {
      found: true as const,
      success: true as const,

      burnId:
        burn.id,

      amount:
        areaAmount
          .toString(),

      rawAmount:
        rawAmount
          .toString(),

      treasury:
        treasury
          .toBase58(),

      treasuryAta:
        treasuryAta
          .toBase58(),

      mint:
        mint
          .toBase58(),

      transactionSignature:
        confirmedSignature,

      completionResult,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "[AREA BURN WORKER] Burn failed:",
      {
        burnId:
          burn?.id ??
          null,

        transactionSignature,

        error:
          message,
      },
    );

    /*
     * No signature => nothing was broadcast
     * by this execution.
     *
     * Safe to retry.
     *
     * Signature exists => DO NOT requeue.
     * Reconciliation must resolve it.
     */
    if (
      burn &&
      !transactionSignature
    ) {
      try {
        const {
          data:
            failureResult,
          error:
            failError,
        } =
          await supabase.rpc(
            "fail_area_burn",
            {
              p_burn_id:
                burn.id,

              p_error_message:
                message,

              p_retryable:
                true,

              p_max_retries:
                5,
            },
          );

        if (
          failError
        ) {
          console.error(
            "[AREA BURN WORKER] fail_area_burn failed:",
            failError,
          );
        } else {
          console.log(
            "[AREA BURN WORKER] Failure result:",
            failureResult,
          );
        }
      } catch (
        failError
      ) {
        console.error(
          "[AREA BURN WORKER] Could not record failure:",
          failError,
        );
      }
    }

    return {
      found:
        burn !== null,

      success:
        false as const,

      burnId:
        burn?.id ??
        null,

      transactionSignature,

      requiresReconciliation:
        transactionSignature !==
        null,

      error:
        message,
    };
  }
}

Deno.serve(
  async (
    req: Request,
  ) => {
    try {
      if (
        req.method !==
        "POST"
      ) {
        return jsonResponse(
          {
            ok: false,

            error:
              "Method not allowed",
          },
          405,
        );
      }

      /*
       * ========================================
       * Private worker authentication
       * ========================================
       */

      const suppliedSecret =
        req.headers.get(
          "x-area-worker-secret",
        );

      if (
        suppliedSecret !==
        requireEnv(
          "AREA_WORKER_SECRET",
        )
      ) {
        return jsonResponse(
          {
            ok: false,

            error:
              "Unauthorized",
          },
          401,
        );
      }

      /*
       * ========================================
       * Supabase + Solana
       * ========================================
       */

      const supabase =
        createAdminClient();

      const connection =
        new Connection(
          requireEnv(
            "SOLANA_RPC_URL",
          ),
          "confirmed",
        );

      /*
       * ========================================
       * Existing signed burns FIRST
       * ========================================
       */

      const reconciliation =
        await reconcileBurns(
          supabase,
          connection,
        );

      /*
       * ========================================
       * Then at most ONE pending burn
       * ========================================
       */

      const burn =
        await processNextBurn(
          supabase,
          connection,
        );

      return jsonResponse({
        ok: true,
        reconciliation,
        burn,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "[AREA BURN WORKER] Fatal error:",
        message,
      );

      if (
        error instanceof Error &&
        error.stack
      ) {
        console.error(
          error.stack,
        );
      }

      return jsonResponse(
        {
          ok: false,
          error: message,
        },
        500,
      );
    }
  },
);