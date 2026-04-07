-- Migration: Add Salesforce profile fields to users table
-- Run this migration once before relying on Salesforce enrichment fields.

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lead_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS salesforce_interview_guid VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS salesforce_interview_status VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_lead_id ON users(lead_id);
CREATE INDEX IF NOT EXISTS idx_users_salesforce_interview_guid ON users(salesforce_interview_guid);
