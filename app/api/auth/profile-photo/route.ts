import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLogger, logRouteError, requestLogFields } from '@/lib/logger';

const log = apiLogger('auth:profile-photo');

// Configure max body size for this route (10MB)
export const maxDuration = 30;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header (exactly same as /api/auth/me)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    log.debug(
      {
        ...requestLogFields(request),
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        tokenLength: token?.length ?? 0,
      },
      'Profile photo GET'
    );

    if (!token) {
      log.warn(requestLogFields(request), 'Profile photo GET without token');
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      log.warn(requestLogFields(request), 'Profile photo GET token invalid');
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 401 }
      );
    }

    log.debug(
      { ...requestLogFields(request), userId: decoded.userId },
      'Profile photo GET authorized'
    );

    // Get user photo from database
    const result = await pool.query(
      'SELECT profile_photo, profile_photo_mime_type FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].profile_photo) {
      return NextResponse.json(
        { error: 'Foto profil tidak ditemukan' },
        { status: 404 }
      );
    }

    const { profile_photo, profile_photo_mime_type } = result.rows[0];

    // BYTEA dari PostgreSQL → Buffer (Node); NextResponse menerima Buffer di runtime
    const body = Buffer.isBuffer(profile_photo)
      ? profile_photo
      : (() => {
          const raw = profile_photo as ArrayBuffer | ArrayBufferView;
          const bytes =
            raw instanceof ArrayBuffer
              ? new Uint8Array(raw)
              : new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
          return Buffer.from(bytes);
        })();

    return new NextResponse(body as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': profile_photo_mime_type || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Profile photo GET failed');
    const detail =
      (error && typeof error === 'object' && 'message' in error && String((error as Error).message)) ||
      (error instanceof Error && error.stack && String(error.stack).split('\n')[0]) ||
      (typeof error === 'object' ? JSON.stringify(error) : String(error)) ||
      'Unknown error';
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat mengambil foto profil.',
        detail,
      },
      { status: 500 }
    );
  }
}
