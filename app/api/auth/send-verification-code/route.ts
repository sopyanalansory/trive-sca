import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateVerificationCode } from '@/lib/auth';

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

    // Generate verification code
    const code = generateVerificationCode(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    // Save verification code to database
    await pool.query(
      `INSERT INTO verification_codes (phone, code, expires_at)
       VALUES ($1, $2, $3)`,
      [fullPhoneNumber, code, expiresAt]
    );

    // TODO: Send SMS using your SMS provider (Twilio, AWS SNS, etc.)
    // For now, we'll just log it. In production, you should send via SMS service
    console.log(`Verification code for ${fullPhoneNumber}: ${code}`);
    
    // In development, you might want to return the code for testing
    // In production, remove this and only send via SMS
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          message: 'Kode verifikasi telah dikirim',
          // Only return code in development for testing
          code: code,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Kode verifikasi telah dikirim' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim kode verifikasi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

