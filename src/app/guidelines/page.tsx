import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SiteFooter from "@/components/SiteFooter";

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex w-full max-w-[1320px]">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 py-8 sm:px-6">
          <article className="mx-auto max-w-[860px]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#69b7ff]">
              AREA523
            </p>

            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Community Guidelines
            </h1>

            <p className="mt-3 text-sm text-white/35">
              Last updated: August 13, 2026
            </p>

            <p className="mt-8 text-base leading-8 text-white/60">
              AREA523 is designed for open discussion,
              community investigation, and collaborative
              verification. Participation should improve
              the signal of the network rather than
              deliberately distort it.
            </p>

            <div className="mt-10 space-y-10 text-sm leading-7 text-white/60">
              <Section title="1. Post in Good Faith">
                Do not intentionally fabricate evidence,
                misrepresent sources, manipulate context, or
                knowingly present false information as
                authentic.
                <br />
                <br />
                Opinions, theories, speculation, satire, and
                discussion are allowed when they are not
                deliberately presented in a misleading
                manner.
              </Section>

              <Section title="2. REAL · NOT AI">
                Vote based on your best assessment of the
                material.
                <br />
                <br />
                Do not coordinate fake verification,
                operate voting rings, use multiple accounts
                to manipulate results, or intentionally vote
                incorrectly to obtain rewards.
              </Section>

              <Section title="3. Sources and Context">
                When possible, provide enough source,
                location, date, context, or supporting
                information for other community members to
                evaluate a report.
              </Section>

              <Section title="4. AI-Generated Content">
                Do not intentionally disguise AI-generated
                material as authentic real-world evidence in
                order to deceive users or manipulate the
                verification system.
                <br />
                <br />
                AI content may be discussed when its nature
                and context are not deliberately
                misrepresented.
              </Section>

              <Section title="5. No Harassment">
                Do not engage in targeted harassment,
                threats, stalking, coordinated abuse, or
                attempts to intimidate another user.
              </Section>

              <Section title="6. Privacy and Personal Information">
                Do not publish highly sensitive personal
                information about another person without a
                legitimate reason and appropriate
                authorization.
                <br />
                <br />
                Do not use AREA523 to facilitate stalking,
                doxxing, identity theft, or similar abuse.
              </Section>

              <Section title="7. Illegal or Dangerous Activity">
                Do not use AREA523 to facilitate criminal
                activity, malicious hacking, fraud,
                exploitation, or instructions intended to
                cause serious harm.
              </Section>

              <Section title="8. Spam and Manipulation">
                Do not flood the platform with repetitive
                posts, automated spam, deceptive links,
                artificial engagement, fake accounts, or
                coordinated attempts to manipulate rankings
                and visibility.
              </Section>

              <Section title="9. Reward Abuse">
                Attempts to exploit AREA rewards,
                verification rewards, rankings, withdrawal
                systems, duplicate accounts, or technical
                weaknesses may result in reward
                cancellation, account restriction, or
                suspension.
              </Section>

              <Section title="10. Impersonation">
                Do not impersonate individuals,
                organizations, government entities, AREA523
                staff, or other users in a deceptive manner.
              </Section>

              <Section title="11. Reporting">
                Use the reporting system for genuine
                moderation concerns.
                <br />
                <br />
                Repeated false or malicious reporting may
                itself be treated as platform abuse.
              </Section>

              <Section title="12. Enforcement">
                Depending on severity and context, AREA523
                may remove content, restrict functionality,
                invalidate abusive activity, suspend an
                account, or take other reasonable protective
                measures.
              </Section>

              <Section title="13. Community Standard">
                AREA523 does not require users to agree with
                one another.
                <br />
                <br />
                Strong disagreement, controversial
                viewpoints, investigation, criticism, and
                debate are permitted. The line is crossed
                when participation becomes deceptive,
                manipulative, abusive, or designed to damage
                the integrity of the network.
              </Section>
            </div>
          </article>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-black text-white">
        {title}
      </h2>

      <div className="mt-3">
        {children}
      </div>
    </section>
  );
}