-- Script to refresh Supabase schema cache and verify table structures
-- Run this in your Supabase SQL Editor

-- Refresh the schema cache by querying the tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('attendance', 'anonymous_emotions')
ORDER BY table_name, ordinal_position;

-- Verify attendance table structure
DO $$ 
BEGIN
    -- Check if confidence column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'confidence'
    ) THEN
        ALTER TABLE attendance ADD COLUMN confidence DECIMAL(5,2);
    END IF;
END $$;

-- Verify anonymous_emotions table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'anonymous_emotions'
    ) THEN
        RAISE NOTICE 'anonymous_emotions table does not exist. Please run supabase_anonymous_emotions.sql first.';
    END IF;
END $$;

