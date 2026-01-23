# Cara Menjalankan Migration Platform di Server

Ada beberapa cara untuk menjalankan file SQL `lib/add-platform-table.sql` di server:

## Opsi 1: Menggunakan Script Node.js (Recommended)

Cara termudah dan paling aman untuk production:

```bash
npm run migrate-platform
```

Atau langsung dengan tsx:

```bash
npx tsx lib/run-platform-migration.ts
```

**Keuntungan:**
- Menggunakan koneksi database yang sama dengan aplikasi
- Otomatis load environment variables dari `.env` atau `.env.local`
- Error handling yang lebih baik
- Bisa dijalankan dari mana saja (tidak perlu akses SSH ke server database)

## Opsi 2: Menggunakan psql Command Line

Jika Anda punya akses langsung ke server database:

### Di Server Lokal (Development)

```bash
# Jika menggunakan DATABASE_URL
psql $DATABASE_URL -f lib/add-platform-table.sql

# Atau dengan kredensial langsung
psql -h localhost -U postgres -d trive_db -f lib/add-platform-table.sql
```

### Di Server Production (via SSH)

```bash
# SSH ke server
ssh user@your-server.com

# Masuk ke direktori project
cd /path/to/trive-sca

# Jalankan migration
psql $DATABASE_URL -f lib/add-platform-table.sql
```

### Jika Menggunakan Docker

```bash
# Copy file SQL ke container
docker cp lib/add-platform-table.sql trive-postgres:/tmp/

# Jalankan di dalam container
docker exec trive-postgres psql -U postgres -d trive_db -f /tmp/add-platform-table.sql
```

## Opsi 3: Copy-Paste Manual ke psql

Jika tidak bisa menggunakan file, bisa copy-paste isi SQL:

```bash
# Masuk ke psql
psql $DATABASE_URL
# atau
psql -h localhost -U postgres -d trive_db

# Copy-paste isi file lib/add-platform-table.sql
# Tekan Enter setelah setiap statement
```

## Opsi 4: Menggunakan Database Client GUI

Jika menggunakan tools seperti pgAdmin, DBeaver, atau TablePlus:

1. Buka koneksi ke database
2. Buka file `lib/add-platform-table.sql`
3. Copy semua isinya
4. Paste ke query editor
5. Execute query

## Verifikasi Migration

Setelah migration berhasil, verifikasi dengan:

```bash
# Cek apakah tabel sudah dibuat
psql $DATABASE_URL -c "\d platforms"

# Atau cek dengan query
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'platforms';"
```

## Troubleshooting

### Error: "relation already exists"
- Tabel sudah ada, ini aman untuk diabaikan
- Jika ingin re-run, hapus tabel dulu: `DROP TABLE IF EXISTS platforms CASCADE;`

### Error: "function update_updated_at_column() does not exist"
- Pastikan sudah menjalankan `npm run init-db` terlebih dahulu
- Function ini dibuat di `db-init.sql`

### Error: "permission denied"
- Pastikan user database punya permission untuk CREATE TABLE
- Atau gunakan user postgres/superuser

### Error: "connection refused"
- Pastikan database server sedang berjalan
- Cek DATABASE_URL di `.env` atau `.env.local`
- Cek firewall/network settings

## Catatan Penting

1. **Backup Database Sebelum Migration** (untuk production):
   ```bash
   pg_dump $DATABASE_URL > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Tabel sudah ada di db-init.sql**: 
   - Jika sudah menjalankan `npm run init-db` setelah update, tabel sudah otomatis dibuat
   - Migration ini hanya perlu dijalankan jika database sudah ada sebelumnya

3. **Foreign Key Constraint**:
   - Tabel `platforms` memiliki foreign key ke `users`
   - Pastikan tabel `users` sudah ada sebelum menjalankan migration ini
