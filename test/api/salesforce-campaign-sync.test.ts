import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-campaigns-sync", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salesforce-campaigns-sync")>(
    "@/lib/salesforce-campaigns-sync"
  );
  return {
    ...actual,
    updateExistingCampaignsFromSfRecords: vi.fn(),
  };
});

import { POST } from "@/app/api/internal/salesforce-campaign-sync/route";
import { updateExistingCampaignsFromSfRecords } from "@/lib/salesforce-campaigns-sync";

const auth = basicAuthHeader(
  "test_platform_sync_user",
  "test_platform_sync_secret"
);

describe("POST /api/internal/salesforce-campaign-sync", () => {
  beforeEach(() => {
    process.env.SALESFORCE_PLATFORM_SYNC_USER = "test_platform_sync_user";
    process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD = "test_platform_sync_secret";
    vi.mocked(updateExistingCampaignsFromSfRecords).mockReset();
  });

  afterEach(() => {
    delete process.env.SALESFORCE_PLATFORM_SYNC_USER;
    delete process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD;
  });

  it("returns 200 with Unauthorized without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-campaign-sync", {
        campaigns: [{ Id: "701XXX", Name: "Test" }],
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 with Unauthorized when Basic credentials are wrong", async () => {
    const bad = basicAuthHeader("wrong", "wrong");
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        { campaigns: [{ Id: "701XXX", Name: "Test" }] },
        bad
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 with Unauthorized when SALESFORCE_PLATFORM_SYNC_* env is not set", async () => {
    delete process.env.SALESFORCE_PLATFORM_SYNC_USER;
    delete process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD;
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        { campaigns: [{ Id: "701XXX", Name: "Test" }] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/internal/salesforce-campaign-sync",
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
    expect(res.status).toBe(200);
    const invalidJson = await res.json();
    expect(invalidJson.success).toBe(false);
    expect(invalidJson.error).toBe("INVALID_JSON");
  });

  it("returns 200 with validation when no campaign records in payload", async () => {
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        { campaigns: [] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
  });

  it("updates from campaigns array and returns counts", async () => {
    vi.mocked(updateExistingCampaignsFromSfRecords).mockResolvedValueOnce({
      fetched: 1,
      updated: 1,
      skipped: 0,
      notInDatabase: 0,
    });

    const campaign = {
      Id: "701Oj00000U8NO3IAN",
      Name: "Promo Q1",
      Campaign_Banner__c: "https://example.com/banner.png",
      IsActive: true,
      Status: "In Progress",
    };

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        { campaigns: [campaign] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.updated).toBe(1);
    expect(json.notInDatabase).toBe(0);
    expect(updateExistingCampaignsFromSfRecords).toHaveBeenCalledWith([campaign]);
  });

  it("accepts root-level array payload", async () => {
    vi.mocked(updateExistingCampaignsFromSfRecords).mockResolvedValueOnce({
      fetched: 1,
      updated: 1,
      skipped: 0,
      notInDatabase: 0,
    });

    const campaign = { Id: "701Oj00000U8NO3IAN", Name: "Single" };
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        [campaign],
        auth
      )
    );
    expect(res.status).toBe(200);
    expect(updateExistingCampaignsFromSfRecords).toHaveBeenCalledWith([campaign]);
  });

  it("returns 200 when update throws", async () => {
    vi.mocked(updateExistingCampaignsFromSfRecords).mockRejectedValueOnce(
      new Error("db error")
    );

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-sync",
        { campaigns: [{ Id: "701XXX", Name: "Test" }] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
