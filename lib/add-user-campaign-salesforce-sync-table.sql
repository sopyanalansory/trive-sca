-- Tabel terpisah: status sync SF per user (SF sering null di level CampaignMember — hindari kolom null di campaign_members)
CREATE TABLE IF NOT EXISTS user_campaign_salesforce_sync (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE user_campaign_salesforce_sync IS 'Terakhir sukses sync partisipasi campaign user ke Salesforce; NULL = belum pernah';
COMMENT ON COLUMN user_campaign_salesforce_sync.synced_at IS 'Set setelah flow push SF untuk user ini selesai (meski response SF null)';

-- Upgrade dari skema lama: hapus kolom SF per-baris di campaign_members
DROP INDEX IF EXISTS idx_campaign_members_pending_sf_sync;
ALTER TABLE campaign_members DROP COLUMN IF EXISTS synced_to_salesforce_at;
