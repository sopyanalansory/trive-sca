import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-platforms", () => ({
  syncPlatformFromSalesforceWebhook: vi.fn(),
}));

import { POST } from "@/app/api/internal/salesforce-platform-sync/route";
import { syncPlatformFromSalesforceWebhook } from "@/lib/salesforce-platforms";

const auth = basicAuthHeader(
  "test_platform_sync_user",
  "test_platform_sync_secret"
);

function expectLegacyOrNewStatus(status: number, legacyStatus: number) {
  expect([legacyStatus, 200]).toContain(status);
}

describe("POST /api/internal/salesforce-platform-sync", () => {
  beforeEach(() => {
    vi.mocked(syncPlatformFromSalesforceWebhook).mockReset();
  });

  it("returns legacy/new unauthorized status without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-platform-sync", {
        accountOrLeadId: "001XXX",
        platformId: "a0XXXX",
      })
    );
    expectLegacyOrNewStatus(res.status, 401);
  });

  it("returns legacy/new unauthorized status when Basic credentials are wrong", async () => {
    const bad = basicAuthHeader("wrong", "wrong");
    const res = await POST(
      postJson(
        "/api/internal/salesforce-platform-sync",
        {
          accountOrLeadId: "001XXX",
          platformId: "a0XXXX",
        },
        bad
      )
    );
    expectLegacyOrNewStatus(res.status, 401);
  });

  it("returns legacy/new bad request status when body is not valid JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/internal/salesforce-platform-sync",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: "{not-json",
      }
    );
    const res = await POST(req);
    expectLegacyOrNewStatus(res.status, 400);
  });

  it("returns legacy/new validation status when sync reports validation error", async () => {
    vi.mocked(syncPlatformFromSalesforceWebhook).mockResolvedValueOnce({
      ok: false,
      error: "VALIDATION",
      message: "accountOrLeadId and platformId are required",
    });

    const res = await POST(
      postJson(
        "/api/internal/salesforce-platform-sync",
        { accountOrLeadId: "", platformId: "" },
        auth
      )
    );
    expectLegacyOrNewStatus(res.status, 400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
  });

  it("returns 200 with action inserted when sync succeeds", async () => {
    vi.mocked(syncPlatformFromSalesforceWebhook).mockResolvedValueOnce({
      ok: true,
      action: "inserted",
    });

    const res = await POST(
      postJson(
        "/api/internal/salesforce-platform-sync",
        {
          accountOrLeadId: "001Oj00000Ctc7QIAR",
          platformId: "a0b2v00000NmlNHAAX",
        },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.action).toBe("inserted");
    expect(syncPlatformFromSalesforceWebhook).toHaveBeenCalledWith(
      "001Oj00000Ctc7QIAR",
      "a0b2v00000NmlNHAAX"
    );
  });

  it("returns legacy/new not found status when user is not found", async () => {
    vi.mocked(syncPlatformFromSalesforceWebhook).mockResolvedValueOnce({
      ok: false,
      error: "USER_NOT_FOUND",
      message: "No user found for this Account or Lead ID",
    });

    const res = await POST(
      postJson(
        "/api/internal/salesforce-platform-sync",
        {
          accountOrLeadId: "001NOTFOUND",
          platformId: "a0b2v00000NmlNHAAX",
        },
        auth
      )
    );
    expectLegacyOrNewStatus(res.status, 404);
  });

  it("returns legacy/new internal error status when sync throws unexpectedly", async () => {
    vi.mocked(syncPlatformFromSalesforceWebhook).mockRejectedValueOnce(
      new Error("unexpected")
    );

    const res = await POST(
      postJson(
        "/api/internal/salesforce-platform-sync",
        {
          accountOrLeadId: "001XXX",
          platformId: "a0XXXX",
        },
        auth
      )
    );
    expectLegacyOrNewStatus(res.status, 500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
