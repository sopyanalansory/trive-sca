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

    // Get platforms data for the user
    const result = await pool.query(
      `SELECT 
        id,
        account_id,
        login_number,
        server_name,
        account_type,
        client_group_name,
        status,
        currency,
        leverage,
        swap_free
      FROM platforms 
      WHERE user_id = $1 AND status = 'Enabled'
      ORDER BY created_at DESC`,
      [decoded.userId]
    );

    const platforms = result.rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      loginNumber: row.login_number,
      serverName: row.server_name,
      accountType: row.account_type,
      clientGroupName: row.client_group_name,
      status: row.status,
      currency: row.currency,
      leverage: row.leverage,
      swapFree: row.swap_free,
    }));

    return NextResponse.json(
      { platforms },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get platforms error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data platform. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
