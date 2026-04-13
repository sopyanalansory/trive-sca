import pool from "@/lib/db";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

const DEFAULT_GET_PLATFORMS_FLOW_URL =
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Get_Platforms_by_Account_or_Lead";

function getGetPlatformsFlowUrl(): string {
  return (
    process.env.SALESFORCE_GET_PLATFORMS_FLOW_URL || DEFAULT_GET_PLATFORMS_FLOW_URL
  );
}

async function getValidAccessToken(): Promise<string> {
  let token = await getLatestValidSalesforceToken();
  if (!token) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    token = fresh.access_token;
  }
  return token;
}

async function postGetPlatformsFlow(
  accessToken: string,
  accountOrLeadId: string
): Promise<Response> {
  return fetch(getGetPlatformsFlowUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ accountOrLeadId }],
    }),
    cache: "no-store",
  });
}

/**
 * Calls Trive_Invest_API_Get_Platforms_by_Account_or_Lead and returns parsed platform rows.
 */
async function getPlatformRowsFromGetPlatformsFlow(
  accountOrLeadId: string
): Promise<Record<string, unknown>[]> {
  const token = await getValidAccessToken();
  let response = await postGetPlatformsFlow(token, accountOrLeadId);

  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    response = await postGetPlatformsFlow(fresh.access_token, accountOrLeadId);
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Salesforce platforms response is not valid JSON");
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Get Platforms failed: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  return extractPlatformRowsFromFlow(parsed);
}

function normalizeSalesforceId(id: string): string {
  return id.trim().slice(0, 100);
}

function salesforceIdsMatch(a: string, b: string): boolean {
  const t = normalizeSalesforceId(a).toLowerCase();
  const u = normalizeSalesforceId(b).toLowerCase();
  if (t === u) return true;
  if (t.length >= 15 && u.length >= 15 && t.slice(0, 15) === u.slice(0, 15)) {
    return true;
  }
  return false;
}

/**
 * Upserts one platform row from a Salesforce flow record. Returns false if the row is skipped (incomplete).
 */
async function upsertSinglePlatformRow(
  userId: number,
  accountIdForPlatform: string,
  row: Record<string, unknown>
): Promise<boolean> {
  const login = pickRowString(row, [
    "LoginNumber__c",
    "loginNumber",
    "login_number",
    "LoginNumber",
    "Login Number",
  ]);
  const serverName = pickRowString(row, [
    "serverName",
    "server_name",
    "Server Name",
    "ServerName__c",
    "ServerNameFormula__c",
  ]);
  if (!login || !serverName) {
    return false;
  }

  const platformRegistrationId = pickRowString(row, ["Id", "id"]);
  if (!platformRegistrationId) {
    return false;
  }

  const accountId = accountIdForPlatform;

  const accountType =
    pickRowString(row, [
      "accountType",
      "account_type",
      "Account Type",
      "AccountType__c",
    ]) || null;
  const clientGroupName =
    pickRowString(row, [
      "clientGroupName",
      "client_group_name",
      "Client Group Name",
      "ClientGroupName__c",
    ]) || null;
  const rawStatus = pickRowString(row, ["Status__c", "status", "Status"]) || null;
  const trimmedStatus = rawStatus?.trim() ?? "";
  const status = trimmedStatus ? trimmedStatus : "Enabled";
  const currency =
    pickRowString(row, ["currency", "Currency", "Currency__c"]) || "USD";
  const leverage =
    pickRowString(row, ["leverage", "Leverage", "Leverage__c"]) || null;
  const nickname = normalizeNullableText(
    pickRowString(row, ["nickname", "Nickname", "Nickname__c"]) || null
  );
  const fixRate =
    pickRowString(row, ["fixRate", "FixRate", "Fix_Rate__c"]) || null;
  const swapFree = normalizeSwapFree(
    pickRowString(row, ["Swap_Free__c"]) ||
      "Tidak"
  );
  const type =
    pickRowString(row, ["type", "Type", "accountCategory", "Type__c"]) ||
    inferTypeFromClientGroupName(clientGroupName) ||
    (pickRowBoolean(row, ["IsLive__c"]) ? "Live" : null) ||
    (pickRowBoolean(row, ["IsDemo__c"]) ? "Demo" : null) ||
    "Live";
  const salesforceCreatedAt = pickSalesforceDate(row, ["RegistrationDate__c"]) || null;

  await pool.query(
    `INSERT INTO platforms (
        platform_registration_id, user_id, account_id, login_number, server_name,
        account_type, client_group_name, status, currency, leverage, nickname,
        fix_rate, swap_free, type, registration_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (platform_registration_id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        account_id = EXCLUDED.account_id,
        login_number = EXCLUDED.login_number,
        server_name = EXCLUDED.server_name,
        account_type = EXCLUDED.account_type,
        client_group_name = EXCLUDED.client_group_name,
        status = EXCLUDED.status,
        currency = EXCLUDED.currency,
        leverage = EXCLUDED.leverage,
        nickname = EXCLUDED.nickname,
        fix_rate = EXCLUDED.fix_rate,
        swap_free = EXCLUDED.swap_free,
        type = EXCLUDED.type,
        registration_date = COALESCE(platforms.registration_date, EXCLUDED.registration_date),
        updated_at = CURRENT_TIMESTAMP`,
    [
      normalizeSalesforceId(platformRegistrationId),
      userId,
      accountId,
      login,
      serverName,
      accountType,
      clientGroupName,
      status,
      currency,
      leverage,
      nickname,
      fixRate,
      swapFree,
      type,
      salesforceCreatedAt,
    ]
  );
  return true;
}

export type SyncPlatformFromSalesforceWebhookResult =
  | { ok: true; action: "inserted" | "updated" }
  | { ok: false; error: string; message: string };

/**
 * Untuk dipanggil dari Salesforce (Outbound Message / Flow): sync satu platform
 * lewat flow Get Platforms by Account or Lead, lalu upsert baris yang Id-nya = platformId.
 */
export async function syncPlatformFromSalesforceWebhook(
  accountOrLeadId: string,
  platformId: string
): Promise<SyncPlatformFromSalesforceWebhookResult> {
  const aid = accountOrLeadId.trim();
  const pid = platformId.trim();
  if (!aid || !pid) {
    return {
      ok: false,
      error: "VALIDATION",
      message: "accountOrLeadId and platformId are required",
    };
  }

  const userResult = await pool.query(
    `SELECT id, account_id FROM users
     WHERE LOWER(TRIM(COALESCE(account_id, ''))) = LOWER($1)
        OR LOWER(TRIM(COALESCE(lead_id, ''))) = LOWER($1)
     LIMIT 1`,
    [aid]
  );

  if (userResult.rows.length === 0) {
    return {
      ok: false,
      error: "USER_NOT_FOUND",
      message: "No user found for this Account or Lead ID",
    };
  }

  const userId = userResult.rows[0].id as number;
  const accountIdForPlatform =
    (userResult.rows[0].account_id &&
      String(userResult.rows[0].account_id).trim()) ||
    aid;

  let rows: Record<string, unknown>[];
  try {
    rows = await getPlatformRowsFromGetPlatformsFlow(aid);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to call Salesforce";
    return { ok: false, error: "SALESFORCE_ERROR", message: msg };
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error: "PLATFORM_NOT_IN_RESPONSE",
      message: "No platform data in Salesforce response",
    };
  }

  const row = rows.find((r) => {
    const id = pickRowString(r, ["Id", "id"]);
    if (!id) return false;
    return salesforceIdsMatch(id, pid);
  });

  if (!row) {
    return {
      ok: false,
      error: "PLATFORM_NOT_IN_RESPONSE",
      message: "Platform not found in Salesforce response for this platformId",
    };
  }

  const flowId = pickRowString(row, ["Id", "id"]);
  const key = flowId ? normalizeSalesforceId(flowId) : normalizeSalesforceId(pid);

  const existing = await pool.query(
    "SELECT id FROM platforms WHERE platform_registration_id = $1",
    [key]
  );
  const action: "inserted" | "updated" =
    existing.rows.length > 0 ? "updated" : "inserted";

  const persisted = await upsertSinglePlatformRow(
    userId,
    accountIdForPlatform,
    row
  );
  if (!persisted) {
    return {
      ok: false,
      error: "ROW_INCOMPLETE",
      message:
        "Incomplete platform data from Salesforce (login, server, or Id)",
    };
  }

  return { ok: true, action };
}

function pickRowString(
  row: Record<string, unknown>,
  candidates: string[]
): string | null {
  const isPlaceholder = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "" ||
      normalized === "-" ||
      normalized === "n/a" ||
      normalized === "na" ||
      normalized === "null"
    );
  };

  for (const key of candidates) {
    const v = row[key];
    if (typeof v === "string" && !isPlaceholder(v)) return v.trim();
  }
  const lowerEntries = Object.entries(row).map(([k, v]) => [
    k.toLowerCase(),
    v,
  ]) as [string, unknown][];
  const byLower = new Map(lowerEntries);
  for (const c of candidates) {
    const v = byLower.get(c.toLowerCase());
    if (typeof v === "string" && !isPlaceholder(v)) return v.trim();
  }
  return null;
}

function pickRowBoolean(
  row: Record<string, unknown>,
  candidates: string[]
): boolean | null {
  for (const key of candidates) {
    const v = row[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const normalized = v.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  const lowerEntries = Object.entries(row).map(([k, v]) => [
    k.toLowerCase(),
    v,
  ]) as [string, unknown][];
  const byLower = new Map(lowerEntries);
  for (const c of candidates) {
    const v = byLower.get(c.toLowerCase());
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const normalized = v.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return null;
}

function normalizeSwapFree(swapFree: string): string {
  if (!swapFree) return "Tidak";
  const normalized = swapFree.trim().toLowerCase();
  if (
    normalized === "ya" ||
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "1"
  ) {
    return "Ya";
  }
  return "Tidak";
}

function normalizeNullableText(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "" ||
    normalized === "-" ||
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "null"
  ) {
    return null;
  }
  return value;
}

function inferTypeFromClientGroupName(clientGroupName: string | null): string | null {
  if (!clientGroupName) return null;
  const normalized = clientGroupName.trim().toLowerCase();
  if (normalized.startsWith("real\\") || normalized.includes("\\real\\")) {
    return "Live";
  }
  if (normalized.startsWith("demo\\") || normalized.includes("\\demo\\")) {
    return "Demo";
  }
  return null;
}

function pickSalesforceDate(
  row: Record<string, unknown>,
  candidates: string[]
): Date | null {
  const raw = pickRowString(row, candidates);
  if (!raw) return null;

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isPlatformish(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const keys = Object.keys(obj as Record<string, unknown>).map((k) =>
    k.toLowerCase()
  );
  const hasLogin = keys.some((k) => k.includes("login"));
  const hasServer = keys.some((k) => k.includes("server"));
  return hasLogin && hasServer;
}

function tryParseJsonString(value: string): unknown {
  const t = value.trim();
  if (!t.startsWith("[") && !t.startsWith("{")) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function deepFindPlatformRows(node: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 14) return [];
  if (typeof node === "string") {
    const parsed = tryParseJsonString(node);
    if (parsed !== null) {
      return deepFindPlatformRows(parsed, depth + 1);
    }
    return [];
  }
  if (Array.isArray(node)) {
    if (
      node.length > 0 &&
      node.every((x): x is Record<string, unknown> => isPlatformish(x))
    ) {
      return node;
    }
    for (const item of node) {
      const found = deepFindPlatformRows(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (node && typeof node === "object") {
    for (const v of Object.values(node)) {
      const found = deepFindPlatformRows(v, depth + 1);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function unwrapTopLevel(data: unknown): unknown {
  if (!Array.isArray(data) || data.length === 0) return data;
  const first = data[0];
  if (first && typeof first === "object" && "results" in first) {
    return (first as { results: unknown }).results;
  }
  return data;
}

function flowOutputRoot(data: unknown): unknown {
  const unwrapped = unwrapTopLevel(data);
  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    !Array.isArray(unwrapped) &&
    Array.isArray((unwrapped as { results?: unknown }).results)
  ) {
    const results = (unwrapped as { results: unknown[] }).results;
    const first = results[0];
    if (first && typeof first === "object" && "outputValues" in first) {
      return (first as { outputValues: unknown }).outputValues;
    }
  }
  return unwrapped;
}

function extractPlatformRowsFromFlow(data: unknown): Record<string, unknown>[] {
  const root = flowOutputRoot(data);
  const fromTree = deepFindPlatformRows(root);
  if (fromTree.length > 0) return fromTree;
  const fromScan = deepFindPlatformRows(data);
  if (fromScan.length > 0) return fromScan;
  if (isPlatformish(root)) {
    return [root];
  }
  return [];
}

/**
 * Calls Salesforce Get Platforms flow and upserts rows into `platforms` for this user.
 */
export async function fetchAndPersistPlatformsForUser(
  userId: number,
  accountOrLeadId: string
): Promise<void> {
  const userResult = await pool.query(
    "SELECT account_id, lead_id FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );

  const normalizedAccountId =
    userResult.rows[0]?.account_id &&
    String(userResult.rows[0].account_id).trim()
      ? String(userResult.rows[0].account_id).trim()
      : null;
  const normalizedLeadId =
    userResult.rows[0]?.lead_id && String(userResult.rows[0].lead_id).trim()
      ? String(userResult.rows[0].lead_id).trim()
      : null;
  const normalizedAccountOrLeadId = accountOrLeadId.trim() || null;

  // Some users are not backfilled with account_id yet; keep sync working
  // by falling back to lead_id / token id used to call Salesforce flow.
  const userAccountId =
    normalizedAccountId || normalizedLeadId || normalizedAccountOrLeadId;

  if (!userAccountId) {
    throw new Error("User account_id not found in users table");
  }

  const rows = await getPlatformRowsFromGetPlatformsFlow(accountOrLeadId);
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    await upsertSinglePlatformRow(userId, userAccountId, row);
  }
}
