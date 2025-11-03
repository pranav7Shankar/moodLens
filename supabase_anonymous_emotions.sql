-- SQL script to create the anonymous_emotions table in Supabase
-- Run this in your Supabase SQL Editor
-- This stores aggregated emotion data WITHOUT any employee identification
-- Used for the collective emotions dashboard display

-- Create anonymous_emotions table
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
    UNIQUE(date, emotion, gender, department) -- Ensures only one record per emotion/gender/department per day
);

-- Add trigger for updated_at (reusing existing update_updated_at_column function)
CREATE TRIGGER update_anonymous_emotions_updated_at
    BEFORE UPDATE ON anonymous_emotions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_date ON anonymous_emotions(date);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_emotion ON anonymous_emotions(emotion);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_gender ON anonymous_emotions(gender);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_department ON anonymous_emotions(department);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_date_emotion ON anonymous_emotions(date, emotion);
CREATE INDEX IF NOT EXISTS idx_anonymous_emotions_filters ON anonymous_emotions(date, emotion, gender, department);

-- Enable Row Level Security (RLS)
ALTER TABLE anonymous_emotions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR ANONYMOUS_EMOTIONS TABLE
-- ============================================

-- Policy 1: Only HR can view anonymous emotion data
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

-- Policy 2: Allow anonymous emotions insert/update (for kiosk)
CREATE POLICY "Allow anonymous emotions insert"
    ON anonymous_emotions 
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous emotions update"
    ON anonymous_emotions 
    FOR UPDATE
    USING (true);

-- Policy 3: Only HR can delete anonymous emotions
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

