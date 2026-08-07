"use client";

import { useMemo, useState } from "react";

type VoteChoice = "real" | "ai" | null;

type VerificationPanelProps = {
  initialRealVotes?: number;
  initialAiVotes?: number;
};

export default function VerificationPanel({
  initialRealVotes = 1248,
  initialAiVotes = 242,
}: VerificationPanelProps) {
  const [realVotes, setRealVotes] = useState(initialRealVotes);
  const [aiVotes, setAiVotes] = useState(initialAiVotes);
  const [selectedVote, setSelectedVote] = useState<VoteChoice>(null);

  const totalVotes = realVotes + aiVotes;

  const realPercentage = useMemo(() => {
    if (totalVotes === 0) {
      return 0;
    }

    return Math.round((realVotes / totalVotes) * 100);
  }, [realVotes, totalVotes]);

  const aiPercentage = 100 - realPercentage;

  const handleRealVote = () => {
    if (selectedVote === "real") {
      setRealVotes((current) => Math.max(0, current - 1));
      setSelectedVote(null);
      return;
    }

    if (selectedVote === "ai") {
      setAiVotes((current) => Math.max(0, current - 1));
    }

    setRealVotes((current) => current + 1);
    setSelectedVote("real");
  };

  const handleAiVote = () => {
    if (selectedVote === "ai") {
      setAiVotes((current) => Math.max(0, current - 1));
      setSelectedVote(null);
      return;
    }

    if (selectedVote === "real") {
      setRealVotes((current) => Math.max(0, current - 1));
    }

    setAiVotes((current) => current + 1);
    setSelectedVote("ai");
  };

  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-[#12151a] p-5 sm:p-6">
      <div>
        <p className="text-xs font-black tracking-[0.2em] text-[#75bdff]">
          COMMUNITY VERIFICATION
        </p>

        <h2 className="mt-2 text-xl font-black text-white">
          Is this media authentic?
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/45">
          Review the available context before submitting your judgment.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={selectedVote === "real"}
          onClick={handleRealVote}
          className={`rounded-xl border p-5 text-left transition ${
            selectedVote === "real"
              ? "border-[#48a7ff] bg-[#48a7ff]/20 shadow-[0_0_30px_rgba(72,167,255,0.08)]"
              : "border-[#48a7ff]/30 bg-[#48a7ff]/10 hover:border-[#48a7ff]/70 hover:bg-[#48a7ff]/15"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-black text-[#75bdff]">
              REAL
            </span>

            {selectedVote === "real" && (
              <span className="rounded-full bg-[#48a7ff] px-2.5 py-1 text-[10px] font-black tracking-wider text-[#06111c]">
                YOUR VOTE
              </span>
            )}
          </div>

          <span className="mt-2 block text-sm leading-5 text-white/45">
            Authentic or conventionally produced media.
          </span>

          <span className="mt-4 block text-sm font-bold text-[#75bdff]">
            {realVotes.toLocaleString()} votes
          </span>
        </button>

        <button
          type="button"
          aria-pressed={selectedVote === "ai"}
          onClick={handleAiVote}
          className={`rounded-xl border p-5 text-left transition ${
            selectedVote === "ai"
              ? "border-red-400/70 bg-red-400/10 shadow-[0_0_30px_rgba(248,113,113,0.08)]"
              : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-xl font-black ${
                selectedVote === "ai"
                  ? "text-red-300"
                  : "text-white/75"
              }`}
            >
              AI GENERATED
            </span>

            {selectedVote === "ai" && (
              <span className="rounded-full bg-red-400 px-2.5 py-1 text-[10px] font-black tracking-wider text-[#1a0606]">
                YOUR VOTE
              </span>
            )}
          </div>

          <span className="mt-2 block text-sm leading-5 text-white/40">
            Fully generated or materially altered using AI.
          </span>

          <span
            className={`mt-4 block text-sm font-bold ${
              selectedVote === "ai"
                ? "text-red-300"
                : "text-white/55"
            }`}
          >
            {aiVotes.toLocaleString()} votes
          </span>
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs">
          <span className="font-bold text-white/45">
            COMMUNITY CONFIDENCE
          </span>

          <span className="font-black text-[#69b7ff]">
            {realPercentage}% REAL
          </span>
        </div>

        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full bg-[#48a7ff] transition-[width] duration-300"
            style={{ width: `${realPercentage}%` }}
          />

          <div
            className="h-full bg-red-400/60 transition-[width] duration-300"
            style={{ width: `${aiPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/35">
          <span>
            {realVotes.toLocaleString()} REAL
          </span>

          <span>
            {totalVotes.toLocaleString()} TOTAL VOTES
          </span>

          <span>
            {aiVotes.toLocaleString()} AI
          </span>
        </div>

        {selectedVote !== null && (
          <div className="mt-5 rounded-lg border border-white/10 bg-black/10 px-4 py-3">
            <p className="text-sm text-white/55">
              Your vote has been recorded as{" "}
              <span
                className={
                  selectedVote === "real"
                    ? "font-bold text-[#75bdff]"
                    : "font-bold text-red-300"
                }
              >
                {selectedVote === "real"
                  ? "REAL"
                  : "AI GENERATED"}
              </span>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}