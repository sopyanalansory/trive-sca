import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isValidLocalPhoneLength, normalizePhoneForDb, toMsisdn } from '@/lib/phone';

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

    const normalizedPhone = normalizePhoneForDb(phone);
    const fullPhoneNumber = toMsisdn(normalizedPhone, countryCode);

    // Validate phone length
    if (!isValidLocalPhoneLength(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Nomor telepon tidak valid. Mohon masukkan nomor yang benar.' },
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
          { error: 'Gagal mengirim kode verifikasi. Silakan coba lagi.' },
          { status: 500 }
        );
      }

      // Save verification code reference to database for tracking
      // Store 'VERIHUBS' as code to indicate it's managed by Verihubs
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

      await pool.query(
        `INSERT INTO verification_codes (phone, code, expires_at)
         VALUES ($1, $2, $3)`,
        [fullPhoneNumber, 'VERIHUBS', expiresAt]
      );

      // For development, return code if Verihubs returns it
      // In production, don't return code
      const hideCode = process.env.HIDE_VERIFICATION_CODE === 'true' || 
                       process.env.HIDE_VERIFICATION_CODE === '1';
      
      if (!hideCode && verihubsData.otp) {
        console.log(`[DEBUG] Returning verification code: ${verihubsData.otp}`);
        return NextResponse.json(
          {
            message: 'Kode verifikasi telah dikirim',
            code: verihubsData.otp, // Only in development if Verihubs returns it
          },
          { status: 200 }
        );
      }

      // Don't return code (production mode)
      console.log(`[PROD] Not returning verification code (HIDE_VERIFICATION_CODE is enabled or Verihubs didn't return code)`);
      return NextResponse.json(
        { message: 'Kode verifikasi telah dikirim' },
        { status: 200 }
      );
    } catch (verihubsError: any) {
      console.error('Verihubs API error:', verihubsError);
      return NextResponse.json(
        { error: 'Gagal mengirim kode verifikasi. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim kode verifikasi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
