import Link from "next/link";

import Header from "@/components/Header";
import PostCard, {
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import AreaLaunchCard from "@/components/AreaLaunchCard";

type BoardRelation = {
  name: string;
  slug: string;
};

type AuthorRelation = {
  username: string;
  avatar_url: string | null;
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
  boards: BoardRelation | BoardRelation[] | null;
  profiles: AuthorRelation | AuthorRelation[] | null;
};

function normalizeBoard(
  boards: BoardRelation | BoardRelation[] | null,
): BoardRelation | null {
  if (!boards) {
    return null;
  }

  if (Array.isArray(boards)) {
    return boards[0] ?? null;
  }

  return boards;
}

function normalizeAuthor(
  profiles: AuthorRelation | AuthorRelation[] | null,
): AuthorRelation | null {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0] ?? null;
  }

  return profiles;
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
    author: normalizeAuthor(post.profiles),
    board: normalizeBoard(post.boards),
  };
}

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
      boards (
        name,
        slug
      ),
      profiles (
        username
      )
    `)
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load home posts:", error);
  }

  const posts = ((data ?? []) as RawPost[])
    .map(normalizePost)
    .sort((a, b) => {
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

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 px-4 py-5 xl:grid-cols-[minmax(0,740px)_320px]">
          <section className="min-w-0">
            <div className="mb-4 rounded-xl border border-white/10 bg-[#12151a] p-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-[#48a7ff]/15 px-4 py-2 text-sm font-bold text-[#69b7ff]"
                >
                  Trending
                </button>

                <button
                  type="button"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Latest
                </button>

                <button
                  type="button"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Most Discussed
                </button>

                <button
                  type="button"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Following
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4">
                <p className="text-sm font-semibold text-red-300">
                  Posts could not be loaded.
                </p>
              </div>
            )}

            {posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#12151a] px-6 py-14 text-center">
                <p className="text-lg font-bold text-white/70">
                  No posts have been published yet.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Submit the first report for community
                  review.
                </p>

                <Link
                  href="/create"
                  className="mt-6 inline-flex rounded-full bg-[#48a7ff] px-5 py-2.5 text-sm font-bold text-[#06111c] transition hover:bg-[#71baff]"
                >
                  Create Post
                </Link>
              </div>
            )}
          </section>

          <aside className="hidden space-y-4 xl:block">
            <AreaLaunchCard />

            <section className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
              <div className="border-b border-white/10 bg-gradient-to-r from-[#17304a] to-[#101923] px-5 py-5">
                <p className="text-xs font-bold tracking-[0.25em] text-[#75bdff]">
                  AREA523
                </p>

                <h2 className="mt-2 text-xl font-black">
                  The Unexplained Archive
                </h2>
              </div>

              <div className="p-5">
                <p className="text-sm leading-6 text-white/55">
                  A media-first community for identifying
                  authentic content, investigating disputed
                  footage, and separating real media from
                  AI-generated material.
                </p>

                <Link
                  href="/create"
                  className="mt-5 block w-full rounded-full bg-[#48a7ff] py-2.5 text-center text-sm font-bold text-[#06111c] transition hover:bg-[#71baff]"
                >
                  Create Post
                </Link>

              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#12151a] p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                Top Tags
              </h3>

              <div className="mt-4 space-y-1">
</div>
            </section>


          </aside>
        </div>
      </div>
    </main>
  );
}