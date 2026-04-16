import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-campaign-members-webhook-sync", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/salesforce-campaign-members-webhook-sync")>(
      "@/lib/salesforce-campaign-members-webhook-sync"
    );
  return {
    ...actual,
    upsertCampaignMembersFromSfRecords: vi.fn(),
  };
});

import { POST } from "@/app/api/internal/salesforce-campaign-members-sync/route";
import { upsertCampaignMembersFromSfRecords } from "@/lib/salesforce-campaign-members-webhook-sync";

const auth = basicAuthHeader(
  "test_platform_sync_user",
  "test_platform_sync_secret"
);

describe("POST /api/internal/salesforce-campaign-members-sync", () => {
  beforeEach(() => {
    process.env.SALESFORCE_PLATFORM_SYNC_USER = "test_platform_sync_user";
    process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD = "test_platform_sync_secret";
    vi.mocked(upsertCampaignMembersFromSfRecords).mockReset();
  });

  afterEach(() => {
    delete process.env.SALESFORCE_PLATFORM_SYNC_USER;
    delete process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD;
  });

  it("returns 200 with Unauthorized without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-campaign-members-sync", {
        campaignMembers: [{ Id: "00vXXX" }],
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
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [{ Id: "00vXXX" }] },
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
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [{ Id: "00vXXX" }] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 for invalid JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/internal/salesforce-campaign-members-sync",
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

  it("returns 200 with validation when no records in payload", async () => {
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
  });

  it("updates from campaignMembers array and returns counts", async () => {
    vi.mocked(upsertCampaignMembersFromSfRecords).mockResolvedValueOnce({
      userFound: true,
      fetched: 1,
      updated: 1,
      inserted: 0,
      skipped: 0,
      notInDatabase: 0,
    });

    const member = {
      Id: "00vOj00000t5fm1IAA",
      CampaignId: "701Oj00000ABCDeIAL",
      Status: "1",
      Selected_Rewards__c: "Akun Bebas Swap",
    };

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [member], contactOrLeadId: "003Oj00000XXXXXX" },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.updated).toBe(1);
    expect(json.notInDatabase).toBe(0);
    expect(json.inserted).toBe(0);
    expect(upsertCampaignMembersFromSfRecords).toHaveBeenCalledWith(
      [member],
      "003Oj00000XXXXXX"
    );
  });

  it("accepts root-level array payload", async () => {
    vi.mocked(upsertCampaignMembersFromSfRecords).mockResolvedValueOnce({
      userFound: true,
      fetched: 1,
      updated: 1,
      inserted: 0,
      skipped: 0,
      notInDatabase: 0,
    });

    const member = { Id: "00vOj00000t5fm1IAA", CampaignId: "701Oj00000ABCDeIAL" };
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [member], contactOrLeadId: "003Oj00000YYYYYY" },
        auth
      )
    );
    expect(res.status).toBe(200);
    expect(upsertCampaignMembersFromSfRecords).toHaveBeenCalledWith(
      [member],
      "003Oj00000YYYYYY"
    );
  });

  it("returns validation when contactOrLeadId is missing", async () => {
    const member = { Id: "00vOj00000t5fm1IAA", CampaignId: "701Oj00000ABCDeIAL" };
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [member] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
    expect(upsertCampaignMembersFromSfRecords).not.toHaveBeenCalled();
  });

  it("returns USER_NOT_FOUND when user lookup fails", async () => {
    vi.mocked(upsertCampaignMembersFromSfRecords).mockResolvedValueOnce({
      userFound: false,
      fetched: 1,
      updated: 0,
      inserted: 0,
      skipped: 1,
      notInDatabase: 0,
    });

    const member = { Id: "00vOj00000t5fm1IAA", CampaignId: "701Oj00000ABCDeIAL" };
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        { campaignMembers: [member], contactOrLeadId: "003Oj00000ZZZZZZ" },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("USER_NOT_FOUND");
  });

  it("returns 200 when update throws", async () => {
    vi.mocked(upsertCampaignMembersFromSfRecords).mockRejectedValueOnce(
      new Error("db error")
    );

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-sync",
        {
          campaignMembers: [{ Id: "00vXXX" }],
          contactOrLeadId: "003Oj00000XXXXXX",
        },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
