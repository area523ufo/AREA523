import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const MINT_ADDRESS =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

export default function AreaTokenPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[900px]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              AREA TOKEN
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              The participation layer of AREA523.
            </h1>

            <p className="mt-6 max-w-[760px] text-base leading-8 text-white/55">
              AREA is the native Solana token used by
              AREA523 to reward meaningful participation
              in the community verification network.
            </p>

            <section className="mt-10 rounded-2xl border border-[#48a7ff]/20 bg-[#48a7ff]/[0.06] p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
                PRE-LAUNCH STATUS
              </p>

              <h2 className="mt-3 text-2xl font-black">
                AREA rewards are active. Public trading
                is not yet live.
              </h2>

              <p className="mt-4 leading-7 text-white/55">
                AREA earned before September 1, 2026 is
                distributed through the AREA523 reward
                system, but the token is not yet publicly
                tradable.
              </p>

              <p className="mt-3 leading-7 text-white/40">
                Public trading is scheduled to begin on
                September 1, 2026 following DEX liquidity
                deployment and routing setup. Until then,
                AREA cannot be bought or sold through the
                public market.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                What is AREA used for?
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-white/50">
                <p>
                  Eligible NOT AI VERIFIED reports can
                  receive AREA rewards.
                </p>

                <p>
                  Correct verification votes can receive
                  AREA rewards within the platform&apos;s
                  reward limits.
                </p>

                <p>
                  Monthly ranking rewards are distributed
                  to qualifying participants based on
                  verification performance.
                </p>
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                Tokenomics
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <TokenRow
                  label="Total Supply"
                  value="1,000,000,000 AREA"
                />

                <TokenRow
                  label="Founder"
                  value="30% · 300,000,000"
                />

                <TokenRow
                  label="Treasury"
                  value="30% · 300,000,000"
                />

                <TokenRow
                  label="Rewards"
                  value="20% · 200,000,000"
                />

                <TokenRow
                  label="Liquidity"
                  value="20% · 200,000,000"
                />
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                Rewards and burn policy
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                The Rewards allocation is capped and does
                not expand automatically with user growth.
                AREA523 applies defined reward budgets and
                may burn unused reward allocations
                according to the platform&apos;s published
                reward policy.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                Solana Mint
              </h2>

              <p className="mt-4 break-all rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-white/50">
                {MINT_ADDRESS}
              </p>

              <p className="mt-3 text-xs leading-5 text-white/30">
                Always verify the mint address before
                interacting with AREA on any external
                platform.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                Trading status
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                AREA is currently in its pre-launch
                distribution phase. DEX liquidity,
                routing, and public market access are
                planned for September 1, 2026.
              </p>

              <p className="mt-3 text-sm leading-6 text-white/30">
                Launch timing may change if required by
                technical, liquidity, or operational
                conditions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function TokenRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white/80">
        {value}
      </p>
    </div>
  );
}