# Backend Setup Guide

Panduan setup backend untuk aplikasi Trive SCA dengan PostgreSQL.

## Prerequisites

1. **PostgreSQL** - Pastikan PostgreSQL sudah terinstall di sistem Anda
   - Download: https://www.postgresql.org/download/
   - Atau gunakan Docker: `docker run --name trive-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=trive_db -p 5432:5432 -d postgres`

2. **Node.js** - Versi 18 atau lebih tinggi

## Setup Database

### 1. Buat Database PostgreSQL

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE trive_db;

# Keluar dari psql
\q
```

### 2. Setup Environment Variables

Buat file `.env.local` di root project dengan konfigurasi berikut:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/trive_db

# JWT Secret (generate random string untuk production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=development
```

**Penting:** 
- Ganti `username`, `password`, dan `localhost:5432` sesuai konfigurasi PostgreSQL Anda
- Untuk production, gunakan JWT_SECRET yang kuat dan aman (minimal 32 karakter random)
- Jangan commit file `.env.local` ke repository (sudah ada di .gitignore)

### 3. Initialize Database Schema

Jalankan script untuk membuat tabel-tabel yang diperlukan:

```bash
npm run init-db
```

Atau jika menggunakan tsx langsung:

```bash
npx tsx lib/db-init.ts
```

Script ini akan membuat:
- Tabel `users` - untuk menyimpan data user
- Tabel `verification_codes` - untuk menyimpan kode verifikasi SMS
- Index dan trigger yang diperlukan

## API Endpoints

### 1. Register User
**POST** `/api/auth/register`

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "81234567890",
  "countryCode": "+62",
  "password": "Password123",
  "verificationCode": "123456",
  "referralCode": "REF123", // optional
  "marketingConsent": true,
  "termsConsent": true
}
```

Response (Success - 201):
```json
{
  "message": "Registrasi berhasil",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "81234567890"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login User
**POST** `/api/auth/login`

Request body:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

Response (Success - 200):
```json
{
  "message": "Login berhasil",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "81234567890",
    "countryCode": "+62"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Send Verification Code
**POST** `/api/auth/send-verification-code`

Request body:
```json
{
  "phone": "81234567890",
  "countryCode": "+62"
}
```

Response (Success - 200):
```json
{
  "message": "Kode verifikasi telah dikirim",
  "code": "123456" // Hanya di development mode untuk testing
}
```

**Catatan:** 
- Di development mode, kode verifikasi akan dikembalikan di response untuk memudahkan testing
- Di production, kode hanya dikirim via SMS (perlu integrasi dengan SMS provider seperti Twilio, AWS SNS, dll)

## Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255))
- email (VARCHAR(255) UNIQUE)
- phone (VARCHAR(20))
- country_code (VARCHAR(5))
- password_hash (VARCHAR(255))
- referral_code (VARCHAR(50))
- marketing_consent (BOOLEAN)
- terms_consent (BOOLEAN)
- email_verified (BOOLEAN)
- phone_verified (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Verification Codes Table
```sql
- id (SERIAL PRIMARY KEY)
- phone (VARCHAR(20))
- code (VARCHAR(10))
- expires_at (TIMESTAMP)
- verified (BOOLEAN)
- created_at (TIMESTAMP)
```

## Security Features

1. **Password Hashing** - Menggunakan bcryptjs dengan 10 salt rounds
2. **JWT Authentication** - Token JWT untuk autentikasi user
3. **Phone Verification** - Sistem verifikasi via SMS code
4. **Input Validation** - Validasi di backend untuk semua input

## Development Notes

1. **Verification Code**: 
   - Di development, kode verifikasi akan muncul di console dan response
   - Untuk production, perlu integrasi dengan SMS provider

2. **Database Connection**:
   - Menggunakan connection pooling untuk efisiensi
   - Auto-reconnect jika connection terputus

3. **Error Handling**:
   - Semua error di-handle dengan proper HTTP status codes
   - Error messages dalam bahasa Indonesia untuk user experience

## Troubleshooting

### Database Connection Error
- Pastikan PostgreSQL service berjalan
- Check DATABASE_URL di .env.local
- Pastikan database `trive_db` sudah dibuat

### Port Already in Use
- Jika port 5432 sudah digunakan, ubah port di DATABASE_URL
- Atau stop service PostgreSQL yang menggunakan port tersebut

### Migration Error
- Pastikan user PostgreSQL memiliki permission untuk create table
- Check apakah database sudah dibuat dengan benar

## Next Steps

1. **SMS Integration**: Integrasikan dengan SMS provider untuk production
2. **Email Verification**: Tambahkan email verification flow
3. **Password Reset**: Implementasi forgot password functionality
4. **Rate Limiting**: Tambahkan rate limiting untuk API endpoints
5. **Logging**: Setup proper logging system
6. **Testing**: Tambahkan unit tests dan integration tests

