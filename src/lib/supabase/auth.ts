import { createClient } from "./client";

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const supabase = createClient();

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
}

export async function signIn(
  email: string,
  password: string,
) {
  const supabase = createClient();

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle() {
  const supabase = createClient();

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://area523.com";

  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();

  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = createClient();

  return await supabase.auth.getUser();
}