import { notFound } from "next/navigation";

import FollowList, {
  type FollowListUser,
} from "@/components/FollowList";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

type RawFollowerRow = {
  follower:
    | FollowListUser
    | FollowListUser[]
    | null;
};

function normalizeUser(
  value:
    | FollowListUser
    | FollowListUser[]
    | null,
): FollowListUser | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export default async function FollowersPage({
  params,
}: Props) {
  const { username } = await params;

  const decodedUsername =
    decodeURIComponent(username).trim();

  const supabase = await createClient();

  /*
   * -----------------------------------------
   * Profile
   * -----------------------------------------
   */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike(
      "username",
      decodedUsername,
    )
    .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    if (profileError) {
      console.error(
        "Followers profile lookup failed:",
        profileError,
      );
    }

    notFound();
  }

  /*
   * -----------------------------------------
   * Followers
   * -----------------------------------------
   */

  const {
    data,
    error,
  } = await supabase
    .from("user_follows")
    .select(`
      follower:profiles!user_follows_follower_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `)
    .eq(
      "following_id",
      profile.id,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    console.error(
      "Followers query failed:",
      error,
    );
  }

  const rows =
    (data ??
      []) as unknown as
      RawFollowerRow[];

  const users = rows
    .map((row) =>
      normalizeUser(
        row.follower,
      ),
    )
    .filter(
      (
        user,
      ): user is FollowListUser =>
        user !== null,
    );

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e7e9ea]">
      <Header />

      <div className="mx-auto flex w-full max-w-[1320px]">
        <Sidebar />

        <section className="min-w-0 flex-1 px-0 py-0 sm:px-4 sm:py-6">
          <div className="mx-auto w-full max-w-[720px]">
            <FollowList
              title="Followers"
              username={
                profile.username
              }
              users={users}
              emptyMessage="No followers yet."
            />
          </div>
        </section>
      </div>
    </main>
  );
}