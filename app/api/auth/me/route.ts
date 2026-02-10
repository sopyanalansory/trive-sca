import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    // Get user data from database
    const result = await pool.query(
      `SELECT id, fullname, email, phone, country_code, 
       place_of_birth,
       city, postal_code, street_name, house_number,
       profile_photo, profile_photo_mime_type
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Check if user has profile photo
    const hasProfilePhoto = user.profile_photo !== null;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.fullname || '',
          fullname: user.fullname || '',
          email: user.email,
          phone: user.phone,
          countryCode: user.country_code,
          placeOfBirth: user.place_of_birth || '',
          city: user.city || '',
          postalCode: user.postal_code || '',
          streetName: user.street_name || '',
          houseNumber: user.house_number || '',
          hasProfilePhoto: hasProfilePhoto,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data user. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      placeOfBirth,
      city,
      postalCode,
      streetName,
      houseNumber,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle fullName - simpan ke field fullname
    if (fullName !== undefined) {
      if (!fullName || !fullName.trim()) {
        return NextResponse.json(
          { error: 'Nama lengkap tidak boleh kosong' },
          { status: 400 }
        );
      }
      updates.push(`fullname = $${paramIndex}`);
      values.push(fullName.trim());
      paramIndex++;
    }

    if (phone !== undefined) {
      if (!phone || !phone.trim()) {
        return NextResponse.json(
          { error: 'Nomor telepon tidak boleh kosong' },
          { status: 400 }
        );
      }
      updates.push(`phone = $${paramIndex}`);
      values.push(phone.trim());
      paramIndex++;
    }

    if (email !== undefined) {
      if (!email || !email.trim()) {
        return NextResponse.json(
          { error: 'Email tidak boleh kosong' },
          { status: 400 }
        );
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Format email tidak valid' },
          { status: 400 }
        );
      }
      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.trim().toLowerCase(), decoded.userId]
      );
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 400 }
        );
      }
      updates.push(`email = $${paramIndex}`);
      values.push(email.trim().toLowerCase());
      paramIndex++;
    }

    if (placeOfBirth !== undefined) {
      updates.push(`place_of_birth = $${paramIndex}`);
      values.push(placeOfBirth || null);
      paramIndex++;
    }

    if (city !== undefined) {
      updates.push(`city = $${paramIndex}`);
      values.push(city || null);
      paramIndex++;
    }

    if (postalCode !== undefined) {
      updates.push(`postal_code = $${paramIndex}`);
      values.push(postalCode || null);
      paramIndex++;
    }

    if (streetName !== undefined) {
      updates.push(`street_name = $${paramIndex}`);
      values.push(streetName || null);
      paramIndex++;
    }

    if (houseNumber !== undefined) {
      updates.push(`house_number = $${paramIndex}`);
      values.push(houseNumber || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    // Add user id to values
    values.push(decoded.userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, fullname, email, phone, country_code, 
                place_of_birth,
                city, postal_code, street_name, house_number,
                profile_photo, profile_photo_mime_type
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Check if user has profile photo
    const hasProfilePhoto = user.profile_photo !== null;

    return NextResponse.json(
      {
        message: 'Profil berhasil diupdate',
        user: {
          id: user.id,
          name: user.fullname || '',
          fullname: user.fullname || '',
          email: user.email,
          phone: user.phone,
          countryCode: user.country_code,
          placeOfBirth: user.place_of_birth || '',
          city: user.city || '',
          postalCode: user.postal_code || '',
          streetName: user.street_name || '',
          houseNumber: user.house_number || '',
          hasProfilePhoto: hasProfilePhoto,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate profil. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
