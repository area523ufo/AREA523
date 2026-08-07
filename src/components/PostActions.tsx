"use client";

import { useState } from "react";

type PostActionsProps = {
  postId: string;
  authorId: string;
  currentUserId: string | null;
  createdAt: string;
};

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

export default function PostActions({
  postId,
  authorId,
  currentUserId,
  createdAt,
}: PostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isAuthor =
    currentUserId !== null &&
    currentUserId === authorId;

  const createdTime = new Date(createdAt).getTime();

  const canEdit =
    isAuthor &&
    Date.now() - createdTime <= 10 * 60 * 1000;

  function handleEdit() {
    setIsOpen(false);

    // 실제 수정 UI는 다음 단계에서 연결
    window.location.href = `/post/${postId}/edit`;
  }

 async function handleDelete() {
  setIsOpen(false);

  const confirmed = window.confirm(
    "Delete this post? This action cannot be undone.",
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "/api/post/delete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      window.alert(
        result.error ??
          "The post could not be deleted.",
      );

      return;
    }

    window.location.href = "/";
  } catch (error) {
    console.error(
      "Delete post request failed:",
      error,
    );

    window.alert(
      "The post could not be deleted.",
    );
  }
}

  async function handleReport() {
  setIsOpen(false);

  if (!currentUserId) {
    window.alert(
      "You must be signed in to report a post.",
    );

    return;
  }

  const reason = window.prompt(
    "Why are you reporting this post?",
  );

  if (reason === null) {
    return;
  }

  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    window.alert(
      "Please enter a reason for the report.",
    );

    return;
  }

  if (trimmedReason.length > 500) {
    window.alert(
      "Report reason must be 500 characters or fewer.",
    );

    return;
  }

  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        reason: trimmedReason,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      window.alert(
        result.error ??
          "The report could not be submitted.",
      );

      return;
    }

    window.alert(
      "Report submitted. Thank you.",
    );
  } catch (error) {
    console.error(
      "Report request failed:",
      error,
    );

    window.alert(
      "The report could not be submitted.",
    );
  }
}

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-label="More post options"
        aria-expanded={isOpen}
        title="More"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.07] hover:text-white"
      >
        <MoreIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#16191e] py-1 shadow-2xl">
          {isAuthor ? (
            <>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Edit Post
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-300/80 transition hover:bg-red-400/[0.07] hover:text-red-300"
              >
                Delete Post
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleReport}
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            >
              Report Post
            </button>
          )}
        </div>
      )}
    </div>
  );
}