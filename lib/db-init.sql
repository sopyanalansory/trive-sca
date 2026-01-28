-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) NOT NULL DEFAULT '+62',
  password_hash VARCHAR(255) NOT NULL,
  referral_code VARCHAR(50),
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  terms_consent BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Create verification_codes table for phone verification
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create market_updates table
CREATE TABLE IF NOT EXISTS market_updates (
  id SERIAL PRIMARY KEY,
  research_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  img_url VARCHAR(1000),
  economic_data_1 TEXT,
  economic_data_2 TEXT,
  economic_data_3 TEXT,
  economic_data_4 TEXT,
  economic_data_5 TEXT,
  created_by VARCHAR(255) NOT NULL,
  salesforce_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for market_updates
CREATE INDEX IF NOT EXISTS idx_market_updates_status ON market_updates(status);
CREATE INDEX IF NOT EXISTS idx_market_updates_research_type ON market_updates(research_type);
CREATE INDEX IF NOT EXISTS idx_market_updates_created_at ON market_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_updates_created_by ON market_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_market_updates_salesforce_id ON market_updates(salesforce_id);

-- Trigger to automatically update updated_at for market_updates
DROP TRIGGER IF EXISTS update_market_updates_updated_at ON market_updates;
CREATE TRIGGER update_market_updates_updated_at BEFORE UPDATE ON market_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create platforms table with relationship to users table
CREATE TABLE IF NOT EXISTS platforms (
  id SERIAL PRIMARY KEY,
  platform_registration_id VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(50) NOT NULL,
  login_number VARCHAR(50) NOT NULL,
  server_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100),
  client_group_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'Enabled',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  leverage VARCHAR(50),
  swap_free VARCHAR(10) NOT NULL DEFAULT 'Tidak',
  type VARCHAR(20) DEFAULT 'Live',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for platforms table
CREATE INDEX IF NOT EXISTS idx_platforms_user_id ON platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_platforms_account_id ON platforms(account_id);
CREATE INDEX IF NOT EXISTS idx_platforms_platform_registration_id ON platforms(platform_registration_id);
CREATE INDEX IF NOT EXISTS idx_platforms_login_number ON platforms(login_number);
CREATE INDEX IF NOT EXISTS idx_platforms_status ON platforms(status);
CREATE INDEX IF NOT EXISTS idx_platforms_server_name ON platforms(server_name);
CREATE INDEX IF NOT EXISTS idx_platforms_type ON platforms(type);

-- Trigger to automatically update updated_at for platforms
DROP TRIGGER IF EXISTS update_platforms_updated_at ON platforms;
CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to platforms table
COMMENT ON TABLE platforms IS 'Platform trading accounts linked to users via account_id';
COMMENT ON COLUMN platforms.type IS 'Account type: Live or Demo';

