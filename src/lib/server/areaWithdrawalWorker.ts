import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";

import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

import { createSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const AREA_MINT_ADDRESS =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

const AREA_DECIMALS = 9;

type ClaimedWithdrawal = {
  id: string;
  user_id: string;
  wallet_address: string;
  amount: number | string;
  reward_count: number;
  retry_count: number;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

function parseSecretKey(value: string) {
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

  return new Uint8Array(parsed as number[]);
}

export function areaToRawAmount(
  areaAmount: bigint,
) {
  if (areaAmount <= 0n) {
    throw new Error(
      "AREA amount must be positive",
    );
  }

  return (
    areaAmount *
    10n ** BigInt(AREA_DECIMALS)
  );
}

export async function getAreaWithdrawalWorkerContext() {
  const rpcUrl =
    requireEnv("SOLANA_RPC_URL");

  const rpcSubscriptionsUrl =
    requireEnv("SOLANA_RPC_WS_URL");

  const rewardsWallet =
    address(
      requireEnv(
        "REWARDS_WALLET_ADDRESS",
      ),
    );

  const secretBytes =
    parseSecretKey(
      requireEnv(
        "REWARDS_WALLET_SECRET_KEY",
      ),
    );

  const rewardsSigner =
    await createKeyPairSignerFromBytes(
      secretBytes,
    );

  if (
    rewardsSigner.address !==
    rewardsWallet
  ) {
    throw new Error(
      "Rewards wallet secret key does not match REWARDS_WALLET_ADDRESS",
    );
  }

  const rpc =
    createSolanaRpc(rpcUrl);

  const rpcSubscriptions =
    createSolanaRpcSubscriptions(
      rpcSubscriptionsUrl,
    );

  return {
    rpc,
    rpcSubscriptions,
    rewardsSigner,
    rewardsWallet,

    mint: address(
      AREA_MINT_ADDRESS,
    ),

    decimals: AREA_DECIMALS,
  };
}

async function claimNextWithdrawal() {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase.rpc(
      "claim_next_withdrawal",
    );

  if (error) {
    throw new Error(
      `claim_next_withdrawal failed: ${error.message}`,
    );
  }

  const rows =
    (data ?? []) as ClaimedWithdrawal[];

  return rows[0] ?? null;
}

async function claimSpecificWithdrawal(
  withdrawalId: string,
) {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase.rpc(
      "claim_specific_withdrawal",
      {
        p_withdrawal_id:
          withdrawalId,
      },
    );

  if (error) {
    throw new Error(
      `claim_specific_withdrawal failed: ${error.message}`,
    );
  }

  const rows =
    (data ?? []) as ClaimedWithdrawal[];

  return rows[0] ?? null;
}

async function recordWithdrawalSignature(
  withdrawalId: string,
  transactionSignature: string,
) {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase.rpc(
      "record_area_withdrawal_signature",
      {
        p_withdrawal_id:
          withdrawalId,

        p_transaction_signature:
          transactionSignature,
      },
    );

  if (error) {
    throw new Error(
      `record_area_withdrawal_signature failed: ${error.message}`,
    );
  }

  if (
    data !== "signature_recorded" &&
    data !== "already_recorded"
  ) {
    throw new Error(
      `Withdrawal signature was not recorded: ${String(data)}`,
    );
  }

  return data;
}

async function completeWithdrawal(
  withdrawalId: string,
  transactionSignature: string,
) {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase.rpc(
      "complete_area_withdrawal",
      {
        p_withdrawal_id:
          withdrawalId,

        p_transaction_signature:
          transactionSignature,
      },
    );

  if (error) {
    throw new Error(
      `complete_area_withdrawal failed: ${error.message}`,
    );
  }

  return data;
}

async function failWithdrawal(
  withdrawalId: string,
  errorMessage: string,
) {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase.rpc(
      "fail_area_withdrawal",
      {
        p_withdrawal_id:
          withdrawalId,

        p_error_message:
          errorMessage,

        p_retryable: true,

        p_max_retries: 5,
      },
    );

  if (error) {
    console.error(
      "fail_area_withdrawal RPC failed:",
      error,
    );

    return null;
  }

  return data;
}

export async function preflightAreaTreasury(
  requiredAreaAmount: bigint,
) {
  const context =
    await getAreaWithdrawalWorkerContext();

  const rawRequiredAmount =
    areaToRawAmount(
      requiredAreaAmount,
    );

  const [treasuryAta] =
    await findAssociatedTokenPda({
      mint: context.mint,
      owner:
        context.rewardsWallet,
      tokenProgram:
        TOKEN_PROGRAM_ADDRESS,
    });

  const solBalanceResponse =
    await context.rpc
      .getBalance(
        context.rewardsWallet,
        {
          commitment:
            "confirmed",
        },
      )
      .send();

  const treasuryAtaInfo =
    await context.rpc
      .getAccountInfo(
        treasuryAta,
        {
          commitment:
            "confirmed",
          encoding:
            "base64",
        },
      )
      .send();

  if (!treasuryAtaInfo.value) {
    throw new Error(
      "Treasury AREA token account does not exist",
    );
  }

  const tokenBalanceResponse =
    await context.rpc
      .getTokenAccountBalance(
        treasuryAta,
        {
          commitment:
            "confirmed",
        },
      )
      .send();

  const tokenRawAmount =
    BigInt(
      tokenBalanceResponse.value.amount,
    );

  const solLamports =
    solBalanceResponse.value;

  const hasEnoughArea =
    tokenRawAmount >=
    rawRequiredAmount;

  const hasSolForFees =
    solLamports > 0n;

  return {
    treasury:
      context.rewardsWallet,

    treasuryAta,

    mint:
      context.mint,

    decimals:
      context.decimals,

    solLamports:
      solLamports.toString(),

    areaRawBalance:
      tokenRawAmount.toString(),

    areaUiBalance:
      tokenBalanceResponse.value
        .uiAmountString,

    requiredArea:
      requiredAreaAmount.toString(),

    requiredRawAmount:
      rawRequiredAmount.toString(),

    hasEnoughArea,

    hasSolForFees,

    ready:
      hasEnoughArea &&
      hasSolForFees,
  };
}

async function executeWithdrawal(
  withdrawal: ClaimedWithdrawal,
) {
  let transactionSignature:
    string | null = null;

  try {
    const context =
      await getAreaWithdrawalWorkerContext();

    const destinationWallet =
      address(
        withdrawal.wallet_address,
      );

    const areaAmount =
      BigInt(
        withdrawal.amount,
      );

    const rawAmount =
      areaToRawAmount(
        areaAmount,
      );

    const preflight =
      await preflightAreaTreasury(
        areaAmount,
      );

    if (!preflight.hasEnoughArea) {
      throw new Error(
        `Treasury does not have enough AREA. Required: ${areaAmount.toString()} AREA`,
      );
    }

    if (!preflight.hasSolForFees) {
      throw new Error(
        "Treasury does not have enough SOL for transaction fees.",
      );
    }

    const [treasuryAta] =
      await findAssociatedTokenPda({
        mint: context.mint,
        owner:
          context.rewardsWallet,
        tokenProgram:
          TOKEN_PROGRAM_ADDRESS,
      });

    const [destinationAta] =
      await findAssociatedTokenPda({
        mint: context.mint,
        owner:
          destinationWallet,
        tokenProgram:
          TOKEN_PROGRAM_ADDRESS,
      });

    const createDestinationAtaInstruction =
      getCreateAssociatedTokenIdempotentInstruction(
        {
          payer:
            context.rewardsSigner,

          ata:
            destinationAta,

          owner:
            destinationWallet,

          mint:
            context.mint,

          tokenProgram:
            TOKEN_PROGRAM_ADDRESS,
        },
      );

    const transferInstruction =
      getTransferCheckedInstruction(
        {
          source:
            treasuryAta,

          mint:
            context.mint,

          destination:
            destinationAta,

          authority:
            context.rewardsSigner,

          amount:
            rawAmount,

          decimals:
            context.decimals,
        },
      );

    const {
      value: latestBlockhash,
    } =
      await context.rpc
        .getLatestBlockhash({
          commitment:
            "confirmed",
        })
        .send();

    const transactionMessage =
      appendTransactionMessageInstructions(
        [
          createDestinationAtaInstruction,
          transferInstruction,
        ],

        setTransactionMessageLifetimeUsingBlockhash(
          latestBlockhash,

          setTransactionMessageFeePayerSigner(
            context.rewardsSigner,

            createTransactionMessage({
              version: 0,
            }),
          ),
        ),
      );

    const signedTransaction =
      await signTransactionMessageWithSigners(
        transactionMessage,
      );

    assertIsTransactionWithBlockhashLifetime(
      signedTransaction,
    );

    /*
     * Generate the transaction signature before broadcast.
     *
     * Once recorded in the DB, this withdrawal must never
     * be automatically re-queued without reconciliation.
     */
    transactionSignature =
      getSignatureFromTransaction(
        signedTransaction,
      );

    await recordWithdrawalSignature(
      withdrawal.id,
      transactionSignature,
    );

    const sendAndConfirm =
      sendAndConfirmTransactionFactory({
        rpc:
          context.rpc,

        rpcSubscriptions:
          context.rpcSubscriptions,
      });

    await sendAndConfirm(
      signedTransaction,
      {
        commitment:
          "confirmed",
      },
    );

    const completionResult =
      await completeWithdrawal(
        withdrawal.id,
        transactionSignature,
      );

    return {
      found: true as const,
      success: true as const,

      withdrawalId:
        withdrawal.id,

      amount:
        areaAmount.toString(),

      rawAmount:
        rawAmount.toString(),

      destination:
        destinationWallet,

      destinationAta,
      treasuryAta,

      transactionSignature,

      completionResult,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown AREA withdrawal error";

    console.error(
      "AREA withdrawal processing failed:",
      message,
    );

    /*
     * If no transaction signature exists yet,
     * the transaction has not crossed the
     * idempotency barrier and may be re-queued.
     *
     * If a signature already exists, never
     * automatically retry the withdrawal.
     * The transaction must first be reconciled
     * against Solana.
     */
    if (!transactionSignature) {
      await failWithdrawal(
        withdrawal.id,
        message,
      );
    } else {
      console.error(
        "Withdrawal has a transaction signature and must be reconciled before retry:",
        transactionSignature,
      );
    }

    return {
      found: true as const,
      success: false as const,

      withdrawalId:
        withdrawal.id,

      transactionSignature,

      error:
        message,
    };
  }
}

export async function processNextAreaWithdrawal() {
  const withdrawal =
    await claimNextWithdrawal();

  if (!withdrawal) {
    return {
      found: false as const,
    };
  }

  return executeWithdrawal(
    withdrawal,
  );
}

export async function processAreaWithdrawalById(
  withdrawalId: string,
) {
  const withdrawal =
    await claimSpecificWithdrawal(
      withdrawalId,
    );

  if (!withdrawal) {
    return {
      found: false as const,

      reason:
        "Withdrawal is not pending or does not exist.",
    };
  }

  return executeWithdrawal(
    withdrawal,
  );
}