import { describe, it, expect, vi, beforeEach } from "vitest";
import { postJson } from "../helpers/request";

vi.mock("@/lib/rate-limit", () => ({
  enforceOtpSendByMsisdn: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

import { POST } from "@/app/api/auth/send-verification-code/route";
import pool from "@/lib/db";

describe("POST /api/auth/send-verification-code", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 400 when phone is missing", async () => {
    const res = await POST(
      postJson("/api/auth/send-verification-code", { countryCode: "+62" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when countryCode is missing", async () => {
    const res = await POST(
      postJson("/api/auth/send-verification-code", { phone: "8123456789" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when local phone length is invalid", async () => {
    const res = await POST(
      postJson("/api/auth/send-verification-code", {
        phone: "81234",
        countryCode: "+62",
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/tidak valid/i);
  });

  it("returns 200 and forwards to Verihubs when send succeeds", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OTP sent successfully",
          otp: "12345",
          msisdn: "6281234567890",
          session_id: "sess-1",
          try_count: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await POST(
      postJson("/api/auth/send-verification-code", {
        phone: "81234567890",
        countryCode: "+62",
      })
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/whatsapp/otp/send");
    expect(pool.query).toHaveBeenCalled();
  });

  it("returns 500 when Verihubs responds with error", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "rate limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await POST(
      postJson("/api/auth/send-verification-code", {
        phone: "81234567890",
        countryCode: "+62",
      })
    );
    expect(res.status).toBe(500);
  });
});
