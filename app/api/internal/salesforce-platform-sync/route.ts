import { NextRequest, NextResponse } from "next/server";
import { apiLogger, logRouteError } from "@/lib/logger";
import { syncPlatformFromSalesforceWebhook } from "@/lib/salesforce-platforms";

const log = apiLogger("internal:salesforce-platform-sync");

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

function statusForError(error: string): number {
  switch (error) {
    case "VALIDATION":
      return 400;
    case "USER_NOT_FOUND":
      return 404;
    case "PLATFORM_NOT_IN_RESPONSE":
      return 404;
    case "ROW_INCOMPLETE":
      return 422;
    case "SALESFORCE_ERROR":
      return 502;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Body must be a JSON object" },
        { status: 400 }
      );
    }

    const accountOrLeadId = (body as { accountOrLeadId?: unknown })
      .accountOrLeadId;
    const platformId = (body as { platformId?: unknown }).platformId;

    function toIdString(value: unknown): string {
      if (typeof value === "string") return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
      return "";
    }

    const accountStr = toIdString(accountOrLeadId);
    const platformStr = toIdString(platformId);

    const result = await syncPlatformFromSalesforceWebhook(
      accountStr,
      platformStr
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: statusForError(result.error) }
      );
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      message:
        result.action === "inserted"
          ? "Platform saved successfully"
          : "Platform updated successfully",
    });
  } catch (error: unknown) {
    logRouteError(
      log,
      request,
      error,
      "Salesforce platform sync webhook failed"
    );
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An error occurred while syncing the platform",
      },
      { status: 500 }
    );
  }
}
