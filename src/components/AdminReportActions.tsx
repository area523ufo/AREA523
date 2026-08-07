"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminReportActionsProps = {
  reportId: string;
  postId: string;
  authorId: string | null;
  reportStatus: string;
  postRemoved: boolean;
};

export default function AdminReportActions({
  reportId,
  postId,
  authorId,
  reportStatus,
  postRemoved,
}: AdminReportActionsProps) {
  const router = useRouter();

  const [pendingAction, setPendingAction] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  async function removePost() {
    const confirmed = window.confirm(
      "Remove this post from AREA523?",
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("remove");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/remove-post",
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
        setMessage(
          result.error ??
            "The post could not be removed.",
        );
        return;
      }

      setMessage("Post removed.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        "The post could not be removed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function suspendAuthor() {
    if (!authorId) {
      setMessage(
        "The post author could not be identified.",
      );
      return;
    }

    const reason = window.prompt(
      "Reason for suspending this user:",
    );

    if (reason === null) {
      return;
    }

    setPendingAction("suspend");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/suspend-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: authorId,
            reason: reason.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.error ??
            "The user could not be suspended.",
        );
        return;
      }

      setMessage("Author suspended.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        "The user could not be suspended.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function updateReportStatus(
    status: "reviewed" | "dismissed",
  ) {
    setPendingAction(status);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/report-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportId,
            status,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.error ??
            "The report could not be updated.",
        );
        return;
      }

      setMessage(
        status === "reviewed"
          ? "Report marked as reviewed."
          : "Report dismissed.",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "The report could not be updated.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const pending = pendingAction !== null;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {!postRemoved && (
          <button
            type="button"
            onClick={() => void removePost()}
            disabled={pending}
            className="rounded-full border border-red-400/25 bg-red-400/[0.06] px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pendingAction === "remove"
              ? "Removing..."
              : "Remove Post"}
          </button>
        )}

        {authorId && (
          <button
            type="button"
            onClick={() =>
              void suspendAuthor()
            }
            disabled={pending}
            className="rounded-full border border-amber-400/25 bg-amber-400/[0.05] px-4 py-2 text-xs font-black text-amber-300 transition hover:bg-amber-400/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pendingAction === "suspend"
              ? "Suspending..."
              : "Suspend Author"}
          </button>
        )}

        {reportStatus === "pending" && (
          <>
            <button
              type="button"
              onClick={() =>
                void updateReportStatus(
                  "reviewed",
                )
              }
              disabled={pending}
              className="rounded-full border border-[#48a7ff]/25 bg-[#48a7ff]/5 px-4 py-2 text-xs font-black text-[#69b7ff] transition hover:bg-[#48a7ff]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pendingAction === "reviewed"
                ? "Updating..."
                : "Mark Reviewed"}
            </button>

            <button
              type="button"
              onClick={() =>
                void updateReportStatus(
                  "dismissed",
                )
              }
              disabled={pending}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pendingAction === "dismissed"
                ? "Updating..."
                : "Dismiss"}
            </button>
          </>
        )}
      </div>

      {message && (
        <p className="mt-3 text-xs font-semibold text-white/45">
          {message}
        </p>
      )}
    </div>
  );
}