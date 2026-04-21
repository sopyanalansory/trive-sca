import { beforeEach, describe, expect, it, vi } from "vitest";
import { postJson } from "../helpers/request";

const { listV2Mock, signatureUrlMock, ossCtorMock } = vi.hoisted(() => {
  const listV2Mock = vi.fn();
  const signatureUrlMock = vi.fn();
  const ossCtorMock = vi.fn(() => ({
    listV2: listV2Mock,
    signatureUrl: signatureUrlMock,
  }));
  return { listV2Mock, signatureUrlMock, ossCtorMock };
});

vi.mock("ali-oss", () => ({
  default: ossCtorMock,
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
    verifyToken: vi.fn(),
  };
});

vi.mock("@/lib/email", () => ({
  sendScaPasswordResetRequestNotificationEmail: vi.fn(),
  sendScaClientAgreementRequestNotificationEmail: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  logRouteError: vi.fn(),
  requestLogFields: vi.fn(() => ({})),
}));

import { POST } from "@/app/api/accounts/sca-notification/route";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendScaClientAgreementRequestNotificationEmail } from "@/lib/email";

describe("POST /api/accounts/sca-notification (client agreement)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.OSS_REGION = "oss-ap-southeast-5";
    process.env.OSS_BUCKET = "triveinvest-bucket";
    process.env.OSS_ACCESS_KEY_ID = "test-key-id";
    process.env.OSS_ACCESS_KEY_SECRET = "test-key-secret";
    process.env.OSS_CLIENT_AGREEMENT_PREFIXES = "Migrasi Agreement";
    process.env.OSS_CLIENT_AGREEMENT_URL_EXPIRES = "600";

    vi.mocked(verifyToken).mockReturnValue({
      userId: 1,
      email: "user@test.com",
      accountId: null,
      leadId: null,
    });
    vi.mocked(pool.query).mockResolvedValue({
      rows: [
        {
          id: 10,
          login_number: "123456",
          account_type: "live",
          user_name: "Test User",
          user_email: "user@test.com",
        },
      ],
    } as never);
    vi.mocked(sendScaClientAgreementRequestNotificationEmail).mockResolvedValue({
      success: true,
      messageId: "msg-1",
    } as never);
  });

  it("returns signed OSS url when file exists for loginNumber", async () => {
    listV2Mock.mockResolvedValueOnce({
      objects: [{ name: "Migrasi Agreement/123456-client-agreement.pdf" }],
    });
    signatureUrlMock.mockReturnValueOnce("https://signed.oss.example/agreement.pdf");

    const res = await POST(
      postJson(
        "/api/accounts/sca-notification",
        { notificationType: "client_agreement", platformId: 10 },
        { Authorization: "Bearer valid-token" }
      )
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.delivery).toBe("cdn");
    expect(json.fileUrl).toBe("https://signed.oss.example/agreement.pdf");
    expect(signatureUrlMock).toHaveBeenCalledWith(
      "Migrasi Agreement/123456-client-agreement.pdf",
      { expires: 600 }
    );
    expect(sendScaClientAgreementRequestNotificationEmail).not.toHaveBeenCalled();
  });

  it("falls back to email when file is not found in OSS", async () => {
    listV2Mock.mockResolvedValueOnce({ objects: [] });

    const res = await POST(
      postJson(
        "/api/accounts/sca-notification",
        { notificationType: "client_agreement", platformId: 10 },
        { Authorization: "Bearer valid-token" }
      )
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, message: "Notification queued" });
    expect(signatureUrlMock).not.toHaveBeenCalled();
    expect(sendScaClientAgreementRequestNotificationEmail).toHaveBeenCalledWith({
      fullName: "Test User",
      email: "user@test.com",
      loginNumber: "123456",
    });
  });
});
