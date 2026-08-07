"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type EditPostFormProps = {
  postId: string;
  initialTitle: string;
  initialDescription: string;
  initialSourceUrl: string;
  initialLocation: string;
  initialCapturedAt: string;
};

export default function EditPostForm({
  postId,
  initialTitle,
  initialDescription,
  initialSourceUrl,
  initialLocation,
  initialCapturedAt,
}: EditPostFormProps) {
  const router = useRouter();

  const [title, setTitle] =
    useState(initialTitle);

  const [description, setDescription] =
    useState(initialDescription);

  const [sourceUrl, setSourceUrl] =
    useState(initialSourceUrl);

  const [location, setLocation] =
    useState(initialLocation);

  const [capturedAt, setCapturedAt] =
    useState(initialCapturedAt);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/post/edit",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            postId,
            title,
            description,
            sourceUrl,
            location,
            capturedAt,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ??
            "The post could not be updated.",
        );

        return;
      }

      router.push(`/post/${postId}`);
      router.refresh();
    } catch (error) {
      console.error(
        "Edit request failed:",
        error,
      );

      setError(
        "The post could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/40"
        >
          Title
        </label>

        <input
          id="title"
          type="text"
          value={title}
          maxLength={300}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#48a7ff]/50"
          required
        />

        <p className="mt-2 text-right text-xs text-white/25">
          {title.length}/300
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/40"
        >
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          rows={10}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#48a7ff]/50"
          required
        />
      </div>

      <div>
        <label
          htmlFor="sourceUrl"
          className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/40"
        >
          Source URL
        </label>

        <input
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(event) =>
            setSourceUrl(event.target.value)
          }
          placeholder="https://"
          className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#48a7ff]/50"
        />
      </div>

      <div>
        <label
          htmlFor="location"
          className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/40"
        >
          Location
        </label>

        <input
          id="location"
          type="text"
          value={location}
          onChange={(event) =>
            setLocation(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#48a7ff]/50"
        />
      </div>

      <div>
        <label
          htmlFor="capturedAt"
          className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/40"
        >
          Captured Date
        </label>

        <input
          id="capturedAt"
          type="date"
          value={capturedAt}
          onChange={(event) =>
            setCapturedAt(
              event.target.value,
            )
          }
          className="rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#48a7ff]/50"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm font-semibold text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={() =>
            router.push(`/post/${postId}`)
          }
          disabled={saving}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#48a7ff] px-6 py-2.5 text-sm font-black text-[#06111c] transition hover:bg-[#71baff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}