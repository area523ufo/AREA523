import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SiteFooter from "@/components/SiteFooter";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>

            <p className="mt-3 text-sm text-white/35">
              Last updated: August 13, 2026
            </p>

            <div className="mt-10 space-y-10 text-sm leading-7 text-white/60">
              <PolicySection title="1. Overview">
                AREA523 operates an online community focused
                on user-generated reports, discussion,
                community verification, and related AREA
                reward functionality. This Privacy Policy
                explains how information may be collected,
                used, stored, and disclosed when you use
                AREA523.
              </PolicySection>

              <PolicySection title="2. Information We Collect">
                We may collect account information such as
                your email address, username, display name,
                profile image, biography, authentication
                provider information, and account
                identifiers.
                <br />
                <br />
                When you connect a compatible blockchain
                wallet, we may store your public wallet
                address. AREA523 does not require or request
                your wallet private key or seed phrase.
                <br />
                <br />
                We may also process content and activity you
                submit, including posts, comments, votes,
                follows, reposts, reports, verification
                activity, and reward or withdrawal records.
              </PolicySection>

              <PolicySection title="3. Authentication">
                AREA523 may provide authentication through
                email/password and supported third-party
                authentication providers such as Google.
                Third-party authentication providers process
                information according to their own privacy
                policies.
              </PolicySection>

              <PolicySection title="4. Technical Information">
                We and our service providers may process
                technical information necessary to operate
                and secure AREA523, such as IP addresses,
                browser or device information, request logs,
                timestamps, authentication events, and
                security-related records.
              </PolicySection>

              <PolicySection title="5. How We Use Information">
                We may use information to operate accounts,
                provide community features, maintain login
                sessions, process verification activity,
                calculate or distribute rewards, process
                withdrawals, prevent abuse, investigate
                reports, enforce our rules, improve the
                service, and maintain platform security.
              </PolicySection>

              <PolicySection title="6. Public Information">
                Posts, comments, usernames, display names,
                profile information, community activity,
                follower relationships, verification
                activity, and other information you choose
                to publish may be visible to other users or
                the public.
                <br />
                <br />
                Public blockchain wallet addresses and
                blockchain transactions may also be visible
                permanently on public blockchain networks.
              </PolicySection>

              <PolicySection title="7. Service Providers">
                AREA523 may rely on infrastructure and
                service providers for hosting, databases,
                authentication, analytics, blockchain
                connectivity, security, and other technical
                operations. These providers may process
                information as necessary to provide their
                services.
              </PolicySection>

              <PolicySection title="8. Blockchain Transactions">
                Blockchain transactions may be public,
                permanent, and outside AREA523&apos;s ability
                to modify or delete. Once a transaction is
                submitted to a blockchain network, AREA523
                may not be able to reverse or erase that
                transaction.
              </PolicySection>

              <PolicySection title="9. Data Retention">
                We may retain information for as long as
                reasonably necessary to provide the service,
                preserve platform integrity, maintain
                accounting or security records, resolve
                disputes, prevent fraud, and comply with
                applicable obligations.
              </PolicySection>

              <PolicySection title="10. Security">
                AREA523 uses reasonable technical and
                organizational measures intended to protect
                platform information. No internet,
                authentication, database, wallet, or
                blockchain system can be guaranteed to be
                completely secure.
              </PolicySection>

              <PolicySection title="11. Your Choices">
                You may choose what profile information and
                content you publish. You may sign out of
                your account and may contact AREA523
                regarding requests concerning your account
                or personal information where applicable.
              </PolicySection>

              <PolicySection title="12. Children">
                AREA523 is not intended for children who are
                below the minimum age permitted to use
                online services in their jurisdiction.
              </PolicySection>

              <PolicySection title="13. Changes">
                We may update this Privacy Policy as AREA523
                changes. The updated version will be posted
                on this page with a revised update date.
              </PolicySection>

              <PolicySection title="14. Contact">
                Privacy-related questions may be submitted
                through the contact method published by
                AREA523.
              </PolicySection>
            </div>
          </article>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function PolicySection({
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