import Link from "next/link";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const MINT_ADDRESS =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

const tokenInformation = [
  {
    label: "Total Supply",
    value: "1,000,000,000 AREA",
  },
  {
    label: "Founder",
    value: "30% · 300,000,000 AREA",
  },
  {
    label: "Treasury",
    value: "30% · 300,000,000 AREA",
  },
  {
    label: "Rewards",
    value: "20% · 200,000,000 AREA",
  },
  {
    label: "Liquidity",
    value: "20% · 200,000,000 AREA",
  },
];

export default function AreaTokenInformationPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[760px]">
            <Link
              href="/area"
              className="text-xs font-bold text-white/35 transition hover:text-white/70"
            >
              ← Back to AREA
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              AREA
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Token Information
            </h1>

            <p className="mt-4 max-w-[620px] text-sm leading-7 text-white/45">
              Reference information about AREA&apos;s
              supply and allocation.
            </p>

            <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#12151a]">
              {tokenInformation.map(
                (item, index) => (
                  <div
                    key={item.label}
                    className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                      index !== 0
                        ? "border-t border-white/[0.06]"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/30">
                      {item.label}
                    </span>

                    <span className="text-sm font-bold text-white/70">
                      {item.value}
                    </span>
                  </div>
                ),
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/30">
                Solana Mint
              </p>

              <p className="mt-3 break-all font-mono text-xs leading-6 text-white/55">
                {MINT_ADDRESS}
              </p>
            </section>

            <p className="mt-6 text-xs leading-5 text-white/25">
              Allocation and distribution information may
              be updated to reflect operational,
              technical, or regulatory changes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}