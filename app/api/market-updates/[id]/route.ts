import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single market update by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const marketUpdateId = parseInt(id);

    if (isNaN(marketUpdateId)) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

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
        created_by,
        created_at,
        updated_at
      FROM market_updates 
      WHERE id = $1`,
      [marketUpdateId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Market update tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching market update:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data.' },
      { status: 500 }
    );
  }
}

// PUT - Update market update by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const marketUpdateId = parseInt(id);

    if (isNaN(marketUpdateId)) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

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
      created_by 
    } = body;

    // Check if market update exists
    const existingResult = await pool.query(
      'SELECT id FROM market_updates WHERE id = $1',
      [marketUpdateId]
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
      // Validate research_type
      const validResearchTypes = [
        'Daily Analysis/Strategy',
        'Trading Signal (Trading Central)',
        'Technical Sentiment (TradingView)',
      ];
      
      if (!validResearchTypes.includes(research_type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Research type tidak valid. Pilihan: ${validResearchTypes.join(', ')}` 
          },
          { status: 400 }
        );
      }
      
      updates.push(`research_type = $${paramIndex}`);
      values.push(research_type);
      paramIndex++;
    }

    if (status !== undefined) {
      // Validate status
      const validStatuses = ['Draft', 'Published', 'Archived'];
      
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` 
          },
          { status: 400 }
        );
      }
      
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

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    // Add ID to values
    values.push(marketUpdateId);

    const updateQuery = `
      UPDATE market_updates 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, research_type, status, title, summary, img_url, economic_data_1, economic_data_2, economic_data_3, economic_data_4, economic_data_5, created_by, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    return NextResponse.json({
      success: true,
      message: 'Market update berhasil diupdate',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating market update:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate data.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete market update by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
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

    return NextResponse.json({
      success: true,
      message: `Market update "${existingResult.rows[0].title}" berhasil dihapus`,
    });
  } catch (error: any) {
    console.error('Error deleting market update:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus data.' },
      { status: 500 }
    );
  }
}

