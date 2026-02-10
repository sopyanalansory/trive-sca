import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
