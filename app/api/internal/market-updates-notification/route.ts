import { NextRequest, NextResponse } from 'next/server';
import {
  isMetaMarketUpdateNotificationEnabled,
} from '@/lib/market-update-meta-notification';
import { enqueueMarketUpdateNotificationJob } from '@/lib/market-update-notification-queue';
import { apiLogger, logRouteError } from '@/lib/logger';

const log = apiLogger('market-updates-internal-notification');

const BASIC_AUTH_USERNAME = process.env.MARKET_UPDATES_USERNAME || 'admin';
const BASIC_AUTH_PASSWORD = process.env.MARKET_UPDATES_PASSWORD || 'trive2024!';

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function verifyBasicAuth(request: NextRequest): { success: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { success: false, error: 'Authorization header tidak ditemukan.' };
  }

  try {
    const base64Credentials = authHeader.substring(6);
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    if (username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
      return { success: true };
    }

    return { success: false, error: 'Username atau password salah.' };
  } catch {
    return { success: false, error: 'Format credentials tidak valid.' };
  }
}

// POST - Internal endpoint to enqueue meta notification (REQUIRES BASIC AUTH)
export async function POST(request: NextRequest) {
  try {
    const auth = verifyBasicAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Market Updates API"',
          },
        }
      );
    }

    if (!isMetaMarketUpdateNotificationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notifikasi market update sedang nonaktif.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const loginNumber = toText(body?.login_number).trim();
    const title = toText(body?.title).trim();
    const summary = toText(body?.summary).trim();

    if (!loginNumber || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Field login_number dan title wajib diisi.',
        },
        { status: 400 }
      );
    }

    await enqueueMarketUpdateNotificationJob({
      salesforceId: loginNumber,
      title,
      summary,
    });

    return NextResponse.json({
      success: true,
      message: 'Notifikasi market update berhasil di-enqueue',
      data: {
        login_number: loginNumber,
        title,
        summary,
      },
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Enqueue internal market update notification failed');
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat enqueue notifikasi market update.',
      },
      {
        status: 500,
      }
    );
  }
}
