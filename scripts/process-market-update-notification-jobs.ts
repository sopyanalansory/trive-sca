import { config as loadEnv } from "dotenv";
import { processMarketUpdateNotificationJobs } from "@/lib/market-update-notification-queue";

loadEnv({ path: ".env.local" });

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
}

async function main(): Promise<void> {
  const result = await processMarketUpdateNotificationJobs();
  console.log(
    `processed market notif jobs | claimed=${result.claimed} sent=${result.sent} failed=${result.failed}`
  );
}

main().catch((error: unknown) => {
  const message = errorToMessage(error);
  console.error(`process-market-update-notification-jobs failed: ${message}`);
  process.exit(1);
});

