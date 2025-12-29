import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken, generateVerificationCode } from '@/lib/auth';

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

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
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

    // Verify verification code
    const codeCheck = await pool.query(
      `SELECT id, expires_at, verified 
       FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND verified = false 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [fullPhoneNumber, verificationCode]
    );

    if (codeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kode verifikasi tidak valid atau sudah digunakan' },
        { status: 400 }
      );
    }

    const codeRecord = codeCheck.rows[0];
    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Kode verifikasi sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Mark verification code as used
    await pool.query(
      'UPDATE verification_codes SET verified = true WHERE id = $1',
      [codeRecord.id]
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
        true, // Phone is verified since verification code was valid
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

