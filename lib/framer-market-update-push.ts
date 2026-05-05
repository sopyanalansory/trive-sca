/**
 * Sinkron satu baris market update ke Framer setelah tulis DB (Salesforce → API webhook).
 * Opt-in: set FRAMER_PUSH_ON_WEBHOOK=true dan FRAMER_PROJECT_URL + FRAMER_API_KEY.
 */

import type { CollectionItemInput } from "framer-api";

import { apiLogger } from "@/lib/logger";
import {
  SLUG_RE,
  buildFieldData,
  isPublishedMarketRow,
  marketUpdateSlug,
  normalizeMarketRowForFramer,
  type MarketRow,
} from "@/lib/framer-market-updates-cms-fields";
import { withFramerMarketUpdatesCollection } from "@/lib/framer-market-updates-framer-connection";

const log = apiLogger("framer-market-push");

export function isFramerWebhookPushEnabled(): boolean {
  const flag = process.env.FRAMER_PUSH_ON_WEBHOOK?.trim().toLowerCase();
  if (flag !== "true" && flag !== "1" && flag !== "yes") return false;
  return Boolean(
    process.env.FRAMER_PROJECT_URL?.trim() && process.env.FRAMER_API_KEY?.trim()
  );
}

function findFramerItemIdForDbRow(
  items: readonly { id: string; slug: string }[],
  dbId: number
): string | undefined {
  const expectSlug = marketUpdateSlug(dbId);
  for (const item of items) {
    if (item.slug === expectSlug) return item.id;
    const m = item.slug.match(SLUG_RE);
    if (m && Number(m[1]) === dbId) return item.id;
  }
  return undefined;
}

/** Upsert jika Published; hapus item Framer jika status bukan Published. */
export async function syncMarketRowToFramerAfterDbWrite(
  rawRow: Record<string, unknown>
): Promise<void> {
  const row: MarketRow = normalizeMarketRowForFramer(rawRow);

  await withFramerMarketUpdatesCollection(async ({ target, fm }) => {
    const existingItems = await target.getItems();
    const existingFramerId = findFramerItemIdForDbRow(existingItems, row.id);

    if (!isPublishedMarketRow(row)) {
      if (existingFramerId) {
        await target.removeItems([existingFramerId]);
      }
      return;
    }

    const slug = marketUpdateSlug(row.id);
    const fieldData = buildFieldData(row, fm);
    const input: CollectionItemInput = existingFramerId
      ? { id: existingFramerId, slug, fieldData }
      : { slug, fieldData };
    await target.addItems([input]);
  });
}

export async function removeMarketUpdateFromFramerByDbId(
  dbId: number
): Promise<void> {
  await withFramerMarketUpdatesCollection(async ({ target }) => {
    const existingItems = await target.getItems();
    const framerId = findFramerItemIdForDbRow(existingItems, dbId);
    if (framerId) await target.removeItems([framerId]);
  });
}

export function scheduleMarketUpdateFramerSync(rawRow: Record<string, unknown>): void {
  if (!isFramerWebhookPushEnabled()) return;
  void syncMarketRowToFramerAfterDbWrite(rawRow).catch((err) => {
    log.warn({ err }, "Framer CMS sync after DB write failed");
  });
}

export function scheduleMarketUpdateRemovedFromFramer(dbId: number): void {
  if (!isFramerWebhookPushEnabled()) return;
  void removeMarketUpdateFromFramerByDbId(dbId).catch((err) => {
    log.warn({ err }, "Framer CMS remove after delete failed");
  });
}
