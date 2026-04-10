import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth";
import { digitsOnly, normalizePhoneForDb } from "../../../../lib/phone";
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from "../../../../lib/salesforce-oauth";
import { apiLogger, logRouteError } from "../../../../lib/logger";

const log = apiLogger("auth:check-salesforce-client");

const SALESFORCE_SEARCH_CLIENT_FLOW_URL =
  process.env.SALESFORCE_SEARCH_CLIENT_FLOW_URL ||
  "https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Search_Client_by_Email";

type SalesforceFlowResult = {
  isSuccess?: boolean;
  message?: string;
  outputValues?: {
    message?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    placeOfBirth?: string;
    dateOfBirth?: string;
    accountId?: string;
    leadId?: string | null;
    Flow__InterviewGuid?: string;
    Flow__InterviewStatus?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type SalesforceOutputValues = SalesforceFlowResult["outputValues"];

type UserSyncPayload = {
  fullname: string;
  email: string;
  phone: string;
  salesforcePhone: string | null;
  countryCode: string;
  placeOfBirth: string | null;
  dateOfBirth: string | null;
  clientId: string | null;
  accountId: string | null;
  leadId: string | null;
  contactId: string | null;
  isRedFlag: boolean | null;
  interviewGuid: string | null;
  interviewStatus: string | null;
};

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

function pickRecordFoundOutputValues(data: unknown): SalesforceOutputValues | null {
  const typedData = data as {
    results?: SalesforceFlowResult[];
    outputValues?: SalesforceOutputValues;
  };

  const results = Array.isArray(typedData?.results) ? typedData.results : [];
  const foundResult = results.find((result) => isFoundFromResult(result));
  if (foundResult?.outputValues) {
    return foundResult.outputValues;
  }

  if (typedData?.outputValues && hasRecordFoundMessage(typedData.outputValues.message)) {
    return typedData.outputValues;
  }

  if (Array.isArray(data)) {
    const foundArrayResult = (data as SalesforceFlowResult[]).find((result) =>
      isFoundFromResult(result)
    );
    if (foundArrayResult?.outputValues) {
      return foundArrayResult.outputValues;
    }
  }

  return null;
}

function normalizeDateOnly(value: string | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsedDate = new Date(trimmed);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString().slice(0, 10);
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return null;
}

function buildSyncPayload(
  fallbackEmail: string,
  fallbackPhone: string,
  outputValues: SalesforceOutputValues | null
): UserSyncPayload {
  const sfEmail =
    typeof outputValues?.email === "string" ? outputValues.email.toLowerCase().trim() : "";
  const email = sfEmail || fallbackEmail;

  const sfPhone = typeof outputValues?.phone === "string" ? outputValues.phone : "";
  const salesforcePhone = sfPhone.trim() ? normalizePhoneForDb(sfPhone) : null;
  const phone = salesforcePhone || normalizePhoneForDb(fallbackPhone);

  const firstName = typeof outputValues?.firstName === "string" ? outputValues.firstName.trim() : "";
  const lastName = typeof outputValues?.lastName === "string" ? outputValues.lastName.trim() : "";
  const fullName = `${firstName} ${lastName === "-" ? "" : lastName}`.trim();

  const placeOfBirth =
    typeof outputValues?.placeOfBirth === "string" && outputValues.placeOfBirth.trim()
      ? outputValues.placeOfBirth.trim()
      : null;
  const clientIdRaw =
    outputValues?.clientId ??
    outputValues?.client_id ??
    outputValues?.ClientId ??
    outputValues?.ClientID;
  const clientId =
    typeof clientIdRaw === "string" && clientIdRaw.trim() ? clientIdRaw.trim() : null;
  const accountId =
    typeof outputValues?.accountId === "string" && outputValues.accountId.trim()
      ? outputValues.accountId.trim()
      : null;
  const leadId =
    typeof outputValues?.leadId === "string" && outputValues.leadId.trim()
      ? outputValues.leadId.trim()
      : null;
  const contactIdRaw =
    outputValues?.contactId ??
    outputValues?.contact_id ??
    outputValues?.ContactId ??
    outputValues?.ContactID;
  const contactId =
    typeof contactIdRaw === "string" && contactIdRaw.trim() ? contactIdRaw.trim() : null;
  const isRedFlag = normalizeBoolean(
    outputValues?.isRedFlag ?? outputValues?.is_red_flag ?? outputValues?.IsRedFlag
  );
  const interviewGuid =
    typeof outputValues?.Flow__InterviewGuid === "string" &&
    outputValues.Flow__InterviewGuid.trim()
      ? outputValues.Flow__InterviewGuid.trim()
      : null;
  const interviewStatus =
    typeof outputValues?.Flow__InterviewStatus === "string" &&
    outputValues.Flow__InterviewStatus.trim()
      ? outputValues.Flow__InterviewStatus.trim()
      : null;

  return {
    fullname: fullName || email.split("@")[0] || "User",
    email,
    phone,
    salesforcePhone,
    countryCode: "+62",
    placeOfBirth,
    dateOfBirth: normalizeDateOnly(
      typeof outputValues?.dateOfBirth === "string" ? outputValues.dateOfBirth : undefined
    ),
    clientId,
    accountId,
    leadId,
    contactId,
    isRedFlag,
    interviewGuid,
    interviewStatus,
  };
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

async function getAvailableUserColumns(columnNames: string[]): Promise<Set<string>> {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'users' AND column_name = ANY($1::text[])`,
    [columnNames]
  );
  return new Set(result.rows.map((row: { column_name: string }) => row.column_name));
}

async function saveOrSyncSalesforceUser(payload: UserSyncPayload): Promise<void> {
  const defaultPasswordHash = await hashPassword("TempPassword123!");
  const optionalColumns = [
    "place_of_birth",
    "date_of_birth",
    "client_id",
    "account_id",
    "lead_id",
    "contact_id",
    "is_red_flag",
    "salesforce_interview_guid",
    "salesforce_interview_status",
  ];
  const availableColumns = await getAvailableUserColumns(optionalColumns);

  const insertColumns = [
    "fullname",
    "email",
    "phone",
    "country_code",
    "password_hash",
    "marketing_consent",
    "terms_consent",
    "email_verified",
    "phone_verified",
  ];
  const insertValues: (string | boolean | null)[] = [
    payload.fullname,
    payload.email,
    payload.phone,
    payload.countryCode,
    defaultPasswordHash,
    true,
    true,
    true,
    true,
  ];

  const appendOptionalInsert = (column: string, value: string | null) => {
    if (!availableColumns.has(column)) return;
    insertColumns.push(column);
    insertValues.push(value);
  };

  appendOptionalInsert("place_of_birth", payload.placeOfBirth);
  appendOptionalInsert("date_of_birth", payload.dateOfBirth);
  appendOptionalInsert("client_id", payload.clientId);
  appendOptionalInsert("account_id", payload.accountId);
  appendOptionalInsert("lead_id", payload.leadId);
  appendOptionalInsert("contact_id", payload.contactId);
  if (availableColumns.has("is_red_flag")) {
    insertColumns.push("is_red_flag");
    insertValues.push(payload.isRedFlag);
  }
  appendOptionalInsert("salesforce_interview_guid", payload.interviewGuid);
  appendOptionalInsert("salesforce_interview_status", payload.interviewStatus);

  await pool.query(
    `INSERT INTO users
      (${insertColumns.join(", ")})
     VALUES (${insertValues.map((_, index) => `$${index + 1}`).join(", ")})
     ON CONFLICT (email) DO NOTHING`,
    insertValues
  );

  const updateParts: string[] = ["fullname = $1", "country_code = $2"];
  const updateValues: (string | boolean | null)[] = [payload.fullname, payload.countryCode];
  let paramIndex = 3;

  if (payload.salesforcePhone) {
    updateParts.push(`phone = $${paramIndex}`);
    updateValues.push(payload.salesforcePhone);
    paramIndex += 1;
  }

  const pushOverwriteUpdate = (column: string, value: string | null) => {
    if (!value || !availableColumns.has(column)) return;
    updateParts.push(`${column} = $${paramIndex}`);
    updateValues.push(value);
    paramIndex += 1;
  };

  if (payload.dateOfBirth && availableColumns.has("date_of_birth")) {
    updateParts.push(`date_of_birth = $${paramIndex}::date`);
    updateValues.push(payload.dateOfBirth);
    paramIndex += 1;
  }
  pushOverwriteUpdate("place_of_birth", payload.placeOfBirth);
  pushOverwriteUpdate("client_id", payload.clientId);
  pushOverwriteUpdate("account_id", payload.accountId);
  pushOverwriteUpdate("lead_id", payload.leadId);
  pushOverwriteUpdate("contact_id", payload.contactId);
  if (payload.isRedFlag !== null && availableColumns.has("is_red_flag")) {
    updateParts.push(`is_red_flag = $${paramIndex}`);
    updateValues.push(payload.isRedFlag);
    paramIndex += 1;
  }
  pushOverwriteUpdate("salesforce_interview_guid", payload.interviewGuid);
  pushOverwriteUpdate("salesforce_interview_status", payload.interviewStatus);

  await pool.query(
    `UPDATE users
     SET ${updateParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE email = $${paramIndex}`,
    [...updateValues, payload.email]
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";

    const email = rawEmail.toLowerCase().trim();
    const phone = digitsOnly(rawPhone);

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
    if (found) {
      const outputValues = pickRecordFoundOutputValues(parsed);
      const syncPayload = buildSyncPayload(email, phone, outputValues);
      await saveOrSyncSalesforceUser(syncPayload);
    }

    return NextResponse.json(
      {
        found,
        message: found ? "Client ditemukan" : "Client tidak ditemukan",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, "Check Salesforce client failed");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memeriksa data client." },
      { status: 500 }
    );
  }
}
