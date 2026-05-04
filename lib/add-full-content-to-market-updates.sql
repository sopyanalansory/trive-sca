-- Migration: Add full_content column to market_updates table
-- Stores full article/body HTML (optional, can be NULL)

ALTER TABLE market_updates ADD COLUMN IF NOT EXISTS full_content TEXT;
