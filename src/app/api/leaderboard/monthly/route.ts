import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month");

    const requestedLimit = Number(
      searchParams.get("limit") ?? "100",
    );

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 100;

    const { data, error } = await supabase.rpc(
      "get_public_monthly_leaderboard",
      {
        p_ranking_month: month,
        p_limit: limit,
      },
    );

    if (error) {
      console.error(
        "[monthly-leaderboard-api]",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        leaderboard: data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[monthly-leaderboard-api]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}