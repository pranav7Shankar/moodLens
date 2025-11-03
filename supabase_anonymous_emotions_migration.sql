-- Migration script for existing anonymous_emotions table
-- Run this if you already have the anonymous_emotions table created
-- This adds gender, department, and confidence columns and updates the unique constraint

-- Add gender and department columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anonymous_emotions' AND column_name = 'gender') THEN
        ALTER TABLE anonymous_emotions ADD COLUMN gender TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anonymous_emotions' AND column_name = 'department') THEN
        ALTER TABLE anonymous_emotions ADD COLUMN department TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anonymous_emotions' AND column_name = 'confidence') THEN
        ALTER TABLE anonymous_emotions ADD COLUMN confidence DECIMAL(5,2);
    END IF;
END $$;

-- Drop old unique constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anonymous_emotions_date_emotion_key') THEN
        ALTER TABLE anonymous_emotions DROP CONSTRAINT anonymous_emotions_date_emotion_key;
    END IF;
END $$;

-- Add new unique constraint with gender and department if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anonymous_emotions_date_emotion_gender_department_key') THEN
        ALTER TABLE anonymous_emotions 
        ADD CONSTRAINT anonymous_emotions_date_emotion_gender_department_key 
        UNIQUE(date, emotion, gender, department);
    END IF;
END $$;

-- Create indexes for gender and department if they don't exist
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_gender ON anonymous_emotions(gender);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_department ON anonymous_emotions(department);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_filters ON anonymous_emotions(date, emotion, gender, department);

