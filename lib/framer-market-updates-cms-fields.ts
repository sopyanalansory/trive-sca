/**
 * Pemetaan field CMS Framer ↔ kolom market_updates (dipakai skrip sync & push webhook).
 */

import type {
  Collection,
  Field,
  FieldDataEntryInput,
  FieldDataInput,
} from "framer-api";

export const FIELD_LABELS = {
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

export type FieldKey = keyof typeof FIELD_LABELS;

/** Bentuk baris yang dibaca DB/API sebelum kirim ke Framer. */
export type MarketRow = {
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

export const SLUG_RE = /^mu-(\d+)$/;

export function marketUpdateSlug(dbId: number): string {
  return `mu-${dbId}`;
}

function asIsoString(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

/** Normalisasi satu baris hasil query `pg` / JSON untuk dipakai buildFieldData. */
export function normalizeMarketRowForFramer(r: Record<string, unknown>): MarketRow {
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

export function mapFieldsByLabel(fields: Field[]): Record<FieldKey, Field> {
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

export function coerceIsoTimestamp(raw: unknown): string | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw).toISOString();
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    return s === "" ? null : s;
  }
  return null;
}

export function timestampFieldEntry(field: Field, raw: unknown): FieldDataEntryInput {
  const iso = coerceIsoTimestamp(raw);
  switch (field.type) {
    case "date":
      return { type: "date", value: iso };
    case "string":
      return { type: "string", value: iso ?? "" };
    default:
      throw new Error(
        `Field "${field.name}" untuk tanggal harus bertipe Date atau Text/String di Framer (sekarang: "${field.type}").`
      );
  }
}

export function buildFieldData(row: MarketRow, fm: Record<FieldKey, Field>): FieldDataInput {
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
    [fm.createdAt.id]: timestampFieldEntry(fm.createdAt, row.created_at),
    [fm.updatedAt.id]: timestampFieldEntry(fm.updatedAt, row.updated_at),
    [fm.createdBy.id]: { type: "string", value: row.created_by ?? "" },
    [fm.salesforceId.id]: { type: "string", value: row.salesforce_id ?? "" },
  };
}

export function assertWritableCollection(c: Collection): void {
  if (c.managedBy !== "user") {
    throw new Error(
      "Collection ini dikelola plugin lain / bukan Unmanaged. Buat collection baru “biasa” di CMS Framer."
    );
  }
  if (c.readonly) {
    throw new Error("Collection read-only (cek permission / API key).");
  }
}

export function isPublishedMarketRow(row: MarketRow): boolean {
  return row.status?.trim().toLowerCase() === "published";
}
