"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardRow = {
  ranking_position: number;
  user_id: string;
  username: string;
  wallet_address: string;
  total_votes: number;
  correct_votes: number;
  accuracy: number;
  ranking_month: string;
};

type LeaderboardResponse = {
  success: boolean;
  leaderboard?: LeaderboardRow[];
  error?: string;
};

export default function MonthlyRankingWidget() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const response = await fetch(
          "/api/leaderboard/monthly?limit=5",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as LeaderboardResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ?? "Failed to load monthly ranking.",
          );
        }

        if (!cancelled) {
          setRows(result.leaderboard ?? []);
          setFailed(false);
        }
      } catch (error) {
        console.error("[monthly-ranking-widget]", error);

        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101317]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-[#69b7ff]">
            TOP 5
          </p>

          <h2 className="mt-1 text-sm font-bold text-white">
            Monthly Ranking
          </h2>
        </div>

        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#48a7ff]/10 text-lg">
          🏆
        </span>
      </div>

      <div className="p-3">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-white/[0.04]"
              />
            ))}
          </div>
        )}

        {!loading && failed && (
          <div className="rounded-lg border border-white/10 px-4 py-7 text-center">
            <p className="text-sm font-semibold text-white/55">
              Ranking unavailable.
            </p>
          </div>
        )}

        {!loading && !failed && rows.length === 0 && (
          <div className="rounded-lg border border-white/10 px-4 py-7 text-center">
            <p className="text-sm font-semibold text-white/65">
              No qualified users yet.
            </p>

            <p className="mt-2 text-xs leading-5 text-white/35">
              Minimum 30 votes and 70% accuracy required.
            </p>
          </div>
        )}

        {!loading && !failed && rows.length > 0 && (
          <div className="space-y-1">
            {rows.map((row) => (
              <Link
                key={row.user_id}
                href="/leaderboard/monthly"
                className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-white/[0.05]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    row.ranking_position === 1
                      ? "bg-[#48a7ff]/20 text-[#75bdff]"
                      : "bg-white/[0.04] text-white/45"
                  }`}
                >
                  {row.ranking_position}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white/80 transition group-hover:text-white">
                    {row.username}
                  </p>

                  <p className="mt-0.5 text-[11px] text-white/35">
                    {row.correct_votes}/{row.total_votes} correct
                  </p>
                </div>

                <span className="shrink-0 text-xs font-black text-[#69b7ff]">
                  {row.accuracy}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/leaderboard/monthly"
        className="block border-t border-white/10 px-4 py-3 text-center text-xs font-bold text-white/45 transition hover:bg-[#48a7ff]/5 hover:text-[#69b7ff]"
      >
        VIEW FULL RANKING →
      </Link>
    </section>
  );
}