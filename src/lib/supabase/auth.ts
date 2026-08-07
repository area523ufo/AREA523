import { createClient } from "./client";

export async function signUp(
  email: string,
  password: string,
  username: string
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
  password: string
) {
  const supabase = createClient();

  return await supabase.auth.signInWithPassword({
    email,
    password,
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
