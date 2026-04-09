import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { hashPassword, verifyPasswordResetToken } from '../../../../lib/auth';
import { normalizePhoneForDb, toMsisdn } from '../../../../lib/phone';
import { enforceOtpVerifyByEmail } from '../../../../lib/rate-limit';
import { apiLogger, logRouteError, requestLogFields } from '../../../../lib/logger';

const log = apiLogger('auth:reset-password');

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

function validateNewPassword(newPassword: string): NextResponse | null {
  if (newPassword.length < 8 || newPassword.length > 15) {
    return NextResponse.json(
      { error: 'Password harus terdiri dari 8-15 karakter' },
      { status: 400 }
    );
  }

  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  if (!hasLowerCase || !hasUpperCase || !hasNumber) {
    return NextResponse.json(
      { error: 'Password harus berisi huruf kecil, huruf besar, dan angka' },
      { status: 400 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword, resetToken } = body;

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Password baru wajib diisi' },
        { status: 400 }
      );
    }

    const passwordErr = validateNewPassword(newPassword);
    if (passwordErr) {
      return passwordErr;
    }

    /** After OTP verified via POST /auth/verify-reset-password-otp — no second Verihubs call. */
    if (resetToken && typeof resetToken === 'string') {
      const tokenPayload = verifyPasswordResetToken(resetToken);
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Sesi reset password tidak valid atau sudah kadaluarsa. Minta OTP baru dan verifikasi lagi.' },
          { status: 401 }
        );
      }

      const normalizedEmail = tokenPayload.email;

      if (email && typeof email === 'string') {
        const bodyEmail = email.toLowerCase().trim();
        if (bodyEmail !== normalizedEmail) {
          return NextResponse.json(
            { error: 'Email tidak cocok dengan sesi verifikasi' },
            { status: 400 }
          );
        }
      }

      const userCheck = await pool.query(
        'SELECT id, email FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Email tidak terdaftar' },
          { status: 404 }
        );
      }

      const user = userCheck.rows[0];
      const passwordHash = await hashPassword(newPassword);

      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, user.id]
      );

      return NextResponse.json(
        { message: 'Password berhasil direset. Silakan login dengan password baru.' },
        { status: 200 }
      );
    }

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email, OTP, dan password baru wajib diisi (atau gunakan resetToken dari verifikasi OTP)' },
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

    // Check if user exists and get phone number from database
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

    // Normalize phone number from database for Verihubs
    const normalizedPhone = normalizePhoneForDb(phoneFromDb);
    const msisdn = toMsisdn(normalizedPhone, countryCodeFromDb);

    const verifyLimited = await enforceOtpVerifyByEmail(request, normalizedEmail);
    if (verifyLimited) {
      return verifyLimited;
    }

    // Verify OTP via Verihubs
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
          otp: otp,
        }),
      });

      const verihubsData = await verihubsResponse.json();

      if (!verihubsResponse.ok || !verihubsData.message || !verihubsData.message.includes('verified')) {
        log.warn(
          { ...requestLogFields(request), email: normalizedEmail, verihubsBody: verihubsData },
          'Verihubs reset password OTP verify failed'
        );
        return NextResponse.json(
          { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      // Mark verification code as used
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

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, user.id]
      );

      return NextResponse.json(
        { message: 'Password berhasil direset. Silakan login dengan password baru.' },
        { status: 200 }
      );
    } catch (verihubsError: unknown) {
      logRouteError(log, request, verihubsError, 'Verihubs reset password verify request failed');
      return NextResponse.json(
        { error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Reset password failed');
    return NextResponse.json(
      { error: 'Gagal reset password. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
