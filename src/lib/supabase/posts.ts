import { createClient } from "@/lib/supabase/client";

export type CreatePostInput = {
  boardSlug: string;
  title: string;
  description: string;
  sourceUrl: string;
  location: string;
  capturedAt: string;
  isOriginalMedia: boolean;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
};

export async function createPost(
  input: CreatePostInput,
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error(
      "You must be logged in to create a post.",
    );
  }

const {
  data: profile,
  error: profileError,
} = await supabase
  .from("profiles")
  .select("is_suspended")
  .eq("id", user.id)
  .single();

if (profileError) {
  throw new Error(profileError.message);
}

if (profile?.is_suspended) {
  throw new Error(
    "Your account is suspended.",
  );
}

  const { data: board, error: boardError } =
    await supabase
      .from("boards")
      .select("id")
      .eq("slug", input.boardSlug)
      .single();

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (!board) {
    throw new Error("Selected board was not found.");
  }

  const { data: posts, error: postError } =
    await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        board_id: board.id,
        title: input.title.trim(),
        description: input.description.trim(),
        media_url: input.mediaUrl ?? null,
        media_type: input.mediaType ?? null,
        source_url: input.sourceUrl.trim() || null,
        location: input.location.trim() || null,
        captured_at: input.capturedAt || null,
        is_original_media: input.isOriginalMedia,
      })
      .select("id");

  if (postError) {
    console.error(
      "Supabase post insert error:",
      postError,
    );

    throw new Error(postError.message);
  }

  const post = posts?.[0];

  if (!post) {
    throw new Error(
      "Post was created, but its ID could not be returned.",
    );
  }

  return post;
}