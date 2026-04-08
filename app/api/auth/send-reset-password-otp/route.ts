import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { isValidLocalPhoneLength, normalizePhoneForDb, toMsisdn } from '../../../../lib/phone';
import { enforceOtpSendByEmail } from '../../../../lib/rate-limit';
import { apiLogger, logRouteError, requestLogFields } from '../../../../lib/logger';

const log = apiLogger('auth:send-reset-password-otp');

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email wajib diisi' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailLimited = await enforceOtpSendByEmail(request, normalizedEmail);
    if (emailLimited) {
      return emailLimited;
    }

    // Check if user exists and get phone number from database
    const userCheck = await pool.query(
      'SELECT id, email, phone, country_code FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userCheck.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'Jika email terdaftar, kode OTP akan dikirim ke WhatsApp Anda.' },
        { status: 200 }
      );
    }

    const user = userCheck.rows[0];
    const phoneFromDb = user.phone;
    const countryCodeFromDb = user.country_code || '+62';

    // Normalize phone number from database for Verihubs
    const normalizedPhone = normalizePhoneForDb(phoneFromDb);
    const msisdn = toMsisdn(normalizedPhone, countryCodeFromDb);

    // Validate normalized phone length
    if (!isValidLocalPhoneLength(normalizedPhone)) {
      log.warn(
        {
          ...requestLogFields(request),
          phoneDigitsLen: normalizedPhone.length,
          email: normalizedEmail,
        },
        'User phone from DB failed length validation for Verihubs'
      );
      return NextResponse.json(
        { error: 'Nomor telepon tidak valid. Silakan hubungi customer service.' },
        { status: 400 }
      );
    }

    // Send OTP via Verihubs
    try {
      const verihubsResponse = await fetch(`${VERIHUBS_API_URL}/send`, {
        method: 'POST',
        headers: {
          'API-Key': VERIHUBS_API_KEY,
          'App-ID': VERIHUBS_APP_ID,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: msisdn,
          lang_code: 'id',
          template_name: 'trive_invest_wba',
          callback_url: process.env.VERIHUBS_CALLBACK_URL || 'https://google.com',
          otp_length: '4',
        }),
      });

      const verihubsData = await verihubsResponse.json();

      if (!verihubsResponse.ok) {
        log.warn(
          { ...requestLogFields(request), email: normalizedEmail, verihubsBody: verihubsData },
          'Verihubs reset OTP send rejected'
        );
        return NextResponse.json(
          { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
          { status: 500 }
        );
      }

      // Save verification code reference to database for tracking
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 2); // Code expires in 2 minutes

      await pool.query(
        `INSERT INTO verification_codes (phone, code, expires_at)
         VALUES ($1, $2, $3)`,
        [msisdn, 'VERIHUBS', expiresAt] // Store 'VERIHUBS' as code to indicate it's managed by Verihubs
      );

      // For development, return success message
      // In production, don't reveal if email exists
      return NextResponse.json(
        {
          message: 'Kode OTP telah dikirim ke WhatsApp Anda',
          // Only return code in development if Verihubs returns it
          ...(process.env.NODE_ENV === 'development' && verihubsData.otp ? { code: verihubsData.otp } : {}),
        },
        { status: 200 }
      );
    } catch (verihubsError: unknown) {
      logRouteError(log, request, verihubsError, 'Verihubs reset OTP send failed');
      return NextResponse.json(
        { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Send reset password OTP failed');
    return NextResponse.json(
      { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
