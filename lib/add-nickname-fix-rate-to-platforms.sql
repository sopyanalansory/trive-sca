-- Add nickname and fix_rate columns to platforms table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platforms'
          AND column_name = 'nickname'
    ) THEN
        ALTER TABLE platforms
        ADD COLUMN nickname VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platforms'
          AND column_name = 'fix_rate'
    ) THEN
        ALTER TABLE platforms
        ADD COLUMN fix_rate VARCHAR(50);
    END IF;
END $$;
