import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Mapping step ke kolom DB (sesuai urutan halaman open-investment-account)
const STEP_COLUMN: Record<number, string> = {
  0: 'selected_products',      // Product selection
  1: 'personal_info',          // personal-info
  2: 'statement_acceptances',  // company-profile
  3: 'statement_acceptances',  // demo-experience
  4: 'statement_acceptances',  // transaction-experience
  5: 'statement_acceptances',  // disclosure
  6: 'account_opening_info',   // account-opening-form
  7: 'emergency_contact',      // emergency-contact-form
  8: 'employment',             // employment-form
  9: 'wealth_list',            // wealth-list-form
  10: 'bank_account',          // account-bank-form
  11: 'additional_statements', // additional-statement 1-8
  12: 'atur_akun',             // atur-akun
};

/** GET - Ambil aplikasi draft/aktif user untuk resume */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    if (!token) return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const result = await pool.query(
      `SELECT id, user_id, status, current_step,
              selected_products, personal_info, statement_acceptances,
              account_opening_info, emergency_contact, employment,
              wealth_list, bank_account, additional_statements,
              atur_akun, document_urls, created_at, updated_at
       FROM investment_account_applications
       WHERE user_id = $1 AND status IN ('draft', 'in_progress')
       ORDER BY updated_at DESC LIMIT 1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ application: null }, { status: 200 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      application: {
        id: row.id,
        userId: row.user_id,
        status: row.status,
        currentStep: row.current_step,
        selectedProducts: row.selected_products || {},
        personalInfo: row.personal_info || {},
        statementAcceptances: row.statement_acceptances || {},
        accountOpeningInfo: row.account_opening_info || {},
        emergencyContact: row.emergency_contact || {},
        employment: row.employment || {},
        wealthList: row.wealth_list || {},
        bankAccount: row.bank_account || {},
        additionalStatements: row.additional_statements || {},
        aturAkun: row.atur_akun || {},
        documentUrls: row.document_urls || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Get investment account error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data aplikasi.' },
      { status: 500 }
    );
  }
}

/** POST - Simpan data per step. Body: { step: number, data: object } */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    if (!token) return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const body = await request.json();
    const { step, data, documentUrls } = body as {
      step?: number;
      data?: Record<string, unknown>;
      documentUrls?: Record<string, string>;
    };

    if (step == null || step < 0 || step > 12) {
      return NextResponse.json({ error: 'Step tidak valid (0-12)' }, { status: 400 });
    }

    const column = STEP_COLUMN[step];
    if (!column) {
      return NextResponse.json({ error: 'Step tidak dikenali' }, { status: 400 });
    }

    const dataJson = JSON.stringify(data || {});

    // Cari aplikasi draft/in_progress
    const existing = await pool.query(
      `SELECT id, current_step FROM investment_account_applications
       WHERE user_id = $1 AND status IN ('draft', 'in_progress')
       LIMIT 1`,
      [decoded.userId]
    );

    if (existing.rows.length > 0) {
      const appId = existing.rows[0].id;
      const currentStep = existing.rows[0].current_step;
      const newStep = Math.max(currentStep, step);
      const newStatus = step >= 12 ? 'submitted' : 'in_progress';

      if (column === 'statement_acceptances' || column === 'additional_statements') {
        await pool.query(
          `UPDATE investment_account_applications
           SET ${column} = COALESCE(${column}, '{}'::jsonb) || $2::jsonb,
               current_step = $3, status = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [appId, dataJson, newStep, newStatus]
        );
      } else {
        const docUrlsJson = step === 1 && documentUrls && Object.keys(documentUrls).length > 0
          ? JSON.stringify(documentUrls)
          : null;
        if (docUrlsJson) {
          await pool.query(
            `UPDATE investment_account_applications
             SET ${column} = $2, document_urls = COALESCE(document_urls, '{}'::jsonb) || $3::jsonb,
                 current_step = $4, status = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [appId, dataJson, docUrlsJson, newStep, newStatus]
          );
        } else {
          await pool.query(
            `UPDATE investment_account_applications
             SET ${column} = $2, current_step = $3, status = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [appId, dataJson, newStep, newStatus]
          );
        }
      }

      return NextResponse.json({ success: true, id: appId, currentStep: newStep, status: newStatus });
    }

    // Insert baru: semua kolom kosong kecuali yang dipakai step ini
    const emptyJson = '{}';
    const documentUrlsJson = step === 1 && documentUrls && Object.keys(documentUrls).length > 0
      ? JSON.stringify(documentUrls)
      : emptyJson;
    const insertResult = await pool.query(
      `INSERT INTO investment_account_applications
       (user_id, status, current_step, selected_products, personal_info,
        statement_acceptances, account_opening_info, emergency_contact,
        employment, wealth_list, bank_account, additional_statements,
        atur_akun, document_urls)
       VALUES ($1, 'in_progress', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, current_step, status`,
      [
        decoded.userId,
        step,
        column === 'selected_products' ? dataJson : emptyJson,
        column === 'personal_info' ? dataJson : emptyJson,
        column === 'statement_acceptances' ? dataJson : emptyJson,
        column === 'account_opening_info' ? dataJson : emptyJson,
        column === 'emergency_contact' ? dataJson : emptyJson,
        column === 'employment' ? dataJson : emptyJson,
        column === 'wealth_list' ? dataJson : emptyJson,
        column === 'bank_account' ? dataJson : emptyJson,
        column === 'additional_statements' ? dataJson : emptyJson,
        column === 'atur_akun' ? dataJson : emptyJson,
        (step === 1 && documentUrls && Object.keys(documentUrls).length > 0) ? documentUrlsJson : (column === 'document_urls' ? dataJson : emptyJson),
      ]
    );

    const row = insertResult.rows[0];
    const newStatus = step >= 12 ? 'submitted' : 'in_progress';
    return NextResponse.json({ success: true, id: row.id, currentStep: step, status: newStatus });
  } catch (error: any) {
    console.error('Save investment account error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan data.' },
      { status: 500 }
    );
  }
}
