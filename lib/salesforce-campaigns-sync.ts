import pool from "@/lib/db";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

const DEFAULT_GET_CAMPAIGNS_FLOW_URL =
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Get_Campaigns";

export function getGetCampaignsFlowUrl(): string {
  return (
    process.env.SALESFORCE_GET_CAMPAIGNS_FLOW_URL || DEFAULT_GET_CAMPAIGNS_FLOW_URL
  );
}

type SfCampaignRecord = Record<string, unknown>;

function truncateStr(value: string | null, max: number): string | null {
  if (value == null) return null;
  if (value.length <= max) return value;
  return value.slice(0, max);
}

function strField(rec: SfCampaignRecord, key: string): string | null {
  const v = rec[key];
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  return String(v);
}

function parseDateOnly(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toBool(value: unknown, defaultTrue: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const n = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(n)) return true;
    if (["false", "0", "no"].includes(n)) return false;
  }
  return defaultTrue;
}

/**
 * Parse webhook / outbound body from Salesforce (JSON). Accepts:
 * - `{ campaigns: [ { Id, Name, ... }, ... ] }`
 * - `[ { Id, ... }, ... ]`
 * - single object `{ Id, ... }` (one campaign)
 */
export function extractCampaignArrayFromWebhookPayload(
  body: unknown
): SfCampaignRecord[] {
  if (body == null) return [];
  if (Array.isArray(body)) {
    return body.filter(
      (c): c is SfCampaignRecord => c != null && typeof c === "object"
    );
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.campaigns)) {
      return o.campaigns.filter(
        (c): c is SfCampaignRecord => c != null && typeof c === "object"
      );
    }
    if (typeof o.Id === "string" && o.Id.trim()) {
      return [o as SfCampaignRecord];
    }
  }
  return [];
}

export function extractCampaignsFromFlowResponse(parsed: unknown): SfCampaignRecord[] {
  const arr = Array.isArray(parsed) ? parsed : null;
  if (!arr?.length) return [];

  const first = arr[0] as {
    isSuccess?: boolean;
    outputValues?: { campaigns?: unknown; message?: string };
  };

  if (first?.isSuccess === false) return [];

  const raw = first?.outputValues?.campaigns;
  if (!Array.isArray(raw)) return [];

  return raw.filter((c): c is SfCampaignRecord => c != null && typeof c === "object");
}

function mapSfCampaignToDbRow(rec: SfCampaignRecord) {
  const id = strField(rec, "Id");
  if (!id) return null;

  const isDeleted = toBool(rec.IsDeleted, false);
  const nameRaw = strField(rec, "Name");
  const name = truncateStr(nameRaw || `Campaign ${id}`, 500);
  if (!name) return null;

  return {
    campaign_id_from_salesforce: id.slice(0, 255),
    banner_url: truncateStr(strField(rec, "Campaign_Banner__c"), 1000),
    name,
    description: strField(rec, "Description"),
    terms_conditions_url: truncateStr(
      strField(rec, "Campaign_Terms_Conditions__c"),
      1000
    ),
    see_details_url: truncateStr(strField(rec, "Details__c"), 1000),
    share_banner_url: truncateStr(strField(rec, "Campaign_Share_Banner__c"), 1000),
    share_url: truncateStr(strField(rec, "Campaign_Share_Link__c"), 1000),
    reward_title: truncateStr(strField(rec, "Reward_Title__c"), 500),
    rewards_01: strField(rec, "Rewards_01__c"),
    is_active: isDeleted ? false : toBool(rec.IsActive, true),
    start_date: parseDateOnly(strField(rec, "StartDate")),
    end_date: parseDateOnly(strField(rec, "EndDate")),
    status: truncateStr(strField(rec, "Status") || "draft", 50) || "draft",
  };
}

async function postGetCampaignsFlow(accessToken: string): Promise<Response> {
  return fetch(getGetCampaignsFlowUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ version: "1" }],
    }),
    cache: "no-store",
  });
}

export async function fetchCampaignsFromSalesforceFlow(): Promise<SfCampaignRecord[]> {
  let token = await getLatestValidSalesforceToken();
  if (!token) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    token = fresh.access_token;
  }

  let response = await postGetCampaignsFlow(token);

  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    response = await postGetCampaignsFlow(fresh.access_token);
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Salesforce Get Campaigns response is not valid JSON");
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Get Campaigns failed: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  return extractCampaignsFromFlowResponse(parsed);
}

export type SyncCampaignsResult = {
  fetched: number;
  upserted: number;
  skipped: number;
};

export async function upsertCampaignsFromSfRecords(
  records: SfCampaignRecord[]
): Promise<SyncCampaignsResult> {
  let upserted = 0;
  let skipped = 0;

  for (const rec of records) {
    const row = mapSfCampaignToDbRow(rec);
    if (!row) {
      skipped += 1;
      continue;
    }

    await pool.query(
      `
      INSERT INTO campaigns (
        campaign_id_from_salesforce,
        banner_url,
        name,
        description,
        terms_conditions_url,
        see_details_url,
        share_banner_url,
        share_url,
        reward_title,
        rewards_01,
        is_active,
        start_date,
        end_date,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (campaign_id_from_salesforce) DO UPDATE SET
        banner_url = EXCLUDED.banner_url,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        terms_conditions_url = EXCLUDED.terms_conditions_url,
        see_details_url = EXCLUDED.see_details_url,
        share_banner_url = EXCLUDED.share_banner_url,
        share_url = EXCLUDED.share_url,
        reward_title = EXCLUDED.reward_title,
        rewards_01 = EXCLUDED.rewards_01,
        is_active = EXCLUDED.is_active,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        row.campaign_id_from_salesforce,
        row.banner_url,
        row.name,
        row.description,
        row.terms_conditions_url,
        row.see_details_url,
        row.share_banner_url,
        row.share_url,
        row.reward_title,
        row.rewards_01,
        row.is_active,
        row.start_date,
        row.end_date,
        row.status,
      ]
    );
    upserted += 1;
  }

  return { fetched: records.length, upserted, skipped };
}

/** Webhook: only UPDATE rows that already exist; never INSERT. */
export type UpdateExistingCampaignsResult = {
  fetched: number;
  updated: number;
  skipped: number;
  notInDatabase: number;
};

export async function updateExistingCampaignsFromSfRecords(
  records: SfCampaignRecord[]
): Promise<UpdateExistingCampaignsResult> {
  let updated = 0;
  let skipped = 0;
  let notInDatabase = 0;

  for (const rec of records) {
    const row = mapSfCampaignToDbRow(rec);
    if (!row) {
      skipped += 1;
      continue;
    }

    const result = await pool.query(
      `
      UPDATE campaigns SET
        banner_url = $2,
        name = $3,
        description = $4,
        terms_conditions_url = $5,
        see_details_url = $6,
        share_banner_url = $7,
        share_url = $8,
        reward_title = $9,
        rewards_01 = $10,
        is_active = $11,
        start_date = $12,
        end_date = $13,
        status = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE campaign_id_from_salesforce = $1
      `,
      [
        row.campaign_id_from_salesforce,
        row.banner_url,
        row.name,
        row.description,
        row.terms_conditions_url,
        row.see_details_url,
        row.share_banner_url,
        row.share_url,
        row.reward_title,
        row.rewards_01,
        row.is_active,
        row.start_date,
        row.end_date,
        row.status,
      ]
    );

    const n = result.rowCount ?? 0;
    if (n === 0) {
      notInDatabase += 1;
    } else {
      updated += 1;
    }
  }

  return {
    fetched: records.length,
    updated,
    skipped,
    notInDatabase,
  };
}

export async function syncCampaignsFromSalesforce(): Promise<SyncCampaignsResult> {
  const records = await fetchCampaignsFromSalesforceFlow();
  return upsertCampaignsFromSfRecords(records);
}
