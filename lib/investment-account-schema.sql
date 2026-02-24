-- Migration: Investment Account Application (Open Account Flow)
-- Simpan data aplikasi pembukaan rekening investasi per user
-- Flow: personal-info -> company-profile -> demo/transaction/disclosure -> account forms -> additional statements -> atur-akun -> success

-- Tabel utama: satu aplikasi per user (bisa draft sampai selesai)
CREATE TABLE IF NOT EXISTS investment_account_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- draft | in_progress | submitted | pending_review | approved | rejected
  current_step INTEGER NOT NULL DEFAULT 0,
  -- 0: product selection, 1: personal-info, 2: company-profile, ... dst

  -- Step 0: Product selection
  selected_products JSONB DEFAULT '{}',
  -- { "spa": ["Forex"], "multilateral": ["Komoditi"] }

  -- Step 1: Personal info (informasi pribadi)
  personal_info JSONB DEFAULT '{}',

  -- Step 2-5: Pernyataan & disclosures (tanggal penerimaan, accepted)
  statement_acceptances JSONB DEFAULT '{}',

  -- Step 6a: Account opening form (info pribadi lagi + npwp, tujuan, dll)
  account_opening_info JSONB DEFAULT '{}',

  -- Step 6b: Emergency contact
  emergency_contact JSONB DEFAULT '{}',

  -- Step 6c: Employment (pekerjaan)
  employment JSONB DEFAULT '{}',

  -- Step 6d: Wealth list (daftar kekayaan)
  wealth_list JSONB DEFAULT '{}',

  -- Step 6e: Bank account (akun bank)
  bank_account JSONB DEFAULT '{}',

  -- Step 7: Additional statements (1-8)
  additional_statements JSONB DEFAULT '{}',

  -- Step 8: Atur akun (account type, platform, leverage, dll)
  atur_akun JSONB DEFAULT '{}',

  -- Document URLs (foto KTP, selfie, buku tabungan - setelah upload ke storage)
  document_urls JSONB DEFAULT '{}',
  -- { "fotoKtp": "url", "fotoSelfie": "url", "bukuTabungan": "url" }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Satu aplikasi aktif per user (bisa tambah unique constraint jika hanya allow satu draft)
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_account_applications_user_id_status
  ON investment_account_applications(user_id)
  WHERE status IN ('draft', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_investment_account_applications_user_id
  ON investment_account_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_account_applications_status
  ON investment_account_applications(status);
CREATE INDEX IF NOT EXISTS idx_investment_account_applications_created_at
  ON investment_account_applications(created_at DESC);

-- Trigger update updated_at
DROP TRIGGER IF EXISTS update_investment_account_applications_updated_at ON investment_account_applications;
CREATE TRIGGER update_investment_account_applications_updated_at BEFORE UPDATE ON investment_account_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE investment_account_applications IS 'Aplikasi pembukaan rekening investasi (open-investment-account flow)';
