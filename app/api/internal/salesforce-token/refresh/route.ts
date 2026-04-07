import { NextRequest, NextResponse } from "next/server";
import { refreshAndStoreSalesforceToken } from "@/lib/salesforce-oauth";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

async function runRefresh(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await refreshAndStoreSalesforceToken();
    return NextResponse.json({
      success: true,
      message: "Salesforce token refreshed and stored",
      data: result,
    });
  } catch (error: any) {
    console.error("Salesforce token refresh error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to refresh Salesforce token",
      },
      { status: 500 }
    );
  }
}

// Vercel cron sends GET by default; keep POST for manual/integration calls.
export async function GET(request: NextRequest) {
  return runRefresh(request);
}

export async function POST(request: NextRequest) {
  return runRefresh(request);
}
