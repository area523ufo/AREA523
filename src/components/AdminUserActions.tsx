"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  username: string;
  suspended: boolean;
  isAdmin: boolean;
};

export default function AdminUserActions({
  userId,
  username,
  suspended,
  isAdmin,
}: AdminUserActionsProps) {
  const router = useRouter();

  const [pending, setPending] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  async function changeSuspension() {
    if (pending || isAdmin) {
      return;
    }

    let reason = "";

    if (!suspended) {
      const enteredReason = window.prompt(
        `Reason for suspending @${username}:`,
      );

      if (enteredReason === null) {
        return;
      }

      reason = enteredReason.trim();

      const confirmed = window.confirm(
        `Suspend @${username}?`,
      );

      if (!confirmed) {
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Restore @${username}'s account?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/suspend-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId,
            suspended: !suspended,
            reason,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.error ??
            "User status could not be changed.",
        );
        return;
      }

      setMessage(
        suspended
          ? "User restored."
          : "User suspended.",
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "User status could not be changed.",
      );
    } finally {
      setPending(false);
    }
  }

  if (isAdmin) {
    return (
      <span className="text-xs font-black text-[#69b7ff]">
        ADMIN
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          void changeSuspension()
        }
        className={
          suspended
            ? "rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/[0.12] disabled:opacity-40"
            : "rounded-full border border-red-400/25 bg-red-400/[0.06] px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/[0.12] disabled:opacity-40"
        }
      >
        {pending
          ? "Updating..."
          : suspended
            ? "Unsuspend"
            : "Suspend"}
      </button>

      {message && (
        <p className="mt-2 text-xs font-semibold text-white/40">
          {message}
        </p>
      )}
    </div>
  );
}