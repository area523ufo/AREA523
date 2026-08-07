import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type VoteValue = "REAL" | "AI";

type VoteRequestBody = {
  postId?: unknown;
  vote?: unknown;
};

type CastVoteResult = {
  success: boolean;
  postId: string;
  userVote: VoteValue;
  realVotes: number;
  aiVotes: number;
  totalVotes: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isVoteValue(value: unknown): value is VoteValue {
  return value === "REAL" || value === "AI";
}

function getErrorResponse(message: string) {
  if (message.includes("AUTH_REQUIRED")) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to vote.",
      },
      {
        status: 401,
      },
    );
  }

  if (message.includes("INVALID_VOTE")) {
    return NextResponse.json(
      {
        success: false,
        error: "The vote must be REAL or AI.",
      },
      {
        status: 400,
      },
    );
  }

  if (message.includes("POST_NOT_VOTABLE")) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This post does not exist or voting has already ended.",
      },
      {
        status: 409,
      },
    );
  }

if (message.includes("ACCOUNT_SUSPENDED")) {
  return NextResponse.json(
    {
      success: false,
      error: "Your account is suspended.",
    },
    {
      status: 403,
    },
  );
}

  return NextResponse.json(
    {
      success: false,
      error: "The vote could not be processed.",
    },
    {
      status: 500,
    },
  );
}

export async function POST(request: Request) {
  try {
    let body: VoteRequestBody;

    try {
      body = (await request.json()) as VoteRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const postId =
      typeof body.postId === "string"
        ? body.postId.trim()
        : "";

    if (!UUID_PATTERN.test(postId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid post ID.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isVoteValue(body.vote)) {
      return NextResponse.json(
        {
          success: false,
          error: "The vote must be REAL or AI.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to vote.",
        },
        {
          status: 401,
        },
      );
    }

    const { data, error } = await supabase.rpc(
      "cast_vote",
      {
        p_post_id: postId,
        p_vote: body.vote,
      },
    );

    if (error) {
      console.error("Vote RPC failed:", error);

      return getErrorResponse(error.message);
    }

    const result = data as CastVoteResult | null;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "The vote result was empty.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected vote API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred.",
      },
      {
        status: 500,
      },
    );
  }
}