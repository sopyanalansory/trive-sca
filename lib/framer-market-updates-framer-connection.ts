/**
 * Koneksi Server API Framer bersama (push & read).
 */

import WebSocketPolyfill from "ws";

import {
  assertWritableCollection,
  mapFieldsByLabel,
  type FieldKey,
} from "@/lib/framer-market-updates-cms-fields";

export function ensureGlobalWebSocket(): void {
  const g = globalThis as typeof globalThis & {
    WebSocket?: typeof globalThis.WebSocket;
  };
  if (typeof g.WebSocket === "function") return;
  g.WebSocket = WebSocketPolyfill as unknown as typeof globalThis.WebSocket;
}

export function assertFramerListEnv(): void {
  if (
    !process.env.FRAMER_PROJECT_URL?.trim() ||
    !process.env.FRAMER_API_KEY?.trim()
  ) {
    throw new Error(
      "FRAMER_PROJECT_URL dan FRAMER_API_KEY wajib untuk source=framer."
    );
  }
}

type Collection = import("framer-api").Collection;
type Field = import("framer-api").Field;

export async function withFramerMarketUpdatesCollection<T>(
  fn: (ctx: { target: Collection; fm: Record<FieldKey, Field> }) => Promise<T>,
  options: { assertWritable?: boolean } = {}
): Promise<T> {
  const { assertWritable = true } = options;
  assertFramerListEnv();

  const projectUrl = process.env.FRAMER_PROJECT_URL!.trim();
  const apiKey = process.env.FRAMER_API_KEY!.trim();
  const collectionName =
    process.env.FRAMER_MU_COLLECTION?.trim() || "Market Updates";

  ensureGlobalWebSocket();
  const { connect } = await import("framer-api");
  const framer = await connect(projectUrl, apiKey);
  try {
    const collections = await framer.getCollections();
    const target = collections.find((c) => c.name === collectionName);
    if (!target) {
      throw new Error(
        `Collection "${collectionName}" tidak ditemukan. Set FRAMER_MU_COLLECTION atau buat collection di Framer.`
      );
    }
    if (assertWritable) {
      assertWritableCollection(target);
    }
    const fields = await target.getFields();
    const fm = mapFieldsByLabel(fields);
    return await fn({ target, fm });
  } finally {
    await framer.disconnect();
  }
}
