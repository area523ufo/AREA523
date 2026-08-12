"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function ChooseUsernameForm() {
  const router = useRouter();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const normalized =
        username.trim();

      setErrorMessage("");

      if (
        normalized.length < 3 ||
        normalized.length > 24
      ) {
        setErrorMessage(
          "Username must be 3 to 24 characters.",
        );

        return;
      }

      if (
        !/^[A-Za-z0-9_]+$/.test(
          normalized,
        )
      ) {
        setErrorMessage(
          "Use only letters, numbers, and underscores.",
        );

        return;
      }

      setSubmitting(true);

      try {
        const response =
          await fetch(
            "/api/account/username",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                username:
                  normalized,
              }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result?.error ??
              "Unable to set username.",
          );

          setSubmitting(false);

          return;
        }

        router.replace(
          `/profile/${encodeURIComponent(
            result.username,
          )}`,
        );

        router.refresh();
      } catch {
        setErrorMessage(
          "Unexpected error.",
        );

        setSubmitting(false);
      }
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12151a] p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-black tracking-[0.18em] text-[#69b7ff]">
          AREA523
        </p>

        <h1 className="mt-3 text-2xl font-black">
          Choose your username
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/45">
          This will be your public AREA523 identity.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              Username
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-[#0b0d10] focus-within:border-[#48a7ff]/60">
              <span className="pl-4 text-sm text-white/25">
                u/
              </span>

              <input
                id="username"
                value={
                  username
                }
                onChange={(
                  event,
                ) =>
                  setUsername(
                    event.target.value,
                  )
                }
                autoComplete="username"
                autoFocus
                maxLength={24}
                placeholder="your_username"
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>

            <p className="mt-2 text-xs text-white/25">
              3–24 characters · A–Z · 0–9 · _
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-red-300">
                {errorMessage}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting
            }
            className="w-full rounded-full bg-[#48a7ff] px-6 py-3 text-sm font-black text-[#06111c] transition hover:bg-[#71baff] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting
              ? "Saving..."
              : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}