-- Migration: add status fields from Salesforce Campaign Member
ALTER TABLE campaign_members
  ADD COLUMN IF NOT EXISTS campaign_member_id_from_salesforce VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status_code VARCHAR(16),
  ADD COLUMN IF NOT EXISTS status_label VARCHAR(64),
  ADD COLUMN IF NOT EXISTS selected_rewards TEXT;

COMMENT ON COLUMN campaign_members.campaign_member_id_from_salesforce IS 'Salesforce Campaign Member Id (record Id, e.g. 00v...)';
COMMENT ON COLUMN campaign_members.status_code IS 'Salesforce CampaignMember Status__c code (e.g. 1..6)';
COMMENT ON COLUMN campaign_members.status_label IS 'Mapped readable status label from Status__c';
COMMENT ON COLUMN campaign_members.selected_rewards IS 'Salesforce CampaignMember Selected_Rewards__c';
