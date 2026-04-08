import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReq } from "../helpers/request";

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    verifyToken: vi.fn(),
  };
});

vi.mock("@/lib/salesforce-platforms", () => ({
  fetchAndPersistPlatformsForUser: vi.fn(),
}));

import { GET } from "@/app/api/accounts/route";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { fetchAndPersistPlatformsForUser } from "@/lib/salesforce-platforms";

describe("GET /api/accounts", () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    vi.mocked(verifyToken).mockReset();
    vi.mocked(fetchAndPersistPlatformsForUser).mockReset();
  });

  it("returns 401 when token is missing", async () => {
    const res = await GET(getReq("/api/accounts"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce(null);

    const res = await GET(
      getReq("/api/accounts", { authorization: "Bearer invalid-token" })
    );

    expect(res.status).toBe(401);
  });

  it("returns accounts from db when platforms exist", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce({
      userId: 10,
      email: "u@test.com",
      accountId: "001A",
      leadId: null,
    });
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          type: "Live",
          account_type: "Standard",
          client_group_name: "MT5",
          login_number: "123456",
          server_name: "MT5-Live-1",
          status: "Enabled",
          currency: "USD",
          leverage: "1:100",
        },
      ],
    } as never);

    const res = await GET(
      getReq("/api/accounts", { authorization: "Bearer valid-token" })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accounts).toHaveLength(1);
    expect(json.accounts[0].login).toBe("123456");
    expect(fetchAndPersistPlatformsForUser).not.toHaveBeenCalled();
  });

  it("syncs from Salesforce when db is empty and token has accountId", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce({
      userId: 7,
      email: "sync@test.com",
      accountId: "001Oj00000Ctc7QIAR",
      leadId: null,
    });
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            type: "Live",
            account_type: "Pro",
            client_group_name: "MT4",
            login_number: "778899",
            server_name: "MT4-Live",
            status: "Enabled",
            currency: "USD",
            leverage: "1:200",
          },
        ],
      } as never);

    const res = await GET(
      getReq("/api/accounts", { authorization: "Bearer valid-token" })
    );

    expect(res.status).toBe(200);
    expect(fetchAndPersistPlatformsForUser).toHaveBeenCalledWith(
      7,
      "001Oj00000Ctc7QIAR",
      "001Oj00000Ctc7QIAR"
    );
    const json = await res.json();
    expect(json.accounts).toHaveLength(1);
  });

  it("returns empty list when db is empty and token lacks accountId/leadId", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce({
      userId: 8,
      email: "empty@test.com",
      accountId: null,
      leadId: null,
    });
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as never);

    const res = await GET(
      getReq("/api/accounts", { authorization: "Bearer valid-token" })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accounts).toEqual([]);
    expect(fetchAndPersistPlatformsForUser).not.toHaveBeenCalled();
  });

  it("returns 502 when Salesforce sync fails", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce({
      userId: 9,
      email: "fail@test.com",
      accountId: null,
      leadId: "00Qj00000012345",
    });
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as never);
    vi.mocked(fetchAndPersistPlatformsForUser).mockRejectedValueOnce(
      new Error("Salesforce down")
    );

    const res = await GET(
      getReq("/api/accounts", { authorization: "Bearer valid-token" })
    );

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/salesforce/i);
  });
});
