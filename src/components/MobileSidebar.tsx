"use client";

import { useEffect } from "react";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  username?: string | null;
};

export default function MobileSidebar({
  open,
  onClose,
  username,
}: MobileSidebarProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      <div className="absolute inset-y-0 left-0 w-[min(86vw,320px)] overflow-y-auto border-r border-white/10 bg-[#0b0d10] shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <span className="text-sm font-black tracking-[0.12em] text-white">
            AREA523
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white/55 transition hover:bg-white/[0.07] hover:text-white"
          >
            ×
          </button>
        </div>

        {username && (
          <div className="border-b border-white/10 px-3 py-3">
            <Link
              href={`/profile/${encodeURIComponent(
                username,
              )}`}
              onClick={onClose}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 transition hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/30">
                  PROFILE
                </p>

                <p className="mt-1 truncate text-sm font-black text-white/85">
                  u/{username}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="shrink-0 text-lg text-white/25"
              >
                ›
              </span>
            </Link>
          </div>
        )}

        <div onClick={onClose}>
          <Sidebar mobile />
        </div>
      </div>
    </div>
  );
}