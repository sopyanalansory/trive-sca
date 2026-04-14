import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { isValidLocalPhoneLength, normalizePhoneForDb, toMsisdn } from '@/lib/phone';
import { enforceOtpVerifyByMsisdn } from '@/lib/rate-limit';
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from '@/lib/salesforce-oauth';
import { apiLogger, logRouteError, requestLogFields } from '@/lib/logger';

const log = apiLogger('auth:register');

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';
const SALESFORCE_REGISTER_LEAD_FLOW_URL =
  process.env.SALESFORCE_REGISTER_LEAD_FLOW_URL ||
  'https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Register_Lead';

type SalesforceRegisterLeadOutput = {
  clientId?: string | null;
  leadId?: string | null;
  Flow__InterviewGuid?: string | null;
  Flow__InterviewStatus?: string | null;
  message?: string | null;
};

function cleanString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: 'User', lastName: '-' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

async function postRegisterLeadToSalesforce(payload: {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasScaPassword: boolean;
  phoneVerified: boolean;
  referralCode: string;
}): Promise<Response> {
  const accessToken =
    (await getLatestValidSalesforceToken()) ||
    (await (async () => {
      const fresh = await requestSalesforceAccessToken();
      await saveSalesforceAccessToken(fresh);
      return fresh.access_token;
    })());

  const callFlow = (token: string) =>
    fetch(SALESFORCE_REGISTER_LEAD_FLOW_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: [payload] }),
      cache: 'no-store',
    });

  let response = await callFlow(accessToken);
  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    response = await callFlow(fresh.access_token);
  }
  return response;
}

function parseSalesforceRegisterLeadResponse(
  rawParsed: unknown
): SalesforceRegisterLeadOutput | null {
  if (!Array.isArray(rawParsed) || rawParsed.length === 0) return null;
  const first = rawParsed[0] as {
    isSuccess?: boolean;
    outputValues?: SalesforceRegisterLeadOutput;
  };
  if (first?.isSuccess !== true) return null;
  return first.outputValues ?? null;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      countryCode,
      password,
      verificationCode,
      referralCode,
      marketingConsent,
      termsConsent,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !verificationCode) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Validate consents
    if (!marketingConsent || !termsConsent) {
      return NextResponse.json(
        { error: 'Anda harus menyetujui syarat dan ketentuan' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneForDb(phone);
    const fullPhoneNumber = toMsisdn(normalizedPhone, countryCode || '+62');

    // Validate phone length
    if (!isValidLocalPhoneLength(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak valid. Mohon masukkan nomor yang benar.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const verifyLimited = await enforceOtpVerifyByMsisdn(request, fullPhoneNumber);
    if (verifyLimited) {
      return verifyLimited;
    }

    // Verify OTP via Verihubs
    try {
      const verifyPayload = {
        msisdn: fullPhoneNumber,
        otp: String(verificationCode).trim(), // Ensure OTP is string and trimmed
      };
      
      log.debug(
        {
          ...requestLogFields(request),
          url: `${VERIHUBS_API_URL}/verify`,
          msisdn: fullPhoneNumber,
          countryCode: countryCode || '+62',
        },
        'Verihubs verify request (OTP not logged)'
      );

      const verihubsResponse = await fetch(`${VERIHUBS_API_URL}/verify`, {
        method: 'POST',
        headers: {
          'API-Key': VERIHUBS_API_KEY,
          'App-ID': VERIHUBS_APP_ID,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(verifyPayload),
      });

      // Get response text first to handle non-JSON responses
      const responseText = await verihubsResponse.text();
      let verihubsData;
      
      try {
        verihubsData = JSON.parse(responseText);
      } catch {
        log.error(
          {
            ...requestLogFields(request),
            status: verihubsResponse.status,
            bodyPreview: responseText.slice(0, 500),
          },
          'Verihubs verify response is not valid JSON'
        );
        return NextResponse.json(
          { error: 'Kode verifikasi tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      log.debug(
        {
          ...requestLogFields(request),
          status: verihubsResponse.status,
          ok: verihubsResponse.ok,
          msisdn: fullPhoneNumber,
          verihubsBody: verihubsData,
        },
        'Verihubs verify response'
      );

      // Check if verification was successful
      // Verihubs might return different success indicators
      const isVerified = verihubsResponse.ok && (
        (verihubsData.message && verihubsData.message.toLowerCase().includes('verified')) ||
        verihubsData.status === 'success' ||
        verihubsData.success === true ||
        (verihubsData.data && verihubsData.data.verified === true)
      );

      if (!isVerified) {
        log.warn(
          {
            ...requestLogFields(request),
            status: verihubsResponse.status,
            msisdn: fullPhoneNumber,
            verihubsBody: verihubsData,
          },
          'Verihubs verify rejected'
        );
        return NextResponse.json(
          { error: verihubsData.message || 'Kode verifikasi tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      // Mark verification code as used in database
      await pool.query(
        `UPDATE verification_codes 
         SET verified = true 
         WHERE id = (
           SELECT id 
           FROM verification_codes 
           WHERE phone = $1 AND verified = false 
           ORDER BY created_at DESC 
           LIMIT 1
         )`,
        [fullPhoneNumber]
      );

      // Hash password
      const passwordHash = await hashPassword(password);

      const generatedClientId = randomUUID();
      const { firstName, lastName } = splitName(name);
      const registerLeadPayload = {
        clientId: generatedClientId,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone: fullPhoneNumber,
        hasScaPassword: true,
        phoneVerified: false,
        referralCode: referralCode?.trim() || '',
      };

      const sfResponse = await postRegisterLeadToSalesforce(registerLeadPayload);
      const sfRaw = await sfResponse.text();
      let sfParsed: unknown = null;
      try {
        sfParsed = sfRaw ? JSON.parse(sfRaw) : null;
      } catch {
        log.error(
          {
            ...requestLogFields(request),
            status: sfResponse.status,
            bodyPreview: sfRaw.slice(0, 500),
          },
          'Salesforce register lead response is not valid JSON'
        );
        return NextResponse.json(
          { error: 'Response Salesforce Register Lead tidak valid JSON' },
          { status: 502 }
        );
      }

      const sfOutput = parseSalesforceRegisterLeadResponse(sfParsed);
      if (!sfResponse.ok || !sfOutput) {
        log.error(
          {
            ...requestLogFields(request),
            status: sfResponse.status,
            salesforceBody: sfParsed,
          },
          'Salesforce register lead rejected'
        );
        return NextResponse.json(
          { error: 'Gagal register lead ke Salesforce', details: sfParsed },
          { status: 502 }
        );
      }

      const sfClientId = cleanString(sfOutput.clientId) || generatedClientId;
      const sfLeadId = cleanString(sfOutput.leadId);
      const sfInterviewGuid = cleanString(sfOutput.Flow__InterviewGuid);
      const sfInterviewStatus = cleanString(sfOutput.Flow__InterviewStatus);

      const optionalColumns = [
        'client_id',
        'lead_id',
        'salesforce_interview_guid',
        'salesforce_interview_status',
      ];
      const availableColumns = await getAvailableUserColumns(optionalColumns);
      const insertColumns = [
        'fullname',
        'email',
        'phone',
        'country_code',
        'password_hash',
        'referral_code',
        'marketing_consent',
        'terms_consent',
        'phone_verified',
      ];
      const insertValues: Array<string | boolean | null> = [
        name.trim(),
        email.toLowerCase().trim(),
        normalizedPhone,
        countryCode || '+62',
        passwordHash,
        referralCode?.trim() || null,
        marketingConsent,
        termsConsent,
        true,
      ];
      if (availableColumns.has('client_id')) {
        insertColumns.push('client_id');
        insertValues.push(sfClientId);
      }
      if (availableColumns.has('lead_id')) {
        insertColumns.push('lead_id');
        insertValues.push(sfLeadId);
      }
      if (availableColumns.has('salesforce_interview_guid')) {
        insertColumns.push('salesforce_interview_guid');
        insertValues.push(sfInterviewGuid);
      }
      if (availableColumns.has('salesforce_interview_status')) {
        insertColumns.push('salesforce_interview_status');
        insertValues.push(sfInterviewStatus);
      }

      // Insert user into database
      const result = await pool.query(
        `INSERT INTO users 
         (${insertColumns.join(', ')})
         VALUES (${insertValues.map((_, i) => `$${i + 1}`).join(', ')})
         RETURNING id, fullname, email, phone, country_code, created_at`,
        insertValues
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = generateToken(user.id, user.email, null, null);

      return NextResponse.json(
        {
          message: 'Registrasi berhasil',
          user: {
            id: user.id,
            name: user.fullname,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
          },
          token,
        },
        { status: 201 }
      );
    } catch (verihubsError: unknown) {
      logRouteError(log, request, verihubsError, 'Verihubs verify request failed during register');

      return NextResponse.json(
        {
          error:
            verihubsError instanceof Error
              ? verihubsError.message
              : 'Gagal memverifikasi kode verifikasi. Silakan coba lagi.',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Registration failed');

    // Handle unique constraint violations
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      if (
        'constraint' in error &&
        (error as { constraint: string }).constraint === 'users_email_key'
      ) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
