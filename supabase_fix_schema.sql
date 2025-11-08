-- Fix script to create missing tables and columns
-- Run this in your Supabase SQL Editor to fix the schema issues

-- ============================================
-- 1. Fix attendance table - Remove confidence column if it exists
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'confidence'
    ) THEN
        ALTER TABLE attendance DROP COLUMN confidence;
        RAISE NOTICE 'Removed confidence column from attendance table';
    ELSE
        RAISE NOTICE 'confidence column does not exist in attendance table';
    END IF;
END $$;

-- ============================================
-- 2. Create anonymous_emotions table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS anonymous_emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    emotion TEXT NOT NULL,
    gender TEXT,
    department TEXT,
    confidence DECIMAL(5,2),
    count INTEGER NOT NULL DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(date, emotion, gender, department)
);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_anonymous_emotions_updated_at'
    ) THEN
        CREATE TRIGGER update_anonymous_emotions_updated_at
            BEFORE UPDATE ON anonymous_emotions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_updated_at trigger for anonymous_emotions';
    ELSE
        RAISE NOTICE 'update_updated_at trigger already exists for anonymous_emotions';
    END IF;
END $$;

-- Create indexes for anonymous_emotions
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_date ON anonymous_emotions(date);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_emotion ON anonymous_emotions(emotion);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_gender ON anonymous_emotions(gender);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_department ON anonymous_emotions(department);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_date_emotion ON anonymous_emotions(date, emotion);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_filters ON anonymous_emotions(date, emotion, gender, department);

-- Enable Row Level Security (RLS) for anonymous_emotions
ALTER TABLE anonymous_emotions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create RLS policies for anonymous_emotions if they don't exist
-- ============================================

-- Policy 1: Only HR can view anonymous emotion data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'anonymous_emotions' 
        AND policyname = 'Only HR can view anonymous emotions'
    ) THEN
        CREATE POLICY "Only HR can view anonymous emotions"
            ON anonymous_emotions 
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid() 
                    AND users.role = 'HR'
                )
            );
        RAISE NOTICE 'Created view policy for anonymous_emotions';
    END IF;
END $$;

-- Policy 2: Allow anonymous emotions insert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'anonymous_emotions' 
        AND policyname = 'Allow anonymous emotions insert'
    ) THEN
        CREATE POLICY "Allow anonymous emotions insert"
            ON anonymous_emotions 
            FOR INSERT
            WITH CHECK (true);
        RAISE NOTICE 'Created insert policy for anonymous_emotions';
    END IF;
END $$;

-- Policy 3: Allow anonymous emotions update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'anonymous_emotions' 
        AND policyname = 'Allow anonymous emotions update'
    ) THEN
        CREATE POLICY "Allow anonymous emotions update"
            ON anonymous_emotions 
            FOR UPDATE
            USING (true);
        RAISE NOTICE 'Created update policy for anonymous_emotions';
    END IF;
END $$;

-- Policy 4: Only HR can delete anonymous emotions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'anonymous_emotions' 
        AND policyname = 'Only HR can delete anonymous emotions'
    ) THEN
        CREATE POLICY "Only HR can delete anonymous emotions"
            ON anonymous_emotions 
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid() 
                    AND users.role = 'HR'
                )
            );
        RAISE NOTICE 'Created delete policy for anonymous_emotions';
    END IF;
END $$;

-- ============================================
-- 4. Verify tables exist
-- ============================================
SELECT 
    'attendance' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status
UNION ALL
SELECT 
    'anonymous_emotions' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anonymous_emotions') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status;

-- ============================================
-- 5. Verify columns
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('attendance', 'anonymous_emotions')
ORDER BY table_name, ordinal_position;

