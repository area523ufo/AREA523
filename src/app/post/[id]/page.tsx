import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import VoteSection from "@/components/VoteSection";
import CommentSection from "@/components/CommentSection";
import { createClient } from "@/lib/supabase/server";
import PostActions from "@/components/PostActions";

type PostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BoardRelation = {
  name: string;
  slug: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCaptureDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function getBoard(
  boards: BoardRelation | BoardRelation[] | null,
) {
  if (!boards) {
    return null;
  }

  if (Array.isArray(boards)) {
    return boards[0] ?? null;
  }

  return boards;
}

export default async function PostPage({
  params,
}: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
  data: { user },
} = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      id,
      author_id,
      board_id,
      title,
      description,
      media_url,
      media_type,
      source_url,
      location,
      captured_at,
      is_original_media,
      status,
      verification_status,
      verification_number,
      verified_at,
      comment_count,
      real_vote_count,
      ai_vote_count,
      created_at,
      updated_at,
      boards (
        name,
        slug
      )
    `)
  .eq("id", id)
.neq("status", "removed")
.maybeSingle();

  if (error) {
    console.error("Failed to load post:", error);
    throw new Error(error.message);
  }

  if (!post) {
    notFound();
  }

  const board = getBoard(
    post.boards as BoardRelation | BoardRelation[] | null,
  );

  const realVotes = post.real_vote_count ?? 0;
  const aiVotes = post.ai_vote_count ?? 0;
  const totalVotes = realVotes + aiVotes;

  const realPercentage =
    totalVotes > 0
      ? Math.round((realVotes / totalVotes) * 100)
      : 0;

  const aiPercentage =
    totalVotes > 0
      ? Math.round((aiVotes / totalVotes) * 100)
      : 0;

  const createdAt = formatDate(post.created_at);
  const capturedAt = formatCaptureDate(post.captured_at);

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="mx-auto max-w-[820px]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-[#69b7ff]"
              >
                <span aria-hidden="true">←</span>
                Back to feed
              </Link>

              {board && (
                <Link
                  href={`/board/${board.slug}`}
                  className="rounded-full border border-[#48a7ff]/25 bg-[#48a7ff]/5 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#69b7ff] transition hover:bg-[#48a7ff]/10"
                >
                  {board.name}
                </Link>
              )}
            </div>

            <article className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
<div className="flex items-start justify-between gap-4">
  <div className="flex flex-wrap items-center gap-2">
    <span className="rounded-full border border-[#48a7ff]/25 bg-[#48a7ff]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#69b7ff]">
      {post.verification_status === "verified_real"
  ? "REAL · NOT AI"
  : post.verification_status === "verified_ai"
    ? "AI"
    : "UNVERIFIED"}
    </span>

    {post.is_original_media && (
      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
        Original uploader
      </span>
    )}

    {post.status && (
      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
        {post.status.replaceAll("_", " ")}
      </span>
    )}
  </div>

  <PostActions
    postId={post.id}
    authorId={post.author_id}
    currentUserId={user?.id ?? null}
    createdAt={post.created_at}
  />
</div>

                <h1 className="mt-4 break-words text-2xl font-black leading-tight text-white sm:text-3xl">
                  {post.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/35">
                  {createdAt && <span>Posted {createdAt}</span>}

                  <span>
                    {post.comment_count ?? 0} comments
                  </span>

                  <span>{totalVotes} votes</span>
                </div>
              </header>

              {post.media_url ? (
                <div className="border-b border-white/10 bg-black">
                  {post.media_type === "video" ? (
                    <video
                      src={post.media_url}
                      controls
                      playsInline
                      className="max-h-[760px] w-full bg-black object-contain"
                    >
                      Your browser does not support video
                      playback.
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="max-h-[760px] w-full bg-black object-contain"
                    />
                  )}
                </div>
              ) : null}

              <div className="space-y-6 px-5 py-6 sm:px-7">
                <section>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                    Description
                  </p>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/70">
                    {post.description}
                  </p>
                </section>

                {(post.location ||
                  capturedAt ||
                  post.source_url) && (
                  <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                      Submission details
                    </p>

                    <div className="mt-4 space-y-3">
                      {post.location && (
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                          <span className="w-28 shrink-0 text-xs font-black uppercase tracking-[0.12em] text-white/30">
                            Location
                          </span>

                          <span className="text-sm text-white/65">
                            {post.location}
                          </span>
                        </div>
                      )}

                      {capturedAt && (
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                          <span className="w-28 shrink-0 text-xs font-black uppercase tracking-[0.12em] text-white/30">
                            Captured
                          </span>

                          <span className="text-sm text-white/65">
                            {capturedAt}
                          </span>
                        </div>
                      )}

                      {post.source_url && (
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                          <span className="w-28 shrink-0 text-xs font-black uppercase tracking-[0.12em] text-white/30">
                            Source
                          </span>

                          <a
                            href={post.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 break-all text-sm font-semibold text-[#69b7ff] hover:underline"
                          >
                            {post.source_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <VoteSection
  postId={post.id}
  initialRealVotes={realVotes}
  initialAiVotes={aiVotes}
/>

                <CommentSection postId={post.id} />
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}