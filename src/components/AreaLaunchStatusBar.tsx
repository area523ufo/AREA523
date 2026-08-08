import Link from "next/link";

export default function AreaLaunchStatusBar() {
  return (
    <div className="border-b border-[#48a7ff]/20 bg-[#48a7ff]/[0.055]">
      <div className="mx-auto flex max-w-[1320px] items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-bold sm:text-xs">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#69b7ff]" />

        <span className="text-[#8ac8ff]">
          AREA PRE-LAUNCH
        </span>

        <span className="hidden text-white/25 sm:inline">
          ·
        </span>

        <span className="hidden text-white/45 sm:inline">
          Rewards live · Public trading scheduled Sep 1
        </span>

        <Link
          href="/area"
          className="ml-1 whitespace-nowrap text-[#69b7ff] transition hover:text-white"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}