import crypto from "node:crypto";
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

function pickRowString(
  row: Record<string, unknown>,
  candidates: string[]
): string | null {
  for (const key of candidates) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const lowerEntries = Object.entries(row).map(([k, v]) => [
    k.toLowerCase(),
    v,
  ]) as [string, unknown][];
  const byLower = new Map(lowerEntries);
  for (const c of candidates) {
    const v = byLower.get(c.toLowerCase());
    if (typeof v === "string" && v.trim()) return v.trim();
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

function normalizeStatus(status: string): string {
  if (!status) return "Enabled";
  const normalized = status.trim();
  if (normalized === "Read-Only" || normalized === "Disabled") {
    return normalized;
  }
  return "Enabled";
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

function syntheticRegistrationId(userId: number, login: string, server: string): string {
  const h = crypto
    .createHash("sha256")
    .update(`${userId}\0${login}\0${server}`)
    .digest("hex")
    .slice(0, 24);
  return `SF:${userId}:${h}`.slice(0, 100);
}

/**
 * Calls Salesforce Get Platforms flow and upserts rows into `platforms` for this user.
 */
export async function fetchAndPersistPlatformsForUser(
  userId: number,
  accountOrLeadId: string,
  userAccountId: string | null
): Promise<void> {
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
    throw new Error("Respons Salesforce platforms bukan JSON valid");
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Get Platforms gagal: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  const rows = extractPlatformRowsFromFlow(parsed);
  if (rows.length === 0) {
    return;
  }

  const firstRow = rows[0];
  const defaultAccountId =
    userAccountId?.trim() ||
    (firstRow
      ? pickRowString(firstRow, ["accountId", "account_id", "AccountId"])
      : null) ||
    accountOrLeadId;

  for (const row of rows) {
    const login = pickRowString(row, [
      "loginNumber",
      "login_number",
      "LoginNumber",
      "Login Number",
      "LoginNumber__c",
    ]);
    const serverName = pickRowString(row, [
      "serverName",
      "server_name",
      "Server Name",
      "ServerName__c",
      "ServerNameFormula__c",
    ]);
    if (!login || !serverName) {
      continue;
    }

    const platformRegistrationId =
      pickRowString(row, [
        "platformRegistrationId",
        "platform_registration_id",
        "Platform_Registration_ID",
        "Platform Registration ID",
        "Id",
        "id",
        "Long_ID__c",
      ]) || syntheticRegistrationId(userId, login, serverName);

    const accountId =
      pickRowString(row, [
        "accountId",
        "account_id",
        "AccountId",
        "Account: Account ID",
        "Account__c",
        "Lead__c",
      ]) || defaultAccountId;

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
    const status = normalizeStatus(
      pickRowString(row, ["status", "Status", "Status__c"]) || "Enabled"
    );
    const currency =
      pickRowString(row, ["currency", "Currency", "Currency__c"]) || "USD";
    const leverage =
      pickRowString(row, ["leverage", "Leverage", "Leverage__c"]) || null;
    const swapFree = normalizeSwapFree(
      pickRowString(row, ["swapFree", "swap_free", "Swap Free", "SwapFree__c"]) ||
        "Tidak"
    );
    const type =
      pickRowString(row, ["type", "Type", "accountCategory", "Type__c"]) ||
      (pickRowBoolean(row, ["IsLive__c"]) ? "Live" : null) ||
      (pickRowBoolean(row, ["IsDemo__c"]) ? "Demo" : null) ||
      "Live";

    await pool.query(
      `INSERT INTO platforms (
        platform_registration_id, user_id, account_id, login_number, server_name,
        account_type, client_group_name, status, currency, leverage, swap_free, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        swap_free = EXCLUDED.swap_free,
        type = EXCLUDED.type,
        updated_at = CURRENT_TIMESTAMP`,
      [
        platformRegistrationId.slice(0, 100),
        userId,
        accountId,
        login,
        serverName,
        accountType,
        clientGroupName,
        status,
        currency,
        leverage,
        swapFree,
        type,
      ]
    );
  }
}
