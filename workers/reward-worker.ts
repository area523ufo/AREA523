import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

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

import bs58 from "bs58";


// ======================================================
// TYPES
// ======================================================

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


// ======================================================
// ENV HELPERS
// ======================================================

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(
            `${name} is missing or empty in .env.local`
        );
    }

    return value;
}

function getPositiveIntegerEnv(
    name: string,
    fallback: number
): number {
    const raw = process.env[name]?.trim();

    if (!raw) {
        return fallback;
    }

    const parsed = Number(raw);

    if (
        !Number.isInteger(parsed) ||
        parsed <= 0
    ) {
        throw new Error(
            `${name} must be a positive integer.`
        );
    }

    return parsed;
}


// ======================================================
// ENV
// ======================================================

const SUPABASE_URL =
    requireEnv("SUPABASE_URL");

const SUPABASE_SERVICE_ROLE_KEY =
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const RPC =
    process.env.SOLANA_RPC_URL?.trim() ||
    clusterApiUrl("mainnet-beta");

const MINT_ADDRESS =
    requireEnv("AREA_MINT_ADDRESS");

const EXPECTED_REWARDS_WALLET_ADDRESS =
    requireEnv("REWARDS_WALLET_ADDRESS");

const REWARDS_WALLET_SECRET_KEY =
    requireEnv("REWARDS_WALLET_SECRET_KEY");

const MAX_RETRIES =
    getPositiveIntegerEnv(
        "REWARD_MAX_RETRIES",
        5
    );


// ======================================================
// CLIENTS
// ======================================================

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );

const connection =
    new Connection(
        RPC,
        "confirmed"
    );


// ======================================================
// KEYPAIR LOADER
// ======================================================

function loadKeypair(secretValue: string): Keypair {
    const trimmed = secretValue.trim();

    if (!trimmed) {
        throw new Error(
            "REWARDS_WALLET_SECRET_KEY is empty."
        );
    }

    if (trimmed.startsWith("[")) {
        let parsed: unknown;

        try {
            parsed = JSON.parse(trimmed);
        } catch {
            throw new Error(
                "REWARDS_WALLET_SECRET_KEY is not valid JSON."
            );
        }

        if (
            !Array.isArray(parsed) ||
            !parsed.every(
                (value) =>
                    typeof value === "number" &&
                    Number.isInteger(value) &&
                    value >= 0 &&
                    value <= 255
            )
        ) {
            throw new Error(
                "Secret-key JSON must be an array of integers from 0 to 255."
            );
        }

        const bytes =
            Uint8Array.from(parsed);

        if (bytes.length === 64) {
            return Keypair.fromSecretKey(bytes);
        }

        if (bytes.length === 32) {
            return Keypair.fromSeed(bytes);
        }

        throw new Error(
            `Invalid secret-key byte length: ${bytes.length}. Expected 32 or 64.`
        );
    }

    let decoded: Uint8Array;

    try {
        decoded = bs58.decode(trimmed);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : String(error);

        throw new Error(
            `Unable to decode REWARDS_WALLET_SECRET_KEY as Base58: ${message}`
        );
    }

    if (decoded.length === 64) {
        return Keypair.fromSecretKey(decoded);
    }

    if (decoded.length === 32) {
        return Keypair.fromSeed(decoded);
    }

    throw new Error(
        `Invalid Base58 secret-key length: ${decoded.length}. Expected 32 or 64 bytes.`
    );
}


// ======================================================
// GENERAL HELPERS
// ======================================================

function toBigIntAmount(
    value: string | number,
    fieldName: string
): bigint {
    try {
        const amount =
            BigInt(String(value));

        if (amount < 0n) {
            throw new Error(
                `${fieldName} cannot be negative.`
            );
        }

        return amount;
    } catch {
        throw new Error(
            `${fieldName} is not a valid integer amount: ${String(value)}`
        );
    }
}

function formatTokenAmount(
    amount: bigint,
    decimals: number
): string {
    if (decimals === 0) {
        return amount.toString();
    }

    const negative =
        amount < 0n;

    const absolute =
        negative
            ? -amount
            : amount;

    const base =
        10n ** BigInt(decimals);

    const whole =
        absolute / base;

    const fraction =
        absolute %
        base;

    const fractionText =
        fraction
            .toString()
            .padStart(decimals, "0")
            .replace(/0+$/, "");

    const formatted =
        fractionText.length > 0
            ? `${whole.toString()}.${fractionText}`
            : whole.toString();

    return negative
        ? `-${formatted}`
        : formatted;
}

function getErrorMessage(
    error: unknown
): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

function isValidRewardRow(
    value: unknown
): value is RewardRow {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return false;
    }

    const row =
        value as Partial<RewardRow>;

    return (
        typeof row.id === "string" &&
        typeof row.user_id === "string" &&
        typeof row.wallet_address === "string" &&
        typeof row.reward_type === "string" &&
        typeof row.source_id === "string" &&
        (
            typeof row.amount === "string" ||
            typeof row.amount === "number"
        ) &&
        (
            typeof row.burn_amount === "string" ||
            typeof row.burn_amount === "number"
        ) &&
        typeof row.retry_count === "number"
    );
}


// ======================================================
// DATABASE HELPERS
// ======================================================

async function recoverStaleRewards(): Promise<number> {
    const {
        data,
        error,
    } =
        await supabase.rpc(
            "recover_stale_rewards",
            {
                p_stale_minutes: 10,
            }
        );

    if (error) {
        throw new Error(
            `recover_stale_rewards RPC failed: ${error.message}`
        );
    }

    return Number(data ?? 0);
}

async function claimNextReward():
Promise<RewardRow | null> {
    const {
        data,
        error,
    } =
        await supabase.rpc(
            "claim_next_reward"
        );

    if (error) {
        throw new Error(
            `claim_next_reward RPC failed: ${error.message}`
        );
    }

    if (!Array.isArray(data)) {
        throw new Error(
            "claim_next_reward returned an unexpected result."
        );
    }

    if (data.length === 0) {
        return null;
    }

    const reward =
        data[0];

    if (!isValidRewardRow(reward)) {
        throw new Error(
            "claim_next_reward returned an invalid reward row."
        );
    }

    return reward;
}

async function getRewardLedgerState(
    rewardId: string
): Promise<RewardLedgerState> {
    const {
        data,
        error,
    } =
        await supabase
            .from("reward_ledger")
            .select("transaction_signature")
            .eq("id", rewardId)
            .single();

    if (error) {
        throw new Error(
            `Unable to read reward ledger state: ${error.message}`
        );
    }

    return {
        transaction_signature:
            typeof data.transaction_signature === "string"
                ? data.transaction_signature
                : null,
    };
}

async function saveTransactionSignature(
    rewardId: string,
    signature: string
): Promise<void> {
    const {
        error,
    } =
        await supabase
            .from("reward_ledger")
            .update({
                transaction_signature: signature,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", rewardId)
            .eq("status", "processing");

    if (error) {
        throw new Error(
            `Unable to save transaction signature: ${error.message}`
        );
    }
}

async function clearTransactionSignature(
    rewardId: string
): Promise<void> {
    const {
        error,
    } =
        await supabase
            .from("reward_ledger")
            .update({
                transaction_signature: null,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", rewardId)
            .eq("status", "processing");

    if (error) {
        throw new Error(
            `Unable to clear transaction signature: ${error.message}`
        );
    }
}

async function completeReward(
    rewardId: string,
    signature: string
): Promise<string> {
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
            }
        );

    if (error) {
        throw new Error(
            `complete_reward RPC failed: ${error.message}`
        );
    }

    const result =
        String(data ?? "");

    if (
        result !== "completed" &&
        result !== "already_completed"
    ) {
        throw new Error(
            `complete_reward returned: ${result}`
        );
    }

    return result;
}

async function failReward(
    rewardId: string,
    errorMessage: string,
    retryable: boolean
): Promise<string> {
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
                        2000
                    ),

                p_retryable:
                    retryable,

                p_max_retries:
                    MAX_RETRIES,
            }
        );

    if (error) {
        throw new Error(
            `fail_reward RPC failed: ${error.message}`
        );
    }

    return String(data ?? "");
}


// ======================================================
// TRANSACTION RECOVERY
// ======================================================

async function recoverExistingTransaction(
    reward: RewardRow
): Promise<boolean> {
    const state =
        await getRewardLedgerState(
            reward.id
        );

    const signature =
        state.transaction_signature?.trim();

    if (!signature) {
        return false;
    }

    console.log("");
    console.log("Existing Transaction");
    console.log("------------------------");
    console.log(signature);

    const response =
        await connection.getSignatureStatuses(
            [signature],
            {
                searchTransactionHistory: true,
            }
        );

    const status =
        response.value[0];

    if (
        status &&
        status.err === null &&
        (
            status.confirmationStatus === "confirmed" ||
            status.confirmationStatus === "finalized"
        )
    ) {
        const completionResult =
            await completeReward(
                reward.id,
                signature
            );

        console.log(
            "Recovered completed transaction:",
            completionResult
        );

        return true;
    }

    if (
        status &&
        status.err !== null
    ) {
        console.log(
            "Existing transaction failed on-chain."
        );

        await clearTransactionSignature(
            reward.id
        );

        return false;
    }

    throw new Error(
        [
            "An existing transaction signature is unresolved.",
            `Signature: ${signature}`,
            "The worker stopped to prevent a duplicate payment.",
        ].join("\n")
    );
}


// ======================================================
// MAIN
// ======================================================

async function main(): Promise<void> {
    console.log("");
    console.log("====================================");
    console.log("AREA523 Reward Worker");
    console.log("LIVE MODE");
    console.log("====================================");
    console.log("");

    let claimedReward:
        RewardRow |
        null =
        null;

    let transactionBroadcast =
        false;

    try {
        // ----------------------------------------------
        // Wallet
        // ----------------------------------------------

        const wallet =
            loadKeypair(
                REWARDS_WALLET_SECRET_KEY
            );

        const actualWalletAddress =
            wallet.publicKey.toBase58();

        if (
            actualWalletAddress !==
            EXPECTED_REWARDS_WALLET_ADDRESS
        ) {
            throw new Error(
                [
                    "Rewards wallet address mismatch.",
                    `Expected: ${EXPECTED_REWARDS_WALLET_ADDRESS}`,
                    `Actual:   ${actualWalletAddress}`,
                ].join("\n")
            );
        }

        console.log(
            "Rewards Wallet:",
            actualWalletAddress
        );

        // ----------------------------------------------
        // Mint
        // ----------------------------------------------

        const mintPublicKey =
            new PublicKey(
                MINT_ADDRESS
            );

        const mint =
            await getMint(
                connection,
                mintPublicKey
            );

        console.log(
            "Mint:",
            mintPublicKey.toBase58()
        );

        console.log(
            "Decimals:",
            mint.decimals
        );

        // ----------------------------------------------
        // SOL balance
        // ----------------------------------------------

        const solBalanceLamports =
            await connection.getBalance(
                wallet.publicKey
            );

        console.log(
            "SOL:",
            (
                solBalanceLamports /
                LAMPORTS_PER_SOL
            ).toFixed(9)
        );

        if (solBalanceLamports <= 0) {
            throw new Error(
                "Rewards wallet has no SOL for transaction fees."
            );
        }

        // ----------------------------------------------
        // Rewards token account
        // ----------------------------------------------

        const rewardsAta =
            await getAssociatedTokenAddress(
                mintPublicKey,
                wallet.publicKey
            );

        const rewardsAtaInfo =
            await connection.getAccountInfo(
                rewardsAta
            );

        if (!rewardsAtaInfo) {
            throw new Error(
                "Rewards wallet AREA token account does not exist."
            );
        }

        // ----------------------------------------------
        // Recover stale jobs
        // ----------------------------------------------

        const recoveredCount =
            await recoverStaleRewards();

        console.log(
            "Recovered stale rewards:",
            recoveredCount
        );

        // ----------------------------------------------
        // Claim one reward
        // ----------------------------------------------

        claimedReward =
            await claimNextReward();

        if (!claimedReward) {
            console.log("");
            console.log(
                "No pending rewards."
            );
            console.log("");

            return;
        }

        console.log("");
        console.log("Claimed Reward");
        console.log("------------------------");
        console.log(
            "ID:",
            claimedReward.id
        );
        console.log(
            "Type:",
            claimedReward.reward_type
        );
        console.log(
            "Source:",
            claimedReward.source_id
        );
        console.log(
            "Wallet:",
            claimedReward.wallet_address
        );

        // ----------------------------------------------
        // Existing signature recovery
        // ----------------------------------------------

        const recovered =
            await recoverExistingTransaction(
                claimedReward
            );

        if (recovered) {
            console.log("");
            console.log(
                "LIVE MODE COMPLETE"
            );
            console.log("");

            return;
        }

        // ----------------------------------------------
        // Validate reward
        // ----------------------------------------------

        let recipientWallet:
            PublicKey;

        try {
            recipientWallet =
                new PublicKey(
                    claimedReward.wallet_address
                );
        } catch {
            throw new Error(
                `Invalid recipient wallet address: ${claimedReward.wallet_address}`
            );
        }

        const rewardAmount =
            toBigIntAmount(
                claimedReward.amount,
                "amount"
            );

        const burnAmount =
            toBigIntAmount(
                claimedReward.burn_amount,
                "burn_amount"
            );

        if (rewardAmount <= 0n) {
            throw new Error(
                "Reward amount must be greater than zero."
            );
        }

        if (burnAmount < 0n) {
            throw new Error(
                "Burn amount cannot be negative."
            );
        }

        const totalRequired =
            rewardAmount +
            burnAmount;

        const sourceBalance =
            await connection
                .getTokenAccountBalance(
                    rewardsAta
                );

        const sourceRawBalance =
            BigInt(
                sourceBalance.value.amount
            );

        if (
            sourceRawBalance <
            totalRequired
        ) {
            throw new Error(
                [
                    "Insufficient AREA balance.",
                    `Required: ${formatTokenAmount(totalRequired, mint.decimals)} AREA`,
                    `Available: ${formatTokenAmount(sourceRawBalance, mint.decimals)} AREA`,
                ].join("\n")
            );
        }

        console.log(
            "Reward:",
            formatTokenAmount(
                rewardAmount,
                mint.decimals
            ),
            "AREA"
        );

        console.log(
            "Burn:",
            formatTokenAmount(
                burnAmount,
                mint.decimals
            ),
            "AREA"
        );

        // ----------------------------------------------
        // Recipient ATA
        // ----------------------------------------------

        const recipientTokenAccount =
            await getOrCreateAssociatedTokenAccount(
                connection,
                wallet,
                mintPublicKey,
                recipientWallet,
                false,
                "confirmed"
            );

        console.log(
            "Recipient ATA:",
            recipientTokenAccount.address.toBase58()
        );

        // ----------------------------------------------
        // Build atomic transfer + burn transaction
        // ----------------------------------------------

        const latestBlockhash =
            await connection.getLatestBlockhash(
                "confirmed"
            );

        const transaction =
            new Transaction({
                feePayer:
                    wallet.publicKey,

                blockhash:
                    latestBlockhash.blockhash,

                lastValidBlockHeight:
                    latestBlockhash.lastValidBlockHeight,
            });

        transaction.add(
            createTransferCheckedInstruction(
                rewardsAta,
                mintPublicKey,
                recipientTokenAccount.address,
                wallet.publicKey,
                rewardAmount,
                mint.decimals
            )
        );

        if (burnAmount > 0n) {
            transaction.add(
                createBurnCheckedInstruction(
                    rewardsAta,
                    mintPublicKey,
                    wallet.publicKey,
                    burnAmount,
                    mint.decimals
                )
            );
        }

        transaction.sign(
            wallet
        );

        if (!transaction.signature) {
            throw new Error(
                "Transaction signature was not generated."
            );
        }

        const expectedSignature =
            bs58.encode(
                transaction.signature
            );

        // Save deterministic signature before broadcast.
        await saveTransactionSignature(
            claimedReward.id,
            expectedSignature
        );

        console.log("");
        console.log("Broadcasting Transaction");
        console.log("------------------------");
        console.log(expectedSignature);

        const actualSignature =
            await connection.sendRawTransaction(
                transaction.serialize(),
                {
                    skipPreflight: false,
                    maxRetries: 5,
                }
            );

        transactionBroadcast =
            true;

        if (
            actualSignature !==
            expectedSignature
        ) {
            throw new Error(
                [
                    "Transaction signature mismatch.",
                    `Expected: ${expectedSignature}`,
                    `Actual:   ${actualSignature}`,
                ].join("\n")
            );
        }

        const confirmation =
            await connection.confirmTransaction(
                {
                    signature:
                        actualSignature,

                    blockhash:
                        latestBlockhash.blockhash,

                    lastValidBlockHeight:
                        latestBlockhash.lastValidBlockHeight,
                },
                "confirmed"
            );

        if (confirmation.value.err) {
            throw new Error(
                `Solana transaction failed: ${JSON.stringify(
                    confirmation.value.err
                )}`
            );
        }

        // ----------------------------------------------
        // Complete database record
        // ----------------------------------------------

        const completionResult =
            await completeReward(
                claimedReward.id,
                actualSignature
            );

        console.log("");
        console.log("Reward Completed");
        console.log("------------------------");
        console.log(
            "Database:",
            completionResult
        );
        console.log(
            "Signature:",
            actualSignature
        );
        console.log(
            "Transferred:",
            formatTokenAmount(
                rewardAmount,
                mint.decimals
            ),
            "AREA"
        );
        console.log(
            "Burned:",
            formatTokenAmount(
                burnAmount,
                mint.decimals
            ),
            "AREA"
        );

        console.log("");
        console.log(
            "LIVE MODE COMPLETE"
        );
        console.log("");
    } catch (error) {
        const message =
            getErrorMessage(
                error
            );

        if (claimedReward) {
            try {
                /*
                 * If the transaction may already have been broadcast,
                 * do not automatically return the reward to pending.
                 * This prevents an accidental duplicate payment.
                 */
                const retryable =
                    !transactionBroadcast &&
                    !message.includes(
                        "unresolved"
                    ) &&
                    !message.includes(
                        "Invalid recipient wallet"
                    ) &&
                    !message.includes(
                        "must be greater than zero"
                    );

                const failureResult =
                    await failReward(
                        claimedReward.id,
                        message,
                        retryable
                    );

                console.error(
                    "Reward failure status:",
                    failureResult
                );
            } catch (failureError) {
                console.error(
                    "Unable to record reward failure:",
                    getErrorMessage(
                        failureError
                    )
                );
            }
        }

        throw error;
    }
}


// ======================================================
// START
// ======================================================

main().catch((error: unknown) => {
    console.error("");
    console.error("Worker failed");
    console.error(
        getErrorMessage(error)
    );
    console.error("");

    process.exit(1);
});