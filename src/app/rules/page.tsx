import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[900px]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              AREA523 RULES
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Community Rules
            </h1>

            <div className="mt-8 space-y-4">
              <Rule
                title="1. Submit in good faith"
                text="Do not knowingly submit fabricated, manipulated, or misleading material without clearly disclosing its nature."
              />

              <Rule
                title="2. Verification is evidence-based"
                text="REAL and AI votes should reflect your assessment of the submitted media and available evidence, not personal preference or ideology."
              />

              <Rule
                title="3. No vote manipulation"
                text="Do not coordinate artificial voting, use multiple accounts to influence outcomes, or attempt to manipulate verification results."
              />

              <Rule
                title="4. No spam or abuse"
                text="Spam, harassment, threats, impersonation, malicious links, and repetitive low-quality submissions may be removed."
              />

              <Rule
                title="5. Respect privacy"
                text="Do not publish private personal information, doxxing material, or content that creates an unreasonable privacy or safety risk."
              />

              <Rule
                title="6. Follow applicable law"
                text="Content that is unlawful, facilitates criminal activity, or violates applicable legal obligations may be removed."
              />

              <Rule
                title="7. Rewards can be withheld"
                text="AREA rewards may be withheld, reversed, or denied when activity violates platform rules, reward requirements, or anti-abuse controls."
              />

              <Rule
                title="8. Moderation decisions"
                text="AREA523 may remove content, suspend accounts, or restrict participation when necessary to protect the integrity of the verification network."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Rule({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#12151a] p-6">
      <h2 className="text-lg font-black">{title}</h2>

      <p className="mt-3 leading-7 text-white/50">
        {text}
      </p>
    </section>
  );
}