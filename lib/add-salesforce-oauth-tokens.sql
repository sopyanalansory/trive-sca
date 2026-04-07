CREATE TABLE IF NOT EXISTS salesforce_oauth_tokens (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'salesforce',
  access_token TEXT NOT NULL,
  instance_url TEXT NOT NULL,
  token_type VARCHAR(20) NOT NULL DEFAULT 'Bearer',
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salesforce_oauth_tokens_provider
  ON salesforce_oauth_tokens(provider);

CREATE INDEX IF NOT EXISTS idx_salesforce_oauth_tokens_expires_at
  ON salesforce_oauth_tokens(expires_at DESC);

CREATE OR REPLACE FUNCTION update_salesforce_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_salesforce_oauth_tokens_updated_at
  ON salesforce_oauth_tokens;

CREATE TRIGGER trigger_update_salesforce_oauth_tokens_updated_at
  BEFORE UPDATE ON salesforce_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_salesforce_oauth_tokens_updated_at();
