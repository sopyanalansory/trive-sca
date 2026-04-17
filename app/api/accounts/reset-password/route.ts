import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLogger, logRouteError, requestLogFields } from '@/lib/logger';
import { changeMetaUserPassword, MetaManagerError } from '@/lib/metamanager';
import { sendMt5PasswordChangedEmail } from '@/lib/email';

const log = apiLogger('accounts:reset-password');

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
    const { platformId, newPassword, confirmPassword } = body as {
      platformId?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };

    const pid = Number(platformId);
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json(
        { error: 'Platform ID wajib diisi' },
        { status: 400 }
      );
    }

    const password =
      typeof newPassword === 'string' ? newPassword.trim() : '';
    const confirmedPassword =
      typeof confirmPassword === 'string' ? confirmPassword.trim() : '';
    if (!password || !confirmedPassword) {
      return NextResponse.json(
        { error: 'Kata sandi baru dan konfirmasi wajib diisi' },
        { status: 400 }
      );
    }
    if (password !== confirmedPassword) {
      return NextResponse.json(
        { error: 'Konfirmasi kata sandi tidak sesuai' },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 16) {
      return NextResponse.json(
        { error: 'Kata sandi harus terdiri dari 8-16 karakter' },
        { status: 400 }
      );
    }
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        {
          error:
            'Kata sandi harus berisi huruf kecil, huruf besar, angka, dan karakter khusus',
        },
        { status: 400 }
      );
    }

    // Get platform and user data
    const platformResult = await pool.query(
      `SELECT 
        p.id,
        p.type,
        p.login_number,
        p.server_name,
        u.id as user_id,
        u.fullname as user_name,
        u.email as user_email
      FROM platforms p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [pid, decoded.userId]
    );

    if (platformResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Platform tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    const platform = platformResult.rows[0];
    const platformType = String(platform.type ?? '')
      .trim()
      .toLowerCase();
    if (platformType !== 'demo') {
      return NextResponse.json(
        { error: 'Reset kata sandi via Meta hanya berlaku untuk akun demo' },
        { status: 400 }
      );
    }
    const loginNumber = String(platform.login_number ?? '').trim();
    if (!loginNumber) {
      return NextResponse.json(
        { error: 'Login number akun tidak tersedia' },
        { status: 400 }
      );
    }

    try {
      await changeMetaUserPassword({
        login: loginNumber,
        password,
        type: 'main',
      });
    } catch (error: unknown) {
      if (error instanceof MetaManagerError) {
        const message =
          error.statusCode >= 500
            ? 'Gagal mengubah kata sandi akun demo. Silakan coba lagi.'
            : error.message;
        log.warn(
          {
            ...requestLogFields(request),
            userId: decoded.userId,
            platformId: pid,
            loginNumber,
            status: error.statusCode,
            detail: error.detail,
          },
          'MetaManager reset password failed'
        );
        if (error.statusCode === 500) {
          log.error(
            { ...requestLogFields(request), userId: decoded.userId },
            'MetaManager credentials/configuration is missing'
          );
        }
        return NextResponse.json(
          { error: message },
          { status: error.statusCode === 500 ? 500 : 502 }
        );
      }
      throw error;
    }

    const userEmail = String(platform.user_email ?? '').trim();
    if (userEmail) {
      const emailResult = await sendMt5PasswordChangedEmail({
        name: String(platform.user_name ?? '').trim() || 'Nasabah',
        email: userEmail,
        loginNumber,
        password,
      });

      if (!emailResult.success) {
        log.warn(
          {
            ...requestLogFields(request),
            userId: decoded.userId,
            platformId: pid,
            loginNumber,
            detail: emailResult.error,
          },
          'MT5 password changed email failed'
        );
        return NextResponse.json(
          {
            error:
              'Kata sandi berhasil diubah, tetapi email notifikasi gagal dikirim.',
          },
          { status: 500 }
        );
      }
    } else {
      log.warn(
        {
          ...requestLogFields(request),
          userId: decoded.userId,
          platformId: pid,
          loginNumber,
        },
        'MT5 password changed email skipped: user email is empty'
      );
    }

    return NextResponse.json(
      { 
        message: 'Kata sandi akun demo berhasil diubah',
        loginNumber
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Platform reset password request failed');
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses request reset password. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
