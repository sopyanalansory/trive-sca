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

import { POST } from "@/app/api/auth/reset-password/route";
import pool from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/auth";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "user@test.com",
    otp: "1234",
    newPassword: "Aa1bbbbbb",
    ...overrides,
  };
}

describe("POST /api/auth/reset-password", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 400 when fields are missing", async () => {
    const res = await POST(
      postJson("/api/auth/reset-password", { email: "a@b.com" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when email format invalid", async () => {
    const res = await POST(
      postJson("/api/auth/reset-password", validBody({ email: "bad" }))
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when password rules fail", async () => {
    const res = await POST(
      postJson(
        "/api/auth/reset-password",
        validBody({ newPassword: "alllower1" })
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when email not registered", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      postJson("/api/auth/reset-password", validBody())
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
        JSON.stringify({ message: "invalid otp" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await POST(
      postJson("/api/auth/reset-password", validBody())
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 when Verihubs verify succeeds and DB updates", async () => {
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
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "verified successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res = await POST(
      postJson("/api/auth/reset-password", validBody())
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/berhasil direset/i);
    expect(pool.query).toHaveBeenCalled();
  });

  it("returns 200 when resetToken is valid (no Verihubs call)", async () => {
    const token = generatePasswordResetToken("user@test.com");
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [{ id: 1, email: "user@test.com" }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await POST(
      postJson("/api/auth/reset-password", {
        email: "user@test.com",
        newPassword: "Aa1bbbbbb",
        resetToken: token,
      })
    );
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.message).toMatch(/berhasil direset/i);
  });

  it("returns 401 when resetToken invalid", async () => {
    vi.mocked(pool.query).mockReset();

    const res = await POST(
      postJson("/api/auth/reset-password", {
        newPassword: "Aa1bbbbbb",
        resetToken: "not-a-real-jwt",
      })
    );
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
