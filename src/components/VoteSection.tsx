"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type VoteType = "real" | "ai";

type VoteSectionProps = {
  postId: string;
  initialRealVotes: number;
  initialAiVotes: number;
};

type ExistingVote = {
  id: string;
  vote: VoteType;
};

export default function VoteSection({
  postId,
  initialRealVotes,
  initialAiVotes,
}: VoteSectionProps) {
  const supabase = createClient();

  const [realVotes, setRealVotes] =
    useState(initialRealVotes);
  const [aiVotes, setAiVotes] = useState(initialAiVotes);

  const [userId, setUserId] = useState<string | null>(null);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] =
    useState<VoteType | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadVotingData() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const { data: existingVote, error: voteError } =
          await supabase
            .from("votes")
            .select("id, vote")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (voteError) {
          console.error(
            "Failed to load current vote:",
            voteError,
          );
        }

        if (existingVote) {
          const typedVote = existingVote as ExistingVote;

          setVoteId(typedVote.id);
          setSelectedVote(typedVote.vote);
        }
      }

      /*
       * votes 테이블을 기준으로 현재 실제 득표 수를 다시 계산한다.
       * posts 테이블의 저장된 카운트가 아직 갱신되지 않았더라도
       * 상세 페이지에서는 정확한 결과를 보여준다.
       */
      const { data: votes, error: votesError } =
        await supabase
          .from("votes")
          .select("vote")
          .eq("post_id", postId);

      if (votesError) {
        console.error(
          "Failed to load vote counts:",
          votesError,
        );
      } else if (votes) {
        const nextRealVotes = votes.filter(
          (item) => item.vote === "real",
        ).length;

        const nextAiVotes = votes.filter(
          (item) => item.vote === "ai",
        ).length;

        setRealVotes(nextRealVotes);
        setAiVotes(nextAiVotes);
      }

      setIsLoading(false);
    }

    void loadVotingData();
  }, [postId, supabase]);

  async function handleVote(nextVote: VoteType) {
    setMessage(null);

   if (!userId) {
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

    if (isSubmitting) {
      return;
    }

    if (selectedVote === nextVote) {
      setMessage(
        `You already voted ${
          nextVote === "real" ? "REAL" : "AI GENERATED"
        }.`,
      );
      return;
    }

    setIsSubmitting(true);

    const previousVote = selectedVote;

    let error: { message: string } | null = null;
    let newVoteId = voteId;

    if (voteId) {
      const result = await supabase
        .from("votes")
        .update({
          vote: nextVote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", voteId)
        .eq("user_id", userId);

      error = result.error;
    } else {
      const result = await supabase
        .from("votes")
        .insert({
          post_id: postId,
          user_id: userId,
          vote: nextVote,
        })
        .select("id")
        .single();

      error = result.error;
      newVoteId = result.data?.id ?? null;
    }

    if (error) {
      console.error("Failed to submit vote:", error);
      setMessage(`Vote failed: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    /*
     * 화면을 즉시 갱신한다.
     * REAL → AI 또는 AI → REAL 변경도 반영한다.
     */
    if (previousVote === "real") {
      setRealVotes((current) => Math.max(current - 1, 0));
    }

    if (previousVote === "ai") {
      setAiVotes((current) => Math.max(current - 1, 0));
    }

    if (nextVote === "real") {
      setRealVotes((current) => current + 1);
    }

    if (nextVote === "ai") {
      setAiVotes((current) => current + 1);
    }

    setVoteId(newVoteId);
    setSelectedVote(nextVote);
    setMessage("Your vote has been recorded.");
    setIsSubmitting(false);
  }

  const totalVotes = realVotes + aiVotes;

  const realPercentage =
    totalVotes > 0
      ? Math.round((realVotes / totalVotes) * 100)
      : 0;

  const aiPercentage =
    totalVotes > 0
      ? Math.round((aiVotes / totalVotes) * 100)
      : 0;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b0d10] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#69b7ff]">
            Community verdict
          </p>

          <p className="mt-2 text-sm text-white/40">
            Vote whether this submission appears authentic or
            AI-generated.
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-white/30">
          {totalVotes} total
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isLoading || isSubmitting}
          onClick={() => void handleVote("real")}
          className={`rounded-xl border p-4 text-left transition ${
            selectedVote === "real"
              ? "border-emerald-300 bg-emerald-400/15 ring-1 ring-emerald-300/40"
              : "border-emerald-400/15 bg-emerald-400/[0.04] hover:border-emerald-300/40 hover:bg-emerald-400/[0.08]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
              Real
            </span>

            <span className="text-sm font-black text-white">
              {realPercentage}%
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-black text-white">
              {realVotes}
            </p>

            {selectedVote === "real" && (
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                Your vote
              </span>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{
                width: `${realPercentage}%`,
              }}
            />
          </div>
        </button>

        <button
          type="button"
          disabled={isLoading || isSubmitting}
          onClick={() => void handleVote("ai")}
          className={`rounded-xl border p-4 text-left transition ${
            selectedVote === "ai"
              ? "border-red-300 bg-red-400/15 ring-1 ring-red-300/40"
              : "border-red-400/15 bg-red-400/[0.04] hover:border-red-300/40 hover:bg-red-400/[0.08]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
              AI generated
            </span>

            <span className="text-sm font-black text-white">
              {aiPercentage}%
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-black text-white">
              {aiVotes}
            </p>

            {selectedVote === "ai" && (
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-red-300">
                Your vote
              </span>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-red-400 transition-all"
              style={{
                width: `${aiPercentage}%`,
              }}
            />
          </div>
        </button>
      </div>

      <div className="mt-4 min-h-5 text-center">
        {isLoading && (
          <p className="text-xs font-semibold text-white/30">
            Loading votes...
          </p>
        )}

        {!isLoading && isSubmitting && (
          <p className="text-xs font-semibold text-[#69b7ff]">
            Recording vote...
          </p>
        )}

        {!isLoading && !isSubmitting && message && (
          <p className="text-xs font-semibold text-white/45">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}