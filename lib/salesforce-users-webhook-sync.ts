import pool from "@/lib/db";
import { normalizePhoneForDb } from "@/lib/phone";

type SyncUsersPayload = Record<string, unknown>;

export type SyncSalesforceUserResult =
  | { ok: true; action: "updated"; userId: number }
  | { ok: false; error: string; message: string };

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return null;
}

function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function pickFullname(payload: SyncUsersPayload): string | null {
  const fullname = cleanString(payload.fullname);
  if (fullname) return fullname;

  const firstName = cleanString(payload.firstName);
  const lastName = cleanString(payload.lastName);
  const combined = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return combined || null;
}

function getContactOrLeadId(payload: SyncUsersPayload): string | null {
  return (
    cleanString(payload.contactOrLeadId) ??
    cleanString(payload.ContactOrLeadId) ??
    cleanString(payload.LeadOrContactId) ??
    cleanString(payload.leadOrContactId)
  );
}

export async function syncUserFromSalesforceWebhook(
  payload: SyncUsersPayload
): Promise<SyncSalesforceUserResult> {
  const contactOrLeadId = getContactOrLeadId(payload);
  if (!contactOrLeadId) {
    return {
      ok: false,
      error: "VALIDATION",
      message: "contactOrLeadId wajib diisi.",
    };
  }

  const userResult = await pool.query<{ id: number }>(
    `
    SELECT id
    FROM users
    WHERE contact_id = $1 OR lead_id = $1
    ORDER BY id DESC
    LIMIT 1
    `,
    [contactOrLeadId]
  );
  const user = userResult.rows[0];
  if (!user) {
    return {
      ok: false,
      error: "USER_NOT_FOUND",
      message: "User tidak ditemukan untuk contactOrLeadId tersebut.",
    };
  }

  const updateParts: string[] = [];
  const values: Array<string | boolean | null> = [];
  let param = 1;

  const push = (sql: string, value: string | boolean | null) => {
    updateParts.push(`${sql} = $${param}`);
    values.push(value);
    param += 1;
  };

  const fullname = pickFullname(payload);
  if (fullname) push("fullname", fullname);

  const email =
    cleanString(payload.email)?.toLowerCase() ??
    cleanString(payload.Email)?.toLowerCase() ??
    null;
  if (email) push("email", email);

  const phone = cleanString(payload.phone) ?? cleanString(payload.Phone);
  const normalizedPhone = phone ? normalizePhoneForDb(phone) : null;
  if (normalizedPhone) push("phone", normalizedPhone);

  const placeOfBirth =
    cleanString(payload.placeOfBirth) ?? cleanString(payload.PlaceOfBirth);
  if (placeOfBirth) push("place_of_birth", placeOfBirth);

  const dateOfBirth = normalizeDateOnly(
    payload.dateOfBirth ?? payload.DateOfBirth
  );
  if (dateOfBirth) {
    updateParts.push(`date_of_birth = $${param}::date`);
    values.push(dateOfBirth);
    param += 1;
  }

  const clientId =
    cleanString(payload.clientId) ??
    cleanString(payload.ClientId__c) ??
    cleanString(payload.ClientId);
  if (clientId) push("client_id", clientId);

  const accountId =
    cleanString(payload.accountId) ??
    cleanString(payload.AccountId) ??
    cleanString(payload.AccountId__c);
  if (accountId) push("account_id", accountId);

  const leadId =
    cleanString(payload.leadId) ??
    cleanString(payload.LeadId) ??
    cleanString(payload.lead_or_contact_id);
  if (leadId) push("lead_id", leadId);

  const contactId =
    cleanString(payload.contactId) ??
    cleanString(payload.ContactId) ??
    cleanString(payload.contact_id);
  if (contactId) push("contact_id", contactId);

  const isRedFlag = normalizeBoolean(
    payload.isRedFlag ?? payload.is_red_flag ?? payload.IsRedFlag
  );
  if (isRedFlag !== null) push("is_red_flag", isRedFlag);

  const interviewGuid =
    cleanString(payload.Flow__InterviewGuid) ??
    cleanString(payload.salesforceInterviewGuid);
  if (interviewGuid) push("salesforce_interview_guid", interviewGuid);

  const interviewStatus =
    cleanString(payload.Flow__InterviewStatus) ??
    cleanString(payload.salesforceInterviewStatus);
  if (interviewStatus) push("salesforce_interview_status", interviewStatus);

  if (updateParts.length === 0) {
    return {
      ok: false,
      error: "VALIDATION",
      message: "Tidak ada field user yang bisa diupdate dari payload.",
    };
  }

  await pool.query(
    `
    UPDATE users
    SET ${updateParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${param}
    `,
    [...values, user.id]
  );

  return {
    ok: true,
    action: "updated",
    userId: user.id,
  };
}
