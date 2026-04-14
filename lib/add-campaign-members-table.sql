-- Migration: Campaign members (registrasi / Campaign Member–aligned fields)
CREATE TABLE IF NOT EXISTS campaign_members (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_id_from_salesforce VARCHAR(255) NOT NULL,
  client_id VARCHAR(255),
  contact_id VARCHAR(255),
  lead_or_contact_id VARCHAR(255),
  lead_id VARCHAR(255),
  status_code VARCHAR(16),
  status_label VARCHAR(64),
  selected_rewards TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE campaign_members ADD COLUMN IF NOT EXISTS status_code VARCHAR(16);
ALTER TABLE campaign_members ADD COLUMN IF NOT EXISTS status_label VARCHAR(64);
ALTER TABLE campaign_members ADD COLUMN IF NOT EXISTS selected_rewards TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id_sf ON campaign_members(campaign_id_from_salesforce);
CREATE INDEX IF NOT EXISTS idx_campaign_members_client_id ON campaign_members(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_contact_id ON campaign_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_lead_or_contact_id ON campaign_members(lead_or_contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_lead_id ON campaign_members(lead_id);

DROP TRIGGER IF EXISTS update_campaign_members_updated_at ON campaign_members;
CREATE TRIGGER update_campaign_members_updated_at BEFORE UPDATE ON campaign_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE campaign_members IS 'User/client membership per campaign; mirrors Salesforce Campaign Member–style ids';
COMMENT ON COLUMN campaign_members.campaign_id_from_salesforce IS 'Denormalized Salesforce Campaign id (same as campaigns.campaign_id_from_salesforce)';
COMMENT ON COLUMN campaign_members.client_id IS 'Client identifier (e.g. internal or Salesforce Account id)';
COMMENT ON COLUMN campaign_members.contact_id IS 'Salesforce Contact Id';
COMMENT ON COLUMN campaign_members.lead_or_contact_id IS 'Salesforce LeadOrContactId (polymorphic)';
COMMENT ON COLUMN campaign_members.lead_id IS 'Salesforce Lead Id';
COMMENT ON COLUMN campaign_members.status_code IS 'Salesforce CampaignMember Status__c code (e.g. 1..6)';
COMMENT ON COLUMN campaign_members.status_label IS 'Mapped readable status label from Status__c';
COMMENT ON COLUMN campaign_members.selected_rewards IS 'Salesforce CampaignMember Selected_Rewards__c';
