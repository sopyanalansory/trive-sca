-- Migration: normalize transfer_requests Salesforce fields to single id/date

ALTER TABLE transfer_requests
  ADD COLUMN IF NOT EXISTS salesforce_request_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS salesforce_created_date TIMESTAMP WITH TIME ZONE;

UPDATE transfer_requests
SET
  salesforce_request_id = COALESCE(
    salesforce_request_id,
    salesforce_origin_request_id,
    salesforce_destination_request_id
  ),
  salesforce_created_date = COALESCE(
    salesforce_created_date,
    salesforce_origin_created_date,
    salesforce_destination_created_date
  );

ALTER TABLE transfer_requests
  DROP COLUMN IF EXISTS salesforce_origin_request_id,
  DROP COLUMN IF EXISTS salesforce_destination_request_id,
  DROP COLUMN IF EXISTS salesforce_origin_created_date,
  DROP COLUMN IF EXISTS salesforce_destination_created_date;

CREATE INDEX IF NOT EXISTS idx_transfer_requests_salesforce_request_id
  ON transfer_requests(salesforce_request_id);
