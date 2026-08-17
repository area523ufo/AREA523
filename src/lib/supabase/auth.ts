import { createClient } from "@/lib/supabase/client";

export async function signUp(
  email: string,
  password: string,
) {
  const supabase =
    createClient();

  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signIn(
  email: string,
  password: string,
) {
  const supabase =
    createClient();

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle() {
  const supabase =
    createClient();

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  return await supabase.auth.signInWithOAuth({
    provider: "google",

    options: {
      redirectTo,
    },
  });
}

export async function getCurrentUser() {
  const supabase =
    createClient();

  return await supabase.auth.getUser();
}

export async function signOut() {
  const supabase =
    createClient();

  return await supabase.auth.signOut();
}