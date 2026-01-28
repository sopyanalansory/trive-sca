-- Migration: Add meta_text column to market_updates table
-- This column is optional and can be used to store additional metadata

-- Add meta_text column (optional, can be NULL)
ALTER TABLE market_updates ADD COLUMN IF NOT EXISTS meta_text TEXT;
