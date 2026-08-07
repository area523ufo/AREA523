import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
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
      "remove_own_post",
      {
        p_post_id: postId,
      },
    );

    if (error) {
      console.error(
        "remove_own_post RPC failed:",
        error,
      );

      if (
        error.message.includes("NOT_POST_AUTHOR")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You can only delete your own posts.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        error.message.includes("POST_NOT_FOUND")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Post not found.",
          },
          {
            status: 404,
          },
        );
      }

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
      "Delete post API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "The post could not be deleted.",
      },
      {
        status: 500,
      },
    );
  }
}