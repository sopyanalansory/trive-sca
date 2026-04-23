-- Add provision_status and provision_error columns to platforms table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platforms'
          AND column_name = 'provision_status'
    ) THEN
        ALTER TABLE platforms
        ADD COLUMN provision_status VARCHAR(64);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platforms'
          AND column_name = 'provision_error'
    ) THEN
        ALTER TABLE platforms
        ADD COLUMN provision_error JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platforms_provision_status
    ON platforms(provision_status);
