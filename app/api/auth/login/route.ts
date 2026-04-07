import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getLatestValidSalesforceToken } from '@/lib/salesforce-oauth';

async function hasSalesforceClientByEmail(email: string): Promise<boolean> {
  const token = await getLatestValidSalesforceToken();
  if (!token) {
    return false;
  }

  const salesforceFlowUrl =
    process.env.SALESFORCE_SEARCH_CLIENT_FLOW_URL ||
    'https://gkg-mfsa.my.salesforce.com/services/data/v66.0/actions/custom/flow/Trive_Invest_API_Search_Client_by_Email';

  const response = await fetch(salesforceFlowUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [
        {
          email,
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  const hasRecordFoundMessage = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return value.trim().toLowerCase() === 'record found';
  };

  const isFoundFromResult = (result: any): boolean => {
    if (result?.isSuccess === false) return false;
    return hasRecordFoundMessage(result?.outputValues?.message) || hasRecordFoundMessage(result?.message);
  };

  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length > 0) {
    return results.some((result: any) => isFoundFromResult(result));
  }

  if (Array.isArray(data) && data.length > 0) {
    return data.some((result: any) => isFoundFromResult(result));
  }

  return (
    hasRecordFoundMessage(data?.outputValues?.message) ||
    hasRecordFoundMessage(data?.message)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, fullname, email, phone, country_code, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      const normalizedEmail = email.toLowerCase().trim();
      const isSalesforceClient = await hasSalesforceClientByEmail(normalizedEmail);

      if (isSalesforceClient) {
        return NextResponse.json(
          {
            error: 'Akun ini tidak terdaftar atau kata sandi Anda saat ini salah!',
            errorType: 'wrong_password',
            email: normalizedEmail,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Akun ini tidak terdaftar atau kata sandi Anda saat ini salah!', errorType: 'user_not_found' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Akun ini tidak terdaftar atau kata sandi Anda saat ini salah!', errorType: 'wrong_password', email: email.toLowerCase().trim() },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return NextResponse.json(
      {
        message: 'Login berhasil',
        user: {
          id: user.id,
          name: user.fullname,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          countryCode: user.country_code,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

