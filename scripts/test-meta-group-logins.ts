import { config as loadEnv } from "dotenv";
import { getMetaLoginsByGroup } from "@/lib/metamanager";
import { resolveMetaNotificationRecipients } from "@/lib/market-update-meta-notification";

loadEnv({ path: ".env.local" });

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
}

function resolveExtraLoginsFromEnv(): string[] {
  const raw = String(process.env.METAMANAGER_NOTIF_EXTRA_LOGINS ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const group =
    process.argv[2]?.trim() || String(process.env.METAMANAGER_NOTIF_GROUP ?? "").trim();
  if (!group) {
    const usageGroup = String.raw`real\GKB\Classic-Fixed-SwapFree-Test`;
    console.error(
      `Usage: npm run test:meta-group -- "${usageGroup}"`
    );
    console.error("or set METAMANAGER_NOTIF_GROUP in .env.local");
    process.exit(1);
  }

  const rows = await getMetaLoginsByGroup(group);
  const count = Array.isArray(rows) ? rows.length : 0;
  const recipients = resolveMetaNotificationRecipients(group, rows);
  const extraLogins = resolveExtraLoginsFromEnv();
  const finalRecipients = Array.from(new Set([...recipients, ...extraLogins]));

  console.log(`Group: ${group}`);
  console.log(`Raw Count: ${count}`);
  console.log(`Effective Recipients Count: ${recipients.length}`);
  console.log(`Extra Logins Count: ${extraLogins.length}`);
  console.log(`Final Recipients Count: ${finalRecipients.length}`);
  console.log("Raw Logins:");
  console.log(JSON.stringify(rows, null, 2));
  console.log("Effective Recipients (after exclude rules):");
  console.log(JSON.stringify(recipients, null, 2));
  console.log("Extra Logins (from METAMANAGER_NOTIF_EXTRA_LOGINS):");
  console.log(JSON.stringify(extraLogins, null, 2));
  console.log("Final Recipients (effective + extra, deduplicated):");
  console.log(JSON.stringify(finalRecipients, null, 2));
}

main().catch((error: unknown) => {
  const message = errorToMessage(error);
  console.error(`test:meta-group failed: ${message}`);
  process.exit(1);
});

