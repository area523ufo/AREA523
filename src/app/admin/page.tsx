import Link from "next/link";
import { redirect } from "next/navigation";

import AdminPostActions from "@/components/AdminPostActions";
import AdminReportActions from "@/components/AdminReportActions";
import AdminUserActions from "@/components/AdminUserActions";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

type PostRelation = {
  id: string;
  author_id: string;
  title: string;
  status: string;
};

type ReportRow = {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  post: PostRelation | PostRelation[] | null;
};

type AdminPostRow = {
  id: string;
  author_id: string;
  title: string;
  status: string;
  created_at: string;
  verification_status: string | null;
  verification_admin_override: boolean;

  author:
    | {
        username: string;
      }
    | {
        username: string;
      }[]
    | null;

  board:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
};

type AdminUserRow = {
  id: string;
  username: string;
  display_name: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  karma: number;
  verified_score: number | null;
  area_balance: number | null;
  verification_admin_override: boolean;
  verification_status: string | null;
};

function getPost(
  post:
    | PostRelation
    | PostRelation[]
    | null,
): PostRelation | null {
  if (!post) {
    return null;
  }

  if (Array.isArray(post)) {
    return post[0] ?? null;
  }

  return post;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRelation<T>(
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

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      is_admin,
      is_suspended
    `)
    .eq("id", user.id)
    .single();

  if (
    !profile?.is_admin ||
    profile.is_suspended
  ) {
    redirect("/");
  }

  const {
    data: reportData,
    error: reportError,
  } = await supabase
    .from("post_reports")
    .select(`
      id,
      post_id,
      reporter_id,
      reason,
      status,
      created_at,
      reviewed_at,
      reviewed_by,
      post:posts!post_reports_post_id_fkey (
        id,
        author_id,
        title,
        status
      )
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(100);

  if (reportError) {
    console.error(
      "Failed to load reports:",
      reportError,
    );
  }

  const reports =
    (reportData ?? []) as ReportRow[];

  const pendingCount = reports.filter(
    (report) =>
      report.status === "pending",
  ).length;

  const reviewedCount = reports.filter(
    (report) =>
      report.status === "reviewed",
  ).length;

  const dismissedCount = reports.filter(
    (report) =>
      report.status === "dismissed",
  ).length;

const {
  data: postData,
  error: postError,
} = await supabase
  .from("posts")
  .select(`
    id,
   author_id,
   title,
   status,
   created_at,
   verification_status,
   verification_admin_override,
   author:profiles (
     username,
     avatar_url
    ),
    board:boards!posts_board_id_fkey (
      name,
      slug
    )
  `)
  .order("created_at", {
    ascending: false,
  })
  .limit(100);

if (postError) {
  console.error(
    "Failed to load admin posts:",
    postError,
  );
}

const adminPosts =
  (postData ?? []) as AdminPostRow[];

  const {
  data: userData,
  error: userError,
} = await supabase
  .from("profiles")
  .select(`
    id,
    username,
    display_name,
    is_admin,
    is_suspended,
    suspended_at,
    suspended_reason,
    created_at,
    karma,
    verified_score,
    area_balance
  `)
  .order("created_at", {
    ascending: false,
  })
  .limit(200);

if (userError) {
  console.error(
    "Failed to load admin users:",
    userError,
  );
}

const adminUsers =
  (userData ?? []) as AdminUserRow[];

const suspendedUserCount =
  adminUsers.filter(
    (item) => item.is_suspended,
  ).length;

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-5">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
                  AREA523 ADMIN
                </p>

                <h1 className="mt-2 text-3xl font-black text-white">
                  Moderation Console
                </h1>

                <p className="mt-2 text-sm text-white/40">
                  Review reports, remove
                  content, and moderate users.
                </p>
              </div>

              <Link
                href="/"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                Back to AREA523
              </Link>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-[#12151a] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">
                  Total
                </p>

                <p className="mt-2 text-3xl font-black text-white">
                  {reports.length}
                </p>
              </div>

              <div className="rounded-xl border border-amber-400/15 bg-[#12151a] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-300/60">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-black text-amber-300">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-xl border border-[#48a7ff]/15 bg-[#12151a] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#69b7ff]/60">
                  Reviewed
                </p>

                <p className="mt-2 text-3xl font-black text-[#69b7ff]">
                  {reviewedCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#12151a] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">
                  Dismissed
                </p>

                <p className="mt-2 text-3xl font-black text-white/60">
                  {dismissedCount}
                </p>
              </div>
            </div>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div>
                  <h2 className="font-black text-white">
                    Post Reports
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Newest reports appear
                    first.
                  </p>
                </div>

                {pendingCount > 0 && (
                  <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                    {pendingCount} pending
                  </span>
                )}
              </div>

              {reports.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-white/35">
                    No reports submitted.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {reports.map(
                    (report) => {
                      const post = getPost(
                        report.post,
                      );

                      const postRemoved =
                        post?.status ===
                        "removed";

                      return (
                        <article
                          key={report.id}
                          className="p-5 sm:p-6"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-5">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                                    report.status ===
                                    "pending"
                                      ? "bg-amber-400/10 text-amber-300"
                                      : report.status ===
                                          "reviewed"
                                        ? "bg-[#48a7ff]/10 text-[#69b7ff]"
                                        : "bg-white/[0.06] text-white/35"
                                  }`}
                                >
                                  {
                                    report.status
                                  }
                                </span>

                                {postRemoved && (
                                  <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-300">
                                    POST REMOVED
                                  </span>
                                )}

                                <span className="text-xs text-white/25">
                                  {formatDate(
                                    report.created_at,
                                  )}
                                </span>
                              </div>

                              {post && (
                                <div className="mt-4">
                                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                                    Reported Post
                                  </p>

                                  <p className="mt-1 break-words text-sm font-black text-white">
                                    {post.title}
                                  </p>
                                </div>
                              )}

                              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/10 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                                  Report Reason
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
                                  {
                                    report.reason
                                  }
                                </p>
                              </div>

                              <div className="mt-4 space-y-1 font-mono text-[11px] text-white/20">
                                <p>
                                  Reporter:{" "}
                                  {
                                    report.reporter_id
                                  }
                                </p>

                                <p>
                                  Author:{" "}
                                  {post?.author_id ??
                                    "Unknown"}
                                </p>

                                <p>
                                  Post:{" "}
                                  {report.post_id}
                                </p>
                              </div>

                              <AdminReportActions
                                reportId={
                                  report.id
                                }
                                postId={
                                  report.post_id
                                }
                                authorId={
                                  post?.author_id ??
                                  null
                                }
                                reportStatus={
                                  report.status
                                }
                                postRemoved={
                                  postRemoved
                                }
                              />
                            </div>

                            {!postRemoved &&
                              post && (
                                <Link
                                  href={`/post/${report.post_id}`}
                                  className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/50 transition hover:border-[#48a7ff]/40 hover:text-[#69b7ff]"
                                >
                                  View Post
                                </Link>
                              )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>

<section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
    <div>
      <h2 className="font-black text-white">
        Users
      </h2>

      <p className="mt-1 text-xs text-white/30">
        Manage AREA523 accounts and
        suspensions.
      </p>
    </div>

    <div className="flex items-center gap-3 text-xs font-black">
      <span className="text-white/30">
        {adminUsers.length} users
      </span>

      {suspendedUserCount > 0 && (
        <span className="rounded-full bg-red-400/10 px-3 py-1 text-red-300">
          {suspendedUserCount} suspended
        </span>
      )}
    </div>
  </div>

  {adminUsers.length === 0 ? (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-white/35">
        No users found.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-white/10">
      {adminUsers.map((item) => (
        <article
          key={item.id}
          className="p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${encodeURIComponent(
                    item.username,
                  )}`}
                  className="text-sm font-black text-white transition hover:text-[#69b7ff]"
                >
                  @{item.username}
                </Link>

                {item.is_admin && (
                  <span className="rounded-full bg-[#48a7ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#69b7ff]">
                    ADMIN
                  </span>
                )}

                {item.is_suspended ? (
                  <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-300">
                    SUSPENDED
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                    ACTIVE
                  </span>
                )}
              </div>

              {item.display_name && (
                <p className="mt-1 text-xs font-semibold text-white/40">
                  {item.display_name}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/30">
                <span>
                  Karma:{" "}
                  {item.karma.toLocaleString(
                    "en-US",
                  )}
                </span>

                <span>
                  Verified Score:{" "}
                  {item.verified_score ?? 0}
                </span>

                <span>
                  AREA:{" "}
                  {(
                    item.area_balance ?? 0
                  ).toLocaleString("en-US")}
                </span>

                <span>
                  Joined:{" "}
                  {formatDate(
                    item.created_at,
                  )}
                </span>
              </div>

              {item.is_suspended &&
                item.suspended_reason && (
                  <div className="mt-3 rounded-lg border border-red-400/10 bg-red-400/[0.04] px-3 py-2">
                    <p className="text-xs text-red-200/60">
                      Suspension reason:{" "}
                      {
                        item.suspended_reason
                      }
                    </p>
                  </div>
                )}
            </div>

            <AdminUserActions
              userId={item.id}
              username={item.username}
              suspended={
                item.is_suspended
              }
              isAdmin={item.is_admin}
            />
          </div>
        </article>
      ))}
    </div>
  )}
</section>
            
            <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
  <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
    <div>
      <h2 className="font-black text-white">
        All Posts
      </h2>

      <p className="mt-1 text-xs text-white/30">
        Manage all posts regardless of
        report status.
      </p>
    </div>

    <span className="text-xs font-black text-white/30">
      {adminPosts.length} posts
    </span>
  </div>

  {adminPosts.length === 0 ? (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-white/35">
        No posts found.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-white/10">
      {adminPosts.map((post) => {
        const author = getRelation(
          post.author,
        );

        const board = getRelation(
          post.board,
        );

        const removed =
          post.status === "removed";

        return (
          <article
            key={post.id}
            className="p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      removed
                        ? "bg-red-400/10 text-red-300"
                        : "bg-emerald-400/10 text-emerald-300"
                    }`}
                  >
                    {post.status}
                  </span>

                  {board && (
                    <span className="rounded-full bg-[#48a7ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#69b7ff]">
                      {board.name}
                    </span>
                  )}

{post.verification_admin_override && (
  <span className="rounded-full bg-[#48a7ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#69b7ff]">
    ADMIN VERIFIED
  </span>
)}

                  <span className="text-xs text-white/25">
                    {formatDate(
                      post.created_at,
                    )}
                  </span>
                </div>

                <h3 className="mt-3 break-words text-sm font-black text-white">
                  {post.title}
                </h3>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
                  <span>
                    Author:{" "}
                    {author?.username ??
                      post.author_id.slice(
                        0,
                        8,
                      )}
                  </span>

                  {board && (
                    <span>
                      Board: {board.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!removed && (
                  <Link
                    href={`/post/${post.id}`}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/45 transition hover:border-[#48a7ff]/40 hover:text-[#69b7ff]"
                  >
                    View
                  </Link>
                )}

                <AdminPostActions
  postId={post.id}
  removed={removed}
  adminOverride={
    post.verification_admin_override
  }
/>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  )}


  
</section>
          </div>
        </div>
      </div>
    </main>
  );
}