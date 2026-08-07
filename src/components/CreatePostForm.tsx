"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/supabase/posts";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

const boards = [
  { name: "UFO", value: "ufo" },
  { name: "Politics", value: "politics" },
  { name: "Stocks", value: "stocks" },
  { name: "Memes", value: "memes" },
];

const MAX_TITLE_LENGTH = 100;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type PreviewType = "image" | "video" | null;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreatePostForm() {
  const [board, setBoard] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [captureDate, setCaptureDate] = useState("");
  const [originalMedia, setOriginalMedia] = useState(false);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] =
    useState<PreviewType>(null);

  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const titleCharactersRemaining =
    MAX_TITLE_LENGTH - title.length;

  const canSubmit = useMemo(() => {
    return (
      board.trim().length > 0 &&
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      !fileError &&
      !isSubmitting
    );
  }, [
    board,
    title,
    description,
    fileError,
    isSubmitting,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleMediaChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    setFileError("");

    if (!file) {
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setFileError(
        "Only image and video files are supported.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        "The selected file exceeds the 100 MB limit.",
      );
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setMediaFile(file);
    setPreviewUrl(newPreviewUrl);
    setPreviewType(isImage ? "image" : "video");
  };

  const handleRemoveMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMediaFile(null);
    setPreviewUrl(null);
    setPreviewType(null);
    setFileError("");

    const input =
      document.querySelector<HTMLInputElement>(
        "#media",
      );

    if (input) {
      input.value = "";
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    console.log("handleSubmit called");

    setFormError("");

    if (!board) {
      setFormError("Select a board.");
      return;
    }

    if (!title.trim()) {
      setFormError("Enter a post title.");
      return;
    }

    if (!description.trim()) {
      setFormError("Enter a description.");
      return;
    }

    if (fileError) {
      setFormError(
        "Resolve the media file error before submitting.",
      );
      return;
    }

    setIsSubmitting(true);

    console.log("About to create post");

    try {
  const post = await createPost({
    boardSlug: board,
    title,
    description,
    sourceUrl: source,
    location,
    capturedAt: captureDate,
    isOriginalMedia: originalMedia,
    mediaUrl: null,
    mediaType: mediaFile
      ? mediaFile.type.startsWith("image/")
        ? "image"
        : "video"
      : null,
  });

  router.push(`/post/${post.id}`);
} catch (error: unknown) {
  console.error("Create post error:", error);

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    setFormError(error.message);
  } else {
    setFormError("Failed to create post.");
  }
} finally {
  setIsSubmitting(false);
}
  };

  if (isSubmitted) {
    return (
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
        <div className="px-6 py-14 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#48a7ff]/30 bg-[#48a7ff]/10 text-2xl text-[#75bdff]">
            ✓
          </div>

          <p className="mt-6 text-xs font-black tracking-[0.22em] text-[#75bdff]">
            SUBMISSION RECEIVED
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Post submitted for review
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
            Your submission has passed the local form
            validation. Database storage and permanent post
            creation will be connected in a later step.
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/10 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
              Submission preview
            </p>

            <p className="mt-3 text-sm font-bold text-[#75bdff]">
              {board.toUpperCase()}
            </p>

            <h2 className="mt-2 text-lg font-black text-white">
              {title}
            </h2>

            <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/45">
              {description}
            </p>

            {mediaFile && (
              <p className="mt-4 text-xs text-white/30">
                Media: {mediaFile.name}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              Edit Submission
            </button>

            <Link
              href="/"
              className="rounded-full bg-[#48a7ff] px-6 py-3 text-sm font-black text-[#06111c] transition hover:bg-[#71baff]"
            >
              Return to Feed
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#12151a]">
      <div className="border-b border-white/10 bg-gradient-to-r from-[#17304a] to-[#101923] px-6 py-6">
        <p className="text-xs font-black tracking-[0.22em] text-[#75bdff]">
          AREA523 SUBMISSION
        </p>

        <h1 className="mt-2 text-3xl font-black text-white">
          Create Post
        </h1>

        <p className="mt-2 text-sm leading-6 text-white/45">
          Submit media for public review and community
          verification.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-5 sm:p-7"
      >
        <div>
          <label
            htmlFor="board"
            className="mb-2 block text-sm font-bold text-white/70"
          >
            Board
          </label>

          <select
            id="board"
            name="board"
            value={board}
            onChange={(event) =>
              setBoard(event.target.value)
            }
            required
            className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-[#48a7ff]/60"
          >
            <option value="" disabled>
              Select a board
            </option>

            {boards.map((boardOption) => (
              <option
                key={boardOption.value}
                value={boardOption.value}
              >
                {boardOption.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              htmlFor="title"
              className="block text-sm font-bold text-white/70"
            >
              Title
            </label>

            <span
              className={`text-xs font-semibold ${
                titleCharactersRemaining <= 20
                  ? "text-amber-300"
                  : "text-white/30"
              }`}
            >
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>

          <input
            id="title"
            name="title"
            type="text"
            maxLength={MAX_TITLE_LENGTH}
            required
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Describe what appears in the media"
            className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
          />

          <p className="mt-2 text-xs text-white/30">
            Keep the title factual. Avoid presenting
            unverified claims as confirmed.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-bold text-white/70"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={7}
            required
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Add context, known details, capture date, location, and relevant background..."
            className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
          />
        </div>

        <div>
          <label
            htmlFor="media"
            className="mb-2 block text-sm font-bold text-white/70"
          >
            Media
          </label>

          {!previewUrl ? (
            <label
              htmlFor="media"
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b0d10] px-6 py-8 text-center transition hover:border-[#48a7ff]/45 hover:bg-[#48a7ff]/5"
            >
              <span className="text-3xl text-[#69b7ff]">
                ＋
              </span>

              <span className="mt-3 text-sm font-bold text-white/70">
                Upload image or video
              </span>

              <span className="mt-1 text-xs text-white/30">
                JPG, PNG, WEBP, MP4 or MOV · Maximum
                100 MB
              </span>
            </label>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0d10]">
              <div className="relative flex min-h-64 items-center justify-center bg-black">
                {previewType === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Selected upload preview"
                    className="max-h-[520px] w-full object-contain"
                  />
                )}

                {previewType === "video" && (
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-[520px] w-full"
                  >
                    Your browser does not support video
                    preview.
                  </video>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white/70">
                    {mediaFile?.name}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    {mediaFile
                      ? formatFileSize(mediaFile.size)
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="shrink-0 rounded-full border border-red-400/20 px-4 py-2 text-xs font-bold text-red-300 transition hover:border-red-400/50 hover:bg-red-400/10"
                >
                  Remove Media
                </button>
              </div>
            </div>
          )}

          <input
            id="media"
            name="media"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={handleMediaChange}
            className="sr-only"
          />

          {fileError && (
            <p className="mt-3 text-sm font-semibold text-red-300">
              {fileError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="source"
            className="mb-2 block text-sm font-bold text-white/70"
          >
            Original Source
          </label>

          <input
            id="source"
            name="source"
            type="url"
            value={source}
            onChange={(event) =>
              setSource(event.target.value)
            }
            placeholder="https://"
            className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              Location
            </label>

            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="City, state or country"
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
            />
          </div>

          <div>
            <label
              htmlFor="captureDate"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              Capture Date
            </label>

            <input
              id="captureDate"
              name="captureDate"
              type="date"
              value={captureDate}
              onChange={(event) =>
                setCaptureDate(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-[#48a7ff]/60"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="originalMedia"
              checked={originalMedia}
              onChange={(event) =>
                setOriginalMedia(event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-[#48a7ff]"
            />

            <span>
              <span className="block text-sm font-bold text-white/70">
                I captured this media
              </span>

              <span className="mt-1 block text-xs leading-5 text-white/35">
                Select this only when you are the original
                photographer or recorder.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <p className="text-xs font-black tracking-[0.16em] text-amber-300">
            SUBMISSION NOTICE
          </p>

          <p className="mt-2 text-sm leading-6 text-white/45">
            Uploading known AI-generated or edited media
            without disclosure may result in removal and
            account restrictions.
          </p>
        </div>

        {formError && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-red-300">
              {formError}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-6 py-3 text-center text-sm font-bold text-white/55 transition hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-[#48a7ff] px-7 py-3 text-sm font-black text-[#06111c] transition hover:bg-[#71baff] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit for Review"}
          </button>
        </div>
      </form>
    </section>
  );
}