import { beforeEach, describe, expect, it, vi } from "vitest";
import { postJson } from "../helpers/request";

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

vi.mock("@/lib/metamanager", () => ({
  addMetaUser: vi.fn(),
  applyMetaTradeBalance: vi.fn(),
  MetaManagerError: class extends Error {
    statusCode: number;
    detail?: unknown;
    constructor(message: string, statusCode = 500, detail?: unknown) {
      super(message);
      this.name = "MetaManagerError";
      this.statusCode = statusCode;
      this.detail = detail;
    }
  },
}));

vi.mock("@/lib/salesforce-oauth", () => ({
  getLatestValidSalesforceToken: vi.fn(),
  requestSalesforceAccessToken: vi.fn(),
  saveSalesforceAccessToken: vi.fn(),
}));

import { POST } from "@/app/api/accounts/create-demo/route";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { addMetaUser, applyMetaTradeBalance } from "@/lib/metamanager";
import { getLatestValidSalesforceToken } from "@/lib/salesforce-oauth";

describe("POST /api/accounts/create-demo", () => {
  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    vi.mocked(verifyToken).mockReset();
    vi.mocked(addMetaUser).mockReset();
    vi.mocked(applyMetaTradeBalance).mockReset();
    vi.mocked(getLatestValidSalesforceToken).mockReset();
    vi.unstubAllGlobals();
  });

  it("creates demo on Meta, sets initial balance, saves DB and syncs Salesforce", async () => {
    vi.mocked(verifyToken).mockReturnValueOnce({
      userId: 77,
      email: "demo@test.com",
      accountId: "001A",
      leadId: null,
    });

    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            account_id: "001A",
            fullname: "Demo User",
            email: "demo@test.com",
            client_id: "001Oj00000Ctc7QIAR",
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [{ id: 999 }],
      } as never)
      .mockResolvedValueOnce({
        rows: [],
      } as never);

    vi.mocked(addMetaUser).mockResolvedValueOnce({
      Login: "764636",
    } as never);
    vi.mocked(applyMetaTradeBalance).mockResolvedValueOnce({
      Ticket: "136623",
    } as never);
    vi.mocked(getLatestValidSalesforceToken).mockResolvedValueOnce(
      "sf-token-123"
    );

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            isSuccess: true,
            outputValues: {
              platform: { Id: "a0b2v00000NmlNHAAX" },
            },
          },
        ]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const req = postJson(
      "/api/accounts/create-demo",
      {
        group: String.raw`real\demo`,
        name: "Demo User",
        leverage: "100",
        passMain: "Abcd1234!",
        passInvestor: "Xyz12345!",
        balance: 1000,
        clientGroupName: String.raw`real\demo`,
      },
      { authorization: "Bearer valid-token" }
    );

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.loginNumber).toBe("764636");
    expect(json.platformRegistrationId).toBe("a0b2v00000NmlNHAAX");

    expect(addMetaUser).toHaveBeenCalledTimes(1);
    expect(applyMetaTradeBalance).toHaveBeenCalledWith({
      login: "764636",
      type: 2,
      balance: 1000,
      comment: "Initial Margin",
    });

    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

