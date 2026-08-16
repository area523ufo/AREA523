"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ProfileRelation = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  profiles:
    | ProfileRelation
    | ProfileRelation[]
    | null;
};

type Comment = Omit<CommentRow, "profiles"> & {
  profile: ProfileRelation | null;
};

type CommentSectionProps = {
  postId: string;
};

function getProfile(
  profiles:
    | ProfileRelation
    | ProfileRelation[]
    | null,
) {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0] ?? null;
  }

  return profiles;
}

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CommentSection({
  postId,
}: CommentSectionProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [comments, setComments] = useState<
    Comment[]
  >([]);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [content, setContent] = useState("");

  const [replyingTo, setReplyingTo] =
    useState<string | null>(null);

  const [replyContent, setReplyContent] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isReplySubmitting, setIsReplySubmitting] =
    useState(false);

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const loadComments = useCallback(
    async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          post_id,
          author_id,
          parent_id,
          content,
          is_edited,
          is_removed,
          created_at,
          updated_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Failed to load comments:",
          error,
        );

        setMessage(
          `Failed to load comments: ${error.message}`,
        );

        setComments([]);
        setIsLoading(false);
        return;
      }

      const normalized = (data ?? []).map(
        (item) => {
          const row = item as CommentRow;

          return {
            ...row,
            profile: getProfile(row.profiles),
          };
        },
      );

      setComments(normalized);
      setIsLoading(false);
    },
    [postId, supabase],
  );

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);

      await loadComments();
    }

    void initialize();
  }, [loadComments, supabase]);

  const rootComments = comments
    .filter(
      (comment) => comment.parent_id === null,
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    );

  const activeCommentCount = comments.filter(
    (comment) => !comment.is_removed,
  ).length;

  function getReplies(parentId: string) {
    return comments
      .filter(
        (comment) =>
          comment.parent_id === parentId,
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime(),
      );
  }

async function checkSuspended() {
  if (!currentUserId) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", currentUserId)
    .single();

  if (error) {
    console.error(
      "Failed to check account status:",
      error,
    );

    return false;
  }

  return data?.is_suspended === true;
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);

    const trimmedContent = content.trim();

    if (!currentUserId) {
      setMessage(
        "Sign in to leave a comment.",
      );
      return;
    }

if (await checkSuspended()) {
  setMessage(
    "Your account is suspended.",
  );
  return;
}

    if (!trimmedContent) {
      setMessage(
        "Enter a comment before posting.",
      );
      return;
    }

    if (trimmedContent.length > 5000) {
      setMessage(
        "Comments must be 5,000 characters or fewer.",
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: currentUserId,
        content: trimmedContent,
        parent_id: null,
      })
      .select(`
        id,
        post_id,
        author_id,
        parent_id,
        content,
        is_edited,
        is_removed,
        created_at,
        updated_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error(
        "Failed to create comment:",
        error,
      );

      setMessage(
        `Comment failed: ${error.message}`,
      );

      setIsSubmitting(false);
      return;
    }

    const row = data as CommentRow;

    const newComment: Comment = {
      ...row,
      profile: getProfile(row.profiles),
    };

    setComments((current) => [
      ...current,
      newComment,
    ]);

    setContent("");
    setMessage("Comment posted.");
    setIsSubmitting(false);

    router.refresh();
  }

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    parentId: string,
  ) {
    event.preventDefault();

    setMessage(null);

    const trimmedContent =
      replyContent.trim();

    if (!currentUserId) {
      setMessage(
        "Sign in to reply.",
      );
      return;
    }

if (await checkSuspended()) {
  setMessage(
    "Your account is suspended.",
  );
  return;
}

    if (!trimmedContent) {
      return;
    }

    if (trimmedContent.length > 5000) {
      setMessage(
        "Replies must be 5,000 characters or fewer.",
      );
      return;
    }

    if (isReplySubmitting) {
      return;
    }

    setIsReplySubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: currentUserId,
        content: trimmedContent,
        parent_id: parentId,
      })
      .select(`
        id,
        post_id,
        author_id,
        parent_id,
        content,
        is_edited,
        is_removed,
        created_at,
        updated_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error(
        "Failed to create reply:",
        error,
      );

      setMessage(
        `Reply failed: ${error.message}`,
      );

      setIsReplySubmitting(false);
      return;
    }

    const row = data as CommentRow;

    const newReply: Comment = {
      ...row,
      profile: getProfile(row.profiles),
    };

    setComments((current) => [
      ...current,
      newReply,
    ]);

    setReplyContent("");
    setReplyingTo(null);
    setMessage("Reply posted.");
    setIsReplySubmitting(false);

    router.refresh();
  }

  async function handleDelete(
    commentId: string,
  ) {
    if (
      !currentUserId ||
      deletingCommentId
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this comment?",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setDeletingCommentId(commentId);

    const { error } = await supabase.rpc(
      "remove_own_comment",
      {
        p_comment_id: commentId,
      },
    );

    if (error) {
      console.error(
        "Failed to delete comment:",
        error,
      );

      setMessage(
        `Delete failed: ${error.message}`,
      );

      setDeletingCommentId(null);
      return;
    }

    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              is_removed: true,
            }
          : comment,
      ),
    );

    setMessage("Comment deleted.");
    setDeletingCommentId(null);

    router.refresh();
  }

  function renderComment(
    comment: Comment,
    isReply = false,
  ) {
    const profile = comment.profile;

    const username =
      profile?.username ?? "unknown_user";

    const displayName =
      profile?.display_name ?? username;

    const isOwner =
      currentUserId === comment.author_id;

    const replies = isReply
      ? []
      : getReplies(comment.id);

    return (
  <article
    key={comment.id}
    className={
      isReply
        ? "border-l border-white/10 py-4 pl-1 sm:pl-4"
        : "py-5 first:pt-0 last:pb-0"
    }
  >
    {/* HEADER */}
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 sm:h-10 sm:w-10">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-black uppercase text-white/40">
            {displayName.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/profile/${encodeURIComponent(
              username,
            )}`}
            className="truncate text-sm font-black text-white transition hover:text-[#69b7ff]"
          >
            {displayName}
          </Link>

          <Link
            href={`/profile/${encodeURIComponent(
              username,
            )}`}
            className="text-xs font-semibold text-white/30 transition hover:text-white/50"
          >
            @{username}
          </Link>

          <span
            aria-hidden="true"
            className="text-white/15"
          >
            ·
          </span>

          <time className="text-xs font-semibold text-white/25">
            {formatCommentDate(
              comment.created_at,
            )}
          </time>

          {comment.is_edited && (
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/20">
              Edited
            </span>
          )}
        </div>
      </div>
    </div>

    {/* BODY */}
    <div className="mt-3">
      <p
        className={`whitespace-pre-wrap break-words text-[15px] leading-6 sm:text-base sm:leading-7 ${
          comment.is_removed
            ? "italic text-white/30"
            : "text-white/75"
        }`}
      >
        {comment.is_removed
          ? "[Comment removed]"
          : comment.content}
      </p>

      {!comment.is_removed && (
        <div className="mt-3 flex items-center gap-4">
          {!isReply && (
            <button
              type="button"
              onClick={() => {
                if (
                  replyingTo ===
                  comment.id
                ) {
                  setReplyingTo(null);
                  setReplyContent("");
                } else {
                  setReplyingTo(
                    comment.id,
                  );
                  setReplyContent("");
                }
              }}
              className="text-[11px] font-black uppercase tracking-[0.12em] text-white/35 transition hover:text-[#69b7ff]"
            >
              Reply
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              disabled={
                deletingCommentId ===
                comment.id
              }
              onClick={() =>
                void handleDelete(
                  comment.id,
                )
              }
              className="text-[11px] font-black uppercase tracking-[0.12em] text-red-300/60 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deletingCommentId ===
              comment.id
                ? "Deleting..."
                : "Delete"}
            </button>
          )}
        </div>
      )}

      {!isReply &&
        replyingTo === comment.id && (
          <form
            onSubmit={(event) =>
              void handleReply(
                event,
                comment.id,
              )
            }
            className="mt-4 rounded-xl border border-white/10 bg-[#0b0d10] p-3"
          >
            <textarea
              value={replyContent}
              onChange={(event) =>
                setReplyContent(
                  event.target.value,
                )
              }
              rows={3}
              maxLength={5000}
              autoFocus
              disabled={
                isReplySubmitting
              }
              placeholder={`Reply to @${username}...`}
              className="w-full resize-y bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/20"
            />

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                className="rounded-full px-4 py-2 text-xs font-bold text-white/35 transition hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  !replyContent.trim() ||
                  isReplySubmitting
                }
                className="rounded-full bg-[#48a7ff] px-4 py-2 text-xs font-black text-[#07111b] transition hover:bg-[#69b7ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isReplySubmitting
                  ? "Replying..."
                  : "Reply"}
              </button>
            </div>
          </form>
        )}

      {!isReply &&
        replies.length > 0 && (
          <div className="mt-4 space-y-1">
            {replies.map((reply) =>
              renderComment(
                reply,
                true,
              ),
            )}
          </div>
        )}
    </div>
  </article>
    );
  }

  return (
    <section
      id="comments"
      className="rounded-xl border border-white/10 bg-white/[0.02] px-1 py-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
            Discussion
          </p>

          <p className="mt-2 text-sm text-white/40">
            Share evidence, context, or your
            analysis.
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-white/30">
          {activeCommentCount}{" "}
          {activeCommentCount === 1
            ? "comment"
            : "comments"}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-xl border border-white/10 bg-[#0b0d10] p-3 sm:p-4"
      >
        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          disabled={isSubmitting}
          maxLength={5000}
          rows={4}
          placeholder={
            currentUserId
              ? "Add your analysis..."
              : "Sign in to join the discussion."
          }
          className="w-full resize-y bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-[11px] font-semibold text-white/25">
            {content.length.toLocaleString(
              "en-US",
            )}{" "}
            / 5,000
          </span>

          <button
            type="submit"
            disabled={
              !currentUserId ||
              !content.trim() ||
              isSubmitting
            }
            className="rounded-full bg-[#48a7ff] px-5 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#07111b] transition hover:bg-[#69b7ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Posting..."
              : "Post comment"}
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-3 text-center text-xs font-semibold text-white/45">
          {message}
        </p>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-[#0b0d10] px-5 py-8 text-center">
            <p className="text-sm font-semibold text-white/35">
              Loading comments...
            </p>
          </div>
        ) : rootComments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0b0d10] px-5 py-10 text-center">
            <p className="text-sm font-black text-white/45">
              No comments yet.
            </p>

            <p className="mt-2 text-xs text-white/25">
              Be the first to examine this
              submission.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {rootComments.map((comment) =>
              renderComment(comment),
            )}
          </div>
        )}
      </div>
    </section>
  );
}