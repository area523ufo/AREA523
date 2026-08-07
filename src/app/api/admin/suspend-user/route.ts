import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    const suspended =
      typeof body.suspended === "boolean"
        ? body.suspended
        : true;

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc(
      "admin_set_user_suspension",
      {
        p_user_id: userId,
        p_suspended: suspended,
        p_reason:
          suspended && reason
            ? reason
            : null,
      },
    );

    if (error) {
      console.error(
        "admin_set_user_suspension failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error(
      "Admin suspension API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "The user status could not be changed.",
      },
      { status: 500 },
    );
  }
}