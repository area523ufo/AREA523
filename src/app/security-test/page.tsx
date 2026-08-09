"use client";

import { createClient } from "@/lib/supabase/client";

export default function SecurityTestPage() {
  async function runTests() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("LOGIN REQUIRED");
      return;
    }

    console.log("USER:", user.id);

    const tests = [];

    // ---------------------------------------------------------
    // 1. profiles.is_admin
    // 기대 결과: 실패
    // ---------------------------------------------------------
    tests.push(
      await supabase
        .from("profiles")
        .update({
          is_admin: true,
        })
        .eq("id", user.id),
    );

    // ---------------------------------------------------------
    // 2. profiles.area_balance
    // 기대 결과: 실패
    // ---------------------------------------------------------
    tests.push(
      await supabase
        .from("profiles")
        .update({
          area_balance: 999999999,
        })
        .eq("id", user.id),
    );

    // ---------------------------------------------------------
    // 자기 게시글 하나 가져오기
    // ---------------------------------------------------------
    const { data: posts, error: postsError } =
      await supabase
        .from("posts")
        .select("id")
        .eq("author_id", user.id)
        .limit(1);

    if (postsError) {
      console.error(
        "Failed to load own post:",
        postsError,
      );
    }

    const postId = posts?.[0]?.id;

    if (postId) {
      // -------------------------------------------------------
      // 3. posts.verification_status
      // 기대 결과: 실패
      // -------------------------------------------------------
      tests.push(
        await supabase
          .from("posts")
          .update({
            verification_status:
              "verified_real",
          })
          .eq("id", postId),
      );

      // -------------------------------------------------------
      // 4. posts.real_vote_count
      // 기대 결과: 실패
      // -------------------------------------------------------
      tests.push(
        await supabase
          .from("posts")
          .update({
            real_vote_count: 99999,
          })
          .eq("id", postId),
      );
    } else {
      console.log(
        "No own post found — post tests skipped.",
      );
    }

    // ---------------------------------------------------------
    // 자기 댓글 하나 가져오기
    // ---------------------------------------------------------
    const {
      data: comments,
      error: commentsError,
    } = await supabase
      .from("comments")
      .select("id")
      .eq("author_id", user.id)
      .limit(1);

    if (commentsError) {
      console.error(
        "Failed to load own comment:",
        commentsError,
      );
    }

    const commentId = comments?.[0]?.id;

    if (commentId) {
      // -------------------------------------------------------
      // 5. comments.is_removed
      // 기대 결과: 실패
      // -------------------------------------------------------
      tests.push(
        await supabase
          .from("comments")
          .update({
            is_removed: true,
          })
          .eq("id", commentId),
      );
    } else {
      console.log(
        "No own comment found — comment test skipped.",
      );
    }

    // ---------------------------------------------------------
    // 결과 출력
    // ---------------------------------------------------------
    console.log(
      "SECURITY TEST RESULTS",
    );

    tests.forEach((result, index) => {
      console.log(`TEST ${index + 1}`, {
        data: result.data,
        error: result.error,
      });
    });
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] p-10 text-white">
      <h1 className="text-2xl font-black">
        AREA523 Security Test
      </h1>

      <p className="mt-3 max-w-xl text-sm text-white/50">
        Run this page only with a normal authenticated
        user account. Every privilege escalation attempt
        should fail.
      </p>

      <button
        type="button"
        onClick={() => void runTests()}
        className="mt-6 rounded-lg bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400"
      >
        RUN PRIVILEGE TEST
      </button>
    </main>
  );
}