import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SiteFooter from "@/components/SiteFooter";

export default function TermsPage() {
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
              Terms of Service
            </h1>

            <p className="mt-3 text-sm text-white/35">
              Last updated: August 13, 2026
            </p>

            <div className="mt-10 space-y-10 text-sm leading-7 text-white/60">
              <Section title="1. Acceptance of Terms">
                By accessing or using AREA523, you agree to
                these Terms of Service and applicable
                policies. If you do not agree, do not use
                AREA523.
              </Section>

              <Section title="2. AREA523">
                AREA523 provides community publishing,
                discussion, verification, social features,
                and related reward functionality.
                <br />
                <br />
                AREA523 does not guarantee that user
                content, community votes, verification
                outcomes, or information posted by users is
                accurate, complete, or reliable.
              </Section>

              <Section title="3. Accounts">
                You are responsible for activity performed
                through your account and for maintaining
                appropriate security over your login
                credentials.
                <br />
                <br />
                You may not impersonate another person,
                create accounts for abusive purposes, or
                intentionally provide deceptive account
                information.
              </Section>

              <Section title="4. User Content">
                You retain responsibility for content you
                submit to AREA523.
                <br />
                <br />
                By submitting content, you grant AREA523
                permission to host, display, reproduce,
                distribute, format, and otherwise process
                that content as reasonably necessary to
                operate and promote the service.
                <br />
                <br />
                You must have the necessary rights to
                content you upload or publish.
              </Section>

              <Section title="5. REAL · NOT AI Verification">
                AREA523 may allow community members to
                evaluate whether submitted material appears
                to represent real-world or AI-generated
                content.
                <br />
                <br />
                Verification results represent AREA523
                platform processes and community activity.
                They are not a guarantee of factual truth,
                authenticity, identity, legality, or
                evidentiary validity.
              </Section>

              <Section title="6. Prohibited Conduct">
                You may not use AREA523 to engage in fraud,
                unlawful activity, threats, targeted
                harassment, malicious impersonation,
                unauthorized access, manipulation of
                platform systems, spam, coordinated voting
                abuse, reward exploitation, or attempts to
                interfere with platform security.
              </Section>

              <Section title="7. Moderation">
                AREA523 may investigate reports and may
                remove content, limit features, suspend
                accounts, or take other reasonable actions
                to protect users and platform integrity.
              </Section>

              <Section title="8. AREA Rewards">
                AREA523 may provide AREA rewards for
                qualifying participation.
                <br />
                <br />
                Eligibility, amounts, limits, budgets,
                verification requirements, reward
                categories, distribution rules, and other
                reward conditions may change.
                <br />
                <br />
                Participation does not guarantee a reward.
              </Section>

              <Section title="9. AREA Token">
                AREA is used within the AREA523 ecosystem
                and may also interact with public blockchain
                infrastructure.
                <br />
                <br />
                AREA523 does not guarantee the market value,
                liquidity, availability, exchangeability,
                price, or future performance of AREA.
                <br />
                <br />
                AREA should not be understood as a promise
                of profit, guaranteed financial return, or
                investment advice.
              </Section>

              <Section title="10. Wallets and Blockchain">
                You are responsible for verifying your
                wallet address before requesting blockchain
                transactions.
                <br />
                <br />
                Blockchain transfers may be irreversible.
                AREA523 may not be able to recover tokens
                sent to an incorrect address or reverse a
                transaction that has been confirmed by the
                blockchain network.
              </Section>

              <Section title="11. Third-Party Services">
                AREA523 may rely on or link to third-party
                authentication providers, blockchain
                networks, wallet software, infrastructure,
                websites, or other services. AREA523 is not
                responsible for third-party services that it
                does not control.
              </Section>

              <Section title="12. Service Availability">
                AREA523 may change, suspend, limit, or
                discontinue features for security,
                maintenance, technical, operational, legal,
                or other reasons.
                <br />
                <br />
                Continuous or error-free availability is
                not guaranteed.
              </Section>

              <Section title="13. No Professional Advice">
                Content on AREA523 does not constitute
                legal, financial, investment, medical, or
                other professional advice merely because it
                appears on the platform.
              </Section>

              <Section title="14. Limitation of Responsibility">
                To the extent permitted by applicable law,
                AREA523 is provided on an as-is and
                as-available basis and does not guarantee
                the accuracy of user content, uninterrupted
                operation, or specific outcomes from use of
                the service.
              </Section>

              <Section title="15. Changes to These Terms">
                AREA523 may update these Terms as the
                service evolves. Continued use after an
                updated version becomes effective may
                constitute acceptance of the revised Terms
                where permitted by applicable law.
              </Section>

              <Section title="16. Contact">
                Questions about these Terms may be submitted
                through the contact method published by
                AREA523.
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