import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { isValidLocalPhoneLength, normalizePhoneForDb, toMsisdn } from '@/lib/phone';
import { enforceOtpVerifyByMsisdn } from '@/lib/rate-limit';
import { apiLogger, logRouteError, requestLogFields } from '@/lib/logger';

const log = apiLogger('auth:register');

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

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

      // Insert user into database
      const result = await pool.query(
        `INSERT INTO users 
         (fullname, email, phone, country_code, password_hash, referral_code, marketing_consent, terms_consent, phone_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, fullname, email, phone, country_code, created_at`,
        [
          name.trim(),
          email.toLowerCase().trim(),
          normalizedPhone,
          countryCode || '+62',
          passwordHash,
          referralCode?.trim() || null,
          marketingConsent,
          termsConsent,
          true, // Phone is verified since Verihubs verification was successful
        ]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = generateToken(user.id, user.email);

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
