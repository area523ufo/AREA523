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
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const reportId =
      typeof body.reportId === "string"
        ? body.reportId.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Report ID is required." },
        { status: 400 },
      );
    }

    if (!["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid report status." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc(
      "admin_update_report_status",
      {
        p_report_id: reportId,
        p_status: status,
      },
    );

    if (error) {
      console.error(
        "admin_update_report_status failed:",
        error,
      );

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error) {
    console.error(
      "Admin report status API failed:",
      error,
    );

    return NextResponse.json(
      { success: false, error: "The report could not be updated." },
      { status: 500 },
    );
  }
}