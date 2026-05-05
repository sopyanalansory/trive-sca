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
 */

import "dotenv/config";

import pool from "@/lib/db";
import WebSocketPolyfill from "ws";
import type {
  Collection,
  CollectionItemInput,
  Field,
  FieldDataInput,
} from "framer-api";

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

const FIELD_LABELS = {
  title: "Title",
  researchType: "Research type",
  status: "Status",
  summary: "Summary",
  fullContent: "Full content",
  imageUrl: "Image URL",
  metaText: "Meta text",
  createdAt: "Created at",
  updatedAt: "Updated at",
  createdBy: "Created by",
  salesforceId: "Salesforce ID",
} as const;

type FieldKey = keyof typeof FIELD_LABELS;

type MarketRow = {
  id: number;
  research_type: string | null;
  status: string | null;
  title: string | null;
  summary: string | null;
  img_url: string | null;
  meta_text: string | null;
  full_content: string | null;
  created_by: string | null;
  salesforce_id: string | null;
  created_at: string;
  updated_at: string;
};

const SLUG_RE = /^mu-(\d+)$/;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function asIsoString(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

function normalizeDbRow(r: Record<string, unknown>): MarketRow {
  return {
    id: Number(r.id),
    research_type: (r.research_type as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    summary: (r.summary as string | null) ?? null,
    img_url: (r.img_url as string | null) ?? null,
    meta_text: (r.meta_text as string | null) ?? null,
    full_content: (r.full_content as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    salesforce_id: (r.salesforce_id as string | null) ?? null,
    created_at: asIsoString(r.created_at),
    updated_at: asIsoString(r.updated_at),
  };
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
      out.push(normalizeDbRow(row as Record<string, unknown>));
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

function mapFieldsByLabel(fields: Field[]): Record<FieldKey, Field> {
  const byLower = new Map<string, Field>();
  for (const f of fields) {
    byLower.set(f.name.toLowerCase().trim(), f);
  }
  const out = {} as Record<FieldKey, Field>;
  for (const key of Object.keys(FIELD_LABELS) as FieldKey[]) {
    const label = FIELD_LABELS[key];
    const field = byLower.get(label.toLowerCase());
    if (!field) {
      throw new Error(
        `CMS collection missing field "${label}". Buat field dengan nama persis ini di Framer.`
      );
    }
    out[key] = field;
  }
  return out;
}

function buildFieldData(row: MarketRow, fm: Record<FieldKey, Field>): FieldDataInput {
  const fullHtml = row.full_content?.trim() ?? "";

  return {
    [fm.title.id]: { type: "string", value: row.title ?? "" },
    [fm.researchType.id]: { type: "string", value: row.research_type ?? "" },
    [fm.status.id]: { type: "string", value: row.status ?? "" },
    [fm.summary.id]: { type: "string", value: row.summary ?? "" },
    [fm.fullContent.id]: {
      type: "formattedText",
      value: fullHtml || "<p></p>",
      contentType: "html",
    },
    [fm.imageUrl.id]: {
      type: "link",
      value: row.img_url?.trim() ? row.img_url.trim() : null,
    },
    [fm.metaText.id]: { type: "string", value: row.meta_text ?? "" },
    [fm.createdAt.id]: { type: "date", value: row.created_at || null },
    [fm.updatedAt.id]: { type: "date", value: row.updated_at || null },
    [fm.createdBy.id]: { type: "string", value: row.created_by ?? "" },
    [fm.salesforceId.id]: { type: "string", value: row.salesforce_id ?? "" },
  };
}

function assertWritableCollection(c: Collection) {
  if (c.managedBy !== "user") {
    throw new Error(
      "Collection ini dikelola plugin lain / bukan Unmanaged. Buat collection baru “biasa” di CMS Framer."
    );
  }
  if (c.readonly) {
    throw new Error("Collection read-only (cek permission / API key).");
  }
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
