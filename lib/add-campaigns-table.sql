-- Migration: Campaigns (Salesforce-synced campaign metadata for app / sharing)
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id_from_salesforce VARCHAR(255) UNIQUE NOT NULL,
  banner_url VARCHAR(1000),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  terms_conditions_url VARCHAR(1000),
  see_details_url VARCHAR(1000),
  share_banner_url VARCHAR(1000),
  share_url VARCHAR(1000),
  reward_title VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE campaigns IS 'Campaign data (URLs, copy, schedule, Salesforce id)';
COMMENT ON COLUMN campaigns.campaign_id_from_salesforce IS 'Salesforce Campaign id, e.g. 701Oj00000U8NO3IAN';
