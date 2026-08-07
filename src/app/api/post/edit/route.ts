import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
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

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const sourceUrl =
      typeof body.sourceUrl === "string"
        ? body.sourceUrl.trim()
        : "";

    const location =
      typeof body.location === "string"
        ? body.location.trim()
        : "";

    const capturedAt =
      typeof body.capturedAt === "string" &&
      body.capturedAt.trim()
        ? body.capturedAt.trim()
        : null;

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

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (title.length > 300) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title must be 300 characters or fewer.",
        },
        {
          status: 400,
        },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "Description is required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabase.rpc(
      "update_own_post",
      {
        p_post_id: postId,
        p_title: title,
        p_description: description,
        p_source_url: sourceUrl || null,
        p_location: location || null,
        p_captured_at: capturedAt,
      },
    );

    if (error) {
      console.error(
        "update_own_post RPC failed:",
        error,
      );

      if (
        error.message.includes(
          "EDIT_WINDOW_EXPIRED",
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Posts can only be edited within 10 minutes of publishing.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        error.message.includes(
          "NOT_POST_AUTHOR",
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You can only edit your own posts.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        error.message.includes(
          "POST_NOT_FOUND",
        )
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

      if (
        error.message.includes(
          "POST_REMOVED",
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Deleted posts cannot be edited.",
          },
          {
            status: 410,
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
      "Edit post API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "The post could not be updated.",
      },
      {
        status: 500,
      },
    );
  }
}