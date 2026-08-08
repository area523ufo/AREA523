import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0b0e12]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link
            href="/about"
            className="transition hover:text-white"
          >
            About
          </Link>

          <Link
            href="/area"
            className="transition hover:text-white"
          >
            AREA
          </Link>

          <Link
            href="/rules"
            className="transition hover:text-white"
          >
            Rules
          </Link>

          <Link
            href="/privacy"
            className="transition hover:text-white"
          >
            Privacy
          </Link>

          <Link
            href="/content-policy"
            className="transition hover:text-white"
          >
            Content Policy
          </Link>
        </div>

        <p className="whitespace-nowrap text-white/25">
          © 2026 AREA523
        </p>
      </div>
    </footer>
  );
}