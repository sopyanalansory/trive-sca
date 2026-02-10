import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendDepositNotificationEmail } from '@/lib/email';

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
    const { platformId, bankName, currency, amount, description } = body;

    // Validate required fields
    if (!platformId || !bankName || !currency || !amount) {
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
      'SELECT id, login_number FROM platforms WHERE id = $1 AND user_id = $2',
      [platformId, decoded.userId]
    );

    if (platformCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Platform tidak ditemukan atau tidak memiliki akses' },
        { status: 403 }
      );
    }

    const platform = platformCheck.rows[0];

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

    // Insert deposit request
    const result = await pool.query(
      `INSERT INTO deposit_requests 
       (user_id, platform_id, bank_name, currency, amount, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING id, user_id, platform_id, bank_name, currency, amount, description, status, created_at`,
      [decoded.userId, platformId, bankName, currency, amountNum, description || null]
    );

    const depositRequest = result.rows[0];

    // Send email notification (non-blocking)
    sendDepositNotificationEmail({
      userId: user.id,
      userName: user.fullname,
      userEmail: user.email,
      platformId: platform.id,
      loginNumber: platform.login_number,
      bankName: bankName,
      currency: currency,
      amount: amountNum,
      description: description || undefined,
      requestId: depositRequest.id,
      createdAt: depositRequest.created_at,
    }).catch((error) => {
      console.error('Failed to send deposit notification email:', error);
      // Don't fail the request if email fails
    });

    return NextResponse.json(
      {
        message: 'Deposit request berhasil dibuat',
        depositRequest: {
          id: depositRequest.id,
          userId: depositRequest.user_id,
          platformId: depositRequest.platform_id,
          bankName: depositRequest.bank_name,
          currency: depositRequest.currency,
          amount: parseFloat(depositRequest.amount),
          description: depositRequest.description,
          status: depositRequest.status,
          createdAt: depositRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create deposit request error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat deposit request. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
