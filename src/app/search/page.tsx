import Link from "next/link";

import Header from "@/components/Header";
import PostCard, {
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type SearchResultRow = {
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

  author_username: string | null;

  board_name: string | null;
  board_slug: string | null;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q } = await searchParams;

  const query = q?.trim() ?? "";

  let posts: SupabasePostCard[] = [];
  let searchError: string | null = null;

  if (query) {
    const supabase = await createClient();

    const safeQuery = query
      .replaceAll("%", "")
      .trim()
      .slice(0, 100);

    if (safeQuery) {
      const { data, error } = await supabase.rpc(
        "search_posts",
        {
          p_query: safeQuery,
          p_limit: 50,
        },
      );

      if (error) {
        console.error(
          "Search failed:",
          error,
        );

        searchError = error.message;
      } else {
        const rows =
          (data ?? []) as SearchResultRow[];

        posts = rows.map((row) => ({
          id: row.id,
          author_id: row.author_id,
          title: row.title,
          description: row.description,
          media_url: row.media_url,
          media_type: row.media_type,

          verification_status:
            row.verification_status,

          verification_number:
            row.verification_number,

          real_vote_count:
            row.real_vote_count,

          ai_vote_count:
            row.ai_vote_count,

          comment_count:
            row.comment_count,

          repost_count:
            row.repost_count,

          created_at: row.created_at,

          author: row.author_username
            ? {
                username:
                  row.author_username,
              }
            : null,

          board:
            row.board_name &&
            row.board_slug
              ? {
                  name: row.board_name,
                  slug: row.board_slug,
                }
              : null,
        }));
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="mx-auto max-w-[980px]">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-[#69b7ff]"
            >
              <span aria-hidden="true">
                ←
              </span>

              Back to feed
            </Link>

            <section className="rounded-xl border border-white/10 bg-[#12151a] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
                Search AREA523
              </p>

              <h1 className="mt-2 break-words text-2xl font-black text-white">
                {query
                  ? `Results for "${query}"`
                  : "Search the archive"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Search by title, description,
                location, author, or board.
              </p>

              {query && !searchError && (
                <p className="mt-4 text-xs font-semibold text-white/25">
                  {posts.length}{" "}
                  {posts.length === 1
                    ? "result"
                    : "results"}
                </p>
              )}
            </section>

            {searchError ? (
              <section className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-6">
                <p className="text-sm font-black text-red-300">
                  Search could not be
                  completed.
                </p>

                <p className="mt-2 break-words text-xs leading-5 text-red-200/50">
                  {searchError}
                </p>
              </section>
            ) : !query ? (
              <section className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#12151a] px-6 py-14 text-center">
                <p className="text-sm font-black text-white/50">
                  Enter a search term above.
                </p>

                <p className="mt-2 text-xs text-white/25">
                  Try Roswell, UAP, Moon,
                  a username, or a board.
                </p>
              </section>
            ) : posts.length > 0 ? (
              <section className="mt-5 space-y-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </section>
            ) : (
              <section className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#12151a] px-6 py-14 text-center">
                <p className="text-sm font-black text-white/50">
                  No matching posts found.
                </p>

                <p className="mt-2 text-xs text-white/25">
                  Try a broader keyword or
                  check the spelling.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}