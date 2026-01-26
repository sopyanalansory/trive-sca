-- Migration: Add salesforce_id column to market_updates table
-- This column is mandatory and will be used to link market updates with Salesforce records

-- Add salesforce_id column (NOT NULL constraint will be added after backfilling existing data)
ALTER TABLE market_updates ADD COLUMN IF NOT EXISTS salesforce_id VARCHAR(255);

-- Create index on salesforce_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_market_updates_salesforce_id ON market_updates(salesforce_id);

-- Note: If you have existing data, you may need to backfill salesforce_id values
-- before adding the NOT NULL constraint. Uncomment the following line after backfilling:
-- ALTER TABLE market_updates ALTER COLUMN salesforce_id SET NOT NULL;
