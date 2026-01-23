-- Optional migration: Add additional fields from CSV to users table
-- Run this if you want to store Account ID, Client ID, Client Type, and CFD Status

-- Add account_id column (from CSV "Account ID")
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);

-- Add client_id column (from CSV "Client ID")
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- Add client_type column (from CSV "Client Type")
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_type VARCHAR(50);

-- Add cfd_status column (from CSV "CFD Status")
ALTER TABLE users ADD COLUMN IF NOT EXISTS cfd_status VARCHAR(50);

-- Create index on client_type for filtering
CREATE INDEX IF NOT EXISTS idx_users_client_type ON users(client_type);

-- Create index on cfd_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_cfd_status ON users(cfd_status);
