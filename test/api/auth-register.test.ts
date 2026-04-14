import { beforeEach, describe, expect, it, vi } from "vitest";
import { postJson } from "../helpers/request";

vi.mock("@/lib/rate-limit", () => ({
  enforceOtpVerifyByMsisdn: vi.fn().mockResolvedValue(null),
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
    hashPassword: vi.fn().mockResolvedValue("hashed-password"),
    generateToken: vi.fn(() => "mock.jwt.token"),
  };
});

vi.mock("@/lib/salesforce-oauth", () => ({
  getLatestValidSalesforceToken: vi.fn(),
  requestSalesforceAccessToken: vi.fn(),
  saveSalesforceAccessToken: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";
import pool from "@/lib/db";
import { generateToken } from "@/lib/auth";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

describe("POST /api/auth/register", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(pool.query).mockReset();
    vi.mocked(generateToken).mockReturnValue("mock.jwt.token");
    vi.mocked(getLatestValidSalesforceToken).mockReset();
    vi.mocked(requestSalesforceAccessToken).mockReset();
    vi.mocked(saveSalesforceAccessToken).mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("registers user when Verihubs and Salesforce succeed", async () => {
    vi.mocked(getLatestValidSalesforceToken).mockResolvedValueOnce("sf-token");
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as never) // email check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as never) // mark otp used
      .mockResolvedValueOnce({
        rows: [
          { column_name: "client_id" },
          { column_name: "lead_id" },
          { column_name: "salesforce_interview_guid" },
          { column_name: "salesforce_interview_status" },
        ],
      } as never) // information_schema check
      .mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            fullname: "test azp 7",
            email: "azp007@yyytrive.co",
            phone: "8485848484807",
            country_code: "+62",
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      } as never); // insert user

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "verified successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ) // Verihubs
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              isSuccess: true,
              outputValues: {
                clientId: "eb8c9c03-ce1a-478d-a68f-50d381bf057g",
                leadId: "00QOj00000cPVfVMAW",
                Flow__InterviewGuid: "guid-1",
                Flow__InterviewStatus: "Finished",
              },
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      ); // Salesforce Register Lead

    const res = await POST(
      postJson("/api/auth/register", {
        name: "test azp 7",
        email: "azp007@yyytrive.co",
        phone: "8485848484807",
        countryCode: "+62",
        password: "Password123!",
        verificationCode: "123456",
        referralCode: "",
        marketingConsent: true,
        termsConsent: true,
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.token).toBe("mock.jwt.token");
    expect(json.user.email).toBe("azp007@yyytrive.co");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 and does not insert user when Salesforce rejects", async () => {
    vi.mocked(getLatestValidSalesforceToken).mockResolvedValueOnce("sf-token");
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as never) // email check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as never); // mark otp used

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "verified successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ) // Verihubs
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ isSuccess: false, errors: ["bad"] }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ); // Salesforce rejected

    const res = await POST(
      postJson("/api/auth/register", {
        name: "test azp 7",
        email: "azp007@yyytrive.co",
        phone: "8485848484807",
        countryCode: "+62",
        password: "Password123!",
        verificationCode: "123456",
        referralCode: "",
        marketingConsent: true,
        termsConsent: true,
      })
    );

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/Salesforce/i);

    const sqlCalls = vi.mocked(pool.query).mock.calls.map((call) => String(call[0]));
    const hasInsertUser = sqlCalls.some((sql) =>
      sql.toLowerCase().includes("insert into users")
    );
    expect(hasInsertUser).toBe(false);
  });

  it("returns 502 when Salesforce response is invalid JSON", async () => {
    vi.mocked(getLatestValidSalesforceToken).mockResolvedValueOnce("sf-token");
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as never) // email check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as never); // mark otp used

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "verified successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ) // Verihubs
      .mockResolvedValueOnce(
        new Response("not-json-response", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        })
      ); // Salesforce invalid JSON

    const res = await POST(
      postJson("/api/auth/register", {
        name: "test azp 7",
        email: "azp007@yyytrive.co",
        phone: "8485848484807",
        countryCode: "+62",
        password: "Password123!",
        verificationCode: "123456",
        referralCode: "",
        marketingConsent: true,
        termsConsent: true,
      })
    );

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/tidak valid JSON/i);
  });

  it("refreshes Salesforce token when first call returns 401", async () => {
    vi.mocked(getLatestValidSalesforceToken).mockResolvedValueOnce("expired-token");
    vi.mocked(requestSalesforceAccessToken).mockResolvedValueOnce({
      access_token: "fresh-token",
      instance_url: "https://example.my.salesforce.com",
      token_type: "Bearer",
      issued_at: String(Date.now()),
    });

    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as never) // email check
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as never) // mark otp used
      .mockResolvedValueOnce({
        rows: [{ column_name: "client_id" }, { column_name: "lead_id" }],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            fullname: "test user",
            email: "retry@test.com",
            phone: "8485848484807",
            country_code: "+62",
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      } as never);

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "verified successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ) // Verihubs
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      ) // Salesforce first call
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ isSuccess: true, outputValues: { leadId: "00Qxx" } }]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      ); // Salesforce retry

    const res = await POST(
      postJson("/api/auth/register", {
        name: "test user",
        email: "retry@test.com",
        phone: "8485848484807",
        countryCode: "+62",
        password: "Password123!",
        verificationCode: "123456",
        referralCode: "",
        marketingConsent: true,
        termsConsent: true,
      })
    );

    expect(res.status).toBe(201);
    expect(requestSalesforceAccessToken).toHaveBeenCalledTimes(1);
    expect(saveSalesforceAccessToken).toHaveBeenCalledTimes(1);
  });
});
