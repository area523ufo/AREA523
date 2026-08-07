import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing postId",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { data, error } = await supabase.rpc(
      "toggle_post_repost",
      {
        p_post_id: postId,
      }
    );

    if (error) {
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
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}