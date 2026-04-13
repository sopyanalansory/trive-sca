import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";
import { apiLogger, logRouteError } from "@/lib/logger";

const log = apiLogger("campaigns:register");

const DEFAULT_REGISTER_CAMPAIGN_FLOW_URL =
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Register_Campaign";

type RegisterCampaignOutput = {
  message?: string | null;
  campaignMember?: {
    CampaignId?: string | null;
    ClientId__c?: string | null;
    ContactId?: string | null;
    LeadOrContactId?: string | null;
    LeadId?: string | null;
    Id?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type RegisterCampaignResult = {
  isSuccess?: boolean;
  outputValues?: RegisterCampaignOutput;
  errors?: unknown;
  [key: string]: unknown;
};

type UserRow = {
  id: number;
  email: string;
  client_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
};

function cleanString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function getRegisterCampaignFlowUrl(): string {
  return (
    process.env.SALESFORCE_REGISTER_CAMPAIGN_FLOW_URL ||
    DEFAULT_REGISTER_CAMPAIGN_FLOW_URL
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

async function postRegisterCampaignFlow(
  accessToken: string,
  leadOrContactId: string,
  campaignIdFromSalesforce: string
): Promise<Response> {
  return fetch(getRegisterCampaignFlowUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ leadOrContactId, campaignId: campaignIdFromSalesforce }],
    }),
    cache: "no-store",
  });
}

function parseRegisterCampaignOutput(parsed: unknown): RegisterCampaignOutput | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const first = parsed[0] as RegisterCampaignResult;
  if (first?.isSuccess === false) return null;
  return first?.outputValues ?? null;
}

async function getUserById(userId: number): Promise<UserRow | null> {
  const result = await pool.query(
    `
    SELECT id, email, client_id, contact_id, lead_id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );
  return (result.rows[0] as UserRow | undefined) ?? null;
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const campaignIdFromSalesforce = cleanString(
      body?.campaignIdFromSalesforce ?? body?.campaignId
    );
    if (!campaignIdFromSalesforce) {
      return NextResponse.json(
        { error: "campaignIdFromSalesforce wajib diisi" },
        { status: 400 }
      );
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const leadOrContactId = user.contact_id || user.lead_id;
    if (!leadOrContactId) {
      return NextResponse.json(
        {
          error:
            "User belum memiliki contact_id/lead_id. Silakan sync profile dari Salesforce terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const campaignResult = await pool.query(
      `
      SELECT id, campaign_id_from_salesforce, is_active
      FROM campaigns
      WHERE campaign_id_from_salesforce = $1
      LIMIT 1
      `,
      [campaignIdFromSalesforce]
    );

    if (campaignResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Campaign tidak ditemukan di database" },
        { status: 404 }
      );
    }

    const campaign = campaignResult.rows[0] as {
      id: number;
      campaign_id_from_salesforce: string;
      is_active: boolean;
    };

    if (!campaign.is_active) {
      return NextResponse.json(
        { error: "Campaign tidak aktif" },
        { status: 400 }
      );
    }

    // Validasi sudah register atau belum (lokal DB)
    const duplicateCheck = await pool.query(
      `
      SELECT id
      FROM campaign_members
      WHERE campaign_id = $1
        AND (
          ($2::text IS NOT NULL AND client_id = $2)
          OR ($3::text IS NOT NULL AND contact_id = $3)
          OR ($4::text IS NOT NULL AND lead_id = $4)
          OR ($5::text IS NOT NULL AND lead_or_contact_id = $5)
        )
      LIMIT 1
      `,
      [campaign.id, user.client_id, user.contact_id, user.lead_id, leadOrContactId]
    );
    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "User sudah terdaftar di campaign ini" },
        { status: 409 }
      );
    }

    const accessToken = await getValidAccessToken();
    let sfResponse = await postRegisterCampaignFlow(
      accessToken,
      leadOrContactId,
      campaign.campaign_id_from_salesforce
    );
    if (sfResponse.status === 401 || sfResponse.status === 403) {
      const fresh = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(fresh);
      sfResponse = await postRegisterCampaignFlow(
        fresh.access_token,
        leadOrContactId,
        campaign.campaign_id_from_salesforce
      );
    }

    const sfRaw = await sfResponse.text();
    let sfParsed: unknown = null;
    try {
      sfParsed = sfRaw ? JSON.parse(sfRaw) : null;
    } catch {
      return NextResponse.json(
        { error: "Response Salesforce register campaign tidak valid JSON" },
        { status: 502 }
      );
    }

    if (!sfResponse.ok) {
      return NextResponse.json(
        {
          error: "Gagal register campaign ke Salesforce",
          details: sfParsed,
        },
        { status: 502 }
      );
    }

    const output = parseRegisterCampaignOutput(sfParsed);
    const sfMember = output?.campaignMember ?? null;
    const sfCampaignId = cleanString(sfMember?.CampaignId) || campaign.campaign_id_from_salesforce;

    const insertResult = await pool.query(
      `
      INSERT INTO campaign_members (
        campaign_id,
        campaign_id_from_salesforce,
        client_id,
        contact_id,
        lead_or_contact_id,
        lead_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, campaign_id, campaign_id_from_salesforce, client_id, contact_id, lead_or_contact_id, lead_id, created_at, updated_at
      `,
      [
        campaign.id,
        sfCampaignId,
        cleanString(sfMember?.ClientId__c) || user.client_id,
        cleanString(sfMember?.ContactId) || user.contact_id,
        cleanString(sfMember?.LeadOrContactId) || leadOrContactId,
        cleanString(sfMember?.LeadId) || user.lead_id,
      ]
    );

    await pool.query(
      `
      INSERT INTO user_campaign_salesforce_sync (user_id, synced_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET synced_at = EXCLUDED.synced_at
      `,
      [user.id]
    );

    const campaignMember = insertResult.rows[0];
    return NextResponse.json(
      {
        message: "Register campaign berhasil",
        campaignMember: {
          id: campaignMember.id,
          campaignId: campaignMember.campaign_id,
          campaignIdFromSalesforce: campaignMember.campaign_id_from_salesforce,
          clientId: campaignMember.client_id,
          contactId: campaignMember.contact_id,
          leadOrContactId: campaignMember.lead_or_contact_id,
          leadId: campaignMember.lead_id,
          createdAt: campaignMember.created_at,
          updatedAt: campaignMember.updated_at,
        },
        salesforce: {
          flow: "Trive_Invest_API_Register_Campaign",
          campaignMemberId: cleanString(sfMember?.Id),
          message: output?.message ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, "Register campaign failed");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat register campaign." },
      { status: 500 }
    );
  }
}
