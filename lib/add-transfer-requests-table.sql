-- Migration: Transfer requests (live account to live account)
CREATE TABLE IF NOT EXISTS transfer_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  platform_id_origin INTEGER REFERENCES platforms(id) ON DELETE SET NULL NOT NULL,
  platform_id_destination INTEGER REFERENCES platforms(id) ON DELETE SET NULL NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  amount DECIMAL(15, 2) NOT NULL,
  comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  salesforce_request_id VARCHAR(100),
  salesforce_created_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_user_id
  ON transfer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_platform_origin
  ON transfer_requests(platform_id_origin);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_platform_destination
  ON transfer_requests(platform_id_destination);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status
  ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_created_at
  ON transfer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_salesforce_request_id
  ON transfer_requests(salesforce_request_id);

DROP TRIGGER IF EXISTS update_transfer_requests_updated_at ON transfer_requests;
CREATE TRIGGER update_transfer_requests_updated_at BEFORE UPDATE ON transfer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE transfer_requests IS 'Balance transfer requests between user live accounts';
