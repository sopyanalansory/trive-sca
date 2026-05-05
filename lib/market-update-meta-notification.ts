import { apiLogger } from "@/lib/logger";
import { getMetaLoginsByGroup, sendMetaNotification } from "@/lib/metamanager";

const log = apiLogger("market-updates:meta-notif");
const RECIPIENT_BATCH_SIZE = 50;

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

type LoginRecord = {
  login?: unknown;
  Login?: unknown;
};

function toLogin(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function resolveGroup(): string {
  return env("METAMANAGER_NOTIF_GROUP");
}

function resolveExtraLoginsFromEnv(): string[] {
  const raw = env("METAMANAGER_NOTIF_EXTRA_LOGINS");
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => toLogin(item))
    .filter((value): value is string => Boolean(value));
}

function shouldExcludeLoginForGroup(group: string, login: string): boolean {
  const normalizedGroup = group.trim().toLowerCase();
  if (normalizedGroup !== String.raw`real\gkb\classic-fixed-swapfree-test`) {
    return false;
  }
  const parsed = Number(login);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 8001;
}

export function resolveMetaNotificationRecipients(
  group: string,
  rows: unknown[]
): string[] {
  const logins = rows
    .map((row) => {
      if (typeof row === "string" || typeof row === "number") {
        return toLogin(row);
      }
      if (row && typeof row === "object") {
        const record = row as LoginRecord;
        return toLogin(record.login ?? record.Login);
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  return logins.filter((login) => !shouldExcludeLoginForGroup(group, login));
}

function chunkLogins(logins: string[], size: number): string[][] {
  if (size <= 0) return [logins];
  const chunks: string[][] = [];
  for (let i = 0; i < logins.length; i += size) {
    chunks.push(logins.slice(i, i + size));
  }
  return chunks;
}

function buildMessage(title: string, summary: string): string {
  const safeTitle = title.trim() || "Market Update";
  const safeSummary = summary.trim() || "-";
  return [
    `Trive Invest: ${safeTitle}`,
    "",
    safeSummary,
    "",
    "Trive Invest Success Team",
    "Hubungi Account Manager Anda",
    "https://wa.me/628881683000",
  ].join("\n");
}

export function isMetaMarketUpdateNotificationEnabled(): boolean {
  return Boolean(resolveGroup() || resolveExtraLoginsFromEnv().length > 0);
}

export async function sendPublishedMarketUpdateNotificationToMetaClients(options: {
  title: string;
  summary: string;
}): Promise<void> {
  const group = resolveGroup();
  const filteredLogins = group
    ? resolveMetaNotificationRecipients(group, await getMetaLoginsByGroup(group))
    : [];
  const extraLogins = resolveExtraLoginsFromEnv();
  const finalLogins = Array.from(new Set([...filteredLogins, ...extraLogins]));

  if (finalLogins.length === 0) {
    log.info({ group }, "No client logins found for market update notification");
    return;
  }

  const message = buildMessage(options.title, options.summary);
  const batches = chunkLogins(finalLogins, RECIPIENT_BATCH_SIZE);
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (login) => {
        // sendMetaNotification always performs Meta auth flow before sending.
        await sendMetaNotification({ login, message });
      })
    );
  }
}

