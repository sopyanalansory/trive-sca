import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendResetPasswordNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platformId } = body;

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID wajib diisi' },
        { status: 400 }
      );
    }

    // Get platform and user data
    const platformResult = await pool.query(
      `SELECT 
        p.id,
        p.login_number,
        p.server_name,
        p.account_type,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM platforms p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [platformId, decoded.userId]
    );

    if (platformResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Platform tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    const platform = platformResult.rows[0];

    // Send email notification
    const emailResult = await sendResetPasswordNotificationEmail({
      userId: platform.user_id,
      userName: platform.user_name,
      userEmail: platform.user_email,
      platformId: platform.id,
      loginNumber: platform.login_number,
      serverName: platform.server_name,
      accountType: platform.account_type,
    });

    if (!emailResult.success) {
      console.error('Failed to send reset password email:', emailResult.error);
      return NextResponse.json(
        { error: 'Gagal mengirim email notifikasi. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Request reset password berhasil dikirim ke email notification',
        emailSent: true
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset password request error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses request reset password. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
