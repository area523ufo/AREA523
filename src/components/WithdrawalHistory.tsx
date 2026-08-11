"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WithdrawalRow = {
  id: string;
  amount: number;
  status: string;
  wallet_address: string;
  transaction_signature: string | null;
  created_at: string;
  completed_at: string | null;
};

function shortenWallet(address: string) {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function WithdrawalHistory() {
  const [rows, setRows] =
    useState<WithdrawalRow[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("area_withdrawals")
        .select(`
          id,
          amount,
          status,
          wallet_address,
          transaction_signature,
          created_at,
          completed_at
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Withdrawal history failed:",
          error,
        );

        setErrorMessage(
          "Withdrawal history could not be loaded.",
        );

        setIsLoading(false);
        return;
      }

      setRows(
        (data ?? []) as WithdrawalRow[],
      );

      setIsLoading(false);
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-5">
        <p className="text-sm text-white/30">
          Loading withdrawal history...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-5">
        <p className="text-sm text-red-300/70">
          {errorMessage}
        </p>
      </section>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-white/30">
        WITHDRAWAL HISTORY
      </p>

      <div className="mt-4 divide-y divide-white/[0.06]">
        {rows.map((row) => (
          <div
            key={row.id}
            className="py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white">
                  {Number(
                    row.amount,
                  ).toLocaleString()}{" "}
                  AREA
                </p>

                <p className="mt-1 text-xs text-white/30">
                  {formatDate(
                    row.created_at,
                  )}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                  row.status === "completed"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : row.status ===
                        "failed"
                      ? "bg-red-400/10 text-red-300"
                      : row.status ===
                          "processing"
                        ? "bg-[#48a7ff]/10 text-[#69b7ff]"
                        : "bg-white/[0.06] text-white/45"
                }`}
              >
                {row.status}
              </span>
            </div>

            <p className="mt-3 text-xs text-white/35">
              To{" "}
              <span className="font-semibold text-white/55">
                {shortenWallet(
                  row.wallet_address,
                )}
              </span>
            </p>

            {row.transaction_signature && (
              <p className="mt-1 break-all text-[11px] text-white/25">
                Tx:{" "}
                {row.transaction_signature}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}