import Image from "next/image";

import Header from "@/components/Header";
import PostCard, {
  type PostAuthorRelation,
  type PostBoardRelation,
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type VerifiedPostRow = {
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

export default async function VerifiedPage() {
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
      author:profiles!posts_author_id_fkey (
        username
      ),
      board:boards!posts_board_id_fkey (
        name,
        slug
      )
    `)
    .eq("status", "published")
    .eq("verification_status", "verified_real")
    .order("verification_number", {
      ascending: false,
      nullsFirst: false,
    })
    .order("verified_at", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error(
      "Failed to load verified posts:",
      error,
    );
  }

  const rows = (data ?? []) as VerifiedPostRow[];

  const verifiedPosts: SupabasePostCard[] =
    rows.map((post) => ({
      id: post.id,
      author_id: post.author_id,
      title: post.title,
      description: post.description,
      media_url: post.media_url,
      media_type: post.media_type,
      verification_status:
        post.verification_status,
      verification_number:
        post.verification_number,
      real_vote_count:
        post.real_vote_count,
      ai_vote_count:
        post.ai_vote_count,
      comment_count:
        post.comment_count,
      repost_count:
        post.repost_count,
      created_at:
        post.created_at,
      author:
        getSingleRelation(post.author),
      board:
        getSingleRelation(post.board),
    }));

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="overflow-hidden rounded-xl border border-[#48a7ff]/20 bg-[#12151a]">
            <div className="border-b border-[#48a7ff]/20 bg-gradient-to-r from-[#17304a] to-[#101923] px-6 py-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="AREA523"
                  width={54}
                  height={54}
                  className="rounded-full"
                />

                <div>
                  <p className="text-xs font-bold tracking-[0.22em] text-[#75bdff]">
                    AREA523
                  </p>

                  <h1 className="mt-1 text-3xl font-black">
                    NOT AI VERIFIED
                  </h1>

                  <p className="mt-2 text-sm text-white/45">
                    Permanently archived
                    community-verified media.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 bg-[#0f1318] px-6 py-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-black">
                    {verifiedPosts.length}
                  </p>

                  <p className="text-xs text-white/40">
                    VERIFIED POSTS
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">
                    100%
                  </p>

                  <p className="text-xs text-white/40">
                    PERMANENT
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {error ? (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-10 text-center">
                  <p className="font-bold text-red-300">
                    Verified posts could not be loaded.
                  </p>

                  <p className="mt-2 text-xs text-red-200/50">
                    {error.message}
                  </p>
                </div>
              ) : verifiedPosts.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#0f1318] p-10 text-center text-white/55">
                  No verified posts yet.
                </div>
              ) : (
                verifiedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}