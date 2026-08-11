import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const IDLE_DELAY_MS = 5_000;
const ERROR_DELAY_MS = 10_000;

let shuttingDown = false;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function loadEnvironment() {
  /*
   * Local development:
   * Next.js normally loads .env.local automatically,
   * but a standalone tsx worker does not.
   *
   * Railway:
   * .env.local will not exist.
   * Railway Variables are already provided through process.env.
   */
  if (existsSync(".env.local")) {
    loadEnvFile(".env.local");

    console.log(
      "[AREA WORKER] Loaded .env.local.",
    );
  } else {
    console.log(
      "[AREA WORKER] Using process environment.",
    );
  }
}

function assertRequiredEnvironment() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SOLANA_RPC_URL",
    "SOLANA_RPC_WS_URL",
    "REWARDS_WALLET_ADDRESS",
    "REWARDS_WALLET_SECRET_KEY",
  ];

  const missing =
    required.filter(
      (name) => !process.env[name],
    );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", ",
      )}`,
    );
  }
}

function requestShutdown(
  signal: string,
) {
  if (shuttingDown) {
    return;
  }

  console.log(
    `[AREA WORKER] ${signal} received. Shutting down...`,
  );

  shuttingDown = true;
}

process.on("SIGINT", () => {
  requestShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  requestShutdown("SIGTERM");
});

async function main() {
  /*
   * Load environment BEFORE importing
   * the withdrawal worker.
   *
   * Dynamic import guarantees the server
   * modules see the loaded environment.
   */
  loadEnvironment();

  assertRequiredEnvironment();

  const {
    processNextAreaWithdrawal,
  } = await import(
    "../src/lib/server/areaWithdrawalWorker"
  );

  console.log(
    "[AREA WORKER] Withdrawal worker started.",
  );

  while (!shuttingDown) {
    try {
      const result =
        await processNextAreaWithdrawal();

      /*
       * No pending withdrawals.
       */
      if (!result.found) {
        await sleep(
          IDLE_DELAY_MS,
        );

        continue;
      }

      /*
       * Successful on-chain payout.
       */
      if (result.success) {
        console.log(
          "[AREA WORKER] Withdrawal completed:",
          {
            withdrawalId:
              result.withdrawalId,

            amount:
              result.amount,

            destination:
              result.destination,

            transactionSignature:
              result.transactionSignature,
          },
        );
      } else {
        /*
         * IMPORTANT:
         *
         * If transactionSignature exists,
         * areaWithdrawalWorker deliberately
         * does not automatically requeue the
         * withdrawal.
         *
         * It requires reconciliation first
         * to prevent double payment.
         */
        console.error(
          "[AREA WORKER] Withdrawal requires attention:",
          {
            withdrawalId:
              result.withdrawalId,

            transactionSignature:
              result.transactionSignature,

            error:
              result.error,
          },
        );
      }

      await sleep(
        IDLE_DELAY_MS,
      );
    } catch (error) {
      console.error(
        "[AREA WORKER] Worker loop error:",
        error instanceof Error
          ? error.message
          : error,
      );

      /*
       * Keep the process alive.
       *
       * A temporary RPC/Supabase failure
       * must not permanently kill the
       * Railway worker.
       */
      await sleep(
        ERROR_DELAY_MS,
      );
    }
  }

  console.log(
    "[AREA WORKER] Withdrawal worker stopped.",
  );
}

main().catch((error) => {
  console.error(
    "[AREA WORKER] Fatal startup error:",
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});