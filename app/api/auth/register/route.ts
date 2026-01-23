import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

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

    // Normalize phone number (remove leading 0 or country code)
    const normalizePhoneNumber = (phoneNumber: string): string => {
      let cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      } else if (cleaned.startsWith('62')) {
        cleaned = cleaned.substring(2);
      }
      return cleaned;
    };

    const normalizedPhone = normalizePhoneNumber(phone);
    const fullPhoneNumber = (countryCode || '+62').replace('+', '') + normalizedPhone;

    // Validate phone length
    if (normalizedPhone.length < 9 || normalizedPhone.length > 13) {
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

    // Check if phone already exists
    const phoneCheck = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    if (phoneCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' },
        { status: 409 }
      );
    }

    // Verify OTP via Verihubs
    try {
      const verifyPayload = {
        msisdn: fullPhoneNumber,
        otp: String(verificationCode).trim(), // Ensure OTP is string and trimmed
      };
      
      console.log('Verihubs verify request:', {
        url: `${VERIHUBS_API_URL}/verify`,
        payload: verifyPayload,
        originalPhone: phone,
        normalizedPhone: normalizedPhone,
        countryCode: countryCode || '+62',
      });

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
      } catch (parseError) {
        console.error('Verihubs response is not valid JSON:', responseText);
        console.error('Response status:', verihubsResponse.status);
        return NextResponse.json(
          { error: 'Kode verifikasi tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      // Log full response for debugging
      console.log('Verihubs verify response:', {
        status: verihubsResponse.status,
        ok: verihubsResponse.ok,
        data: verihubsData,
        phone: fullPhoneNumber,
      });

      // Check if verification was successful
      // Verihubs might return different success indicators
      const isVerified = verihubsResponse.ok && (
        (verihubsData.message && verihubsData.message.toLowerCase().includes('verified')) ||
        verihubsData.status === 'success' ||
        verihubsData.success === true ||
        (verihubsData.data && verihubsData.data.verified === true)
      );

      if (!isVerified) {
        console.error('Verihubs verify error:', {
          status: verihubsResponse.status,
          data: verihubsData,
          phone: fullPhoneNumber,
        });
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
         (name, email, phone, country_code, password_hash, referral_code, marketing_consent, terms_consent, phone_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, name, email, phone, country_code, created_at`,
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
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          token,
        },
        { status: 201 }
      );
    } catch (verihubsError: any) {
      console.error('Verihubs API error:', {
        message: verihubsError.message,
        stack: verihubsError.stack,
        name: verihubsError.name,
        phone: fullPhoneNumber,
        code: verificationCode,
      });
      
      return NextResponse.json(
        { error: verihubsError.message || 'Gagal memverifikasi kode verifikasi. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 409 }
        );
      }
      if (error.constraint === 'users_phone_key') {
        return NextResponse.json(
          { error: 'Nomor telepon sudah terdaftar' },
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
