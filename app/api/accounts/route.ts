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

    // Get platform accounts for the user
    const result = await pool.query(
      `SELECT 
        id,
        account_type,
        client_group_name,
        login_number,
        server_name,
        status,
        currency,
        leverage,
        type
      FROM platforms 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [decoded.userId]
    );

    const accounts = result.rows.map((row) => ({
      id: row.id,
      type: row.type || 'Demo',
      accountType: row.account_type || '-',
      platform: row.client_group_name || row.server_name?.split('-')[0] || '-',
      login: row.login_number,
      serverName: row.server_name,
      status: row.status,
      currency: row.currency,
      leverage: row.leverage,
    }));

    return NextResponse.json(
      { accounts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data akun. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
