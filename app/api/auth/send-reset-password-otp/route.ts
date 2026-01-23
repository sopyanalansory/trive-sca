import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode } = body;

    if (!phone || !countryCode) {
      return NextResponse.json(
        { error: 'Nomor telepon dan kode negara wajib diisi' },
        { status: 400 }
      );
    }

    // Normalize phone number
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
    const fullPhoneNumber = countryCode.replace('+', '') + normalizedPhone;

    // Validate phone length
    if (normalizedPhone.length < 9 || normalizedPhone.length > 13) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak valid. Mohon masukkan nomor yang benar.' },
        { status: 400 }
      );
    }

    // Check if user exists by phone number
    const userCheck = await pool.query(
      'SELECT id, email, phone, country_code FROM users WHERE phone = $1 AND country_code = $2',
      [normalizedPhone, countryCode]
    );

    if (userCheck.rows.length === 0) {
      // Don't reveal if phone exists or not for security
      return NextResponse.json(
        { message: 'Jika nomor telepon terdaftar, kode OTP akan dikirim ke WhatsApp Anda.' },
        { status: 200 }
      );
    }

    const user = userCheck.rows[0];

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
          msisdn: fullPhoneNumber,
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
        [fullPhoneNumber, 'VERIHUBS', expiresAt] // Store 'VERIHUBS' as code to indicate it's managed by Verihubs
      );

      // For development, return success message
      // In production, don't reveal if phone exists
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
