import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendWithdrawalNotificationEmail } from '@/lib/email';
import {
  getLatestValidSalesforceToken,
  requestSalesforceAccessToken,
  saveSalesforceAccessToken,
} from '@/lib/salesforce-oauth';
import { apiLogger, logRouteError } from '@/lib/logger';

const log = apiLogger('withdrawal');
const SALESFORCE_CREATE_DEPOSIT_WITHDRAWAL_FLOW_URL =
  process.env.SALESFORCE_CREATE_DEPOSIT_WITHDRAWAL_FLOW_URL ||
  'https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Create_Deposit_Withdrawal';

type SalesforceCreateDepositWithdrawalOutput = {
  data?: {
    Id?: string;
    CreatedDate?: string;
    [key: string]: unknown;
  };
  message?: string | null;
  [key: string]: unknown;
};

function getClientIpAddress(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '0.0.0.0';
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

async function callCreateDepositWithdrawalFlow(payload: {
  platformId: string;
  currency: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  ipAddress: string;
  comment: string;
}): Promise<SalesforceCreateDepositWithdrawalOutput> {
  let token = await getValidSalesforceToken();
  let response = await fetch(SALESFORCE_CREATE_DEPOSIT_WITHDRAWAL_FLOW_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [
        {
          platformId: payload.platformId,
          type: 'Withdrawal Request',
          currency: payload.currency,
          amount: payload.amount,
          bankName: payload.bankName,
          bankAccountNumber: payload.bankAccountNumber,
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
    response = await fetch(SALESFORCE_CREATE_DEPOSIT_WITHDRAWAL_FLOW_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            platformId: payload.platformId,
            type: 'Withdrawal Request',
            currency: payload.currency,
            amount: payload.amount,
            bankName: payload.bankName,
            bankAccountNumber: payload.bankAccountNumber,
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
    throw new Error('Salesforce Create Deposit/Withdrawal response is not valid JSON');
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Salesforce Create Deposit/Withdrawal failed: HTTP ${response.status}`),
      { details: parsed }
    );
  }

  const outputValues = Array.isArray(parsed)
    ? (parsed[0] as { outputValues?: SalesforceCreateDepositWithdrawalOutput } | undefined)
        ?.outputValues
    : null;

  return outputValues || { message: null, data: undefined };
}

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

    // Parse request body
    const body = await request.json();
    const { platformId, bankName, currency, amount, description, bankAccountNumber } = body;

    // Validate required fields
    if (!platformId || !bankName || !currency || !amount || !bankAccountNumber) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Jumlah harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Verify platform belongs to user and get platform details
    const platformCheck = await pool.query(
      `SELECT id, login_number, platform_registration_id
       FROM platforms
       WHERE id = $1
         AND user_id = $2
         AND LOWER(TRIM(COALESCE(status, ''))) = 'enabled'`,
      [platformId, decoded.userId]
    );

    if (platformCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Platform tidak ditemukan, tidak memiliki akses, atau status akun tidak Enabled' },
        { status: 403 }
      );
    }

    const platform = platformCheck.rows[0];
    if (!platform.platform_registration_id) {
      return NextResponse.json(
        { error: 'Platform belum memiliki ID Salesforce (platform_registration_id)' },
        { status: 400 }
      );
    }

    // Salesforce flow expects withdrawal amount as negative value.
    const salesforceAmount = -Math.abs(amountNum);

    // Send request to Salesforce flow first
    const salesforceOutput = await callCreateDepositWithdrawalFlow({
      platformId: String(platform.platform_registration_id),
      currency,
      amount: salesforceAmount,
      bankName,
      bankAccountNumber: typeof bankAccountNumber === 'string' ? bankAccountNumber : '',
      ipAddress: getClientIpAddress(request),
      comment: typeof description === 'string' ? description : '',
    });
    const salesforceFinancialRequestId = salesforceOutput?.data?.Id
      ? String(salesforceOutput.data.Id).trim()
      : '';
    if (!salesforceFinancialRequestId) {
      return NextResponse.json(
        {
          error:
            salesforceOutput?.message ||
            'Salesforce gagal memproses withdrawal request.',
          salesforce: {
            message: salesforceOutput?.message || null,
            financialRequestId: null,
            createdDate: salesforceOutput?.data?.CreatedDate || null,
          },
        },
        { status: 502 }
      );
    }

    // Get user details for email
    const userResult = await pool.query(
      'SELECT id, fullname, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Insert withdrawal request
    const result = await pool.query(
      `INSERT INTO withdrawal_requests 
       (user_id, platform_id, bank_name, currency, amount, description, status, salesforce_request_id, salesforce_created_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7, $8)
       RETURNING id, user_id, platform_id, bank_name, currency, amount, description, status, salesforce_request_id, salesforce_created_date, created_at`,
      [
        decoded.userId,
        platformId,
        bankName,
        currency,
        amountNum,
        description || null,
        salesforceFinancialRequestId,
        salesforceOutput?.data?.CreatedDate || null,
      ]
    );

    const withdrawalRequest = result.rows[0];

    // Send email notification (non-blocking)
    sendWithdrawalNotificationEmail({
      userId: user.id,
      userName: user.fullname,
      userEmail: user.email,
      platformId: platform.id,
      loginNumber: platform.login_number,
      bankName: bankName,
      currency: currency,
      amount: amountNum,
      description: description || undefined,
      requestId: withdrawalRequest.id,
      createdAt: withdrawalRequest.created_at,
    }).catch((error: unknown) => {
      logRouteError(log, request, error, 'Withdrawal notification email failed');
    });

    return NextResponse.json(
      {
        message: 'Withdrawal request berhasil dibuat',
        salesforce: {
          message: salesforceOutput?.message || null,
          financialRequestId: salesforceOutput?.data?.Id || null,
          createdDate: salesforceOutput?.data?.CreatedDate || null,
        },
        withdrawalRequest: {
          id: withdrawalRequest.id,
          userId: withdrawalRequest.user_id,
          platformId: withdrawalRequest.platform_id,
          bankName: withdrawalRequest.bank_name,
          currency: withdrawalRequest.currency,
          amount: parseFloat(withdrawalRequest.amount),
          description: withdrawalRequest.description,
          status: withdrawalRequest.status,
          salesforceRequestId: withdrawalRequest.salesforce_request_id,
          salesforceCreatedDate: withdrawalRequest.salesforce_created_date,
          createdAt: withdrawalRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Create withdrawal request failed');
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat withdrawal request. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
