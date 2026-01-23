import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

// Normalize phone number from database (handle 0062, 62, 0, etc.)
function normalizePhoneForVerihubs(phone: string, countryCode: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code variations (0062, 62)
  if (cleaned.startsWith('0062')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Get country code digits (remove +)
  const countryCodeDigits = countryCode.replace('+', '');
  
  // Combine: country code + normalized phone
  return countryCodeDigits + cleaned;
}

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
    const msisdn = normalizePhoneForVerihubs(phoneFromDb, countryCodeFromDb);

    // Validate normalized phone length
    const phoneWithoutCountryCode = msisdn.replace(/^62/, '');
    if (phoneWithoutCountryCode.length < 9 || phoneWithoutCountryCode.length > 13) {
      console.error(`Invalid phone length after normalization: ${phoneWithoutCountryCode.length} for phone: ${phoneFromDb}`);
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
          otp_length: '5',
        }),
      });

      const verihubsData = await verihubsResponse.json();

      if (!verihubsResponse.ok) {
        console.error('Verihubs error:', verihubsData);
        return NextResponse.json(
          { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
          { status: 500 }
        );
      }

      // Save verification code reference to database for tracking
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

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
    } catch (verihubsError: any) {
      console.error('Verihubs API error:', verihubsError);
      return NextResponse.json(
        { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Send reset password OTP error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
