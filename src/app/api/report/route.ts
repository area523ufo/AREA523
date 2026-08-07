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
          error: "You must be signed in to report a post.",
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

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
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

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a reason for the report.",
        },
        {
          status: 400,
        },
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Report reason must be 500 characters or fewer.",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabase.rpc(
      "report_post",
      {
        p_post_id: postId,
        p_reason: reason,
      },
    );

    if (error) {
      console.error("Report RPC failed:", error);

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
    console.error("Report API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The report could not be submitted.",
      },
      {
        status: 500,
      },
    );
  }
}