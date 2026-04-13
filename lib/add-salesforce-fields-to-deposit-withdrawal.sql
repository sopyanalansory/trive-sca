-- Migration: add Salesforce request metadata to deposit/withdrawal tables

ALTER TABLE deposit_requests
  ADD COLUMN IF NOT EXISTS salesforce_request_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS salesforce_created_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS salesforce_request_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS salesforce_created_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_deposit_requests_salesforce_request_id
  ON deposit_requests(salesforce_request_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_salesforce_request_id
  ON withdrawal_requests(salesforce_request_id);
