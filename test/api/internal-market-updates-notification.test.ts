import { beforeEach, describe, expect, it, vi } from "vitest";
import { basicAuthHeader, postJson } from "../helpers/request";

const { mockIsEnabled, mockEnqueue } = vi.hoisted(() => ({
  mockIsEnabled: vi.fn(),
  mockEnqueue: vi.fn(),
}));

vi.mock("@/lib/market-update-meta-notification", () => ({
  isMetaMarketUpdateNotificationEnabled: mockIsEnabled,
}));

vi.mock("@/lib/market-update-notification-queue", () => ({
  enqueueMarketUpdateNotificationJob: mockEnqueue,
}));

import { POST } from "@/app/api/internal/market-updates-notification/route";

describe("POST /api/internal/market-updates-notification", () => {
  const auth = basicAuthHeader(
    "test_market_api_user",
    "test_market_api_secret"
  );

  beforeEach(() => {
    mockIsEnabled.mockReset();
    mockEnqueue.mockReset();
  });

  it("returns 401 without Basic auth", async () => {
    const res = await POST(
      postJson("/api/internal/market-updates-notification", {
        login_number: "123456",
        title: "Update",
        summary: "Summary",
      })
    );

    expect(res.status).toBe(401);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields missing", async () => {
    mockIsEnabled.mockReturnValueOnce(true);

    const res = await POST(
      postJson(
        "/api/internal/market-updates-notification",
        {
          title: "Update only title",
        },
        auth
      )
    );

    expect(res.status).toBe(400);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("returns 503 when notification feature is disabled", async () => {
    mockIsEnabled.mockReturnValueOnce(false);

    const res = await POST(
      postJson(
        "/api/internal/market-updates-notification",
        {
          login_number: "123456",
          title: "Update",
          summary: "Summary",
        },
        auth
      )
    );

    expect(res.status).toBe(503);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("returns 200 and enqueues notification job", async () => {
    mockIsEnabled.mockReturnValueOnce(true);
    mockEnqueue.mockResolvedValueOnce(undefined);

    const res = await POST(
      postJson(
        "/api/internal/market-updates-notification",
        {
          login_number: "123456",
          title: "Gold Update",
          summary: "Bias bullish intraday",
        },
        auth
      )
    );

    expect(res.status).toBe(200);
    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith({
      salesforceId: "123456",
      title: "Gold Update",
      summary: "Bias bullish intraday",
    });

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.login_number).toBe("123456");
  });
});
