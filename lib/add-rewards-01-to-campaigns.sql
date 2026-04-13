-- Migration: add rewards_01 column to campaigns for Salesforce Rewards_01__c
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS rewards_01 TEXT;

COMMENT ON COLUMN campaigns.rewards_01 IS 'Salesforce Rewards_01__c';
