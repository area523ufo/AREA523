"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

type CreateAreaResult = {
  success: boolean;
  id?: number;
  name?: string;
  slug?: string;
  href?: string;
  remainingAreaSlots?: number;
};

export default function CreateAreaPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setErrorMessage(
        "Area name is required.",
      );
      return;
    }

    if (trimmedName.length > 80) {
      setErrorMessage(
        "Area name must be 80 characters or fewer.",
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setErrorMessage(
        "Description must be 500 characters or fewer.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.rpc("create_area", {
          p_name: trimmedName,
          p_description:
            trimmedDescription || null,
        });

      if (error) {
        const message = error.message;

        if (
          message.includes("ACCOUNT_TOO_NEW")
        ) {
          throw new Error(
            "Your account must be at least 7 days old.",
          );
        }

        if (
          message.includes(
            "INSUFFICIENT_POST_HISTORY",
          )
        ) {
          throw new Error(
            "You need at least 10 published posts before creating an Area.",
          );
        }

        if (
          message.includes(
            "AREA_LIMIT_REACHED",
          )
        ) {
          throw new Error(
            "You have reached the current limit of 3 Community Areas.",
          );
        }

        if (
          message.includes(
            "AREA_NAME_EXISTS",
          ) ||
          message.includes(
            "AREA_SLUG_EXISTS",
          ) ||
          message.includes(
            "AREA_ALREADY_EXISTS",
          )
        ) {
          throw new Error(
            "An Area with this name already exists.",
          );
        }

        if (
          message.includes(
            "ACCOUNT_SUSPENDED",
          )
        ) {
          throw new Error(
            "Suspended accounts cannot create Areas.",
          );
        }

        throw new Error(message);
      }

      const result =
        data as CreateAreaResult | null;

      if (
        !result?.success ||
        !result.href
      ) {
        throw new Error(
          "The Area could not be created.",
        );
      }

      router.push(result.href);
      router.refresh();
    } catch (error) {
      console.error(
        "Create Area failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The Area could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex max-w-[1320px]">
        <Sidebar />

        <div className="min-w-0 flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-7">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#69b7ff]">
                Community
              </p>

              <h1 className="mt-2 text-3xl font-black text-white">
                Create an Area
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/45">
                Create a community around a topic you want
                AREA523 users to investigate, discuss, and
                verify.
              </p>
            </div>

            <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#12151a] p-4">
              <p className="text-xs font-bold text-white/55">
                Requirements
              </p>

              <p className="mt-2 text-xs leading-6 text-white/35">
                Account age 7+ days · 10+ published posts ·
                maximum 3 Community Areas · account must not
                be suspended
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-[#12151a] p-5 sm:p-6"
            >
              <div>
                <label
                  htmlFor="area-name"
                  className="mb-2 block text-sm font-bold text-white/70"
                >
                  Area Name
                </label>

                <input
                  id="area-name"
                  type="text"
                  maxLength={80}
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. UAP Disclosure"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
                />

                <p className="mt-2 text-xs text-white/25">
                  The URL will be generated automatically.
                </p>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="area-description"
                  className="mb-2 block text-sm font-bold text-white/70"
                >
                  Description
                </label>

                <textarea
                  id="area-description"
                  rows={5}
                  maxLength={500}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="What is this Area about?"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#48a7ff]/60"
                />

                <p className="mt-2 text-right text-xs text-white/25">
                  {description.length}/500
                </p>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-xl bg-[#48a7ff] px-5 py-3 text-sm font-black text-[#07111b] transition hover:bg-[#6bb8ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? "Creating Area..."
                  : "Create Area"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}