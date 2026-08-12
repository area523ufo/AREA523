"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AuthModal, {
  type MockUser,
} from "@/components/AuthModal";
import {
  getCurrentUser,
  signOut,
} from "@/lib/supabase/auth";

type AuthMode = "login" | "signup";

export default function Header() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<MockUser | null>(
    null,
  );

  const [isAuthModalOpen, setIsAuthModalOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>("login");

  const [isProfileMenuOpen, setIsProfileMenuOpen] =
    useState(false);

  const profileMenuRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const loadUser = async () => {
    const { data } = await getCurrentUser();

    if (!data.user) {
      return;
    }

    setUser({
      username:
        data.user.user_metadata.username ??
        data.user.email?.split("@")[0] ??
        "user",
      email: data.user.email ?? "",
    });
  };

  loadUser();
}, []);

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);
  
  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

useEffect(() => {
  function handleOpenAuth(event: Event) {
    const customEvent =
      event as CustomEvent<{
        mode?: AuthMode;
      }>;

    const mode =
      customEvent.detail?.mode === "login"
        ? "login"
        : "signup";

    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }

  window.addEventListener(
    "area523:open-auth",
    handleOpenAuth,
  );

  return () => {
    window.removeEventListener(
      "area523:open-auth",
      handleOpenAuth,
    );
  };
}, []);

  const handleLogout = async () => {
  await signOut();

  setUser(null);
  setIsProfileMenuOpen(false);
};

const handleSearch = () => {
  const query = searchQuery.trim();

  if (!query) {
    return;
  }

  router.push(
    `/search?q=${encodeURIComponent(query)}`,
  );
};

  const profileInitial =
    user?.username.charAt(0).toUpperCase() ?? "A";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0d10]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:gap-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Go to AREA523 home"
          >
            <Image
              src="/logo.png"
              alt="AREA523 logo"
              width={38}
              height={38}
              priority
              className="h-[38px] w-[38px] rounded-full object-cover"
            />

            <span className="hidden text-lg font-black tracking-[0.18em] text-[#48a7ff] sm:inline">
              AREA523
            </span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
<input
  type="search"
  value={searchQuery}
  onChange={(event) =>
    setSearchQuery(event.target.value)
  }
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  }}
  placeholder="Search AREA523"
  className="w-full max-w-md rounded-full border border-white/10 bg-white/[0.06] px-5 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#48a7ff]/60"
/>
          </div>

          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/verified"
              className="hidden items-center gap-2 rounded-full border border-[#48a7ff]/30 bg-[#48a7ff]/10 px-4 py-2 text-sm font-bold text-[#69b7ff] transition hover:border-[#48a7ff] hover:bg-[#48a7ff]/20 lg:flex"
            >
              <Image
                src="/logo.png"
                alt=""
                width={18}
                height={18}
                className="rounded-full"
              />

              NOT AI VERIFIED
            </Link>

            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal("login")
                  }
                  className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white sm:block"
                >
                  Log In
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAuthModal("signup")
                  }
                  className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white xl:block"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div
                ref={profileMenuRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setIsProfileMenuOpen(
                      (current) => !current,
                    )
                  }
                  aria-expanded={isProfileMenuOpen}
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pr-3 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#48a7ff] text-sm font-black text-[#06111c]">
                    {profileInitial}
                  </span>

                  <span className="hidden max-w-32 truncate text-sm font-bold text-white/70 lg:block">
                    u/{user.username}
                  </span>

                  <span className="text-xs text-white/30">
                    ▾
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-white/10 bg-[#12151a] shadow-2xl">
                    <div className="border-b border-white/10 px-4 py-4">
                      <p className="truncate text-sm font-black text-white">
                        u/{user.username}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/35">
                        {user.email}
                      </p>
                    </div>

                    <div className="p-2">
                      <Link
                        href={`/profile/${encodeURIComponent(
                          user.username,
                        )}`}
                        onClick={() =>
                          setIsProfileMenuOpen(false)
                        }
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        View Profile
                      </Link>

                      <Link
                        href="/create"
                        onClick={() =>
                          setIsProfileMenuOpen(false)
                        }
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Create Post
                      </Link>

                      <Link
                        href="/verified"
                        onClick={() =>
                          setIsProfileMenuOpen(false)
                        }
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Verified Archive
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-300 transition hover:bg-red-400/[0.08]"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/create"
              className="rounded-full bg-[#48a7ff] px-3 py-2 text-sm font-bold text-[#00111c] transition hover:bg-[#71baff] sm:px-4"
            >
              <span className="sm:hidden">＋</span>
              <span className="hidden sm:inline">
                Create Post
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() =>
          setIsAuthModalOpen(false)
        }
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />
    </>
  );
}