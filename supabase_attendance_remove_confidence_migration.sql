-- Migration script to remove confidence column from attendance table
-- Run this if you already have the attendance table with confidence column

-- Remove confidence column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'attendance' AND column_name = 'confidence') THEN
        ALTER TABLE attendance DROP COLUMN confidence;
        RAISE NOTICE 'Removed confidence column from attendance table';
    ELSE
        RAISE NOTICE 'confidence column does not exist in attendance table';
    END IF;
END $$;

