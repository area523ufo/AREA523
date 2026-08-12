import Link from "next/link";

import AreaLaunchCard from "@/components/AreaLaunchCard";
import Header from "@/components/Header";
import PostCard, {
  type SupabasePostCard,
} from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";

import { createClient } from "@/lib/supabase/server";

type FeedMode =
  | "trending"
  | "latest"
  | "following";

type PageProps = {
  searchParams: Promise<{
    feed?: string;
  }>;
};

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
  status?: string | null;

  boards:
    | BoardRelation
    | BoardRelation[]
    | null;

  profiles:
    | AuthorRelation
    | AuthorRelation[]
    | null;
};

type ReposterRelation = {
  username: string;
  avatar_url?: string | null;
};

type RawRepost = {
  user_id: string;
  created_at: string;

  profiles:
    | ReposterRelation
    | ReposterRelation[]
    | null;

  posts:
    | RawPost
    | RawPost[]
    | null;
};

type FeedActivity = {
  key: string;

  type:
    | "post"
    | "repost";

  occurredAt: string;

  actorId: string;

  actor:
    | ReposterRelation
    | null;

  post: SupabasePostCard;
};

function normalizeBoard(
  boards:
    | BoardRelation
    | BoardRelation[]
    | null,
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
  profiles:
    | AuthorRelation
    | AuthorRelation[]
    | null,
): AuthorRelation | null {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0] ?? null;
  }

  return profiles;
}

function normalizeReposter(
  profiles:
    | ReposterRelation
    | ReposterRelation[]
    | null,
): ReposterRelation | null {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0] ?? null;
  }

  return profiles;
}

function normalizeRawPost(
  post: RawPost,
): SupabasePostCard {
  return {
    id: post.id,
    author_id:
      post.author_id,

    title:
      post.title,

    description:
      post.description,

    media_url:
      post.media_url,

    media_type:
      post.media_type,

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
      normalizeAuthor(
        post.profiles,
      ),

    board:
      normalizeBoard(
        post.boards,
      ),
  };
}

function normalizeEmbeddedPost(
  value:
    | RawPost
    | RawPost[]
    | null,
): RawPost | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function resolveFeedMode(
  value:
    | string
    | undefined,
): FeedMode {
  if (
    value === "latest" ||
    value === "following"
  ) {
    return value;
  }

  return "trending";
}

function getTimestamp(
  value: string,
) {
  const timestamp =
    new Date(value)
      .getTime();

  return Number.isFinite(
    timestamp,
  )
    ? timestamp
    : 0;
}

function trendingScore(
  activity: FeedActivity,
) {
  const post =
    activity.post;

  const votes =
    (post.real_vote_count ??
      0) +
    (post.ai_vote_count ??
      0);

  const comments =
    post.comment_count ??
    0;

  const reposts =
    post.repost_count ??
    0;

  /*
   * Engagement weights:
   *
   * vote    = 1
   * comment = 2
   * repost  = 3
   *
   * Repost activity itself also gives
   * the item a small discovery boost.
   */
  const engagement =
    votes +
    comments * 2 +
    reposts * 3 +
    (activity.type ===
    "repost"
      ? 2
      : 0);

  const ageMs =
    Math.max(
      0,
      Date.now() -
        getTimestamp(
          activity.occurredAt,
        ),
    );

  const ageHours =
    ageMs /
    3_600_000;

  /*
   * Time decay prevents old high-vote
   * posts from permanently owning Trending.
   */
  const decay =
    Math.pow(
      1 +
        ageHours /
          12,
      1.35,
    );

  return (
    (engagement + 1) /
    decay
  );
}

function formatActivityTime(
  value: string,
) {
  const date =
    new Date(value);

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) /
          1000,
      ),
    );

  if (seconds < 60) {
    return "just now";
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days}d`;
}

function feedHref(
  feed: FeedMode,
) {
  if (
    feed === "trending"
  ) {
    return "/";
  }

  return `/?feed=${feed}`;
}

function FeedTab({
  feed,
  current,
  children,
}: {
  feed: FeedMode;
  current: FeedMode;
  children: React.ReactNode;
}) {
  const active =
    feed === current;

  return (
    <Link
      href={feedHref(feed)}
      scroll={false}
      className={
        active
          ? "shrink-0 rounded-lg bg-[#48a7ff]/15 px-4 py-2 text-sm font-bold text-[#69b7ff]"
          : "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
      }
    >
      {children}
    </Link>
  );
}

export default async function Home({
  searchParams,
}: PageProps) {
  const {
    feed:
      requestedFeed,
  } =
    await searchParams;

  const feed =
    resolveFeedMode(
      requestedFeed,
    );

  const supabase =
    await createClient();

  /*
   * -------------------------------------------------
   * Viewer
   * -------------------------------------------------
   */

  const {
    data: {
      user:
        currentUser,
    },
  } =
    await supabase.auth
      .getUser();

  /*
   * -------------------------------------------------
   * Original posts
   * -------------------------------------------------
   */

  const {
    data:
      postsData,
    error:
      postsError,
  } =
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

        boards!posts_board_id_fkey (
          name,
          slug
        ),

        profiles!posts_author_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq(
        "status",
        "published",
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(250);

  if (postsError) {
    console.error(
      "Failed to load home posts:",
      postsError,
    );
  }

  const rawPosts =
    (postsData ??
      []) as unknown as
      RawPost[];

  /*
   * -------------------------------------------------
   * Repost activities
   * -------------------------------------------------
   */

  const {
    data:
      repostData,
    error:
      repostError,
  } =
    await supabase
      .from(
        "post_reposts",
      )
      .select(`
        user_id,
        created_at,

        profiles!post_reposts_user_id_fkey (
          username,
          avatar_url
        ),

        posts!post_reposts_post_id_fkey (
          id,
          author_id,
          title,
          description,
          media_url,
          media_type,
          status,
          verification_status,
          verification_number,
          real_vote_count,
          ai_vote_count,
          comment_count,
          repost_count,
          created_at,

          boards!posts_board_id_fkey (
            name,
            slug
          ),

          profiles!posts_author_id_fkey (
            username,
            avatar_url
          )
        )
      `)
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(250);

  if (repostError) {
    console.error(
      "Failed to load repost activities:",
      repostError,
    );
  }

  const rawReposts =
    (repostData ??
      []) as unknown as
      RawRepost[];

  /*
   * -------------------------------------------------
   * Viewer following IDs
   * -------------------------------------------------
   */

  let followedIds =
    new Set<string>();

  if (currentUser) {
    const {
      data:
        followRows,
      error:
        followError,
    } =
      await supabase
        .from(
          "user_follows",
        )
        .select(
          "following_id",
        )
        .eq(
          "follower_id",
          currentUser.id,
        );

    if (followError) {
      console.error(
        "Failed to load following list:",
        followError,
      );
    } else {
      followedIds =
        new Set(
          (
            followRows ??
            []
          ).map(
            (row) =>
              row.following_id,
          ),
        );
    }
  }

  /*
   * -------------------------------------------------
   * Viewer repost state
   * -------------------------------------------------
   */

  const viewerRepostedIds =
    new Set<string>();

  if (currentUser) {
    for (
      const row
      of rawReposts
    ) {
      if (
        row.user_id !==
        currentUser.id
      ) {
        continue;
      }

      const rawPost =
        normalizeEmbeddedPost(
          row.posts,
        );

      if (rawPost) {
        viewerRepostedIds
          .add(
            rawPost.id,
          );
      }
    }
  }

  /*
   * -------------------------------------------------
   * Build unified activity stream
   * -------------------------------------------------
   */

  const activities:
    FeedActivity[] = [];

  for (
    const rawPost
    of rawPosts
  ) {
    const post =
      normalizeRawPost(
        rawPost,
      );

    activities.push({
      key:
        `post:${post.id}`,

      type:
        "post",

      occurredAt:
        post.created_at,

      actorId:
        post.author_id,

      actor:
        post.author,

      post,
    });
  }

  for (
    const repost
    of rawReposts
  ) {
    const rawPost =
      normalizeEmbeddedPost(
        repost.posts,
      );

    /*
     * Ignore deleted/unpublished posts
     * that may still exist in old relations.
     */
    if (
      !rawPost ||
      rawPost.status !==
        "published"
    ) {
      continue;
    }

    const post =
      normalizeRawPost(
        rawPost,
      );

    activities.push({
      key:
        `repost:${repost.user_id}:${post.id}:${repost.created_at}`,

      type:
        "repost",

      occurredAt:
        repost.created_at,

      actorId:
        repost.user_id,

      actor:
        normalizeReposter(
          repost.profiles,
        ),

      post,
    });
  }

  /*
   * -------------------------------------------------
   * Apply feed mode
   * -------------------------------------------------
   */

  let feedActivities =
    [...activities];

  if (
    feed ===
    "following"
  ) {
    feedActivities =
      currentUser
        ? feedActivities
            .filter(
              (activity) =>
                followedIds.has(
                  activity.actorId,
                ),
            )
        : [];
  }

  if (
    feed === "latest" ||
    feed ===
      "following"
  ) {
    feedActivities.sort(
      (a, b) =>
        getTimestamp(
          b.occurredAt,
        ) -
        getTimestamp(
          a.occurredAt,
        ),
    );
  } else {
    feedActivities.sort(
      (a, b) => {
        const difference =
          trendingScore(b) -
          trendingScore(a);

        if (
          difference !==
          0
        ) {
          return difference;
        }

        return (
          getTimestamp(
            b.occurredAt,
          ) -
          getTimestamp(
            a.occurredAt,
          )
        );
      },
    );
  }

  /*
   * Keep initial page reasonably light.
   */
  feedActivities =
    feedActivities.slice(
      0,
      100,
    );

  const hasLoadError =
    Boolean(
      postsError ||
        repostError,
    );

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 px-4 py-5 xl:grid-cols-[minmax(0,740px)_320px]">
          <section className="min-w-0">
            <div className="mb-4 rounded-xl border border-white/10 bg-[#12151a] p-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                <FeedTab
                  feed="trending"
                  current={feed}
                >
                  Trending
                </FeedTab>

                <FeedTab
                  feed="latest"
                  current={feed}
                >
                  Latest
                </FeedTab>

                <FeedTab
                  feed="following"
                  current={feed}
                >
                  Following
                </FeedTab>
              </div>
            </div>

            {hasLoadError && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4">
                <p className="text-sm font-semibold text-red-300">
                  Some feed activity could not be loaded.
                </p>
              </div>
            )}

            {feed ===
              "following" &&
            !currentUser ? (
              <div className="rounded-xl border border-white/10 bg-[#12151a] px-6 py-16 text-center">
                <p className="text-lg font-black text-white/80">
                  Sign in to see your Following feed.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Posts and reposts from people you follow will appear here.
                </p>
              </div>
            ) : feed ===
                "following" &&
              followedIds.size ===
                0 ? (
              <div className="rounded-xl border border-white/10 bg-[#12151a] px-6 py-16 text-center">
                <p className="text-lg font-black text-white/80">
                  You are not following anyone yet.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Follow people from their profiles to build this feed.
                </p>
              </div>
            ) : feedActivities.length >
              0 ? (
              <div className="space-y-3">
                {feedActivities.map(
                  (
                    activity,
                  ) => (
                    <div
                      key={
                        activity.key
                      }
                    >
                      {activity.type ===
                        "repost" && (
                        <div className="mb-2 flex items-center gap-2 px-3 text-xs font-bold text-white/40">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m17 2 4 4-4 4" />
                            <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                            <path d="m7 22-4-4 4-4" />
                            <path d="M21 13v2a3 3 0 0 1-3 3H3" />
                          </svg>

                          {activity.actor ? (
                            <Link
                              href={`/profile/${encodeURIComponent(
                                activity
                                  .actor
                                  .username,
                              )}`}
                              className="transition hover:text-[#69b7ff]"
                            >
                              @
                              {
                                activity
                                  .actor
                                  .username
                              }{" "}
                              reposted
                            </Link>
                          ) : (
                            <span>
                              Reposted
                            </span>
                          )}

                          <span className="font-medium text-white/25">
                            ·{" "}
                            {formatActivityTime(
                              activity.occurredAt,
                            )}
                          </span>
                        </div>
                      )}

                      <PostCard
                        post={
                          activity.post
                        }
                        initialReposted={
                          viewerRepostedIds.has(
                            activity
                              .post
                              .id,
                          )
                        }
                      />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#12151a] px-6 py-14 text-center">
                <p className="text-lg font-bold text-white/70">
                  No activity yet.
                </p>

                <p className="mt-2 text-sm text-white/35">
                  Submit the first report for community review.
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
                  A media-first community for identifying authentic content,
                  investigating disputed footage, and separating real media
                  from AI-generated material.
                </p>

                <Link
                  href="/create"
                  className="mt-5 block w-full rounded-full bg-[#48a7ff] py-2.5 text-center text-sm font-bold text-[#06111c] transition hover:bg-[#71baff]"
                >
                  Create Post
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}