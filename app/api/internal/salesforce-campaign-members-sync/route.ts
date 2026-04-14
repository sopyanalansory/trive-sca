import { NextRequest, NextResponse } from "next/server";
import {
  extractCampaignMemberArrayFromWebhookPayload,
  updateExistingCampaignMembersFromSfRecords,
} from "@/lib/salesforce-campaign-members-webhook-sync";
import { apiLogger, logRouteError } from "@/lib/logger";

const log = apiLogger("internal:salesforce-campaign-members-sync");

export const runtime = "nodejs";

function basicAuthCredentials(): { user: string; pass: string } | null {
  const user = process.env.SALESFORCE_PLATFORM_SYNC_USER?.trim();
  const pass = process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD;
  if (!user || pass === undefined || pass === "") {
    return null;
  }
  return { user, pass };
}

function isAuthorized(request: NextRequest): boolean {
  const creds = basicAuthCredentials();
  if (!creds) {
    return false;
  }

  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString(
      "utf8"
    );
    const sep = decoded.indexOf(":");
    const username = sep === -1 ? decoded : decoded.slice(0, sep);
    const password = sep === -1 ? "" : decoded.slice(sep + 1);
    return username === creds.user && password === creds.pass;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 200 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON", message: "Invalid JSON body" },
        { status: 200 }
      );
    }

    const records = extractCampaignMemberArrayFromWebhookPayload(body);
    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION",
          message:
            "Payload harus berisi campaignMembers: array objek campaign member, array objek, atau satu objek dengan field Id.",
        },
        { status: 200 }
      );
    }

    const result = await updateExistingCampaignMembersFromSfRecords(records);
    return NextResponse.json({
      success: true,
      fetched: result.fetched,
      updated: result.updated,
      skipped: result.skipped,
      notInDatabase: result.notInDatabase,
    });
  } catch (error: unknown) {
    logRouteError(
      log,
      request,
      error,
      "Salesforce campaign members webhook update failed"
    );
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Gagal menyimpan data campaign members.",
      },
      { status: 200 }
    );
  }
}
