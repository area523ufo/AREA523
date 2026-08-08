import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ContentPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0b0e12] text-white">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto max-w-[900px]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#69b7ff]">
              CONTENT POLICY
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Content and Verification Policy
            </h1>

            <p className="mt-6 leading-8 text-white/50">
              AREA523 is designed for public examination
              of disputed, unusual, controversial, and
              potentially synthetic media.
            </p>

            <div className="mt-8 space-y-4">
              <Policy
                title="Authenticity classification"
                text="REAL and AI classifications reflect community assessment of whether submitted media appears authentic or AI-generated or synthetically manipulated."
              />

              <Policy
                title="NOT AI VERIFIED"
                text="NOT AI VERIFIED means a report satisfied AREA523's platform verification requirements. It does not establish that every claim, interpretation, caption, or theory associated with the media is factually true."
              />

              <Policy
                title="Synthetic and edited media"
                text="AI-generated, CGI, reenacted, or materially edited media may be discussed on AREA523, but it should not be intentionally presented as authentic evidence without disclosure."
              />

              <Policy
                title="Sources and context"
                text="Users should provide source links, locations, capture dates, and relevant context whenever available. Missing context may affect verification quality."
              />

              <Policy
                title="Removal"
                text="AREA523 may remove material that violates platform rules, creates legal or safety risks, contains prohibited personal information, or materially undermines the verification process."
              />

              <Policy
                title="Disputed material"
                text="The presence of controversial or unverified material does not mean AREA523 endorses the underlying claim. The purpose of the platform is to expose material to transparent review."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Policy({
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