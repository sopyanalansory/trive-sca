/**
 * Baca daftar / satu item Market Updates dari CMS Framer (GET ?source=framer).
 */

import type { CollectionItem } from "framer-api";

import {
  SLUG_RE,
  marketUpdateSlug,
  type FieldKey,
} from "@/lib/framer-market-updates-cms-fields";
import { withFramerMarketUpdatesCollection } from "@/lib/framer-market-updates-framer-connection";

/** Bentuk mendekati baris DB untuk respons API konsisten. */
export type MarketUpdateApiRow = {
  id: number;
  research_type: string | null;
  status: string | null;
  title: string | null;
  summary: string | null;
  img_url: string | null;
  economic_data_1: null;
  economic_data_2: null;
  economic_data_3: null;
  economic_data_4: null;
  economic_data_5: null;
  meta_text: string | null;
  full_content: string | null;
  created_by: string | null;
  salesforce_id: string | null;
  created_at: string;
  updated_at: string;
};

function readStringAtSlug(
  item: CollectionItem,
  fm: Record<FieldKey, import("framer-api").Field>,
  key: FieldKey
): string | null {
  const entry = item.fieldData[fm[key].id];
  if (!entry || entry.type !== "string") return null;
  const v = entry.value?.trim?.() ?? entry.value;
  return typeof v === "string" && v.length > 0 ? v : null;
}

function readFormattedAtSlug(
  item: CollectionItem,
  fm: Record<FieldKey, import("framer-api").Field>,
  key: FieldKey
): string | null {
  const entry = item.fieldData[fm[key].id];
  if (!entry || entry.type !== "formattedText") return null;
  const v = entry.value?.trim?.() ?? entry.value;
  return typeof v === "string" && v.length > 0 ? v : null;
}

function readLinkAtSlug(
  item: CollectionItem,
  fm: Record<FieldKey, import("framer-api").Field>,
  key: FieldKey
): string | null {
  const entry = item.fieldData[fm[key].id];
  if (!entry || entry.type !== "link") return null;
  const v = entry.value as unknown;
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  return null;
}

function readTimestampAtSlug(
  item: CollectionItem,
  fm: Record<FieldKey, import("framer-api").Field>,
  key: FieldKey
): string {
  const entry = item.fieldData[fm[key].id];
  if (!entry) return "";
  if (entry.type === "date") {
    const v = entry.value;
    return typeof v === "string" ? v : "";
  }
  if (entry.type === "string") {
    const v = entry.value;
    return typeof v === "string" ? v : "";
  }
  return "";
}

export function collectionItemToApiRow(
  item: CollectionItem,
  fm: Record<FieldKey, import("framer-api").Field>
): MarketUpdateApiRow | null {
  const m = item.slug.match(SLUG_RE);
  if (!m) return null;
  const id = Number(m[1]);

  return {
    id,
    research_type: readStringAtSlug(item, fm, "researchType"),
    status: readStringAtSlug(item, fm, "status"),
    title: readStringAtSlug(item, fm, "title"),
    summary: readStringAtSlug(item, fm, "summary"),
    img_url: readLinkAtSlug(item, fm, "imageUrl"),
    economic_data_1: null,
    economic_data_2: null,
    economic_data_3: null,
    economic_data_4: null,
    economic_data_5: null,
    meta_text: readStringAtSlug(item, fm, "metaText"),
    full_content: readFormattedAtSlug(item, fm, "fullContent"),
    created_by: readStringAtSlug(item, fm, "createdBy"),
    salesforce_id: readStringAtSlug(item, fm, "salesforceId"),
    created_at: readTimestampAtSlug(item, fm, "createdAt"),
    updated_at: readTimestampAtSlug(item, fm, "updatedAt"),
  };
}

export type ListMarketUpdatesFromFramerParams = {
  page: number;
  limit: number;
  status: string | null;
  researchType: string | null;
  createdBy: string | null;
  salesforceId: string | null;
  search: string | null;
  startDate: string | null;
  endDate: string | null;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
};

function rowMatchesFilters(row: MarketUpdateApiRow, p: ListMarketUpdatesFromFramerParams): boolean {
  if (p.status && row.status?.trim().toLowerCase() !== p.status.trim().toLowerCase()) {
    return false;
  }
  if (p.researchType && row.research_type !== p.researchType) return false;
  if (p.createdBy) {
    const q = p.createdBy.toLowerCase();
    if (!row.created_by?.toLowerCase().includes(q)) return false;
  }
  if (p.salesforceId && row.salesforce_id !== p.salesforceId) return false;
  if (p.search) {
    const q = p.search.toLowerCase();
    const title = row.title?.toLowerCase() ?? "";
    const summary = row.summary?.toLowerCase() ?? "";
    if (!title.includes(q) && !summary.includes(q)) return false;
  }
  if (p.startDate && row.created_at) {
    if (row.created_at < p.startDate) return false;
  }
  if (p.endDate && row.created_at) {
    if (row.created_at > p.endDate) return false;
  }
  return true;
}

function sortRows(rows: MarketUpdateApiRow[], sortBy: string, sortOrder: "ASC" | "DESC"): void {
  const mul = sortOrder === "ASC" ? 1 : -1;
  const key = sortBy as keyof MarketUpdateApiRow;
  rows.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1 * mul;
    if (vb == null) return -1 * mul;
    if (typeof va === "number" && typeof vb === "number") {
      return va === vb ? 0 : va < vb ? -1 * mul : 1 * mul;
    }
    const sa = String(va);
    const sb = String(vb);
    return sa === sb ? 0 : sa < sb ? -1 * mul : 1 * mul;
  });
}

export async function listMarketUpdatesFromFramer(
  params: ListMarketUpdatesFromFramerParams
): Promise<{
  data: MarketUpdateApiRow[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const allowedSortColumns = [
    "id",
    "created_at",
    "updated_at",
    "status",
    "research_type",
    "title",
    "created_by",
    "salesforce_id",
  ];
  const safeSortBy = allowedSortColumns.includes(params.sortBy)
    ? params.sortBy
    : "created_at";

  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const filtered = await withFramerMarketUpdatesCollection(async ({ target, fm }) => {
    const items = await target.getItems();
    const rows: MarketUpdateApiRow[] = [];
    for (const item of items) {
      if (item.draft) continue;
      const row = collectionItemToApiRow(item, fm);
      if (!row) continue;
      if (!rowMatchesFilters(row, params)) continue;
      rows.push(row);
    }
    sortRows(rows, safeSortBy, params.sortOrder);
    return rows;
  }, { assertWritable: false });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const data = filtered.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getMarketUpdateFromFramerByDbId(
  dbId: number
): Promise<MarketUpdateApiRow | null> {
  const expectSlug = marketUpdateSlug(dbId);
  return withFramerMarketUpdatesCollection(async ({ target, fm }) => {
    const items = await target.getItems();
    for (const item of items) {
      if (item.draft) continue;
      if (item.slug !== expectSlug) continue;
      return collectionItemToApiRow(item, fm);
    }
    return null;
  }, { assertWritable: false });
}
