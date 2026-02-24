# Flow Open Investment Account – DB & Backend

## Ringkasan

Data open-investment-account disimpan ke database `investment_account_applications`. Setiap langkah form memanggil API untuk menyimpan data, sehingga user bisa **resume** jika keluar atau refresh.

---

## Alur (Flow)

```
[0] Product selection      → POST step 0 (selected_products)
[1] Personal info          → POST step 1 (personal_info)
[2] Company profile        → POST step 2 (statement_acceptances)
[3] Demo experience        → POST step 3 (statement_acceptances)
[4] Transaction experience → POST step 4 (statement_acceptances)
[5] Disclosure statement   → POST step 5 (statement_acceptances)
[6] Account opening form   → POST step 6 (account_opening_info)
[7] Emergency contact      → POST step 7 (emergency_contact)
[8] Employment             → POST step 8 (employment)
[9] Wealth list            → POST step 9 (wealth_list)
[10] Account bank          → POST step 10 (bank_account)
[11] Additional statements → POST step 11 (additional_statements)
[12] Atur akun             → POST step 12 (atur_akun)
                            → status jadi "submitted"
[Success]                  → Redirect ke /accounts
```

---

## Database

### Tabel: `investment_account_applications`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL | PK |
| user_id | INTEGER | FK ke users(id) |
| status | VARCHAR | draft, in_progress, submitted, pending_review, approved, rejected |
| current_step | INTEGER | Langkah terakhir yang sudah disimpan |
| selected_products | JSONB | Step 0 |
| personal_info | JSONB | Step 1 |
| statement_acceptances | JSONB | Step 2–5 (merge per step) |
| account_opening_info | JSONB | Step 6 |
| emergency_contact | JSONB | Step 7 |
| employment | JSONB | Step 8 |
| wealth_list | JSONB | Step 9 |
| bank_account | JSONB | Step 10 |
| additional_statements | JSONB | Step 11 |
| atur_akun | JSONB | Step 12 |
| document_urls | JSONB | URL foto KTP, selfie, buku tabungan |
| created_at, updated_at | TIMESTAMP | |

### Migration

Jalankan migrasi:

```bash
npm run migrate-investment-account
```

Atau manual:

```bash
psql $DATABASE_URL -f lib/investment-account-schema.sql
```

Pastikan `update_updated_at_column()` sudah ada (dari `npm run init-db`).

---

## API

### GET /api/investment-account

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "application": {
    "id": 1,
    "userId": 123,
    "status": "in_progress",
    "currentStep": 3,
    "personalInfo": { "name": "...", "email": "...", ... },
    ...
  }
}
```

Jika tidak ada draft: `{ "application": null }`

---

### POST /api/investment-account

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "step": 1,
  "data": {
    "name": "...",
    "email": "...",
    "phone": "...",
    ...
  }
}
```

**Response:**

```json
{
  "success": true,
  "id": 1,
  "currentStep": 1,
  "status": "in_progress"
}
```

---

## Integrasi di Frontend

### 1. Saat masuk flow (mis. personal-info)

- Panggil `GET /api/investment-account`
- Jika `application` ada, prefill form dari `application.personalInfo`, `application.currentStep`, dll.
- Jika belum ada aplikasi, form kosong (atau dari `/api/auth/me`)

### 2. Saat submit tiap langkah

- Panggil `POST /api/investment-account` dengan `step` dan `data` sesuai halaman
- Setelah sukses, redirect ke halaman berikutnya

### Contoh (personal-info)

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  const token = localStorage.getItem("token");
  const res = await fetch(buildApiUrl("/api/investment-account"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      step: 1,
      data: formData,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    setError(err.error || "Gagal menyimpan");
    return;
  }

  router.push("/open-investment-account/company-profile");
};
```

### 3. Mapping step ke halaman

| Step | Halaman |
|------|---------|
| 0 | /open-investment-account (product selection) |
| 1 | /open-investment-account/personal-info |
| 2 | /open-investment-account/company-profile |
| 3 | /open-investment-account/demo-experience-statement |
| 4 | /open-investment-account/transaction-experience |
| 5 | /open-investment-account/disclosure-statement |
| 6 | /open-investment-account/account-opening-form |
| 7 | /open-investment-account/emergency-contact-form |
| 8 | /open-investment-account/employment-form |
| 9 | /open-investment-account/wealth-list-form |
| 10 | /open-investment-account/account-bank-form |
| 11 | /open-investment-account/additional-statement* |
| 12 | /open-investment-account/atur-akun |

---

## File upload (KTP, Selfie, Buku Tabungan)

- Upload file ke storage (S3, dll.) terlebih dahulu.
- Simpan URL hasil upload di `document_urls` atau gabungkan di `personal_info` / `bank_account`.
- Atau gunakan endpoint terpisah `POST /api/investment-account/documents` yang update `document_urls`.

---

## Resume

- User bisa menutup browser dan kembali nanti.
- Saat buka halaman manapun di flow, panggil `GET /api/investment-account`.
- Dari `currentStep` dan `application.*` bisa prefill dan/atau redirect ke langkah terakhir yang belum selesai.
