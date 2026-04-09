import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { generatePasswordResetToken } from '../../../../lib/auth';
import { normalizePhoneForDb, toMsisdn } from '../../../../lib/phone';
import { enforceOtpVerifyByEmail } from '../../../../lib/rate-limit';
import { apiLogger, logRouteError, requestLogFields } from '../../../../lib/logger';

const log = apiLogger('auth:verify-reset-password-otp');

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    const otpDigits = String(otp).replace(/\D/g, '');
    if (otpDigits.length !== 4) {
      return NextResponse.json(
        { error: 'Kode OTP harus 4 digit' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userCheck = await pool.query(
      'SELECT id, email, phone, country_code FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar' },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    const phoneFromDb = user.phone;
    const countryCodeFromDb = user.country_code || '+62';

    const normalizedPhone = normalizePhoneForDb(phoneFromDb);
    const msisdn = toMsisdn(normalizedPhone, countryCodeFromDb);

    const verifyLimited = await enforceOtpVerifyByEmail(request, normalizedEmail);
    if (verifyLimited) {
      return verifyLimited;
    }

    try {
      const verihubsResponse = await fetch(`${VERIHUBS_API_URL}/verify`, {
        method: 'POST',
        headers: {
          'API-Key': VERIHUBS_API_KEY,
          'App-ID': VERIHUBS_APP_ID,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: msisdn,
          otp: otpDigits,
        }),
      });

      const verihubsData = await verihubsResponse.json();

      if (!verihubsResponse.ok || !verihubsData.message || !verihubsData.message.includes('verified')) {
        log.warn(
          { ...requestLogFields(request), email: normalizedEmail, verihubsBody: verihubsData },
          'Verihubs forgot-password OTP verify failed'
        );
        return NextResponse.json(
          { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

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
        [msisdn]
      );

      const resetToken = generatePasswordResetToken(normalizedEmail);

      return NextResponse.json(
        {
          message: 'OTP terverifikasi. Silakan atur password baru.',
          resetToken,
        },
        { status: 200 }
      );
    } catch (verihubsError: unknown) {
      logRouteError(log, request, verihubsError, 'Verihubs verify-reset-password-otp request failed');
      return NextResponse.json(
        { error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Verify reset password OTP failed');
    return NextResponse.json(
      { error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
