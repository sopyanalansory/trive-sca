import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetMetaLoginsByGroup, mockSendMetaNotification } = vi.hoisted(() => ({
  mockGetMetaLoginsByGroup: vi.fn(),
  mockSendMetaNotification: vi.fn(),
}));

vi.mock("@/lib/metamanager", () => ({
  getMetaLoginsByGroup: mockGetMetaLoginsByGroup,
  sendMetaNotification: mockSendMetaNotification,
}));

import {
  isMetaMarketUpdateNotificationEnabled,
  sendPublishedMarketUpdateNotificationToMetaClients,
} from "@/lib/market-update-meta-notification";

describe("market update meta notification", () => {
  beforeEach(() => {
    mockGetMetaLoginsByGroup.mockReset();
    mockSendMetaNotification.mockReset();
    delete process.env.METAMANAGER_NOTIF_GROUP;
    delete process.env.METAMANAGER_NOTIF_EXTRA_LOGINS;
  });

  it("is disabled when METAMANAGER_NOTIF_GROUP is missing", () => {
    expect(isMetaMarketUpdateNotificationEnabled()).toBe(false);
  });

  it("is enabled when METAMANAGER_NOTIF_GROUP exists", () => {
    process.env.METAMANAGER_NOTIF_GROUP = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    expect(isMetaMarketUpdateNotificationEnabled()).toBe(true);
  });

  it("is enabled when only METAMANAGER_NOTIF_EXTRA_LOGINS exists", () => {
    process.env.METAMANAGER_NOTIF_EXTRA_LOGINS = "39326459,39331204";
    expect(isMetaMarketUpdateNotificationEnabled()).toBe(true);
  });

  it("fetches logins by group and sends formatted notification", async () => {
    process.env.METAMANAGER_NOTIF_GROUP = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    mockGetMetaLoginsByGroup.mockResolvedValueOnce(["39331204"]);
    mockSendMetaNotification.mockResolvedValueOnce({ ok: true });

    await sendPublishedMarketUpdateNotificationToMetaClients({
      title: "Important Economic Data/Event",
      summary: "Summary from Salesforce",
    });

    expect(mockGetMetaLoginsByGroup).toHaveBeenCalledWith(
      String.raw`real\GKB\Classic-Fixed-SwapFree-Test`
    );
    expect(mockSendMetaNotification).toHaveBeenCalledTimes(1);
    expect(mockSendMetaNotification).toHaveBeenCalledWith({
      login: "39331204",
      message: [
        "Trive Invest: Important Economic Data/Event",
        "",
        "Summary from Salesforce",
        "",
        "Trive Invest Success Team",
        "Hubungi Account Manager Anda",
        "https://wa.me/628881683000",
      ].join("\n"),
    });
  });

  it("excludes login <= 8001 for classic-fixed-swapfree-test group", async () => {
    process.env.METAMANAGER_NOTIF_GROUP = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    mockGetMetaLoginsByGroup.mockResolvedValueOnce(["7038", "8001", "39331204"]);
    mockSendMetaNotification.mockResolvedValue({ ok: true });

    await sendPublishedMarketUpdateNotificationToMetaClients({
      title: "T",
      summary: "S",
    });

    expect(mockSendMetaNotification).toHaveBeenCalledTimes(1);
    expect(mockSendMetaNotification).toHaveBeenCalledWith({
      login: "39331204",
      message: [
        "Trive Invest: T",
        "",
        "S",
        "",
        "Trive Invest Success Team",
        "Hubungi Account Manager Anda",
        "https://wa.me/628881683000",
      ].join("\n"),
    });
  });

  it("sends notifications in batches of 50 recipients", async () => {
    process.env.METAMANAGER_NOTIF_GROUP = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    const manyLogins = Array.from({ length: 120 }, (_, i) =>
      String(39000000 + i)
    );
    mockGetMetaLoginsByGroup.mockResolvedValueOnce(manyLogins);

    let active = 0;
    let peak = 0;
    mockSendMetaNotification.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return { ok: true };
    });

    await sendPublishedMarketUpdateNotificationToMetaClients({
      title: "T",
      summary: "S",
    });

    expect(mockSendMetaNotification).toHaveBeenCalledTimes(120);
    expect(peak).toBeLessThanOrEqual(50);
  });

  it("adds extra logins from env and de-duplicates recipients", async () => {
    process.env.METAMANAGER_NOTIF_GROUP = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    process.env.METAMANAGER_NOTIF_EXTRA_LOGINS = "39326459,39331204,39331204";
    mockGetMetaLoginsByGroup.mockResolvedValueOnce(["39331204", "39340000"]);
    mockSendMetaNotification.mockResolvedValue({ ok: true });

    await sendPublishedMarketUpdateNotificationToMetaClients({
      title: "T",
      summary: "S",
    });

    const sentLogins = mockSendMetaNotification.mock.calls.map(
      (args) => args[0].login
    );
    expect(sentLogins).toEqual(["39331204", "39340000", "39326459"]);
  });

  it("sends notification to extra logins when group is not set", async () => {
    process.env.METAMANAGER_NOTIF_EXTRA_LOGINS = "39326459,39331204";
    mockSendMetaNotification.mockResolvedValue({ ok: true });

    await sendPublishedMarketUpdateNotificationToMetaClients({
      title: "T",
      summary: "S",
    });

    expect(mockGetMetaLoginsByGroup).not.toHaveBeenCalled();
    const sentLogins = mockSendMetaNotification.mock.calls.map(
      (args) => args[0].login
    );
    expect(sentLogins).toEqual(["39326459", "39331204"]);
  });
});

