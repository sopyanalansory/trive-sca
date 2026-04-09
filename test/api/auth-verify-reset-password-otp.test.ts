import { describe, it, expect, vi, beforeEach } from "vitest";
import { postJson } from "../helpers/request";

vi.mock("@/lib/rate-limit", () => ({
  enforceOtpVerifyByEmail: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

import { POST } from "@/app/api/auth/verify-reset-password-otp/route";
import pool from "@/lib/db";

describe("POST /api/auth/verify-reset-password-otp", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 400 when fields missing", async () => {
    const res = await POST(
      postJson("/api/auth/verify-reset-password-otp", { email: "a@b.com" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when email not registered", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      postJson("/api/auth/verify-reset-password-otp", {
        email: "u@test.com",
        otp: "1234",
      })
    );
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when Verihubs verify fails", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: "user@test.com",
          phone: "81234567890",
          country_code: "+62",
        },
      ],
    });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "invalid" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await POST(
      postJson("/api/auth/verify-reset-password-otp", {
        email: "user@test.com",
        otp: "1234",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with resetToken when Verihubs verify succeeds", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "user@test.com",
            phone: "81234567890",
            country_code: "+62",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "verified successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await POST(
      postJson("/api/auth/verify-reset-password-otp", {
        email: "user@test.com",
        otp: "1234",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.resetToken).toBeTruthy();
    expect(typeof json.resetToken).toBe("string");
  });
});
