import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INTERVAL_MINUTES = 60;

async function run() {
  try {
    const { data, error } = await supabase.rpc(
      "process_monthly_ranking_rewards"
    );

    if (error) {
      console.error(
        "[monthly-ranking]",
        new Date().toISOString(),
        error
      );
      return;
    }

    console.log(
      "[monthly-ranking]",
      new Date().toISOString(),
      JSON.stringify(data)
    );
  } catch (err) {
    console.error(
      "[monthly-ranking]",
      new Date().toISOString(),
      err
    );
  }
}

run();

setInterval(run, INTERVAL_MINUTES * 60 * 1000);