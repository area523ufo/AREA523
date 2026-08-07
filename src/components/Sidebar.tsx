"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  {
    name: "NOT AI VERIFIED",
    href: "/verified",
    icon: "✦",
  },
  {
    name: "TRENDING",
    href: "/",
    icon: "↗",
  },
  {
    name: "MONTHLY RANKING",
    href: "/leaderboard/monthly",
    icon: "🏆",
  },
];

const boards = [
  {
    name: "UFO",
    href: "/board/ufo",
  },
  {
    name: "Politics",
    href: "/board/politics",
  },
  {
    name: "Stocks",
    href: "/board/stocks",
  },
  {
    name: "Memes",
    href: "/board/memes",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-white/10 bg-[#0b0d10] px-3 py-5 lg:block">
      <nav className="flex h-full flex-col">
        <div className="space-y-1">
          {primaryLinks.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-sm font-bold tracking-wide transition ${
                  active
                    ? "bg-[#48a7ff]/15 text-[#75bdff]"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#48a7ff]" />
                )}

                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200 ${
                    active
                      ? "bg-[#48a7ff]/20 text-[#75bdff]"
                      : "bg-white/[0.04] text-white/45 group-hover:scale-105 group-hover:bg-[#48a7ff]/10 group-hover:text-[#69b7ff]"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-5 border-t border-white/10" />

        <div>
          <p className="mb-2 px-3 text-[10px] font-black tracking-[0.18em] text-white/30">
            BOARDS
          </p>

          <div className="space-y-1">
            {boards.map((board) => {
              const active = isActive(board.href);

              return (
                <Link
                  key={board.name}
                  href={board.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#48a7ff]/15 text-[#75bdff]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#48a7ff]" />
                  )}

                  <span className="pl-1">{board.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            type="button"
            className="w-full rounded-lg border border-dashed border-white/15 px-3 py-3 text-left text-sm font-semibold text-white/40 transition hover:border-[#48a7ff]/40 hover:bg-[#48a7ff]/5 hover:text-[#69b7ff]"
          >
            + New Board
          </button>
        </div>
      </nav>
    </aside>
  );
}