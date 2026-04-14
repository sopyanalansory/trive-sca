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

/**
 * Parse webhook payload for delete campaign members.
 * Accepts:
 * - { campaignMembers: [ { Id }, ... ] }
 * - { ids: [ "00v...", ... ] }
 * - [ { Id }, ... ]
 * - single object { Id: "00v..." }
 */
export function extractCampaignMemberIdsFromDeletePayload(
  body: unknown
): string[] {
  if (body == null) return [];

  if (Array.isArray(body)) {
    return body
      .map((item) => {
        if (item == null || typeof item !== "object") return null;
        return cleanString((item as SfCampaignMemberRecord).Id);
      })
      .filter((id): id is string => !!id);
  }

  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;

    const singleId = cleanString(obj.Id);
    if (singleId) return [singleId];

    if (Array.isArray(obj.ids)) {
      return obj.ids
        .map((id) => cleanString(id))
        .filter((id): id is string => !!id);
    }

    if (Array.isArray(obj.campaignMembers)) {
      return obj.campaignMembers
        .map((item) => {
          if (item == null || typeof item !== "object") return null;
          return cleanString((item as SfCampaignMemberRecord).Id);
        })
        .filter((id): id is string => !!id);
    }
  }

  return [];
}

export type DeleteCampaignMembersResult = {
  fetched: number;
  deleted: number;
  skipped: number;
  notInDatabase: number;
};

export async function deleteCampaignMembersBySfIds(
  ids: string[]
): Promise<DeleteCampaignMembersResult> {
  let deleted = 0;
  let skipped = 0;
  let notInDatabase = 0;

  for (const id of ids) {
    const sfCampaignMemberId = cleanString(id);
    if (!sfCampaignMemberId) {
      skipped += 1;
      continue;
    }

    const result = await pool.query(
      `
      DELETE FROM campaign_members
      WHERE campaign_member_id_from_salesforce = $1
      `,
      [sfCampaignMemberId]
    );

    const n = result.rowCount ?? 0;
    if (n === 0) {
      notInDatabase += 1;
    } else {
      deleted += n;
    }
  }

  return {
    fetched: ids.length,
    deleted,
    skipped,
    notInDatabase,
  };
}
