import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLogger, logRouteError, requestLogFields } from '@/lib/logger';
import { fetchAndPersistPlatformsForUser } from '@/lib/salesforce-platforms';
import { getMetaUserAccount } from '@/lib/metamanager';

const log = apiLogger('accounts');
const ACCOUNTS_CACHE_TTL_MS = 60_000;
const accountsCache = new Map<
  number,
  { expiresAt: number; accounts: unknown[] }
>();

type MetaAccountPayload = Record<string, unknown>;

function pickFirstDefined(
  obj: MetaAccountPayload,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }
  }
  return undefined;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapMetaRealtimeMetrics(raw: unknown): {
  balance: number | null;
  equity: number | null;
  pnl: number | null;
  freeMargin: number | null;
} {
  if (!raw || typeof raw !== 'object') {
    return {
      balance: null,
      equity: null,
      pnl: null,
      freeMargin: null,
    };
  }

  const payload = raw as MetaAccountPayload;
  const nestedBalanceUser = toNullableNumber(
    (payload.balance as Record<string, unknown> | undefined)?.user
  );
  const balance = toNullableNumber(
    pickFirstDefined(payload, ['Balance', 'balance'])
  ) ?? nestedBalanceUser;
  const equity = toNullableNumber(
    pickFirstDefined(payload, ['Equity', 'equity'])
  );
  const pnlFromPayload = toNullableNumber(
    pickFirstDefined(payload, ['Profit', 'profit', 'Floating', 'floating', 'PnL', 'pnl'])
  );
  const freeMargin = toNullableNumber(
    pickFirstDefined(payload, ['MarginFree', 'marginFree', 'FreeMargin', 'freeMargin'])
  );
  const pnl =
    pnlFromPayload ??
    (balance !== null && equity !== null ? equity - balance : null);

  return {
    balance,
    equity,
    pnl,
    freeMargin,
  };
}

function resolvePlatformName(
  serverName: string | null | undefined,
  clientGroupName: string | null | undefined
): string {
  const normalizedServer = (serverName || '').toUpperCase();
  if (normalizedServer.includes('MT5')) return 'MetaTrader 5';
  if (normalizedServer.includes('MT4')) return 'MetaTrader 4';
  return clientGroupName || serverName?.split('-')[0] || '-';
}

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

    const now = Date.now();
    const cached = accountsCache.get(decoded.userId);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({ accounts: cached.accounts }, { status: 200 });
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
        fix_rate,
        swap_free,
        type,
        registration_date
      FROM platforms 
      WHERE user_id = $1
        AND LOWER(TRIM(COALESCE(status, ''))) IN ('enabled', 'read-only')
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
              fix_rate,
              swap_free,
              type,
              registration_date
            FROM platforms 
            WHERE user_id = $1
              AND LOWER(TRIM(COALESCE(status, ''))) IN ('enabled', 'read-only')
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

    const baseAccounts = result.rows.map((row) => ({
      id: row.id,
      type: row.type || 'Demo',
      accountType: row.account_type || '-',
      platform: resolvePlatformName(row.server_name, row.client_group_name),
      login: row.login_number,
      serverName: row.server_name,
      status: row.status,
      currency: row.currency,
      nickname: row.nickname ?? null,
      leverage: row.leverage,
      fixRate: row.fix_rate,
      swapFree: row.swap_free ?? null,
      registrationDate: row.registration_date ?? null,
    }));

    const accounts = await Promise.all(
      baseAccounts.map(async (account) => {
        const login =
          typeof account.login === 'string'
            ? account.login.trim()
            : String(account.login ?? '').trim();

        if (!login) {
          return {
            ...account,
            balance: null,
            equity: null,
            pnl: null,
            freeMargin: null,
          };
        }

        try {
          const metaData = await getMetaUserAccount(login);
          const metrics = mapMetaRealtimeMetrics(metaData);
          return {
            ...account,
            ...metrics,
          };
        } catch (error: unknown) {
          log.warn(
            {
              ...requestLogFields(request),
              login,
              error: error instanceof Error ? error.message : String(error),
            },
            'Failed to fetch realtime meta metrics for account'
          );
          return {
            ...account,
            balance: null,
            equity: null,
            pnl: null,
            freeMargin: null,
          };
        }
      })
    );

    accountsCache.set(decoded.userId, {
      accounts,
      expiresAt: Date.now() + ACCOUNTS_CACHE_TTL_MS,
    });

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
