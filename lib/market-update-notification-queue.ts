import pool from "@/lib/db";
import { apiLogger } from "@/lib/logger";
import { sendPublishedMarketUpdateNotificationToMetaClients } from "@/lib/market-update-meta-notification";

const log = apiLogger("market-updates:notif-queue");

type NotificationJob = {
  id: number;
  salesforce_id: string;
  title: string;
  summary: string | null;
  attempt_count: number;
};

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(String(process.env[name] ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function enqueueMarketUpdateNotificationJob(payload: {
  salesforceId: string;
  title: string;
  summary: string;
}): Promise<void> {
  const salesforceId = payload.salesforceId.trim();
  const title = payload.title.trim();
  const summary = payload.summary.trim();
  if (!salesforceId || !title) return;

  await pool.query(
    `INSERT INTO market_update_notification_jobs (salesforce_id, title, summary, status)
     VALUES ($1, $2, $3, 'pending')`,
    [salesforceId, title, summary || null]
  );
}

export async function processMarketUpdateNotificationJobs(): Promise<{
  claimed: number;
  sent: number;
  failed: number;
}> {
  const claimLimit = envInt("MARKET_UPDATE_NOTIF_JOB_FETCH_LIMIT", 5);
  const maxAttempts = envInt("MARKET_UPDATE_NOTIF_JOB_MAX_ATTEMPTS", 3);
  const client = await pool.connect();

  let claimed: NotificationJob[] = [];
  try {
    await client.query("BEGIN");
    const claimedRes = await client.query<NotificationJob>(
      `WITH picked AS (
         SELECT id
         FROM market_update_notification_jobs
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE market_update_notification_jobs j
       SET status = 'processing',
           attempt_count = j.attempt_count + 1
       FROM picked
       WHERE j.id = picked.id
       RETURNING j.id, j.salesforce_id, j.title, j.summary, j.attempt_count`,
      [claimLimit]
    );
    claimed = claimedRes.rows;
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  let sent = 0;
  let failed = 0;
  for (const job of claimed) {
    try {
      await sendPublishedMarketUpdateNotificationToMetaClients({
        title: job.title,
        summary: job.summary ?? "",
      });
      await pool.query(
        `UPDATE market_update_notification_jobs
         SET status = 'sent',
             processed_at = CURRENT_TIMESTAMP,
             last_error = NULL
         WHERE id = $1`,
        [job.id]
      );
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextStatus = job.attempt_count >= maxAttempts ? "failed" : "pending";
      await pool.query(
        `UPDATE market_update_notification_jobs
         SET status = $2,
             last_error = $3
         WHERE id = $1`,
        [job.id, nextStatus, message.slice(0, 2000)]
      );
      failed += 1;
      log.warn(
        { jobId: job.id, salesforceId: job.salesforce_id, err: message, nextStatus },
        "Failed processing market update notification job"
      );
    }
  }

  return { claimed: claimed.length, sent, failed };
}

