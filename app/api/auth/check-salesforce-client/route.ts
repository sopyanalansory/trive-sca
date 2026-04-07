import { NextRequest, NextResponse } from "next/server";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "@/lib/salesforce-oauth";

const SALESFORCE_SEARCH_CLIENT_FLOW_URL =
  process.env.SALESFORCE_SEARCH_CLIENT_FLOW_URL ||
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Search_Client_by_Email";

type SalesforceFlowResult = {
  isSuccess?: boolean;
  message?: string;
  outputValues?: {
    message?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function normalizePhone(phone: string): string {
  return phone.replaceAll(/\D/g, "");
}

function hasRecordFoundMessage(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "record found";
}

function isFoundFromResult(result: SalesforceFlowResult): boolean {
  if (result?.isSuccess === false) return false;
  return (
    hasRecordFoundMessage(result?.outputValues?.message) ||
    hasRecordFoundMessage(result?.message)
  );
}

function parseIsClientFound(data: unknown): boolean {
  const typedData = data as {
    results?: SalesforceFlowResult[];
    outputValues?: { message?: string };
    message?: string;
  };

  const results = Array.isArray(typedData?.results) ? typedData.results : [];
  if (results.length > 0) {
    return results.some((result) => isFoundFromResult(result));
  }

  if (Array.isArray(data) && data.length > 0) {
    return data.some((result) => isFoundFromResult(result as SalesforceFlowResult));
  }

  return (
    hasRecordFoundMessage(typedData?.outputValues?.message) ||
    hasRecordFoundMessage(typedData?.message)
  );
}

async function callSalesforceFlow(
  token: string,
  email: string,
  phone: string
): Promise<Response> {
  return fetch(SALESFORCE_SEARCH_CLIENT_FLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [
        {
          email,
          phone,
        },
      ],
    }),
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";

    const email = rawEmail.toLowerCase().trim();
    const phone = normalizePhone(rawPhone);

    if (!email || !phone) {
      return NextResponse.json(
        { error: "Email dan nomor HP wajib diisi" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    if (phone.length < 9 || phone.length > 14) {
      return NextResponse.json(
        { error: "Nomor HP tidak valid" },
        { status: 400 }
      );
    }

    let token = await getLatestValidSalesforceToken();
    if (!token) {
      const freshToken = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(freshToken);
      token = freshToken.access_token;
    }

    let response = await callSalesforceFlow(token, email, phone);

    // Retry once when token is expired/invalid.
    if (response.status === 401 || response.status === 403) {
      const freshToken = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(freshToken);
      response = await callSalesforceFlow(freshToken.access_token, email, phone);
    }

    const raw = await response.text();
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = { raw };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Gagal memeriksa data client di Salesforce",
          details: parsed,
        },
        { status: 502 }
      );
    }

    const found = parseIsClientFound(parsed);
    return NextResponse.json(
      {
        found,
        message: found ? "Client ditemukan" : "Client tidak ditemukan",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Check Salesforce client error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memeriksa data client." },
      { status: 500 }
    );
  }
}
