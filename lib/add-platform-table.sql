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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_platforms_user_id ON platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_platforms_account_id ON platforms(account_id);
CREATE INDEX IF NOT EXISTS idx_platforms_platform_registration_id ON platforms(platform_registration_id);
CREATE INDEX IF NOT EXISTS idx_platforms_login_number ON platforms(login_number);
CREATE INDEX IF NOT EXISTS idx_platforms_status ON platforms(status);
CREATE INDEX IF NOT EXISTS idx_platforms_server_name ON platforms(server_name);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_platforms_updated_at ON platforms;
CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE platforms IS 'Platform trading accounts linked to users via account_id';
