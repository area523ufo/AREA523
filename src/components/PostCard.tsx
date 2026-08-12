"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import VerifiedBadge from "@/components/VerifiedBadge";
import FeedVideo from "@/components/FeedVideo";

export type PostAuthorRelation = {
  username: string;
  avatar_url?: string | null;
};

export type PostBoardRelation = {
  name: string;
  slug: string;
};

export type SupabasePostCard = {
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
  author: PostAuthorRelation | null;
  board: PostBoardRelation | null;
};

type PostCardProps = {
  post: SupabasePostCard;
  initialReposted?: boolean;
};

type VoteValue = "REAL" | "AI";

type VoteSuccessResponse = {
  success: true;
  postId: string;
  userVote: VoteValue;
  realVotes: number;
  aiVotes: number;
  totalVotes: number;
};

type VoteErrorResponse = {
  success: false;
  error: string;
};

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[19px] w-[19px]"
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
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const differenceInSeconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000),
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(differenceInSeconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function PostCard({
  post,
  initialReposted = false,
}: PostCardProps) {
  const router = useRouter();
  const [realVotes, setRealVotes] = useState(
    post.real_vote_count ?? 0,
  );

  const [aiVotes, setAiVotes] = useState(
    post.ai_vote_count ?? 0,
  );

  const [selectedVote, setSelectedVote] =
    useState<VoteValue | null>(null);

  const [pendingVote, setPendingVote] =
    useState<VoteValue | null>(null);

  const [voteError, setVoteError] =
    useState<string | null>(null);

  const [repostCount, setRepostCount] = useState(
    post.repost_count ?? 0,
  );

  const [reposted, setReposted] =
  useState(initialReposted);

  const [pendingRepost, setPendingRepost] =
    useState(false);

  const totalVotes = realVotes + aiVotes;
  const comments = post.comment_count ?? 0;

  const votingFinalized =
    post.verification_status !== null &&
    post.verification_status !== "unverified";

  const verificationNumber =
    post.verification_status === "verified_real" &&
    typeof post.verification_number === "number"
      ? post.verification_number
      : null;

  const postHref = `/post/${post.id}`;

  const boardHref = post.board
    ? `/board/${post.board.slug}`
    : "/";

  const authorName =
    post.author?.username ??
    post.author_id.slice(0, 8);
  const authorInitial =
   authorName.charAt(0).toUpperCase();

  async function handleVote(vote: VoteValue) {
    if (pendingVote || votingFinalized) {
      return;
    }

    setPendingVote(vote);
    setVoteError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          vote,
        }),
      });

      const result = (await response.json()) as
        | VoteSuccessResponse
        | VoteErrorResponse;

     if (response.status === 401) {
  window.dispatchEvent(
    new CustomEvent(
      "area523:open-auth",
      {
        detail: {
          mode: "signup",
        },
      },
    ),
  );

  return;
}

if (!response.ok || !result.success) {
  const errorMessage =
    "error" in result
      ? result.error
      : "The vote could not be processed.";

  setVoteError(errorMessage);
  return;
}

      setRealVotes(result.realVotes);
      setAiVotes(result.aiVotes);
      setSelectedVote(result.userVote);
    } catch (error) {
      console.error(
        "Vote request failed:",
        error,
      );

      setVoteError(
        "The vote could not be processed. Please try again.",
      );
    } finally {
      setPendingVote(null);
    }
  }

  async function handleShare() {
    const shareUrl =
      `${window.location.origin}${postHref}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl,
      );

      alert("Link copied.");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleRepost() {
    if (pendingRepost) {
      return;
    }

    setPendingRepost(true);

    try {
      const response = await fetch(
        "/api/repost",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            postId: post.id,
          }),
        },
      );

      const result = await response.json();

     if (response.status === 401) {
  window.dispatchEvent(
    new CustomEvent(
      "area523:open-auth",
      {
        detail: {
          mode: "signup",
        },
      },
    ),
  );

  return;
}

if (!response.ok || !result.success) {
  console.error(result.error);
  return;
}

      setReposted(result.reposted);
setRepostCount(result.repostCount);
router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingRepost(false);
    }
  }

  return (
    <article className="group relative overflow-hidden border-y border-white/10 bg-[#12151a] transition hover:border-white/20 sm:rounded-xl sm:border">
      <Link
        href={postHref}
        aria-label={`Open post: ${post.title}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex">

       <div className="min-w-0 flex-1 p-3 sm:p-4">
       <div className="flex items-start gap-3">
  <Link
    href={`/profile/${encodeURIComponent(authorName)}`}
    className="pointer-events-auto shrink-0"
    aria-label={`Open ${authorName}'s profile`}
  >
    {post.author?.avatar_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.author.avatar_url}
        alt={`${authorName} profile`}
        className="h-10 w-10 rounded-full border border-white/10 object-cover transition hover:border-[#48a7ff]/50"
      />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#17304a] text-sm font-black text-[#69b7ff]">
        {authorInitial}
      </div>
    )}
  </Link>

  <div className="min-w-0 flex-1">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
     <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
  <Link
    href={`/profile/${encodeURIComponent(authorName)}`}
    className="pointer-events-auto truncate text-sm font-bold text-white/85 transition hover:text-[#69b7ff]"
  >
    @{authorName}
  </Link>

  <span className="text-xs text-white/35">
    {formatRelativeTime(post.created_at)}
  </span>

  {post.board && (
    <Link
      href={boardHref}
      className="pointer-events-auto rounded-full bg-[#48a7ff]/10 px-2 py-0.5 text-[10px] font-bold text-[#69b7ff] transition hover:bg-[#48a7ff]/20"
    >
      {post.board.name}
    </Link>
  )}
</div>

      {totalVotes >= 10 && (
        <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          TOP REPORT
        </span>
      )}
    </div>
  </div>
</div>

          <h2 className="mt-3 break-words text-base font-bold leading-6 text-white transition group-hover:text-[#8bc8ff] sm:text-lg">
            {post.title}
          </h2>

          <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/55">
            {post.description}
          </p>

          {post.media_url && (
          <div className="relative -mx-3 mt-4 flex max-h-[560px] min-h-52 items-center justify-center overflow-hidden border-y border-white/[0.07] bg-black sm:mx-0 sm:max-h-[460px] sm:rounded-lg sm:border">
              {verificationNumber !==
                null && (
                <div className="absolute left-3 top-3 z-10">
                  <VerifiedBadge
                    verificationNumber={
                      verificationNumber
                    }
                    compact
                  />
                </div>
              )}

             {post.media_type ===
"video" ? (
  <FeedVideo
    src={post.media_url}
  />
) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.media_url}
                  alt={post.title}
                  className="max-h-[560px] w-full object-contain sm:max-h-[460px]"
                />
              )}
            </div>
          )}

          {verificationNumber !== null && (
            <div className="mt-4">
              <VerifiedBadge
                verificationNumber={
                  verificationNumber
                }
              />
            </div>
          )}

          {votingFinalized && (
            <p className="mt-3 text-xs font-semibold text-white/30">
              Voting has ended for this post.
            </p>
          )}

          {voteError && (
            <div
              role="alert"
              className="pointer-events-auto mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs font-semibold text-red-300"
            >
              {voteError}
            </div>
          )}

         <div className="mt-4 flex flex-wrap items-center gap-1 text-xs font-semibold text-white/40">
  <Link
    href={`${postHref}#comments`}
    aria-label={`${comments} comments`}
    title="Comments"
    className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-white/[0.07] hover:text-white sm:px-3"
  >
    <CommentIcon />
    <span>{comments}</span>
  </Link>

  <button
    type="button"
    onClick={() => void handleVote("REAL")}
    disabled={pendingVote !== null || votingFinalized}
    aria-label="Vote REAL"
    aria-pressed={selectedVote === "REAL"}
    className={`pointer-events-auto inline-flex h-9 items-center rounded-full px-2.5 sm:px-3 transition ${
      selectedVote === "REAL"
        ? "bg-emerald-400/15 text-emerald-300"
        : "text-emerald-300/70 hover:bg-emerald-400/10 hover:text-emerald-300"
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    {pendingVote === "REAL"
      ? "..."
      : `REAL ${realVotes}`}
  </button>

  <button
    type="button"
    onClick={() => void handleVote("AI")}
    disabled={pendingVote !== null || votingFinalized}
    aria-label="Vote AI"
    aria-pressed={selectedVote === "AI"}
    className={`pointer-events-auto inline-flex h-9 items-center rounded-full px-2.5 sm:px-3 transition ${
      selectedVote === "AI"
        ? "bg-red-400/15 text-red-300"
        : "text-red-300/70 hover:bg-red-400/10 hover:text-red-300"
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    {pendingVote === "AI"
      ? "..."
      : `AI ${aiVotes}`}
  </button>

  <button
    type="button"
    onClick={() => void handleRepost()}
    disabled={pendingRepost}
    aria-label={reposted ? "Undo repost" : "Repost"}
    aria-pressed={reposted}
    title={reposted ? "Undo repost" : "Repost"}
    className={`pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 sm:px-3 transition ${
      reposted
        ? "bg-[#48a7ff]/12 text-[#69b7ff]"
        : "text-white/40 hover:bg-white/[0.07] hover:text-white"
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    <RepostIcon />

    <span>
      {pendingRepost ? "..." : repostCount}
    </span>
  </button>

  <button
    type="button"
    onClick={() => void handleShare()}
    aria-label="Share post"
    title="Share"
    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.07] hover:text-white"
  >
    <ShareIcon />
  </button>
</div>
        </div>
      </div>
    </article>
  );
}
