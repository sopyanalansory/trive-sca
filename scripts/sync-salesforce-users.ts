import "dotenv/config";
import pool from "@/lib/db";
import { digitsOnly, normalizePhoneForDb, toMsisdn } from "@/lib/phone";
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
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    placeOfBirth?: string;
    dateOfBirth?: string;
    accountId?: string;
    leadId?: string | null;
    clientId?: string | null;
    contactId?: string | null;
    isRedFlag?: boolean | string | null;
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

type UserRow = {
  id: number;
  email: string;
  phone: string | null;
};

type FlowCallResult = {
  response: Response;
  refreshedToken: string;
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

function pickRecordFoundOutputValues(data: unknown): SalesforceOutputValues | null {
  const typedData = data as {
    results?: SalesforceFlowResult[];
    outputValues?: SalesforceOutputValues;
  };

  const results = Array.isArray(typedData?.results) ? typedData.results : [];
  const foundResult = results.find((result) => isFoundFromResult(result));
  if (foundResult?.outputValues) return foundResult.outputValues;

  if (typedData?.outputValues && hasRecordFoundMessage(typedData.outputValues.message)) {
    return typedData.outputValues;
  }

  if (Array.isArray(data)) {
    const foundArrayResult = (data as SalesforceFlowResult[]).find((result) =>
      isFoundFromResult(result)
    );
    if (foundArrayResult?.outputValues) return foundArrayResult.outputValues;
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

  const firstName =
    typeof outputValues?.firstName === "string" ? outputValues.firstName.trim() : "";
  const lastName =
    typeof outputValues?.lastName === "string" ? outputValues.lastName.trim() : "";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

async function getToken(): Promise<string> {
  let token = await getLatestValidSalesforceToken();
  if (!token) {
    const freshToken = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(freshToken);
    token = freshToken.access_token;
  }
  return token;
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

async function updateUserFromPayload(
  userId: number,
  payload: UserSyncPayload,
  availableColumns: Set<string>
): Promise<void> {
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
  pushOverwriteUpdate("salesforce_interview_guid", payload.interviewGuid);
  pushOverwriteUpdate("salesforce_interview_status", payload.interviewStatus);

  if (payload.isRedFlag !== null && availableColumns.has("is_red_flag")) {
    updateParts.push(`is_red_flag = $${paramIndex}`);
    updateValues.push(payload.isRedFlag);
    paramIndex += 1;
  }

  await pool.query(
    `UPDATE users
     SET ${updateParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}`,
    [...updateValues, userId]
  );
}

async function callSalesforceFlowSafely(params: {
  token: string;
  email: string;
  phone: string;
  maxRetries: number;
  baseDelayMs: number;
}): Promise<FlowCallResult> {
  let currentToken = params.token;
  let attempt = 0;

  while (true) {
    let response = await callSalesforceFlow(currentToken, params.email, params.phone);
    if (response.status === 401 || response.status === 403) {
      const freshToken = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(freshToken);
      currentToken = freshToken.access_token;
      response = await callSalesforceFlow(currentToken, params.email, params.phone);
    }

    if (!isRetryableStatus(response.status) || attempt >= params.maxRetries) {
      return { response, refreshedToken: currentToken };
    }

    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterSeconds = retryAfterHeader
      ? Number(retryAfterHeader)
      : Number.NaN;
    const retryAfterMs =
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 0;
    const backoffMs = params.baseDelayMs * Math.pow(2, attempt);
    const jitterMs = Math.floor(Math.random() * 350);
    const waitMs = Math.max(retryAfterMs, backoffMs + jitterMs);
    await sleep(waitMs);
    attempt += 1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSyncAll = args.includes("--all");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;
  const resumeArg = args.find((arg) => arg.startsWith("--resume-from-id="));
  const resumeFromId = resumeArg ? Number(resumeArg.split("=")[1]) : 0;
  const delayArg = args.find((arg) => arg.startsWith("--delay-ms="));
  const delayMs = delayArg ? Number(delayArg.split("=")[1]) : 1200;
  const retryArg = args.find((arg) => arg.startsWith("--max-retries="));
  const maxRetries = retryArg ? Number(retryArg.split("=")[1]) : 4;
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error("Invalid --limit value. Example: --limit=200");
  }
  if (!Number.isFinite(resumeFromId) || resumeFromId < 0) {
    throw new Error("Invalid --resume-from-id value. Example: --resume-from-id=1200");
  }
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("Invalid --delay-ms value. Example: --delay-ms=1200");
  }
  if (!Number.isFinite(maxRetries) || maxRetries < 0) {
    throw new Error("Invalid --max-retries value. Example: --max-retries=4");
  }

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

  const whereMissing = `
    COALESCE(TRIM(email), '') <> ''
    AND COALESCE(TRIM(phone), '') <> ''
    AND (
      client_id IS NULL
      OR contact_id IS NULL
      OR is_red_flag IS NULL
      OR lead_id IS NULL
      OR account_id IS NULL
    )
  `;

  const baseWhere = shouldSyncAll
    ? `COALESCE(TRIM(email), '') <> '' AND COALESCE(TRIM(phone), '') <> ''`
    : whereMissing;
  const query = `SELECT id, email, phone FROM users
       WHERE ${baseWhere}
         AND id > $1
       ORDER BY id ASC
       LIMIT $2`;

  const usersResult = await pool.query(query, [resumeFromId, limit]);
  const users = usersResult.rows as UserRow[];
  if (users.length === 0) {
    console.log("No users to sync.");
    return;
  }

  let token = await getToken();
  let synced = 0;
  let notFound = 0;
  let failed = 0;
  let rateLimited = 0;

  for (const user of users) {
    try {
      const email = user.email.trim().toLowerCase();
      const localPhoneDigits = digitsOnly(user.phone || "");
      if (!email || !localPhoneDigits) {
        failed += 1;
        continue;
      }
      const phoneMsisdn = toMsisdn(localPhoneDigits, "+62");

      const flowCall = await callSalesforceFlowSafely({
        token,
        email,
        phone: phoneMsisdn,
        maxRetries,
        baseDelayMs: Math.max(delayMs, 500),
      });
      token = flowCall.refreshedToken;
      const response = flowCall.response;
      if (response.status === 429 || response.status === 503) {
        rateLimited += 1;
      }

      const raw = await response.text();
      let parsed: unknown = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = { raw };
      }

      if (!response.ok) {
        failed += 1;
        console.error(`Failed user ${user.id} (${email}): HTTP ${response.status}`);
        continue;
      }

      const outputValues = pickRecordFoundOutputValues(parsed);
      if (!outputValues) {
        notFound += 1;
        continue;
      }

      const payload = buildSyncPayload(email, localPhoneDigits, outputValues);
      await updateUserFromPayload(user.id, payload, availableColumns);
      synced += 1;
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    } catch (error) {
      failed += 1;
      console.error(`Failed user ${user.id} (${user.email}):`, error);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  console.log("Salesforce user sync completed.");
  console.log(`Processed: ${users.length}`);
  console.log(`Synced: ${synced}`);
  console.log(`Not found in Salesforce: ${notFound}`);
  console.log(`Failed: ${failed}`);
  console.log(`Hit rate limit/temporary unavailable: ${rateLimited}`);
  console.log(`Last processed user id: ${users.at(-1)?.id ?? resumeFromId}`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Sync process failed:", error);
    await pool.end();
    process.exit(1);
  });
