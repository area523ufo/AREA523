import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: ".env.local",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing from .env.local",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local",
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

async function runVerification() {
  const startedAt = new Date();

  try {
    const { error } = await supabase.rpc(
      "run_verification_job",
    );

    if (error) {
      console.error(
        "[verification]",
        startedAt.toISOString(),
        "failed:",
        error.message,
      );

      return;
    }

    console.log(
      "[verification]",
      startedAt.toISOString(),
      "completed",
    );
  } catch (error) {
    console.error(
      "[verification]",
      startedAt.toISOString(),
      "unexpected error:",
      error,
    );
  }
}

void runVerification();

const interval = setInterval(
  () => {
    void runVerification();
  },
  10 * 60 * 1000,
);

function shutdown(signal: string) {
  console.log(`[verification] received ${signal}`);

  clearInterval(interval);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));