-- Add type column to platforms table
-- This column distinguishes between Live and Demo accounts

-- Add type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'platforms' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE platforms 
        ADD COLUMN type VARCHAR(20) DEFAULT 'Live';
        
        -- Update all existing records to 'Live' since current data are all live accounts
        UPDATE platforms 
        SET type = 'Live';
        
        -- Add comment to column
        COMMENT ON COLUMN platforms.type IS 'Account type: Live or Demo';
    END IF;
END $$;

-- Also update any existing records that might have NULL or incorrect type
-- Set to Live if server_name contains 'live' or 'real', Demo if contains 'demo'
UPDATE platforms 
SET type = CASE 
    WHEN server_name ILIKE '%live%' OR server_name ILIKE '%real%' THEN 'Live'
    WHEN server_name ILIKE '%demo%' THEN 'Demo'
    ELSE COALESCE(type, 'Live')
END
WHERE type IS NULL OR type = '';

-- Create index for type column for faster queries
CREATE INDEX IF NOT EXISTS idx_platforms_type ON platforms(type);
