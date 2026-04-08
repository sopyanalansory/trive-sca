import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReq, postJson, basicAuthHeader } from "../helpers/request";

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

import { GET, POST } from "@/app/api/market-updates/route";
import pool from "@/lib/db";

const row = {
  id: 1,
  research_type: "Daily Analysis/Strategy",
  status: "Published",
  title: "Update title",
  summary: null as string | null,
  img_url: null as string | null,
  economic_data_1: null,
  economic_data_2: null,
  economic_data_3: null,
  economic_data_4: null,
  economic_data_5: null,
  meta_text: null,
  created_by: "tester",
  salesforce_id: "SF-001",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

describe("/api/market-updates", () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
  });

  describe("GET", () => {
    it("returns paginated list when DB succeeds", async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ count: "1" }] })
        .mockResolvedValueOnce({ rows: structuredClone([row]) });

      const res = await GET(getReq("/api/market-updates?page=1&limit=10"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.pagination.totalItems).toBe(1);
    });

    it("returns 500 when DB throws", async () => {
      vi.mocked(pool.query).mockRejectedValueOnce(new Error("db down"));

      const res = await GET(getReq("/api/market-updates"));
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe("POST", () => {
    const auth = basicAuthHeader(
      "test_market_api_user",
      "test_market_api_secret"
    );

    it("returns 401 without Basic auth", async () => {
      const res = await POST(
        postJson("/api/market-updates", {
          research_type: "Daily Analysis/Strategy",
          title: "T",
          created_by: "c",
          salesforce_id: "s",
        })
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 when required fields missing", async () => {
      const res = await POST(
        postJson(
          "/api/market-updates",
          { research_type: "Daily Analysis/Strategy", created_by: "c" },
          auth
        )
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("returns 201 when create succeeds", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [
          {
            ...structuredClone(row),
            id: 99,
            title: "New post",
            salesforce_id: "SF-NEW",
          },
        ],
      });

      const res = await POST(
        postJson(
          "/api/market-updates",
          {
            research_type: "Daily Analysis/Strategy",
            title: "New post",
            created_by: "tester",
            salesforce_id: "SF-NEW",
          },
          auth
        )
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("New post");
    });
  });
});
