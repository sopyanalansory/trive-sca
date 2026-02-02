-- Migration: Make research_type, status, title, created_by nullable in market_updates table
-- These columns can now be NULL

ALTER TABLE market_updates ALTER COLUMN research_type DROP NOT NULL;
ALTER TABLE market_updates ALTER COLUMN status DROP NOT NULL;
ALTER TABLE market_updates ALTER COLUMN title DROP NOT NULL;
ALTER TABLE market_updates ALTER COLUMN created_by DROP NOT NULL;
