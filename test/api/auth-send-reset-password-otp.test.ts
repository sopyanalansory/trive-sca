import { describe, it, expect, vi, beforeEach } from "vitest";
import { postJson } from "../helpers/request";

vi.mock("@/lib/rate-limit", () => ({
  enforceOtpSendByEmail: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

import { POST } from "@/app/api/auth/send-reset-password-otp/route";
import pool from "@/lib/db";

describe("POST /api/auth/send-reset-password-otp", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(postJson("/api/auth/send-reset-password-otp", {}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await POST(
      postJson("/api/auth/send-reset-password-otp", { email: "not-an-email" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 generic message when email is not registered (no leak)", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      postJson("/api/auth/send-reset-password-otp", {
        email: "nobody@test.com",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/Jika email terdaftar/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when user phone from DB fails length validation", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: "u@test.com",
          phone: "12",
          country_code: "+62",
        },
      ],
    });

    const res = await POST(
      postJson("/api/auth/send-reset-password-otp", { email: "u@test.com" })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 and calls Verihubs when user exists and phone valid", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "u@test.com",
            phone: "81234567890",
            country_code: "+62",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "ok",
          otp: "9999",
          msisdn: "6281234567890",
          session_id: "s",
          try_count: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await POST(
      postJson("/api/auth/send-reset-password-otp", { email: "u@test.com" })
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });
});
