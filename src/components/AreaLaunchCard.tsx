import Link from "next/link";

export default function AreaLaunchCard() {
  return (
    <section className="overflow-hidden rounded-xl border border-[#48a7ff]/20 bg-[#101821]">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#69b7ff]" />

          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
            AREA PRE-LAUNCH
          </p>
        </div>

        <h2 className="mt-3 text-xl font-black leading-tight text-white">
          AREA rewards are live.
          <br />
          Public trading is not yet live.
        </h2>

        <p className="mt-4 text-sm leading-6 text-white/50">
          AREA earned before September 1,
          2026 is distributed through the
          AREA523 reward system.
        </p>

        <p className="mt-2 text-sm leading-6 text-white/35">
          Public trading is scheduled to begin
          after DEX liquidity deployment and
          routing setup.
        </p>

        <Link
          href="/area"
          className="mt-5 inline-flex items-center text-sm font-black text-[#69b7ff] transition hover:text-white"
        >
          AREA token details
          <span className="ml-1">→</span>
        </Link>
      </div>
    </section>
  );
}