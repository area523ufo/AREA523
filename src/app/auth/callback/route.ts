import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
) {
  const requestUrl =
    new URL(
      request.url,
    );

  const code =
    requestUrl.searchParams.get(
      "code",
    );

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/?auth_error=missing_code",
        requestUrl.origin,
      ),
    );
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.auth
      .exchangeCodeForSession(
        code,
      );

  if (
    error ||
    !data.user
  ) {
    console.error(
      "OAuth callback failed:",
      error,
    );

    return NextResponse.redirect(
      new URL(
        "/?auth_error=oauth_callback",
        requestUrl.origin,
      ),
    );
  }

  const {
    data: profile,
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "username, username_set",
      )
      .eq(
        "id",
        data.user.id,
      )
      .single();

  if (
    profileError ||
    !profile
  ) {
    console.error(
      "OAuth profile lookup failed:",
      profileError,
    );

    return NextResponse.redirect(
      new URL(
        "/?auth_error=profile",
        requestUrl.origin,
      ),
    );
  }

  if (
    !profile.username_set
  ) {
    return NextResponse.redirect(
      new URL(
        "/choose-username",
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      "/",
      requestUrl.origin,
    ),
  );
}