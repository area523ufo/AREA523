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
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const postId =
      typeof body.postId === "string"
        ? body.postId.trim()
        : "";

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "Post ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabase.rpc(
      "admin_clear_verification_override",
      {
        p_post_id: postId,
      },
    );

    if (error) {
      console.error(
        "admin_clear_verification_override failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error(
      "Clear verification API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "The verification override could not be removed.",
      },
      {
        status: 500,
      },
    );
  }
}