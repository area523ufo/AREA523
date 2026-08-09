"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ProfileAvatarEditorProps = {
  userId: string;
  currentAvatarUrl: string | null;
  profileName: string;
};

export default function ProfileAvatarEditor({
  userId,
  currentAvatarUrl,
  profileName,
}: ProfileAvatarEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isBusy = uploading || resetting;

  async function handleFile(file: File) {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setMessage(
        "Please select a JPEG, PNG, or WebP image.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Profile image must be 5 MB or smaller.",
      );
      return;
    }

    setUploading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const filePath =
        `${userId}/avatar.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: "3600",
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl =
        `${publicUrl}?v=${Date.now()}`;

      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
          })
          .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      setMessage("Profile photo updated.");
      router.refresh();
    } catch (error) {
      console.error(
        "Avatar upload failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Profile photo could not be updated.",
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleUseDefault() {
    if (!currentAvatarUrl) {
      setMessage(
        "You are already using the default profile image.",
      );
      return;
    }

    setResetting(true);
    setMessage(null);

    const supabase = createClient();

    try {
      // 먼저 DB에서 avatar 연결 제거
      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: null,
          })
          .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      // 기존에 사용했을 가능성이 있는 avatar 파일 정리.
      // 존재하지 않는 파일은 무시한다.
      const possibleFiles = [
        `${userId}/avatar.jpg`,
        `${userId}/avatar.jpeg`,
        `${userId}/avatar.png`,
        `${userId}/avatar.webp`,
      ];

      const { error: removeError } =
        await supabase.storage
          .from("avatars")
          .remove(possibleFiles);

      if (removeError) {
        console.warn(
          "Avatar storage cleanup failed:",
          removeError,
        );
      }

      setMessage("Default profile image restored.");
      router.refresh();
    } catch (error) {
      console.error(
        "Avatar reset failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Profile photo could not be reset.",
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mt-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file =
            event.target.files?.[0];

          if (file) {
            void handleFile(file);
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-[#48a7ff]/30 hover:text-[#69b7ff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading
            ? "Uploading..."
            : "Change Photo"}
        </button>

        <button
          type="button"
          disabled={isBusy || !currentAvatarUrl}
          onClick={() =>
            void handleUseDefault()
          }
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/45 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {resetting
            ? "Resetting..."
            : "Use Default"}
        </button>
      </div>

      {currentAvatarUrl && (
        <p className="mt-2 text-[11px] text-white/25">
          Current profile photo for {profileName}
        </p>
      )}

      {message && (
        <p className="mt-2 text-xs text-white/40">
          {message}
        </p>
      )}
    </div>
  );
}