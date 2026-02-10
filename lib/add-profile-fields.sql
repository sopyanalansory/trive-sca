-- Migration: Add profile fields to users table
-- Run this migration to add fields for profile editing
-- This migration will:
--   1. Rename column "name" to "fullname"
--   2. Drop "first_name" and "last_name" columns if they exist
--   3. Add new profile fields (place_of_birth, city, postal_code, etc.)

-- Rename name column to fullname (only if name column exists and fullname doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fullname') THEN
        ALTER TABLE users RENAME COLUMN name TO fullname;
        RAISE NOTICE 'Column "name" renamed to "fullname"';
    ELSE
        RAISE NOTICE 'Column "name" does not exist or "fullname" already exists, skipping rename';
    END IF;
END $$;

-- Drop first_name and last_name columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users DROP COLUMN first_name;
        RAISE NOTICE 'Column "first_name" dropped';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users DROP COLUMN last_name;
        RAISE NOTICE 'Column "last_name" dropped';
    END IF;
END $$;

-- Add personal information fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255);

-- Add address information fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_number VARCHAR(50);

-- Create indexes for faster lookups (optional, but recommended for search functionality)
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_postal_code ON users(postal_code);
