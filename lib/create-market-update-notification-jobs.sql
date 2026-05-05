CREATE TABLE IF NOT EXISTS market_update_notification_jobs (
  id BIGSERIAL PRIMARY KEY,
  salesforce_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_update_notification_jobs_status_created_at
  ON market_update_notification_jobs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_market_update_notification_jobs_salesforce_id
  ON market_update_notification_jobs(salesforce_id);

DROP TRIGGER IF EXISTS update_market_update_notification_jobs_updated_at
  ON market_update_notification_jobs;

CREATE TRIGGER update_market_update_notification_jobs_updated_at
  BEFORE UPDATE ON market_update_notification_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
