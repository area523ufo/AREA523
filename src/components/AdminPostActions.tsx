"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPostActionsProps = {
  postId: string;
  removed: boolean;
  adminOverride: boolean;
};

export default function AdminPostActions({
  postId,
  removed,
  adminOverride,
}: AdminPostActionsProps) {
  const router = useRouter();

  const [pendingAction, setPendingAction] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  async function handleRemove() {
    if (removed || pendingAction) {
      return;
    }

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
            "Content-Type":
              "application/json",
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

  async function handleForceVerify() {
    if (removed || pendingAction) {
      return;
    }

    const confirmed = window.confirm(
      "Force this post to NOT AI VERIFIED?\n\nNo AREA rewards will be issued.",
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("verify");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/force-verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
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
            "The post could not be verified.",
        );
        return;
      }

      setMessage(
        "Admin verification applied.",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "The post could not be verified.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleClearOverride() {
    if (pendingAction) {
      return;
    }

    const confirmed = window.confirm(
      "Remove the admin verification override and return this post to automatic verification?",
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("clear");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/clear-verification",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
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
            "The verification override could not be removed.",
        );
        return;
      }

      setMessage(
        "Admin override removed.",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "The verification override could not be removed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const pending =
    pendingAction !== null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {!removed &&
          !adminOverride && (
            <button
              type="button"
              onClick={() =>
                void handleForceVerify()
              }
              disabled={pending}
              className="rounded-full border border-[#48a7ff]/25 bg-[#48a7ff]/[0.06] px-4 py-2 text-xs font-black text-[#69b7ff] transition hover:bg-[#48a7ff]/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pendingAction === "verify"
                ? "Verifying..."
                : "Force Verified"}
            </button>
          )}

        {!removed &&
          adminOverride && (
            <button
              type="button"
              onClick={() =>
                void handleClearOverride()
              }
              disabled={pending}
              className="rounded-full border border-amber-400/25 bg-amber-400/[0.05] px-4 py-2 text-xs font-black text-amber-300 transition hover:bg-amber-400/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pendingAction === "clear"
                ? "Removing..."
                : "Remove Override"}
            </button>
          )}

        {!removed && (
          <button
            type="button"
            onClick={() =>
              void handleRemove()
            }
            disabled={pending}
            className="rounded-full border border-red-400/25 bg-red-400/[0.06] px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pendingAction === "remove"
              ? "Removing..."
              : "Remove"}
          </button>
        )}

        {removed && (
          <span className="text-xs font-black text-red-300/60">
            Removed
          </span>
        )}
      </div>

      {message && (
        <p className="mt-2 text-xs font-semibold text-white/40">
          {message}
        </p>
      )}
    </div>
  );
}