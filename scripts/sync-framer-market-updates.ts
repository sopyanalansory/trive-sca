/**
 * Sinkron market updates (Published) dari API trive-sca ke Framer CMS lewat Server API.
 *
 * Prasyarat:
 * - Node.js 20+: `globalThis.WebSocket` tidak ada — skrip mengisi dari paket `ws` sebelum memuat `framer-api`.
 * - Node.js 22.4+ punya WebSocket built-in (polyfill dilewati). Paket `framer-api` tetap mencantumkan engines >=22.
 * - `npm run sync-framer-market-updates` memakai esbuild → bundle ESM agar `framer-api` (top-level await) tidak diproses tsx/esbuild sebagai CJS
 * - Di Framer: buat CMS collection **Unmanaged** (bukan milik plugin lain) dengan field
 *   nama persis seperti di `FIELD_LABELS` di bawah — urutan/tipe: Title string,
 *   Research type string, Status string, Summary string, Full content formatted text (HTML),
 *   Image URL link, Meta text string, Created at date, Updated at date, Created by string,
 *   Salesforce ID string.
 * - Project URL + API key: https://github.com/framer/server-api-examples
 *
 * Env:
 *   FRAMER_PROJECT_URL   — contoh https://framer.com/projects/Sites--xxxx
 *   FRAMER_API_KEY       — dari Settings project Framer
 *   FRAMER_MU_COLLECTION — nama collection (default: Market Updates)
 *   DATABASE_URL         — jika ada (sama seperti app), data diambil langsung dari Postgres
 *   MARKET_UPDATES_SYNC_SOURCE — kosong/db = pakai DB bila DATABASE_URL ada; `api` = pakai HTTP saja
 *   MARKET_UPDATES_API_URL — dipakai hanya jika tidak ada DATABASE_URL atau SYNC_SOURCE=api
 *     (default https://api.trive.co.id/api/market-updates)
 *   FRAMER_PUSH_ON_WEBHOOK — tidak dipakai oleh skrip ini; untuk push dari API Next.js saat SF webhook (POST/PUT).
 */

import "dotenv/config";

import pool from "@/lib/db";
import {
  SLUG_RE,
  assertWritableCollection,
  buildFieldData,
  mapFieldsByLabel,
  normalizeMarketRowForFramer,
  type MarketRow,
} from "@/lib/framer-market-updates-cms-fields";
import WebSocketPolyfill from "ws";
import type { CollectionItemInput } from "framer-api";

/** framer-api memanggil `new globalThis.WebSocket(url, { headers })` — baru ada stabil di Node ~22+. */
function ensureGlobalWebSocket(): void {
  const g = globalThis as typeof globalThis & {
    WebSocket?: typeof globalThis.WebSocket;
  };
  if (typeof g.WebSocket === "function") return;
  g.WebSocket = WebSocketPolyfill as unknown as typeof globalThis.WebSocket;
}

/** Sama dengan CTE di `app/api/market-updates/route.ts` — dedup per salesforce_id. */
const LATEST_MARKET_UPDATES_CTE = `
  WITH latest_market_updates AS (
    SELECT DISTINCT ON (salesforce_id)
      id,
      research_type,
      status,
      title,
      summary,
      img_url,
      economic_data_1,
      economic_data_2,
      economic_data_3,
      economic_data_4,
      economic_data_5,
      meta_text,
      full_content,
      created_by,
      salesforce_id,
      created_at,
      updated_at
    FROM market_updates
    ORDER BY
      salesforce_id,
      CASE WHEN LOWER(COALESCE(status, '')) = 'draft' THEN 1 ELSE 0 END,
      updated_at DESC,
      id DESC
  )
`;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

async function fetchPublishedRowsFromDb(): Promise<MarketRow[]> {
  const baseQuery = `
    ${LATEST_MARKET_UPDATES_CTE}
    SELECT
      m.id,
      m.research_type,
      m.status,
      m.title,
      m.summary,
      m.img_url,
      m.meta_text,
      m.full_content,
      m.created_by,
      m.salesforce_id,
      m.created_at,
      m.updated_at
    FROM latest_market_updates m
    WHERE LOWER(COALESCE(m.status, '')) = LOWER('published')
    ORDER BY m.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const out: MarketRow[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const res = await pool.query(baseQuery, [limit, offset]);
    for (const row of res.rows) {
      out.push(normalizeMarketRowForFramer(row as Record<string, unknown>));
    }
    hasMore = res.rows.length === limit;
    offset += limit;
    if (offset > 50000) throw new Error("Safety stop: too many rows");
  }
  return out;
}

async function fetchPublishedRows(apiBase: string): Promise<MarketRow[]> {
  const base = normalizeBaseUrl(apiBase);
  const out: MarketRow[] = [];
  let page = 1;
  let hasNext = true;
  const limit = 100;

  while (hasNext) {
    const u = new URL(base);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("sort_by", "created_at");
    u.searchParams.set("sort_order", "DESC");
    u.searchParams.set("status", "published");

    const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Market API HTTP ${res.status}: ${res.statusText}`);
    }
    const json = (await res.json()) as {
      success: boolean;
      data?: MarketRow[];
      pagination?: { hasNextPage?: boolean };
      error?: string;
    };
    if (!json.success) {
      throw new Error(json.error || "Market API returned success: false");
    }
    out.push(...(json.data ?? []));
    hasNext = json.pagination?.hasNextPage === true;
    page += 1;
    if (page > 500) throw new Error("Safety stop: too many pages");
  }
  return out;
}

async function main() {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 22) {
    console.warn(
      `Note: Node ${process.version} — WebSocket untuk Framer diisi dari paket \`ws\`; upgrade ke Node 22+ disarankan (sesuai engines framer-api).`
    );
  }

  const projectUrl = requireEnv("FRAMER_PROJECT_URL");
  const apiKey = requireEnv("FRAMER_API_KEY");
  const collectionName =
    process.env.FRAMER_MU_COLLECTION?.trim() || "Market Updates";
  const marketApi =
    process.env.MARKET_UPDATES_API_URL?.trim() ||
    "https://api.trive.co.id/api/market-updates";

  const syncSource =
    process.env.MARKET_UPDATES_SYNC_SOURCE?.trim().toLowerCase();
  const forceApi = syncSource === "api";
  const hasDb = Boolean(process.env.DATABASE_URL?.trim());
  const useDb = !forceApi && hasDb;

  try {
    let rows: MarketRow[];
    if (useDb) {
      console.log(
        "Fetching published rows from Postgres (dedup logic matches GET /api/market-updates)…"
      );
      rows = await fetchPublishedRowsFromDb();
    } else {
      if (!forceApi && !hasDb) {
        console.warn(
          "DATABASE_URL not set — using HTTP (MARKET_UPDATES_API_URL). Set DATABASE_URL to query the DB directly."
        );
      }
      console.log("Fetching published market updates from API…");
      rows = await fetchPublishedRows(marketApi);
    }
    console.log(`Got ${rows.length} published rows.`);

    const apiDbIds = new Set(rows.map((r) => r.id));

    ensureGlobalWebSocket();
    const { connect } = await import("framer-api");
    console.log("Connecting to Framer Server API…");
    const framer = await connect(projectUrl, apiKey);

    try {
      const collections = await framer.getCollections();
      const target = collections.find((c) => c.name === collectionName);
      if (!target) {
        throw new Error(
          `Collection "${collectionName}" tidak ditemukan. Buat di CMS atau set FRAMER_MU_COLLECTION.`
        );
      }
      assertWritableCollection(target);

      const fields = await target.getFields();
      const fm = mapFieldsByLabel(fields);

      const existingItems = await target.getItems();
      const framerIdByDbId = new Map<number, string>();

      for (const item of existingItems) {
        const m = item.slug.match(SLUG_RE);
        if (m) framerIdByDbId.set(Number(m[1]), item.id);
      }

      const removeIds: string[] = [];
      for (const item of existingItems) {
        const m = item.slug.match(SLUG_RE);
        if (!m) continue;
        const dbId = Number(m[1]);
        if (!apiDbIds.has(dbId)) removeIds.push(item.id);
      }
      if (removeIds.length > 0) {
        console.log(`Removing ${removeIds.length} stale CMS items…`);
        await target.removeItems(removeIds);
      }

      const batchSize = 40;
      let upserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const inputs: CollectionItemInput[] = chunk.map((row) => {
          const slug = `mu-${row.id}`;
          const fieldData = buildFieldData(row, fm);
          const existingFramerId = framerIdByDbId.get(row.id);
          if (existingFramerId) {
            return {
              id: existingFramerId,
              slug,
              fieldData,
            };
          }
          return { slug, fieldData };
        });
        await target.addItems(inputs);
        upserted += inputs.length;
        console.log(`Upserted ${upserted} / ${rows.length}…`);
      }

      console.log("Done. Framer CMS market updates are in sync.");
    } finally {
      await framer.disconnect();
    }
  } finally {
    if (useDb) await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
