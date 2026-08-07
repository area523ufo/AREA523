import Link from "next/link";

import CreatePostForm from "@/components/CreatePostForm";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function CreatePostPage() {
  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="mx-auto max-w-[820px]">
            <div className="mb-5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-[#69b7ff]"
              >
                <span aria-hidden="true">←</span>
                Back to feed
              </Link>
            </div>

            <CreatePostForm />
          </div>
        </div>
      </div>
    </main>
  );
}