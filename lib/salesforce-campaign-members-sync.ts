import pool from "@/lib/db";
import { toMsisdn } from "@/lib/phone";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

const DEFAULT_SEARCH_CLIENT_FLOW_URL =
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Search_Client_by_Email";

function getSearchClientFlowUrl(): string {
  return (
    process.env.SALESFORCE_SEARCH_CLIENT_FLOW_URL || DEFAULT_SEARCH_CLIENT_FLOW_URL
  );
}

type CampaignMemberPayload = {
  CampaignId?: string | null;
  ClientId__c?: string | null;
  ContactId?: string | null;
  LeadOrContactId?: string | null;
  LeadId?: string | null;
  [key: string]: unknown;
};

type SearchClientOutput = {
  message?: string;
  clientId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  campaignMembers?: CampaignMemberPayload[] | null;
  [key: string]: unknown;
};

type SearchClientResult = {
  isSuccess?: boolean;
  outputValues?: SearchClientOutput;
  message?: string;
  [key: string]: unknown;
};

type UserContext = {
  id: number;
  email: string;
  phone: string;
  countryCode: string | null;
  clientId: string | null;
  contactId: string | null;
  leadId: string | null;
};

export type CampaignMemberSyncResult = {
  synced: boolean;
  campaignMembersCount: number;
  usedSalesforce: boolean;
};

function cleanString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function extractOutputValues(parsed: unknown): SearchClientOutput | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const first = parsed[0] as SearchClientResult;
  if (first?.isSuccess === false) return null;
  return first?.outputValues ?? null;
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

async function postSearchClientFlow(
  accessToken: string,
  email: string,
  phoneMsisdn: string
): Promise<Response> {
  return fetch(getSearchClientFlowUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ email, phone: phoneMsisdn }],
    }),
    cache: "no-store",
  });
}

function buildDeleteQueryConditions(identifiers: {
  clientId: string | null;
  contactId: string | null;
  leadId: string | null;
}) {
  const clauses: string[] = [];
  const values: string[] = [];
  let index = 1;

  if (identifiers.clientId) {
    clauses.push(`client_id = $${index++}`);
    values.push(identifiers.clientId);
  }
  if (identifiers.contactId) {
    clauses.push(`contact_id = $${index++}`);
    values.push(identifiers.contactId);
    clauses.push(`lead_or_contact_id = $${index++}`);
    values.push(identifiers.contactId);
  }
  if (identifiers.leadId) {
    clauses.push(`lead_id = $${index++}`);
    values.push(identifiers.leadId);
    clauses.push(`lead_or_contact_id = $${index++}`);
    values.push(identifiers.leadId);
  }

  return { clauses, values };
}

export async function syncUserCampaignMembersFromSalesforce(
  user: UserContext
): Promise<CampaignMemberSyncResult> {
  const normalizedEmail = user.email.toLowerCase().trim();
  const msisdn = toMsisdn(user.phone, user.countryCode || "+62");
  const token = await getValidAccessToken();

  let response = await postSearchClientFlow(token, normalizedEmail, msisdn);
  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    response = await postSearchClientFlow(fresh.access_token, normalizedEmail, msisdn);
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Salesforce Search Client response is not valid JSON");
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Search Client failed: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  const output = extractOutputValues(parsed);
  const sfClientId = cleanString(output?.clientId);
  const sfContactId = cleanString(output?.contactId);
  const sfLeadId = cleanString(output?.leadId);
  const campaignMembers = Array.isArray(output?.campaignMembers)
    ? output?.campaignMembers
    : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET
        client_id = COALESCE($2, client_id),
        contact_id = COALESCE($3, contact_id),
        lead_id = COALESCE($4, lead_id)
      WHERE id = $1
      `,
      [user.id, sfClientId, sfContactId, sfLeadId]
    );

    const deleteTarget = {
      clientId: sfClientId || user.clientId,
      contactId: sfContactId || user.contactId,
      leadId: sfLeadId || user.leadId,
    };
    const deleteFilters = buildDeleteQueryConditions(deleteTarget);
    if (deleteFilters.clauses.length > 0) {
      await client.query(
        `
        DELETE FROM campaign_members
        WHERE ${deleteFilters.clauses.join(" OR ")}
        `,
        deleteFilters.values
      );
    }

    let inserted = 0;
    for (const member of campaignMembers) {
      const campaignIdFromSf = cleanString(member.CampaignId);
      if (!campaignIdFromSf) continue;

      const memberClientId =
        cleanString(member.ClientId__c) || sfClientId || user.clientId;
      const memberContactId =
        cleanString(member.ContactId) || sfContactId || user.contactId;
      const memberLeadOrContactId =
        cleanString(member.LeadOrContactId) ||
        memberContactId ||
        cleanString(member.LeadId) ||
        sfLeadId ||
        user.leadId;
      const memberLeadId =
        cleanString(member.LeadId) || sfLeadId || user.leadId;

      const insertedResult = await client.query(
        `
        INSERT INTO campaign_members (
          campaign_id,
          campaign_id_from_salesforce,
          client_id,
          contact_id,
          lead_or_contact_id,
          lead_id
        )
        SELECT
          c.id,
          $1,
          $2,
          $3,
          $4,
          $5
        FROM campaigns c
        WHERE c.campaign_id_from_salesforce::text = $6::text
        `,
        [
          campaignIdFromSf,
          memberClientId,
          memberContactId,
          memberLeadOrContactId,
          memberLeadId,
          campaignIdFromSf,
        ]
      );
      inserted += insertedResult.rowCount ?? 0;
    }

    await client.query(
      `
      INSERT INTO user_campaign_salesforce_sync (user_id, synced_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET synced_at = EXCLUDED.synced_at
      `,
      [user.id]
    );

    await client.query("COMMIT");
    return {
      synced: true,
      campaignMembersCount: inserted,
      usedSalesforce: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
