-- Add registration_date column to platforms table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platforms'
          AND column_name = 'registration_date'
    ) THEN
        ALTER TABLE platforms
        ADD COLUMN registration_date TIMESTAMPTZ;
    END IF;
END $$;
