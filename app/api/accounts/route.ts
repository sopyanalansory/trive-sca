import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLogger, logRouteError } from '@/lib/logger';
import { fetchAndPersistPlatformsForUser } from '@/lib/salesforce-platforms';

const log = apiLogger('accounts');

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
    let result = await pool.query(
      `SELECT 
        id,
        account_type,
        client_group_name,
        login_number,
        server_name,
        status,
        currency,
        nickname,
        leverage,
        type
      FROM platforms 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      const accountOrLeadId =
        (decoded.accountId && String(decoded.accountId).trim()) ||
        (decoded.leadId && String(decoded.leadId).trim()) ||
        null;

      if (accountOrLeadId) {
        try {
          await fetchAndPersistPlatformsForUser(
            decoded.userId,
            accountOrLeadId
          );
          result = await pool.query(
            `SELECT 
              id,
              account_type,
              client_group_name,
              login_number,
              server_name,
              status,
              currency,
              nickname,
              leverage,
              type
            FROM platforms 
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [decoded.userId]
          );
        } catch (error: unknown) {
          logRouteError(
            log,
            request,
            error,
            'Sync platforms from Salesforce failed'
          );
          return NextResponse.json(
            {
              error:
                'Gagal menyinkronkan akun platform dari Salesforce. Silakan coba lagi.',
            },
            { status: 502 }
          );
        }
      }
    }

    const accounts = result.rows.map((row) => ({
      id: row.id,
      type: row.type || 'Demo',
      accountType: row.account_type || '-',
      platform: row.client_group_name || row.server_name?.split('-')[0] || '-',
      login: row.login_number,
      serverName: row.server_name,
      status: row.status,
      currency: row.currency,
      nickname: row.nickname ?? null,
      leverage: row.leverage,
    }));

    return NextResponse.json(
      { accounts },
      { status: 200 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Get accounts failed');
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data akun. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
