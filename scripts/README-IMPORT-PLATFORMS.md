# Import Platforms from CSV

Script untuk mengimpor data platform dari file CSV ke tabel `platforms` di database.

## Cara Menggunakan

### 1. Pastikan Database Sudah Terinisialisasi

```bash
npm run init-db
```

### 2. Buat Tabel Platforms

Jalankan migration untuk membuat tabel `platforms`:

```bash
# Jalankan di psql atau melalui script
psql -d trive_db -f lib/add-platform-table.sql
```

Atau copy-paste isi file `lib/add-platform-table.sql` ke psql.

### 3. Pastikan Users Sudah Diimpor

Platform akan dihubungkan ke user berdasarkan `account_id`. Pastikan data users sudah diimpor terlebih dahulu:

```bash
npm run import-users
```

### 4. Jalankan Import Platforms

```bash
npm run import-platforms
```

## Format CSV

File CSV harus berada di `csv/Import Platform.csv` dengan format:

```csv
"Platform Registration ID","Account: Account ID","Login Number","Server Name","Account Type","Client Group Name","Status","Currency","Leverage","Swap Free"
```

## Struktur Tabel Platforms

Tabel `platforms` memiliki kolom:
- `id` - Primary key (auto increment)
- `platform_registration_id` - Unique identifier dari CSV (UNIQUE)
- `user_id` - Foreign key ke `users.id` (nullable, diisi jika user ditemukan)
- `account_id` - Account ID untuk menghubungkan ke user
- `login_number` - Nomor login platform
- `server_name` - Nama server (contoh: PTGlobalKapitalInv-MT5-Live)
- `account_type` - Tipe akun (contoh: Classic-Fixed, Premium Zero, dll)
- `client_group_name` - Nama grup client
- `status` - Status platform (Enabled, Read-Only, Disabled)
- `currency` - Mata uang (default: USD)
- `leverage` - Leverage trading
- `swap_free` - Status swap free (Ya/Tidak)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

## Relasi dengan Users

Platform dihubungkan ke user melalui:
1. `account_id` - Mencocokkan dengan kolom `account_id` di tabel `users`
2. `user_id` - Foreign key ke `users.id` (akan diisi otomatis jika user ditemukan)

**Catatan:** Jika user dengan `account_id` yang sesuai tidak ditemukan, platform tetap akan dibuat tetapi `user_id` akan bernilai `NULL`.

## Fitur Script

1. **Normalisasi Data:**
   - Status: Normalisasi ke "Enabled", "Read-Only", atau "Disabled"
   - Swap Free: Normalisasi ke "Ya" atau "Tidak" (case-insensitive)

2. **Penanganan Duplikat:**
   - Jika `platform_registration_id` sudah ada: update data platform yang ada
   - Jika `platform_registration_id` belum ada: insert platform baru

3. **Validasi:**
   - Platform Registration ID harus ada
   - Account ID harus ada
   - Login Number harus ada
   - Server Name harus ada

4. **Pencocokan User:**
   - Script akan mencari user berdasarkan `account_id`
   - Jika ditemukan, `user_id` akan diisi
   - Jika tidak ditemukan, platform tetap dibuat dengan `user_id = NULL`

## Output

Script akan menampilkan:
- Jumlah baris yang diproses
- Jumlah platform yang berhasil diimpor/diupdate
- Jumlah baris yang di-skip (kosong)
- Jumlah error dan detail errornya

## Troubleshooting

### Error: "User with account_id not found"
- User dengan `account_id` yang sesuai belum diimpor
- Platform tetap akan dibuat tetapi tanpa `user_id`
- Pastikan import users sudah dilakukan terlebih dahulu

### Error: "Platform Registration ID already exists"
- Platform dengan ID tersebut sudah ada di database
- Script akan update data yang ada

### Error: "Foreign key constraint violation"
- Pastikan tabel `users` sudah ada
- Pastikan migration `add-platform-table.sql` sudah dijalankan
