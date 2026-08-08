import Link from "next/link";

export default function AreaLaunchStatusBar() {
  return (
    <div className="border-b border-[#48a7ff]/60 bg-[#0d6efd]">
      <div className="mx-auto flex min-h-10 max-w-[1320px] items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-black sm:text-xs">
        <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" />

        <span className="whitespace-nowrap text-white">
          AREA PRE-LAUNCH
        </span>

        <span className="hidden text-white/60 sm:inline">
          ·
        </span>

        <span className="hidden text-white sm:inline">
          Rewards are live · Public trading scheduled Sep 1
        </span>

        <Link
          href="/area"
          className="ml-1 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#0957bd] transition hover:bg-white/90 sm:text-[11px]"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}