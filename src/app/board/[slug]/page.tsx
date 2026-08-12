import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import PostCard, {
  type PostAuthorRelation,
  type PostBoardRelation,
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type BoardPageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<{
    sort?: string;
  }>;
};

type SortMode = "trending" | "latest";

type Board = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

type RawPost = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: string | null;
  verification_status: string | null;
  verification_number: number | null;
  real_vote_count: number | null;
  ai_vote_count: number | null;
  comment_count: number | null;
  repost_count: number | null;
  created_at: string;
  author:
    | PostAuthorRelation
    | PostAuthorRelation[]
    | null;
  board:
    | PostBoardRelation
    | PostBoardRelation[]
    | null;
};

const fallbackDescriptions: Record<string, string> = {
  ufo:
    "UFO sightings, UAP footage, unexplained aerial phenomena, and open investigation.",
  politics:
    "Political media, public statements, disputed footage, and authenticity analysis.",
  stocks:
    "Market news, financial claims, trading media, and AI-generated investment content.",
  memes:
    "Viral images, edited media, satire, memes, and AI-generated content.",
};

function getSingleRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizePost(post: RawPost): SupabasePostCard {
  return {
    id: post.id,
    author_id: post.author_id,
    title: post.title,
    description: post.description,
    media_url: post.media_url,
    media_type: post.media_type,
    verification_status: post.verification_status,
    verification_number: post.verification_number,
    real_vote_count: post.real_vote_count,
    ai_vote_count: post.ai_vote_count,
    comment_count: post.comment_count,
    repost_count: post.repost_count,
    created_at: post.created_at,
    author: getSingleRelation(post.author),
    board: getSingleRelation(post.board),
  };
}

export default async function BoardPage({
  params,
  searchParams,
}: BoardPageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const sortMode: SortMode =
    sort === "latest"
      ? "latest"
      : "trending";

  const supabase = await createClient();

  const { data: boardData, error: boardError } =
    await supabase
      .from("boards")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .maybeSingle();

  if (boardError) {
    console.error(
      "Failed to load board:",
      boardError,
    );

    throw new Error(boardError.message);
  }

  if (!boardData) {
    notFound();
  }

  const board = boardData as Board;

  const { data: postData, error: postsError } =
    await supabase
      .from("posts")
      .select(`
        id,
        author_id,
        title,
        description,
        media_url,
        media_type,
        verification_status,
        verification_number,
        real_vote_count,
        ai_vote_count,
        comment_count,
        repost_count,
        created_at,
        author:profiles (
         username,
         avatar_url
        ),
        board:boards!posts_board_id_fkey (
          name,
          slug
        )
      `)
      .eq("board_id", board.id)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      });

  if (postsError) {
    console.error(
      "Failed to load board posts:",
      postsError,
    );
  }

  const boardPosts = ((postData ?? []) as RawPost[])
  .map(normalizePost)
  .sort((a, b) => {
    if (sortMode === "latest") {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }

    const aVotes =
      (a.real_vote_count ?? 0) +
      (a.ai_vote_count ?? 0);

    const bVotes =
      (b.real_vote_count ?? 0) +
      (b.ai_vote_count ?? 0);

    if (bVotes !== aVotes) {
      return bVotes - aVotes;
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

  const boardDescription =
    board.description ||
    fallbackDescriptions[board.slug] ||
    "Community reports and media verification.";

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 px-4 py-5 xl:grid-cols-[minmax(0,740px)_320px]">
          <section className="min-w-0">
            <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
              <div className="border-b border-white/10 bg-gradient-to-r from-[#17304a] to-[#101923] px-6 py-6">
                <h1 className="text-2xl font-black text-white">
  {board.name} AREA
</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  {boardDescription}
                </p>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-lg font-black text-white">
                    {boardPosts.length}
                  </p>

                  <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
                    Posts
                  </p>
                </div>

                <Link
                  href="/create"
                  className="rounded-full bg-[#48a7ff] px-5 py-2.5 text-sm font-bold text-[#06111c] transition hover:bg-[#71baff]"
                >
                  Create Post
                </Link>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-white/10 bg-[#12151a] p-2">
  <div className="flex items-center gap-1 overflow-x-auto">
    <Link
      href={`/board/${encodeURIComponent(
        board.slug,
      )}?sort=trending`}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm transition ${
        sortMode === "trending"
          ? "bg-[#48a7ff]/15 font-bold text-[#69b7ff]"
          : "font-semibold text-white/55 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      Trending
    </Link>

    <Link
      href={`/board/${encodeURIComponent(
        board.slug,
      )}?sort=latest`}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm transition ${
        sortMode === "latest"
          ? "bg-[#48a7ff]/15 font-bold text-[#69b7ff]"
          : "font-semibold text-white/55 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      Latest
    </Link>
  </div>
</div>

            {postsError && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4">
                <p className="text-sm font-semibold text-red-300">
                  Posts could not be loaded.
                </p>
              </div>
            )}

            {boardPosts.length > 0 ? (
              <div className="space-y-3">
                {boardPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#12151a] px-6 py-14 text-center">
                <p className="text-lg font-bold text-white/70">
                  No posts in this board yet.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Be the first to submit media for community
                  review.
                </p>

                <Link
                  href="/create"
                  className="mt-6 inline-flex rounded-full bg-[#48a7ff] px-5 py-2.5 text-sm font-bold text-[#06111c] transition hover:bg-[#71baff]"
                >
                  Create First Post
                </Link>
              </div>
            )}
          </section>

          <aside className="hidden space-y-4 xl:block">
            <section className="rounded-xl border border-white/10 bg-[#12151a] p-5">
              <p className="text-xs font-bold tracking-[0.2em] text-[#75bdff]">
                ABOUT
              </p>

              <h2 className="mt-2 text-xl font-black text-white">
                {board.name}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {boardDescription}
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#12151a] p-5">
              <p className="text-xs font-bold tracking-[0.2em] text-white/40">
                VERIFICATION
              </p>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Posts may enter the REAL · NOT AI archive
                after reaching the required community consensus
                and review threshold.
              </p>
            </section>

            <footer className="px-3 text-xs leading-5 text-white/25">
              About · Rules · Privacy · Content Policy
              <br />
              © 2026 AREA523
            </footer>
          </aside>
        </div>
      </div>
    </main>
  );
}