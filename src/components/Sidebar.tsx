"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type CommunityArea = {
  id: number;
  name: string;
  slug: string;
};

type SidebarProps = {
  mobile?: boolean;
};

const primaryLinks = [
  {
    name: "REAL · NOT AI",
    href: "/verified",
    icon: "✓",
  },
  {
    name: "TRENDING",
    href: "/",
    icon: "↑",
  },
];

const coreAreas = [
  {
    name: "UFO",
    href: "/board/ufo",
  },
  {
    name: "Mysteries",
    href: "/board/mysteries",
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

export default function Sidebar({
  mobile = false,
}: SidebarProps) {
  const pathname = usePathname();

  const [communityAreas, setCommunityAreas] =
    useState<CommunityArea[]>([]);

  const [
    loadingCommunityAreas,
    setLoadingCommunityAreas,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunityAreas() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("boards")
        .select(`
          id,
          name,
          slug
        `)
        .not("created_by", "is", null)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Failed to load Community Areas:",
          error,
        );

        setCommunityAreas([]);
        setLoadingCommunityAreas(false);
        return;
      }

      setCommunityAreas(
        (data ?? []) as CommunityArea[],
      );

      setLoadingCommunityAreas(false);
    }

    void loadCommunityAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <aside
      className={
        mobile
          ? "w-full px-3 py-4"
          : "sticky top-16 hidden h-[calc(100vh-4rem)] w-[240px] shrink-0 overflow-y-auto border-r border-white/10 px-3 py-4 lg:block"
      }
    >
      <nav className="flex flex-col">
        {/* PRIMARY */}
        <div className="space-y-1">
          {primaryLinks.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
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
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition duration-200 ${
                    active
                      ? "bg-[#48a7ff]/20 text-[#75bdff]"
                      : "bg-white/[0.04] text-white/45 group-hover:scale-105 group-hover:bg-[#48a7ff]/10 group-hover:text-[#69b7ff]"
                  }`}
                >
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="my-5 border-t border-white/10" />

        {/* CORE AREAS */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-black tracking-[0.18em] text-white/30">
            AREAS
          </p>

          <div className="space-y-1">
            {coreAreas.map((area) => {
              const active =
                isActive(area.href);

              return (
                <Link
                  key={area.name}
                  href={area.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#48a7ff]/15 text-[#75bdff]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#48a7ff]" />
                  )}

                  <span className="pl-1">
                    {area.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CREATE AREA */}
        <Link
          href="/area/create"
          className="my-4 flex items-center gap-2 rounded-xl border border-[#48a7ff]/20 bg-[#48a7ff]/[0.07] px-3 py-2.5 text-sm font-bold text-[#69b7ff] transition hover:border-[#48a7ff]/40 hover:bg-[#48a7ff]/[0.12]"
        >
          <span className="text-lg leading-none">
            +
          </span>

          <span>
            Create Area
          </span>
        </Link>

        {/* COMMUNITY AREAS */}
        <div className="border-t border-white/[0.07] pt-4">
          <p className="mb-2 px-3 text-[10px] font-black tracking-[0.18em] text-white/30">
            COMMUNITY AREAS
          </p>

          {loadingCommunityAreas ? (
            <p className="px-3 py-2 text-xs text-white/25">
              Loading...
            </p>
          ) : communityAreas.length > 0 ? (
            <div className="space-y-1">
              {communityAreas.map((area) => {
                const href =
                  `/board/${area.slug}`;

                const active =
                  isActive(href);

                return (
                  <Link
                    key={area.id}
                    href={href}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#48a7ff]/15 text-[#75bdff]"
                        : "text-white/45 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#48a7ff]" />
                    )}

                    <span className="truncate pl-1">
                      {area.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-2 text-xs leading-5 text-white/25">
              No Community Areas yet.
            </p>
          )}
        </div>
      </nav>
    </aside>
  );
}