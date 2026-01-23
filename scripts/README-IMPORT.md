# Import Users from CSV

Script untuk mengimpor data user dari file CSV ke tabel `users` di database.

## Cara Menggunakan

### 1. Pastikan Database Sudah Terinisialisasi

```bash
npm run init-db
```

### 2. (Opsional) Tambahkan Kolom Tambahan

Jika Anda ingin menyimpan data tambahan dari CSV (Account ID, Client ID, Client Type, CFD Status), jalankan migration:

```sql
-- Jalankan di psql atau melalui script
psql -d trive_db -f lib/add-user-fields.sql
```

Atau copy-paste isi file `lib/add-user-fields.sql` ke psql.

### 3. Jalankan Import

```bash
npm run import-users
```

## Format CSV

File CSV harus berada di `csv/Import Account.csv` dengan format:

```csv
"Account ID","Client ID","Account Name","First Name","Last Name","Email","Mobile","Client Type","CFD Status"
```

## Fitur Script

1. **Normalisasi Data:**
   - Email: lowercase dan trim
   - Phone: menghapus country code (62/0062), leading zero, dan karakter non-digit
   - Name: menggabungkan First Name dan Last Name, atau menggunakan Account Name jika tersedia

2. **Penanganan Duplikat:**
   - Jika email sudah ada: update data user yang ada
   - Jika email belum ada: insert user baru
   - Validasi phone number untuk menghindari duplikat

3. **Validasi:**
   - Email harus valid format
   - Phone number harus ada dan valid setelah normalisasi
   - Name akan menggunakan default "User" jika semua field name kosong

4. **Password:**
   - User yang diimpor akan memiliki password default: `TempPassword123!`
   - **PENTING:** User harus reset password setelah login pertama kali

5. **Default Values:**
   - `country_code`: `+62`
   - `marketing_consent`: `true`
   - `terms_consent`: `true`
   - `email_verified`: `true`
   - `phone_verified`: `true`

## Output

Script akan menampilkan:
- Jumlah baris yang diproses
- Jumlah user yang berhasil diimpor/diupdate
- Jumlah baris yang di-skip (kosong)
- Jumlah error dan detail errornya

## Troubleshooting

### Error: "Phone already exists"
- Phone number sudah digunakan oleh user lain
- Script akan skip row tersebut dan mencatat error

### Error: "Email already exists"
- Email sudah ada di database
- Script akan update user yang ada dengan data baru dari CSV

### Error: "Missing or invalid phone number"
- Nomor telepon tidak valid atau kosong setelah normalisasi
- Periksa format nomor telepon di CSV

### Error: "Invalid email format"
- Format email tidak valid
- Periksa format email di CSV

## Catatan Penting

1. **Backup Database:** Selalu backup database sebelum menjalankan import
2. **Password Default:** Semua user yang diimpor akan memiliki password yang sama. Pastikan user reset password setelah login pertama kali
3. **Data Existing:** Script akan update user yang sudah ada berdasarkan email. Pastikan data di CSV sudah benar
