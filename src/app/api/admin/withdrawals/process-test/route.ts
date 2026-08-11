import { NextResponse } from "next/server";

import {
  processAreaWithdrawalById,
} from "@/lib/server/areaWithdrawalWorker";

const TEST_WITHDRAWAL_ID =
  "512a6ccd-d458-4b65-99a7-efedfad78bda";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Test withdrawal endpoint is disabled in production.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const result =
      await processAreaWithdrawalById(
        TEST_WITHDRAWAL_ID,
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "AREA test withdrawal failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown withdrawal error",
      },
      {
        status: 500,
      },
    );
  }
}