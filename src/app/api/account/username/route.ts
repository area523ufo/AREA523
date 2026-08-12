import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  username?: unknown;
};

export async function POST(
  request: Request,
) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  let body:
    RequestBody;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      {
        status: 400,
      },
    );
  }

  const username =
    typeof body.username ===
      "string"
      ? body.username.trim()
      : "";

  if (
    username.length < 3 ||
    username.length > 24
  ) {
    return NextResponse.json(
      {
        error:
          "Username must be 3 to 24 characters.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !/^[A-Za-z0-9_]+$/.test(
      username,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Username may only contain letters, numbers, and underscores.",
      },
      {
        status: 400,
      },
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
        "id, username_set",
      )
      .eq(
        "id",
        user.id,
      )
      .single();

  if (
    profileError ||
    !profile
  ) {
    return NextResponse.json(
      {
        error:
          "Profile not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (
    profile.username_set
  ) {
    return NextResponse.json(
      {
        error:
          "Username has already been set.",
      },
      {
        status: 409,
      },
    );
  }

  const {
    error:
      updateError,
  } =
    await supabase
      .from("profiles")
      .update({
        username,
        username_set:
          true,
      })
      .eq(
        "id",
        user.id,
      );

  if (updateError) {
    if (
      updateError.code ===
      "23505"
    ) {
      return NextResponse.json(
        {
          error:
            "That username is already taken.",
        },
        {
          status: 409,
        },
      );
    }

   console.error(
  "Username update failed:",
  updateError,
);

return NextResponse.json(
  {
    error:
      updateError.message,
    code:
      updateError.code,
  },
  {
    status: 500,
  },
);
  }

  return NextResponse.json({
    success: true,
    username,
  });
}