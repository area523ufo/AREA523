import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import PostCard, {
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

type ProfileStats = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;

  verified_score: number | string;
  verified_reports: number | string;
  creator_score: number | string;

  total_posts: number | string;
  total_comments: number | string;

  total_votes: number | string;
  correct_votes: number | string;
  accuracy: number | string;

  earned_area: number | string;
  area_balance: number | string;
};

function formatNumber(
  value: number | string | null | undefined,
): string {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function shortenWallet(wallet: string): string {
  if (wallet.length <= 18) {
    return wallet;
  }

  return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
}

export default async function ProfilePage({
  params,
}: Props) {
  const { username } = await params;

  const decodedUsername =
    decodeURIComponent(username).trim();

  const supabase = await createClient();

  const {
    data: baseProfile,
    error: baseProfileError,
  } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", decodedUsername)
    .maybeSingle();

  if (baseProfileError) {
    console.error(
      "Profile lookup failed:",
      baseProfileError,
    );

    notFound();
  }

  if (!baseProfile) {
    notFound();
  }

  const {
    data: profileData,
    error: profileError,
  } = await supabase.rpc("get_profile_stats", {
    p_user_id: baseProfile.id,
  });

  if (profileError) {
    console.error(
      "Profile stats load failed:",
      profileError,
    );

    notFound();
  }

  const profile =
    (profileData?.[0] as ProfileStats | undefined) ??
    null;

  if (!profile) {
    notFound();
  }

  const {
    data: postsData,
    error: postsError,
  } = await supabase
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
        username
      ),
      board:boards (
        name,
        slug
      )
    `)
    .eq("author_id", baseProfile.id)
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    });

  if (postsError) {
    console.error(
      "Profile posts load failed:",
      postsError,
    );
  }

  const posts =
    (postsData as SupabasePostCard[] | null) ?? [];

  const profileName =
    profile.display_name?.trim() ||
    profile.username;

  const profileInitial =
    profileName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-[980px]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#12151a] px-3 py-2 text-sm font-semibold text-white/55 transition hover:border-[#48a7ff]/30 hover:text-[#69b7ff]"
              >
                <span aria-hidden="true">←</span>
                Back
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#12151a] px-3 py-2 text-sm font-semibold text-white/55 transition hover:border-[#48a7ff]/30 hover:text-[#69b7ff]"
              >
                <span aria-hidden="true">⌂</span>
                Home
              </Link>
            </div>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#12151a]">
              <div className="h-28 bg-gradient-to-r from-[#17304a] via-[#11253a] to-[#0d1823]" />

              <div className="px-5 pb-6 sm:px-7">
                <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={`${profileName} profile`}
                      className="h-24 w-24 shrink-0 rounded-full border-4 border-[#12151a] bg-[#12151a] object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#12151a] bg-[#17304a] text-4xl font-black text-[#69b7ff]">
                      {profileInitial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="break-words text-3xl font-black text-white">
                        {profileName}
                      </h1>

                      {Number(profile.verified_reports) > 0 && (
                        <span className="rounded-full border border-[#48a7ff]/25 bg-[#48a7ff]/10 px-2.5 py-1 text-[10px] font-black tracking-wide text-[#75bdff]">
                          NOT AI VERIFIED
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-white/40">
                      @{profile.username}
                    </p>
                  </div>
                </div>

                {profile.bio && (
                  <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-white/60">
                    {profile.bio}
                  </p>
                )}

                {profile.wallet_address && (
                  <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                      Wallet
                    </p>

                    <p
                      title={profile.wallet_address}
                      className="mt-1 font-mono text-sm text-[#69b7ff]"
                    >
                      {shortenWallet(
                        profile.wallet_address,
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PrimaryStatCard
                title="Verified Score"
                value={formatNumber(
                  profile.verified_score,
                )}
                description="Voting reliability"
              />

              <PrimaryStatCard
                title="Accuracy"
                value={`${formatNumber(
                  profile.accuracy,
                )}%`}
                description={`${formatNumber(
                  profile.correct_votes,
                )} correct votes`}
              />

              <PrimaryStatCard
                title="Creator Score"
                value={formatNumber(
                  profile.creator_score,
                )}
                description="Verified reports created"
              />

              <PrimaryStatCard
                title="AREA Balance"
                value={formatNumber(
                  profile.area_balance,
                )}
                description="Current recorded balance"
              />
            </section>

          <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  <div className="col-span-2">
    <SecondaryStatCard
      title="Earned AREA"
      value={formatNumber(
        profile.earned_area,
      )}
    />
  </div>

  <SecondaryStatCard
    title="Posts"
    value={formatNumber(
      profile.total_posts,
    )}
  />

  <SecondaryStatCard
    title="Comments"
    value={formatNumber(
      profile.total_comments,
    )}
  />

  <SecondaryStatCard
    title="Votes"
    value={formatNumber(
      profile.total_votes,
    )}
  />

  <SecondaryStatCard
    title="Correct"
    value={formatNumber(
      profile.correct_votes,
    )}
  />
</section>

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#69b7ff]">
                    Activity
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-white">
                    Recent Posts
                  </h2>
                </div>

                <span className="text-sm font-semibold text-white/35">
                  {posts.length}{" "}
                  {posts.length === 1
                    ? "post"
                    : "posts"}
                </span>
              </div>

              {postsError ? (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-6 text-sm text-red-300">
                  Posts could not be loaded.
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#12151a] p-10 text-center">
                  <p className="text-sm font-semibold text-white/45">
                    This user has not published any
                    posts yet.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function PrimaryStatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#12151a] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
        {title}
      </p>

      <p className="mt-3 truncate text-2xl font-black text-[#69b7ff]">
        {value}
      </p>

      <p className="mt-2 text-xs text-white/30">
        {description}
      </p>
    </div>
  );
}

function SecondaryStatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#101317] p-4">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/25">
        {title}
      </p>

      <p className="mt-2 truncate text-lg font-black text-white/80">
        {value}
      </p>
    </div>
  );
}