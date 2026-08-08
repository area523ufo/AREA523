import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[900px]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              PRIVACY
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Privacy Notice
            </h1>

            <p className="mt-6 leading-8 text-white/50">
              AREA523 collects and processes only the
              information reasonably necessary to operate
              accounts, community features, verification,
              moderation, security, and rewards.
            </p>

            <div className="mt-8 space-y-4">
              <Section
                title="Information you provide"
                text="This may include your email address, username, profile information, wallet address, posts, comments, votes, reports, and other information you choose to submit."
              />

              <Section
                title="Technical information"
                text="AREA523 and its infrastructure providers may process basic technical information such as IP address, browser information, device information, security logs, and session data."
              />

              <Section
                title="How information is used"
                text="Information may be used to provide the service, authenticate users, maintain platform integrity, prevent abuse, calculate rewards, moderate content, investigate reports, and improve reliability."
              />

              <Section
                title="Service providers"
                text="AREA523 relies on third-party infrastructure and service providers, including hosting, database, authentication, blockchain, and network providers. Information may be processed by those providers as necessary to deliver the service."
              />

              <Section
                title="Blockchain data"
                text="Blockchain transactions are public by design. Wallet addresses and token transfers recorded on Solana may be permanently visible on the public blockchain."
              />

              <Section
                title="Data retention"
                text="Information may be retained for as long as reasonably necessary for service operation, security, moderation, dispute resolution, legal compliance, and fraud prevention."
              />

              <Section
                title="Changes"
                text="This Privacy Notice may be updated as AREA523 develops. Material changes should be reflected on this page."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
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