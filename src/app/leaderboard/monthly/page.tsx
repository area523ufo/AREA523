"use client";

import { useEffect, useState } from "react";

type LeaderboardRow = {
  ranking_position: number;
  username: string;
  wallet_address: string;
  total_votes: number;
  correct_votes: number;
  accuracy: number;
};

export default function MonthlyLeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard/monthly")
      .then((r) => r.json())
      .then((r) => setRows(r.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          🏆 Monthly Ranking
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Minimum 30 votes · 70% accuracy required
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border p-10">
          Loading...
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="rounded-xl border p-10 text-center">
          <div className="text-5xl mb-4">🏆</div>

          <h2 className="text-xl font-semibold">
            No qualified users this month
          </h2>

          <p className="mt-3 text-gray-500">
            Rankings will appear automatically
            after enough verified votes.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-4 text-left">Rank</th>
              <th className="text-left">User</th>
              <th className="text-right">Votes</th>
              <th className="text-right">Correct</th>
              <th className="text-right">Accuracy</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.wallet_address}
                className="border-b"
              >
                <td className="py-4 font-bold">
                  #{row.ranking_position}
                </td>

                <td>{row.username}</td>

                <td className="text-right">
                  {row.total_votes}
                </td>

                <td className="text-right">
                  {row.correct_votes}
                </td>

                <td className="text-right font-semibold">
                  {row.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}