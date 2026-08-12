import Image from "next/image";
import Link from "next/link";

type VerifiedBadgeProps = {
  verificationNumber: number;
  compact?: boolean;
};

function formatVerificationNumber(number: number) {
  return `#${number.toString().padStart(6, "0")}`;
}

export default function VerifiedBadge({
  verificationNumber,
  compact = false,
}: VerifiedBadgeProps) {
  return (
    <Link
      href="/verified"
      title="Community-verified as real, not AI-generated"
      className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1.5 transition hover:border-blue-400/60 hover:bg-blue-400/15"
    >
      <Image
        src="/logo.png"
        alt="AREA523 REAL · NOT AI badge"
        width={compact ? 20 : 24}
        height={compact ? 20 : 24}
        className="shrink-0 rounded-full object-cover"
      />

      <span className="leading-none">
        <span className="block text-[10px] font-black tracking-[0.12em] text-blue-400 sm:text-[11px]">
          REAL · NOT AI
        </span>

        {!compact && (
          <span className="mt-1 block text-[9px] font-semibold tracking-[0.08em] text-white/45">
            VERIFICATION{" "}
            {formatVerificationNumber(
              verificationNumber,
            )}
          </span>
        )}
      </span>
    </Link>
  );
}