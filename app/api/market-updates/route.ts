import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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

// GET - List all market updates with pagination, filtering, and sorting (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Filter params
    const status = searchParams.get('status');
    const researchType = searchParams.get('research_type');
    const createdBy = searchParams.get('created_by');
    const salesforceId = searchParams.get('salesforce_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Sorting params
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (researchType) {
      conditions.push(`research_type = $${paramIndex}`);
      values.push(researchType);
      paramIndex++;
    }
    
    if (createdBy) {
      conditions.push(`created_by ILIKE $${paramIndex}`);
      values.push(`%${createdBy}%`);
      paramIndex++;
    }
    
    if (salesforceId) {
      conditions.push(`salesforce_id = $${paramIndex}`);
      values.push(salesforceId);
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['id', 'created_at', 'updated_at', 'status', 'research_type', 'title', 'created_by', 'salesforce_id'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM market_updates ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get data with pagination
    const dataQuery = `
      SELECT 
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
        salesforce_id,
        created_at,
        updated_at
      FROM market_updates 
      ${whereClause}
      ORDER BY ${safeSortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
    
    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching market updates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan saat mengambil data market updates.' 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new market update (REQUIRES BASIC AUTH)
export async function POST(request: NextRequest) {
  try {
    // Verify Basic Auth
    const auth = verifyBasicAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Market Updates API"' } }
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
      created_by,
      salesforce_id
    } = body;

    // Validate required fields
    if (!research_type || !title || !created_by || !salesforce_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Research type, title, created_by, dan salesforce_id wajib diisi' 
        },
        { status: 400 }
      );
    }

    // // Validate research_type
    // const validResearchTypes = [
    //   'Daily Analysis/Strategy',
    //   'Trading Signal (Trading Central)',
    //   'Technical Sentiment (TradingView)',
    // ];
    
    // if (!validResearchTypes.includes(research_type)) {
    //   return NextResponse.json(
    //     { 
    //       success: false, 
    //       error: `Research type tidak valid. Pilihan: ${validResearchTypes.join(', ')}` 
    //     },
    //     { status: 400 }
    //   );
    // }

    // Validate status
    const validStatuses = ['Draft', 'Published', 'Archived'];
    const finalStatus = status || 'Draft';
    
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Insert new market update
    const result = await pool.query(
      `INSERT INTO market_updates (research_type, status, title, summary, img_url, economic_data_1, economic_data_2, economic_data_3, economic_data_4, economic_data_5, created_by, salesforce_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, research_type, status, title, summary, img_url, economic_data_1, economic_data_2, economic_data_3, economic_data_4, economic_data_5, created_by, salesforce_id, created_at, updated_at`,
      [research_type, finalStatus, title, summary || null, img_url || null, economic_data_1 || null, economic_data_2 || null, economic_data_3 || null, economic_data_4 || null, economic_data_5 || null, created_by, salesforce_id]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Market update berhasil dibuat',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating market update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan saat membuat market update.' 
      },
      { status: 500 }
    );
  }
}

