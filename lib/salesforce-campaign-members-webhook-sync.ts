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
  fetched: number;
  updated: number;
  skipped: number;
  notInDatabase: number;
};

/** Webhook mode: update existing campaign_members only (never insert). */
export async function updateExistingCampaignMembersFromSfRecords(
  records: SfCampaignMemberRecord[]
): Promise<UpdateExistingCampaignMembersResult> {
  let updated = 0;
  let skipped = 0;
  let notInDatabase = 0;

  for (const rec of records) {
    const row = mapSfCampaignMemberToDbRow(rec);
    if (!row) {
      skipped += 1;
      continue;
    }

    const result = await pool.query(
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
