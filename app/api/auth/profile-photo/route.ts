import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Configure max body size for this route (10MB)
export const maxDuration = 30;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header (exactly same as /api/auth/me)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    // Debug logging
    console.log('[Profile Photo API] Request received:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : null,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });

    if (!token) {
      console.error('[Profile Photo API] No token found');
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('[Profile Photo API] Token verification failed');
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 401 }
      );
    }

    console.log('[Profile Photo API] Token verified for user:', decoded.userId);

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

    // Return image with proper content type
    return new NextResponse(profile_photo, {
      status: 200,
      headers: {
        'Content-Type': profile_photo_mime_type || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Get profile photo error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil foto profil.' },
      { status: 500 }
    );
  }
}
