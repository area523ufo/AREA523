"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FollowButtonProps = {
  userId: string;
  initialFollowing: boolean;
};

type FollowResult = {
  success: boolean;
  following?: boolean;
  error?: string;
};

export default function FollowButton({
  userId,
  initialFollowing,
}: FollowButtonProps) {
  const router = useRouter();

  const [
    following,
    setFollowing,
  ] = useState(
    initialFollowing,
  );

  const [
    pending,
    setPending,
  ] = useState(false);

  async function handleFollow() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const response =
        await fetch(
          "/api/follow",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId,
              }),
          },
        );

      const result =
        (await response.json()) as
          FollowResult;

      if (
        response.status ===
        401
      ) {
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

      if (
        !response.ok ||
        !result.success
      ) {
        console.error(
          result.error,
        );

        return;
      }

      setFollowing(
        Boolean(
          result.following,
        ),
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Follow request failed:",
        error,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        void handleFollow()
      }
      className={
        following
          ? "rounded-full border border-white/15 bg-white/[0.05] px-5 py-2 text-sm font-black text-white/70 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
          : "rounded-full bg-[#48a7ff] px-5 py-2 text-sm font-black text-[#07111b] transition hover:bg-[#69b7ff] disabled:opacity-40"
      }
    >
      {pending
        ? "..."
        : following
          ? "Following"
          : "Follow"}
    </button>
  );
}