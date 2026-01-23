import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const VERIHUBS_API_KEY = process.env.VERIHUBS_API_KEY || 'B0KRgWAJRO9xLVGRYlGA5quLhTcsmnOC';
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID || '4bd67e6d-deaf-467c-bafe-1ffe915c3518';
const VERIHUBS_API_URL = 'https://api.verihubs.com/v2/whatsapp/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode, otp, newPassword } = body;

    if (!phone || !countryCode || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Nomor telepon, kode negara, OTP, dan password baru wajib diisi' },
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

    // Validate password
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

    // Check if user exists by phone number
    const userCheck = await pool.query(
      'SELECT id, email, phone, country_code FROM users WHERE phone = $1 AND country_code = $2',
      [normalizedPhone, countryCode]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak terdaftar' },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];

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
          msisdn: fullPhoneNumber,
          otp: otp,
        }),
      });

      const verihubsData = await verihubsResponse.json();

      if (!verihubsResponse.ok || !verihubsData.message || !verihubsData.message.includes('verified')) {
        console.error('Verihubs verify error:', verihubsData);
        return NextResponse.json(
          { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      // Mark verification code as used
      await pool.query(
        `UPDATE verification_codes 
         SET verified = true 
         WHERE phone = $1 AND verified = false 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [fullPhoneNumber]
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
    } catch (verihubsError: any) {
      console.error('Verihubs API error:', verihubsError);
      return NextResponse.json(
        { error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Gagal reset password. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
