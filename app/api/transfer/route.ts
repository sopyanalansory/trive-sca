import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendTransferNotificationEmail } from '@/lib/email';
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from '@/lib/salesforce-oauth';
import { apiLogger, logRouteError } from '@/lib/logger';

const log = apiLogger('transfer');
const SALESFORCE_CREATE_TRANSFER_FLOW_URL =
  process.env.SALESFORCE_CREATE_TRANSFER_FLOW_URL ||
  'https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Create_Transfer_Request';

type SalesforceTransferOutput = {
  dataOrigin?: {
    Id?: string;
    CreatedDate?: string;
    [key: string]: unknown;
  };
  dataDestination?: {
    Id?: string;
    CreatedDate?: string;
    [key: string]: unknown;
  };
  message?: string | null;
  [key: string]: unknown;
};

type PlatformRow = {
  id: number;
  type: string | null;
  login_number: string | null;
  platform_registration_id: string | null;
};

function getClientIpAddress(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '0.0.0.0';
}

function isLiveType(type: string | null): boolean {
  return String(type || '').trim().toLowerCase() === 'live';
}

async function getValidSalesforceToken(): Promise<string> {
  let token = await getLatestValidSalesforceToken();
  if (!token) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    token = fresh.access_token;
  }
  return token;
}

async function callCreateTransferFlow(payload: {
  platformIdOrigin: string;
  platformIdDestination: string;
  currency: string;
  amount: number;
  ipAddress: string;
  comment: string;
}): Promise<SalesforceTransferOutput> {
  let token = await getValidSalesforceToken();
  let response = await fetch(SALESFORCE_CREATE_TRANSFER_FLOW_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [
        {
          platformIdOrigin: payload.platformIdOrigin,
          platformIdDestination: payload.platformIdDestination,
          currency: payload.currency,
          amount: payload.amount,
          ipAddress: payload.ipAddress,
          comment: payload.comment,
        },
      ],
    }),
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    const fresh = await requestSalesforceAccessToken();
    await saveSalesforceAccessToken(fresh);
    token = fresh.access_token;
    response = await fetch(SALESFORCE_CREATE_TRANSFER_FLOW_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            platformIdOrigin: payload.platformIdOrigin,
            platformIdDestination: payload.platformIdDestination,
            currency: payload.currency,
            amount: payload.amount,
            ipAddress: payload.ipAddress,
            comment: payload.comment,
          },
        ],
      }),
      cache: 'no-store',
    });
  }

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error('Salesforce transfer response is not valid JSON');
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Create Transfer failed: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  const outputValues = Array.isArray(parsed)
    ? (parsed[0] as { outputValues?: SalesforceTransferOutput } | undefined)
        ?.outputValues
    : null;

  return outputValues || { message: null };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      platformIdOrigin,
      platformIdDestination,
      currency = 'USD',
      amount,
      comment,
    } = body || {};

    if (!platformIdOrigin || !platformIdDestination || !amount) {
      return NextResponse.json(
        {
          error:
            'platformIdOrigin, platformIdDestination, dan amount wajib diisi.',
        },
        { status: 400 }
      );
    }
    if (Number(platformIdOrigin) === Number(platformIdDestination)) {
      return NextResponse.json(
        { error: 'Akun asal dan tujuan tidak boleh sama.' },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Jumlah transfer harus lebih dari 0.' },
        { status: 400 }
      );
    }

    const platformResult = await pool.query(
      `
      SELECT id, type, login_number, platform_registration_id
      FROM platforms
      WHERE user_id = $1
        AND id IN ($2, $3)
      `,
      [decoded.userId, Number(platformIdOrigin), Number(platformIdDestination)]
    );
    if (platformResult.rows.length !== 2) {
      return NextResponse.json(
        { error: 'Platform asal/tujuan tidak ditemukan atau tidak memiliki akses.' },
        { status: 403 }
      );
    }

    const platforms = platformResult.rows as PlatformRow[];
    const origin = platforms.find((p) => p.id === Number(platformIdOrigin)) || null;
    const destination =
      platforms.find((p) => p.id === Number(platformIdDestination)) || null;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Platform asal/tujuan tidak valid.' },
        { status: 400 }
      );
    }
    if (!isLiveType(origin.type) || !isLiveType(destination.type)) {
      return NextResponse.json(
        { error: 'Transfer hanya boleh dari akun Live ke akun Live.' },
        { status: 400 }
      );
    }
    if (!origin.platform_registration_id || !destination.platform_registration_id) {
      return NextResponse.json(
        {
          error:
            'Platform asal/tujuan belum memiliki ID Salesforce (platform_registration_id).',
        },
        { status: 400 }
      );
    }

    const salesforceOutput = await callCreateTransferFlow({
      platformIdOrigin: String(origin.platform_registration_id),
      platformIdDestination: String(destination.platform_registration_id),
      currency: String(currency || 'USD').toUpperCase(),
      amount: amountNum,
      ipAddress: getClientIpAddress(request),
      comment: typeof comment === 'string' ? comment : '',
    });
    const dataOriginId = salesforceOutput?.dataOrigin?.Id
      ? String(salesforceOutput.dataOrigin.Id).trim()
      : '';
    const dataDestinationId = salesforceOutput?.dataDestination?.Id
      ? String(salesforceOutput.dataDestination.Id).trim()
      : '';
    const salesforceRequestId = dataOriginId || dataDestinationId;
    const salesforceCreatedDate =
      salesforceOutput?.dataOrigin?.CreatedDate ||
      salesforceOutput?.dataDestination?.CreatedDate ||
      null;
    if (!dataOriginId || !dataDestinationId) {
      return NextResponse.json(
        {
          error:
            salesforceOutput?.message ||
            'Salesforce gagal memproses transfer request.',
          salesforce: {
            message: salesforceOutput?.message || null,
            dataOriginId: dataOriginId || null,
            dataDestinationId: dataDestinationId || null,
          },
        },
        { status: 502 }
      );
    }

    const insertResult = await pool.query(
      `
      INSERT INTO transfer_requests (
        user_id,
        platform_id_origin,
        platform_id_destination,
        currency,
        amount,
        comment,
        status,
        salesforce_request_id,
        salesforce_created_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7, $8)
      RETURNING
        id, user_id, platform_id_origin, platform_id_destination, currency, amount,
        comment, status, salesforce_request_id, salesforce_created_date, created_at
      `,
      [
        decoded.userId,
        origin.id,
        destination.id,
        String(currency || 'USD').toUpperCase(),
        amountNum,
        typeof comment === 'string' ? comment : null,
        salesforceRequestId,
        salesforceCreatedDate,
      ]
    );
    const transferRequest = insertResult.rows[0];

    // Get user details for email
    const userResult = await pool.query(
      'SELECT id, fullname, email FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      sendTransferNotificationEmail({
        userId: user.id,
        userName: user.fullname,
        userEmail: user.email,
        platformIdOrigin: origin.id,
        platformIdDestination: destination.id,
        loginNumberOrigin: origin.login_number || '-',
        loginNumberDestination: destination.login_number || '-',
        currency: String(currency || 'USD').toUpperCase(),
        amount: amountNum,
        comment: typeof comment === 'string' ? comment : undefined,
        requestId: transferRequest.id,
        createdAt: transferRequest.created_at,
      }).catch((error: unknown) => {
        logRouteError(log, request, error, 'Transfer notification email failed');
      });
    }

    return NextResponse.json(
      {
        message: 'Transfer request berhasil dibuat',
        salesforce: {
          message: salesforceOutput?.message || null,
          dataOrigin: salesforceOutput?.dataOrigin || null,
          dataDestination: salesforceOutput?.dataDestination || null,
        },
        transferRequest: {
          id: transferRequest.id,
          userId: transferRequest.user_id,
          platformIdOrigin: transferRequest.platform_id_origin,
          platformIdDestination: transferRequest.platform_id_destination,
          currency: transferRequest.currency,
          amount: parseFloat(transferRequest.amount),
          comment: transferRequest.comment,
          status: transferRequest.status,
          salesforceRequestId: transferRequest.salesforce_request_id,
          salesforceCreatedDate: transferRequest.salesforce_created_date,
          createdAt: transferRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Create transfer request failed');
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat transfer request. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
