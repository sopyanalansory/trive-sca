import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMarketUpdateFromFramerByDbId } from '@/lib/framer-market-updates-framer-read';
import {
  scheduleMarketUpdateFramerSync,
  scheduleMarketUpdateRemovedFromFramer,
} from '@/lib/framer-market-update-push';
import { apiLogger, logRouteError } from '@/lib/logger';

const log = apiLogger('market-updates:[id]');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Basic Auth credentials (should be in environment variables for production)
const BASIC_AUTH_USERNAME = process.env.MARKET_UPDATES_USERNAME || 'admin';
const BASIC_AUTH_PASSWORD = process.env.MARKET_UPDATES_PASSWORD || 'trive2024!';

// Helper function to verify Basic Auth
function verifyBasicAuth(request: NextRequest): { success: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { success: false, error: 'Authorization header tidak ditemukan.' };
  }
  
  try {
    const base64Credentials = authHeader.substring(6); // Remove 'Basic ' prefix
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

// GET - Get single market update by ID (PUBLIC)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get('source')?.trim().toLowerCase();
    if (
      sourceParam &&
      sourceParam !== 'db' &&
      sourceParam !== 'framer'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter source harus db atau framer.',
        },
        { status: 400 }
      );
    }
    const source = sourceParam === 'framer' ? 'framer' : 'db';

    const { id } = await params;
    const numericId = parseInt(id, 10);
    const isNumericId = !isNaN(numericId) && id === numericId.toString();

    if (source === 'framer') {
      if (!isNumericId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'source=framer hanya mendukung id numerik (slug CMS: mu-{id}).',
          },
          { status: 400 }
        );
      }
      try {
        const row = await getMarketUpdateFromFramerByDbId(numericId);
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Market update tidak ditemukan' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          source: 'framer',
          data: row,
        });
      } catch (framerErr: unknown) {
        const msg =
          framerErr instanceof Error ? framerErr.message : String(framerErr);
        if (msg.includes('FRAMER_PROJECT_URL')) {
          return NextResponse.json(
            { success: false, error: msg },
            { status: 503 }
          );
        }
        throw framerErr;
      }
    }

    // Tentukan apakah update berdasarkan kolom id (numerik) atau salesforce_id (string)
    const identifierColumn = isNumericId ? 'id' : 'salesforce_id';
    const identifierValue: number | string = isNumericId ? numericId : id;

    const result = await pool.query(
      `SELECT 
        id,
        research_type,
        status,
        title,
        summary,
        img_url,
        economic_data_1,
        economic_data_2,
        economic_data_3,
        economic_data_4,
        economic_data_5,
        meta_text,
        full_content,
        created_by,
        salesforce_id,
        created_at,
        updated_at
      FROM market_updates 
      WHERE ${identifierColumn} = $1`,
      [identifierValue]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Market update tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'db',
      data: result.rows[0],
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Get market update by id failed');
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data.' },
      { status: 500 }
    );
  }
}

// PUT - Update market update by ID (REQUIRES BASIC AUTH)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify Basic Auth
    const auth = verifyBasicAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Market Updates API"' } }
      );
    }

    const { id } = await params;
    if (!id || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }
    const numericId = parseInt(id, 10);
    const isNumericId = !isNaN(numericId) && id === numericId.toString();
    const identifierColumn = isNumericId ? 'id' : 'salesforce_id';
    const identifierValue: number | string = isNumericId ? numericId : id;

    const body = await request.json();
    const { 
      research_type, 
      status, 
      title, 
      summary, 
      img_url, 
      economic_data_1,
      economic_data_2,
      economic_data_3,
      economic_data_4,
      economic_data_5,
      meta_text,
      full_content,
      created_by,
      salesforce_id
    } = body;

    // Check if market update exists (by id atau salesforce_id)
    const existingResult = await pool.query(
      `SELECT id FROM market_updates WHERE ${identifierColumn} = $1`,
      [identifierValue]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Market update tidak ditemukan' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (research_type !== undefined) {
      updates.push(`research_type = $${paramIndex}`);
      values.push(research_type);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { success: false, error: 'Title tidak boleh kosong' },
          { status: 400 }
        );
      }
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (summary !== undefined) {
      updates.push(`summary = $${paramIndex}`);
      values.push(summary || null);
      paramIndex++;
    }

    if (img_url !== undefined) {
      updates.push(`img_url = $${paramIndex}`);
      values.push(img_url || null);
      paramIndex++;
    }

    if (economic_data_1 !== undefined) {
      updates.push(`economic_data_1 = $${paramIndex}`);
      values.push(economic_data_1 || null);
      paramIndex++;
    }

    if (economic_data_2 !== undefined) {
      updates.push(`economic_data_2 = $${paramIndex}`);
      values.push(economic_data_2 || null);
      paramIndex++;
    }

    if (economic_data_3 !== undefined) {
      updates.push(`economic_data_3 = $${paramIndex}`);
      values.push(economic_data_3 || null);
      paramIndex++;
    }

    if (economic_data_4 !== undefined) {
      updates.push(`economic_data_4 = $${paramIndex}`);
      values.push(economic_data_4 || null);
      paramIndex++;
    }

    if (economic_data_5 !== undefined) {
      updates.push(`economic_data_5 = $${paramIndex}`);
      values.push(economic_data_5 || null);
      paramIndex++;
    }

    if (meta_text !== undefined) {
      updates.push(`meta_text = $${paramIndex}`);
      values.push(meta_text || null);
      paramIndex++;
    }

    if (full_content !== undefined) {
      updates.push(`full_content = $${paramIndex}`);
      values.push(full_content || null);
      paramIndex++;
    }

    if (created_by !== undefined) {
      if (!created_by.trim()) {
        return NextResponse.json(
          { success: false, error: 'Created by tidak boleh kosong' },
          { status: 400 }
        );
      }
      updates.push(`created_by = $${paramIndex}`);
      values.push(created_by);
      paramIndex++;
    }

    // salesforce_id is mandatory, so it must be included in every update
    if (salesforce_id === undefined || !salesforce_id || !salesforce_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Salesforce ID wajib diisi' },
        { status: 400 }
      );
    }
    
    updates.push(`salesforce_id = $${paramIndex}`);
    values.push(salesforce_id);
    paramIndex++;

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    // Add identifier (id atau salesforce_id) ke values
    values.push(identifierValue);

    const updateQuery = `
      UPDATE market_updates 
      SET ${updates.join(', ')}
      WHERE ${identifierColumn} = $${paramIndex}
      RETURNING id, research_type, status, title, summary, img_url, economic_data_1, economic_data_2, economic_data_3, economic_data_4, economic_data_5, meta_text, full_content, created_by, salesforce_id, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    scheduleMarketUpdateFramerSync(result.rows[0] as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      message: 'Market update berhasil diupdate',
      data: result.rows[0],
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Update market update failed');
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate data.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete market update by ID (REQUIRES BASIC AUTH)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify Basic Auth
    const auth = verifyBasicAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Market Updates API"' } }
      );
    }

    const { id } = await params;
    const marketUpdateId = parseInt(id);

    if (isNaN(marketUpdateId)) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

    // Check if market update exists
    const existingResult = await pool.query(
      'SELECT id, title FROM market_updates WHERE id = $1',
      [marketUpdateId]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Market update tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete market update
    await pool.query('DELETE FROM market_updates WHERE id = $1', [marketUpdateId]);

    scheduleMarketUpdateRemovedFromFramer(marketUpdateId);

    return NextResponse.json({
      success: true,
      message: `Market update "${existingResult.rows[0].title}" berhasil dihapus`,
    });
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Delete market update failed');
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus data.' },
      { status: 500 }
    );
  }
}

