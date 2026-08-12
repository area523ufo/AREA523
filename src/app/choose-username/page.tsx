import { redirect } from "next/navigation";

import ChooseUsernameForm from "@/components/ChooseUsernameForm";
import { createClient } from "@/lib/supabase/server";

export default async function ChooseUsernamePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("username, username_set")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error(
      "Choose username profile lookup failed:",
      error,
    );

    redirect("/");
  }

  if (profile.username_set) {
    redirect(
      `/profile/${encodeURIComponent(
        profile.username,
      )}`,
    );
  }

  return (
    <ChooseUsernameForm />
  );
}