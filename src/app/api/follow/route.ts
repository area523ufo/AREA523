import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      await request.json();

    const userId =
      typeof body.userId ===
      "string"
        ? body.userId.trim()
        : "";

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "toggle_user_follow",
        {
          p_following_id:
            userId,
        },
      );

    if (error) {
      if (
        error.message.includes(
          "CANNOT_FOLLOW_SELF",
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You cannot follow yourself.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        error.message.includes(
          "ACCOUNT_SUSPENDED",
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your account is suspended.",
          },
          {
            status: 403,
          },
        );
      }

      console.error(
        "toggle_user_follow failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      data,
    );
  } catch (error) {
    console.error(
      "Follow API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Follow status could not be changed.",
      },
      {
        status: 500,
      },
    );
  }
}