import Link from "next/link";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[900px]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              ABOUT AREA523
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              A community verification network
              for the age of AI.
            </h1>

            <p className="mt-6 max-w-[760px] text-base leading-8 text-white/55">
              AREA523 is a community-driven platform
              built to examine media, claims, and
              controversial material through transparent
              public verification.
            </p>

            <section className="mt-10 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                REAL or AI
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                Every submitted report can be reviewed
                by the community. Users vote on whether
                the material appears authentic or
                AI-generated, creating a visible record
                of collective judgment.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black text-[#69b7ff]">
                REAL · NOT AI
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                REAL · NOT AI identifies reports that
                satisfy AREA523&apos;s verification
                requirements and receive sufficient
                community support for authenticity.
              </p>

              <p className="mt-3 leading-7 text-white/35">
                Verification represents the outcome of
                the AREA523 community process. It is not
                a guarantee that every underlying claim
                is factually correct.
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-white/10 bg-[#12151a] p-6 sm:p-8">
              <h2 className="text-xl font-black">
                Participation has value.
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                AREA523 uses the AREA token to reward
                meaningful participation in the
                verification network, including eligible
                verified reports, voting activity, and
                community rankings.
              </p>

              <Link
                href="/area"
                className="mt-6 inline-flex rounded-full border border-[#48a7ff]/30 bg-[#48a7ff]/10 px-5 py-2.5 text-sm font-black text-[#69b7ff] transition hover:bg-[#48a7ff]/20"
              >
                Learn about AREA
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}