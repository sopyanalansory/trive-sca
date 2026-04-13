import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  syncUserCampaignMembersFromSalesforce,
} from "@/lib/salesforce-campaign-members-sync";
import { apiLogger, logRouteError } from "@/lib/logger";

const log = apiLogger("campaigns:get");

type CampaignRow = {
  id: number;
  campaign_id_from_salesforce: string;
  banner_url: string | null;
  name: string;
  description: string | null;
  terms_conditions_url: string | null;
  see_details_url: string | null;
  share_banner_url: string | null;
  share_url: string | null;
  reward_title: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type CampaignMemberRow = {
  id: number;
  campaign_id: number;
  campaign_id_from_salesforce: string;
  client_id: string | null;
  contact_id: string | null;
  lead_or_contact_id: string | null;
  lead_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type UserRow = {
  id: number;
  email: string;
  phone: string | null;
  country_code: string | null;
  client_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
};

async function hasSyncedCampaignMembers(userId: number): Promise<boolean> {
  const result = await pool.query(
    `
    SELECT synced_at
    FROM user_campaign_salesforce_sync
    WHERE user_id = $1
      AND synced_at IS NOT NULL
    LIMIT 1
    `,
    [userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

async function getUserById(userId: number): Promise<UserRow | null> {
  const result = await pool.query(
    `
    SELECT id, email, phone, country_code, client_id, contact_id, lead_id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );
  return (result.rows[0] as UserRow | undefined) ?? null;
}

async function getActiveCampaigns(): Promise<CampaignRow[]> {
  const result = await pool.query(
    `
    SELECT
      id,
      campaign_id_from_salesforce,
      banner_url,
      name,
      description,
      terms_conditions_url,
      see_details_url,
      share_banner_url,
      share_url,
      reward_title,
      is_active,
      start_date::text,
      end_date::text,
      status
    FROM campaigns
    WHERE is_active = true
    ORDER BY start_date DESC NULLS LAST, created_at DESC
    `
  );
  return result.rows as CampaignRow[];
}

async function getUserCampaignMembers(user: UserRow): Promise<CampaignMemberRow[]> {
  const clauses: string[] = [];
  const values: string[] = [];
  let index = 1;

  if (user.client_id) {
    clauses.push(`cm.client_id = $${index++}`);
    values.push(user.client_id);
  }
  if (user.contact_id) {
    clauses.push(`cm.contact_id = $${index++}`);
    values.push(user.contact_id);
    clauses.push(`cm.lead_or_contact_id = $${index++}`);
    values.push(user.contact_id);
  }
  if (user.lead_id) {
    clauses.push(`cm.lead_id = $${index++}`);
    values.push(user.lead_id);
    clauses.push(`cm.lead_or_contact_id = $${index++}`);
    values.push(user.lead_id);
  }

  if (clauses.length === 0) return [];

  const result = await pool.query(
    `
    SELECT
      cm.id,
      cm.campaign_id,
      cm.campaign_id_from_salesforce,
      cm.client_id,
      cm.contact_id,
      cm.lead_or_contact_id,
      cm.lead_id,
      cm.created_at,
      cm.updated_at
    FROM campaign_members cm
    WHERE ${clauses.join(" OR ")}
    ORDER BY cm.created_at DESC
    `,
    values
  );

  return result.rows as CampaignMemberRow[];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;
    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah kadaluarsa" },
        { status: 401 }
      );
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const alreadySynced = await hasSyncedCampaignMembers(user.id);
    let syncTriggered = false;

    if (!alreadySynced) {
      syncTriggered = true;
      if (user.phone && user.email) {
        await syncUserCampaignMembersFromSalesforce({
          id: user.id,
          email: user.email,
          phone: user.phone,
          countryCode: user.country_code,
          clientId: user.client_id,
          contactId: user.contact_id,
          leadId: user.lead_id,
        });
      } else {
        await pool.query(
          `
          INSERT INTO user_campaign_salesforce_sync (user_id, synced_at)
          VALUES ($1, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id)
          DO UPDATE SET synced_at = EXCLUDED.synced_at
          `,
          [user.id]
        );
      }
    }

    const refreshedUser = (await getUserById(user.id)) ?? user;
    const [campaigns, campaignMembers] = await Promise.all([
      getActiveCampaigns(),
      getUserCampaignMembers(refreshedUser),
    ]);

    const registeredCampaignIds = new Set(
      campaignMembers.map((member) => member.campaign_id_from_salesforce)
    );

    return NextResponse.json(
      {
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          campaignIdFromSalesforce: campaign.campaign_id_from_salesforce,
          bannerUrl: campaign.banner_url,
          name: campaign.name,
          description: campaign.description,
          termsConditionsUrl: campaign.terms_conditions_url,
          seeDetailsUrl: campaign.see_details_url,
          shareBannerUrl: campaign.share_banner_url,
          shareUrl: campaign.share_url,
          rewardTitle: campaign.reward_title,
          isActive: campaign.is_active,
          startDate: campaign.start_date,
          endDate: campaign.end_date,
          status: campaign.status,
          isRegistered: registeredCampaignIds.has(
            campaign.campaign_id_from_salesforce
          ),
        })),
        campaignMembers:
          campaignMembers.length > 0
            ? campaignMembers.map((member) => ({
                id: member.id,
                campaignId: member.campaign_id,
                campaignIdFromSalesforce: member.campaign_id_from_salesforce,
                clientId: member.client_id,
                contactId: member.contact_id,
                leadOrContactId: member.lead_or_contact_id,
                leadId: member.lead_id,
                createdAt: member.created_at,
                updatedAt: member.updated_at,
              }))
            : null,
        sync: {
          triggered: syncTriggered,
          source: syncTriggered ? "salesforce" : "db",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, "Get campaigns failed");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data campaign." },
      { status: 500 }
    );
  }
}
