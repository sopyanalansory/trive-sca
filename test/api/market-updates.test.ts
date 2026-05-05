import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getReq,
  postJson,
  putJson,
  deleteReq,
  basicAuthHeader,
} from "../helpers/request";

const {
  mockScheduleMarketUpdateFramerSync,
  mockScheduleMarketUpdateRemovedFromFramer,
} = vi.hoisted(() => ({
  mockScheduleMarketUpdateFramerSync: vi.fn(),
  mockScheduleMarketUpdateRemovedFromFramer: vi.fn(),
}));

vi.mock("@/lib/framer-market-update-push", () => ({
  scheduleMarketUpdateFramerSync: mockScheduleMarketUpdateFramerSync,
  scheduleMarketUpdateRemovedFromFramer: mockScheduleMarketUpdateRemovedFromFramer,
}));

vi.mock("@/lib/db", () => {
  const query = vi.fn();
  return {
    default: {
      query,
      connect: vi.fn().mockResolvedValue({
        query,
        release: vi.fn(),
      }),
    },
  };
});

import { DELETE, PUT } from "@/app/api/market-updates/[id]/route";
import { GET, POST } from "@/app/api/market-updates/route";
import pool from "@/lib/db";

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

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
  full_content: null,
  created_by: "tester",
  salesforce_id: "SF-001",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

describe("/api/market-updates", () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    mockScheduleMarketUpdateFramerSync.mockClear();
    mockScheduleMarketUpdateRemovedFromFramer.mockClear();
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
      expect(mockScheduleMarketUpdateFramerSync).not.toHaveBeenCalled();
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
      const created = {
        ...structuredClone(row),
        id: 99,
        title: "New post",
        salesforce_id: "SF-NEW",
      };
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [] } as never) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE: no row → insert
        .mockResolvedValueOnce({ rows: [created] }) // INSERT
        .mockResolvedValueOnce({ rows: [] } as never); // COMMIT

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
      expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledTimes(1);
      expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 99,
          title: "New post",
          salesforce_id: "SF-NEW",
        })
      );
    });

    it("returns 200 when upsert updates existing salesforce_id and schedules Framer sync", async () => {
      const updated = {
        ...structuredClone(row),
        id: 7,
        title: "Updated via SF",
        salesforce_id: "SF-EXIST",
      };
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 7 }] })
        .mockResolvedValueOnce({ rows: [updated] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await POST(
        postJson(
          "/api/market-updates",
          {
            research_type: "Daily Analysis/Strategy",
            title: "Updated via SF",
            created_by: "tester",
            salesforce_id: "SF-EXIST",
          },
          auth
        )
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Updated via SF");
      expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledTimes(1);
      expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, salesforce_id: "SF-EXIST" })
      );
    });
  });

  describe("/api/market-updates/[id]", () => {
    const auth = basicAuthHeader(
      "test_market_api_user",
      "test_market_api_secret"
    );

    describe("PUT", () => {
      it("schedules Framer sync after successful update", async () => {
        const updated = { ...structuredClone(row), title: "Put title" };
        vi.mocked(pool.query)
          .mockResolvedValueOnce({ rows: [{ id: 1 }] })
          .mockResolvedValueOnce({ rows: [updated] });

        const res = await PUT(
          putJson(
            "/api/market-updates/1",
            {
              salesforce_id: "SF-001",
              title: "Put title",
            },
            auth
          ),
          routeParams("1")
        );
        expect(res.status).toBe(200);
        expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledTimes(1);
        expect(mockScheduleMarketUpdateFramerSync).toHaveBeenCalledWith(
          expect.objectContaining({ id: 1, title: "Put title" })
        );
      });
    });

    describe("DELETE", () => {
      it("schedules Framer removal after successful delete", async () => {
        vi.mocked(pool.query)
          .mockResolvedValueOnce({
            rows: [{ id: 42, title: "Gone" }],
          })
          .mockResolvedValueOnce({ rows: [] });

        const res = await DELETE(
          deleteReq("/api/market-updates/42", auth),
          routeParams("42")
        );
        expect(res.status).toBe(200);
        expect(mockScheduleMarketUpdateRemovedFromFramer).toHaveBeenCalledTimes(
          1
        );
        expect(mockScheduleMarketUpdateRemovedFromFramer).toHaveBeenCalledWith(
          42
        );
      });
    });
  });
});
