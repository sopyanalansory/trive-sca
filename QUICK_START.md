# Quick Start Guide

## Setup Cepat Backend

### 1. Install PostgreSQL
Pastikan PostgreSQL sudah terinstall dan berjalan.

### 2. Buat Database
```bash
psql -U postgres
CREATE DATABASE trive_db;
\q
```

### 3. Setup Environment Variables
Buat file `.env.local` di root project:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/trive_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL= # kosongkan untuk pakai host yang sama, isi dengan https://api.domainmu.com untuk production
NEXT_PUBLIC_USE_API_PROXY=false # set true jika mau proxy untuk hindari CORS
API_PROXY_TARGET= # wajib diisi jika NEXT_PUBLIC_USE_API_PROXY=true, contoh https://api.domainmu.com
```

**Ganti:**
- `postgres` dengan username PostgreSQL Anda
- `password` dengan password PostgreSQL Anda
- `localhost:5432` jika menggunakan konfigurasi berbeda
- `NEXT_PUBLIC_API_BASE_URL` jika API dipisah dari host frontend (biarkan kosong untuk pakai API lokal/relative)
- Aktifkan proxy (set `NEXT_PUBLIC_USE_API_PROXY=true` dan `API_PROXY_TARGET=https://api.domainmu.com`) jika backend tidak mengizinkan CORS; semua request akan diarahkan lewat Next.js `/api/proxy/*`

### 4. Initialize Database
```bash
npm run init-db
```

### 5. Start Development Server
```bash
npm run dev
```

## Testing

### Register User
1. Buka http://localhost:3000/register
2. Isi form registrasi
3. Klik "Kirim Kode" - kode verifikasi akan muncul di console/alert (development mode)
4. Masukkan kode verifikasi
5. Submit form

### Login
1. Buka http://localhost:3000/login
2. Masukkan email dan password yang sudah didaftarkan
3. Klik "Masuk"

## Catatan Penting

- Di development mode, kode verifikasi SMS akan dikembalikan di response untuk testing
- Untuk production, perlu integrasi dengan SMS provider (Twilio, AWS SNS, dll)
- JWT token disimpan di localStorage setelah login/register berhasil
- Token digunakan untuk autentikasi di halaman yang memerlukan login

## Troubleshooting

**Error: Cannot connect to database**
- Pastikan PostgreSQL service berjalan
- Check DATABASE_URL di .env.local
- Pastikan database `trive_db` sudah dibuat

**Error: Table does not exist**
- Jalankan `npm run init-db` untuk membuat schema database

**Port 3000 already in use**
- Gunakan port lain: `npm run dev -- -p 3001`

