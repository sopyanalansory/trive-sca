import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-campaign-members-webhook-delete", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/salesforce-campaign-members-webhook-delete")>(
      "@/lib/salesforce-campaign-members-webhook-delete"
    );
  return {
    ...actual,
    deleteCampaignMembersBySfIds: vi.fn(),
  };
});

import { POST } from "@/app/api/internal/salesforce-campaign-members-delete/route";
import { deleteCampaignMembersBySfIds } from "@/lib/salesforce-campaign-members-webhook-delete";

const auth = basicAuthHeader(
  "test_platform_sync_user",
  "test_platform_sync_secret"
);

describe("POST /api/internal/salesforce-campaign-members-delete", () => {
  beforeEach(() => {
    process.env.SALESFORCE_PLATFORM_SYNC_USER = "test_platform_sync_user";
    process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD = "test_platform_sync_secret";
    vi.mocked(deleteCampaignMembersBySfIds).mockReset();
  });

  afterEach(() => {
    delete process.env.SALESFORCE_PLATFORM_SYNC_USER;
    delete process.env.SALESFORCE_PLATFORM_SYNC_PASSWORD;
  });

  it("returns 200 with Unauthorized without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/salesforce-campaign-members-delete", {
        ids: ["00vXXX"],
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
        "/api/internal/salesforce-campaign-members-delete",
        { ids: ["00vXXX"] },
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
        "/api/internal/salesforce-campaign-members-delete",
        { ids: ["00vXXX"] },
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
      "http://localhost/api/internal/salesforce-campaign-members-delete",
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

  it("returns 200 with validation when no ids in payload", async () => {
    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-delete",
        { ids: [] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("VALIDATION");
  });

  it("deletes from ids array and returns counts", async () => {
    vi.mocked(deleteCampaignMembersBySfIds).mockResolvedValueOnce({
      fetched: 2,
      deleted: 2,
      skipped: 0,
      notInDatabase: 0,
    });

    const ids = ["00vOj00000t5fm1IAA", "00vOj00000t5fm2IAA"];

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-delete",
        { ids },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.deleted).toBe(2);
    expect(json.notInDatabase).toBe(0);
    expect(deleteCampaignMembersBySfIds).toHaveBeenCalledWith(ids);
  });

  it("accepts payload with campaignMembers objects", async () => {
    vi.mocked(deleteCampaignMembersBySfIds).mockResolvedValueOnce({
      fetched: 1,
      deleted: 1,
      skipped: 0,
      notInDatabase: 0,
    });

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-delete",
        { campaignMembers: [{ Id: "00vOj00000t5fm1IAA" }] },
        auth
      )
    );
    expect(res.status).toBe(200);
    expect(deleteCampaignMembersBySfIds).toHaveBeenCalledWith([
      "00vOj00000t5fm1IAA",
    ]);
  });

  it("returns 200 when delete throws", async () => {
    vi.mocked(deleteCampaignMembersBySfIds).mockRejectedValueOnce(
      new Error("db error")
    );

    const res = await POST(
      postJson(
        "/api/internal/salesforce-campaign-members-delete",
        { ids: ["00vXXX"] },
        auth
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
