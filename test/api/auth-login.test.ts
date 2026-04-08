import { describe, it, expect, vi, beforeEach } from "vitest";
import { postJson } from "../helpers/request";

vi.mock("@/lib/salesforce-oauth", () => ({
  getLatestValidSalesforceToken: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    verifyPassword: vi.fn(),
    generateToken: vi.fn(() => "mock.jwt.token"),
  };
});

import { POST } from "@/app/api/auth/login/route";
import pool from "@/lib/db";
import { verifyPassword, generateToken } from "@/lib/auth";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    vi.mocked(verifyPassword).mockReset();
    vi.mocked(generateToken).mockReturnValue("mock.jwt.token");
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(postJson("/api/auth/login", { password: "x" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/wajib/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(
      postJson("/api/auth/login", { email: "u@test.com" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 user_not_found when user does not exist", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      postJson("/api/auth/login", {
        email: "missing@test.com",
        password: "Secret1a",
      })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.errorType).toBe("user_not_found");
  });

  it("returns 401 wrong_password when password invalid", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          fullname: "A",
          email: "a@test.com",
          phone: "8123456789",
          country_code: "+62",
          password_hash: "hashed",
        },
      ],
    });
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const res = await POST(
      postJson("/api/auth/login", {
        email: "a@test.com",
        password: "WrongPass1",
      })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.errorType).toBe("wrong_password");
  });

  it("returns 200 and token when credentials are valid", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 42,
          fullname: "Tester",
          email: "ok@test.com",
          phone: "8123456789",
          country_code: "+62",
          password_hash: "hashed",
        },
      ],
    });
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const res = await POST(
      postJson("/api/auth/login", {
        email: "ok@test.com",
        password: "ValidPass1",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBe("mock.jwt.token");
    expect(json.user.email).toBe("ok@test.com");
    expect(json.user.id).toBe(42);
    expect(generateToken).toHaveBeenCalledWith(42, "ok@test.com", null, null);
  });
});
