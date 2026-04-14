import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";
import { apiLogger, logRouteError } from "@/lib/logger";

const log = apiLogger("auth:check-email-availability");

const SALESFORCE_SEARCH_CLIENT_FLOW_URL =
  process.env.SALESFORCE_SEARCH_CLIENT_FLOW_URL ||
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Search_Client_by_Email";

function hasRecordFoundMessage(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "record found";
}

function parseIsClientFound(data: unknown): boolean {
  if (Array.isArray(data) && data.length > 0) {
    return data.some((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as {
        message?: unknown;
        outputValues?: { message?: unknown };
      };
      return (
        hasRecordFoundMessage(record?.message) ||
        hasRecordFoundMessage(record?.outputValues?.message)
      );
    });
  }

  if (data && typeof data === "object") {
    const obj = data as {
      message?: unknown;
      outputValues?: { message?: unknown };
      results?: unknown[];
    };
    if (Array.isArray(obj.results)) return parseIsClientFound(obj.results);
    return (
      hasRecordFoundMessage(obj?.message) ||
      hasRecordFoundMessage(obj?.outputValues?.message)
    );
  }

  return false;
}

async function callSalesforceSearchClientFlow(
  accessToken: string,
  email: string
): Promise<Response> {
  return fetch(SALESFORCE_SEARCH_CLIENT_FLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ email }],
    }),
    cache: "no-store",
  });
}

async function getValidSalesforceToken(): Promise<string> {
  const cached = await getLatestValidSalesforceToken();
  if (cached) return cached;
  const fresh = await requestSalesforceAccessToken();
  await saveSalesforceAccessToken(fresh);
  return fresh.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";

    const email = rawEmail.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({
        exists: true,
        source: "db",
      });
    }

    const token = await getValidSalesforceToken();
    let sfResponse = await callSalesforceSearchClientFlow(token, email);
    if (sfResponse.status === 401 || sfResponse.status === 403) {
      const fresh = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(fresh);
      sfResponse = await callSalesforceSearchClientFlow(fresh.access_token, email);
    }

    const sfRaw = await sfResponse.text();
    let sfParsed: unknown = null;
    try {
      sfParsed = sfRaw ? JSON.parse(sfRaw) : null;
    } catch {
      sfParsed = null;
    }

    if (!sfResponse.ok) {
      return NextResponse.json(
        {
          exists: false,
          source: null,
          salesforceChecked: false,
          warning: "Salesforce check failed",
        },
        { status: 200 }
      );
    }

    const foundInSalesforce = parseIsClientFound(sfParsed);
    if (foundInSalesforce) {
      return NextResponse.json({
        exists: true,
        source: "salesforce",
      });
    }

    return NextResponse.json({
      exists: false,
      source: null,
      salesforceChecked: true,
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, "Check email availability failed");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memeriksa email." },
      { status: 500 }
    );
  }
}
