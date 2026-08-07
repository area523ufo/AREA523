import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import EditPostForm from "@/components/EditPostForm";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({
  params,
}: EditPostPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: post, error } =
    await supabase
      .from("posts")
      .select(`
        id,
        author_id,
        title,
        description,
        source_url,
        location,
        captured_at,
        status,
        created_at
      `)
      .eq("id", id)
      .maybeSingle();

  if (error) {
    console.error(
      "Failed to load editable post:",
      error,
    );

    throw new Error(error.message);
  }

  if (!post || post.status === "removed") {
    notFound();
  }

  if (post.author_id !== user.id) {
    notFound();
  }

  const createdAt =
    new Date(post.created_at).getTime();

  const editDeadline =
    createdAt + 10 * 60 * 1000;

  const editExpired =
    Date.now() > editDeadline;

  if (editExpired) {
    redirect(`/post/${post.id}`);
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="mx-auto max-w-[820px]">
            <Link
              href={`/post/${post.id}`}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-[#69b7ff]"
            >
              <span aria-hidden="true">
                ←
              </span>
              Back to post
            </Link>

            <section className="rounded-xl border border-white/10 bg-[#12151a] p-5 sm:p-7">
              <div className="mb-6 border-b border-white/10 pb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
                  EDIT POST
                </p>

                <h1 className="mt-2 text-2xl font-black text-white">
                  Edit your post
                </h1>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  Posts can only be edited
                  during the first 10 minutes
                  after publishing.
                </p>
              </div>

              <EditPostForm
                postId={post.id}
                initialTitle={post.title}
                initialDescription={
                  post.description
                }
                initialSourceUrl={
                  post.source_url ?? ""
                }
                initialLocation={
                  post.location ?? ""
                }
                initialCapturedAt={
                  post.captured_at ?? ""
                }
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}