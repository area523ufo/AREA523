import Link from "next/link";

type FollowListUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type FollowListProps = {
  title: string;
  username: string;
  users: FollowListUser[];
  emptyMessage: string;
};

export default function FollowList({
  title,
  username,
  users,
  emptyMessage,
}: FollowListProps) {
  return (
    <section className="overflow-hidden border-y border-white/10 bg-[#12151a] sm:rounded-2xl sm:border">
      {/* HEADER */}
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <Link
          href={`/profile/${encodeURIComponent(
            username,
          )}`}
          className="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-bold text-white/40 transition hover:text-white/80"
        >
          <span aria-hidden="true">
            ←
          </span>

          <span className="max-w-[240px] truncate">
            @{username}
          </span>
        </Link>

        <div className="mt-2 flex items-end justify-between gap-3">
          <h1 className="min-w-0 text-xl font-black text-white sm:text-2xl">
            {title}
          </h1>

          <span className="shrink-0 text-xs font-semibold text-white/30">
            {users.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* EMPTY */}
      {users.length === 0 ? (
        <div className="px-5 py-14 text-center sm:px-6 sm:py-16">
          <p className="text-sm font-semibold text-white/35">
            {emptyMessage}
          </p>
        </div>
      ) : (
        /* USER LIST */
        <div>
          {users.map((user) => {
            const profileName =
              user.display_name?.trim() ||
              user.username;

            const initial =
              profileName
                .slice(0, 1)
                .toUpperCase();

            return (
              <Link
                key={user.id}
                href={`/profile/${encodeURIComponent(
                  user.username,
                )}`}
                className="flex min-w-0 items-start gap-3 border-b border-white/[0.06] px-4 py-4 transition last:border-b-0 hover:bg-white/[0.025] sm:px-5"
              >
                {/* AVATAR */}
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={`${profileName} profile`}
                    className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-[#0b0d10] object-cover sm:h-12 sm:w-12"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#17304a] text-sm font-black text-[#69b7ff] sm:h-12 sm:w-12 sm:text-base">
                    {initial}
                  </div>
                )}

                {/* PROFILE INFO */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
                    <p className="truncate text-sm font-black text-white/90">
                      {profileName}
                    </p>

                    <span className="truncate text-xs text-white/30">
                      @{user.username}
                    </span>
                  </div>

                  {user.bio && (
                    <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-white/45">
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* OPEN PROFILE */}
                <span
                  aria-hidden="true"
                  className="mt-2 shrink-0 text-sm text-white/20"
                >
                  ›
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export type { FollowListUser };