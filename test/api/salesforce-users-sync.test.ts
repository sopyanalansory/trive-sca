import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-users-webhook-sync", () => ({
  syncUserFromSalesforceWebhook: vi.fn(),
}));

import { POST } from "@/app/api/internal/salesforce-users-sync/route";
import { syncUserFromSalesforceWebhook } from "@/lib/salesforce-users-webhook-sync";

const auth = basicAuthHeader(
  "test_platform_sync_user",
  "test_platform_sync_secret"
);

describe("POST /api/internal/salesforce-users-sync", () => {
  beforeEach(() => {
    process.env.SALESFORCE_PLATFORM_SYNC_USER = "test_platform_sync_user";
    process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD = "test_platform_sync_secret";
    vi.mocked(syncUserFromSalesforceWebhook).mockReset();
  });

  it("returns Unauthorized without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-users-sync", {
        contactOrLeadId: "003ABC",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns INVALID_JSON when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/internal/salesforce-users-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth,
      },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INVALID_JSON");
  });

  it("returns VALIDATION when body is not an object", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-users-sync", ["bad-body"], auth)
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
  });

  it("returns USER_NOT_FOUND when sync reports missing user", async () => {
    vi.mocked(syncUserFromSalesforceWebhook).mockResolvedValueOnce({
      ok: false,
      error: "USER_NOT_FOUND",
      message: "User tidak ditemukan",
    });

    const res = await POST(
      postJson(
        "/api/internal/salesforce-users-sync",
        { contactOrLeadId: "003NOTFOUND" },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("USER_NOT_FOUND");
  });

  it("returns success when sync is updated", async () => {
    vi.mocked(syncUserFromSalesforceWebhook).mockResolvedValueOnce({
      ok: true,
      action: "updated",
      userId: 17,
    });

    const payload = {
      contactOrLeadId: "003Oj00000XXXXXX",
      Email: "test@mail.com",
      firstName: "John",
      lastName: "Doe",
    };
    const res = await POST(
      postJson("/api/internal/salesforce-users-sync", payload, auth)
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.action).toBe("updated");
    expect(json.userId).toBe(17);
    expect(syncUserFromSalesforceWebhook).toHaveBeenCalledWith(payload);
  });

  it("returns INTERNAL_ERROR when sync throws", async () => {
    vi.mocked(syncUserFromSalesforceWebhook).mockRejectedValueOnce(
      new Error("unexpected")
    );

    const res = await POST(
      postJson(
        "/api/internal/salesforce-users-sync",
        { contactOrLeadId: "003Oj00000XXXXXX" },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
