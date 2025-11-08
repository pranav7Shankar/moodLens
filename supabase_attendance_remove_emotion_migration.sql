-- Migration script to remove emotion and emotion_confidence columns from attendance table
-- Run this if you already have the attendance table with emotion columns

-- Remove emotion_confidence column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'attendance' AND column_name = 'emotion_confidence') THEN
        ALTER TABLE attendance DROP COLUMN emotion_confidence;
    END IF;
END $$;

-- Remove emotion column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'attendance' AND column_name = 'emotion') THEN
        ALTER TABLE attendance DROP COLUMN emotion;
    END IF;
END $$;

