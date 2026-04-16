import pool from "@/lib/db";

type SfCampaignMemberRecord = Record<string, unknown>;

function cleanString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length ? trimmed : null;
  }
  const asString = String(v).trim();
  return asString.length ? asString : null;
}

function mapCampaignMemberStatusLabel(statusCode: string | null): string | null {
  if (!statusCode) return null;
  switch (statusCode) {
    case "1":
      return "Applicant";
    case "2":
      return "Application Rejected";
    case "3":
      return "Registered";
    case "4":
      return "Claimed";
    case "5":
      return "Claim Rejected";
    case "6":
      return "Eligible for Claim";
    default:
      return statusCode;
  }
}

/**
 * Parse webhook body for Salesforce Campaign Member updates.
 * Accepts:
 * - { campaignMembers: [ { Id, CampaignId, Status, Selected_Rewards__c }, ... ] }
 * - [ { Id, CampaignId, Status, Selected_Rewards__c }, ... ]
 * - single object { Id, ... }
 */
export function extractCampaignMemberArrayFromWebhookPayload(
  body: unknown
): SfCampaignMemberRecord[] {
  if (body == null) return [];
  if (Array.isArray(body)) {
    return body.filter(
      (item): item is SfCampaignMemberRecord =>
        item != null && typeof item === "object"
    );
  }

  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.campaignMembers)) {
      return obj.campaignMembers.filter(
        (item): item is SfCampaignMemberRecord =>
          item != null && typeof item === "object"
      );
    }
    if (cleanString(obj.Id)) {
      return [obj as SfCampaignMemberRecord];
    }
  }

  return [];
}

type MappedCampaignMemberRow = {
  campaignMemberIdFromSalesforce: string;
  campaignIdFromSalesforce: string | null;
  statusCode: string | null;
  statusLabel: string | null;
  selectedRewards: string | null;
};

function mapSfCampaignMemberToDbRow(
  rec: SfCampaignMemberRecord
): MappedCampaignMemberRow | null {
  const campaignMemberIdFromSalesforce = cleanString(rec.Id);
  if (!campaignMemberIdFromSalesforce) return null;

  const campaignIdFromSalesforce = cleanString(rec.CampaignId);
  const statusRaw = cleanString(rec.Status);
  const statusCode = statusRaw;
  const statusLabel = mapCampaignMemberStatusLabel(statusRaw);
  const selectedRewards = cleanString(rec.Selected_Rewards__c);

  return {
    campaignMemberIdFromSalesforce,
    campaignIdFromSalesforce,
    statusCode,
    statusLabel,
    selectedRewards,
  };
}

export type UpdateExistingCampaignMembersResult = {
  userFound: boolean;
  fetched: number;
  updated: number;
  inserted: number;
  skipped: number;
  notInDatabase: number;
};

type UserRow = {
  id: number;
  client_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
};

async function findUserByContactOrLeadId(
  contactOrLeadId: string
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `
    SELECT id, client_id, contact_id, lead_id
    FROM users
    WHERE contact_id = $1 OR lead_id = $1
    ORDER BY id DESC
    LIMIT 1
    `,
    [contactOrLeadId]
  );
  return result.rows[0] ?? null;
}

/** Webhook mode: validate user first, then upsert campaign_members by Salesforce Campaign Member Id. */
export async function upsertCampaignMembersFromSfRecords(
  records: SfCampaignMemberRecord[],
  contactOrLeadId: string
): Promise<UpdateExistingCampaignMembersResult> {
  const user = await findUserByContactOrLeadId(contactOrLeadId);
  if (!user) {
    return {
      userFound: false,
      fetched: records.length,
      updated: 0,
      inserted: 0,
      skipped: records.length,
      notInDatabase: 0,
    };
  }

  let updated = 0;
  let inserted = 0;
  let skipped = 0;
  let notInDatabase = 0;

  for (const rec of records) {
    const row = mapSfCampaignMemberToDbRow(rec);
    if (!row) {
      skipped += 1;
      continue;
    }

    const updateResult = await pool.query(
      `
      UPDATE campaign_members cm
      SET
        campaign_id_from_salesforce = COALESCE($2, cm.campaign_id_from_salesforce),
        campaign_id = COALESCE(
          (SELECT c.id FROM campaigns c WHERE c.campaign_id_from_salesforce = $2 LIMIT 1),
          cm.campaign_id
        ),
        status_code = $3,
        status_label = $4,
        selected_rewards = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE cm.campaign_member_id_from_salesforce = $1
      `,
      [
        row.campaignMemberIdFromSalesforce,
        row.campaignIdFromSalesforce,
        row.statusCode,
        row.statusLabel,
        row.selectedRewards,
      ]
    );

    const n = updateResult.rowCount ?? 0;
    if (n > 0) {
      updated += 1;
      continue;
    }

    notInDatabase += 1;
    if (!row.campaignIdFromSalesforce) {
      skipped += 1;
      continue;
    }

    const insertResult = await pool.query(
      `
      INSERT INTO campaign_members (
        campaign_id,
        campaign_id_from_salesforce,
        campaign_member_id_from_salesforce,
        client_id,
        contact_id,
        lead_or_contact_id,
        lead_id,
        status_code,
        status_label,
        selected_rewards
      )
      SELECT
        c.id,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      FROM campaigns c
      WHERE c.campaign_id_from_salesforce::text = $10::text
      `,
      [
        row.campaignIdFromSalesforce,
        row.campaignMemberIdFromSalesforce,
        user.client_id,
        user.contact_id,
        contactOrLeadId,
        user.lead_id,
        row.statusCode,
        row.statusLabel,
        row.selectedRewards,
        row.campaignIdFromSalesforce,
      ]
    );

    if ((insertResult.rowCount ?? 0) > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    userFound: true,
    fetched: records.length,
    updated,
    inserted,
    skipped,
    notInDatabase,
  };
}
