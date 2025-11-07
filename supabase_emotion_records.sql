-- SQL script to create the emotion_records table in Supabase
-- Run this in your Supabase SQL Editor
-- This stores one emotion record per employee per day (updated if they scan multiple times)

-- Create emotion_records table
CREATE TABLE IF NOT EXISTS emotion_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    date DATE NOT NULL,
    emotion TEXT NOT NULL,
    emotion_confidence DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date) -- Ensures only one record per employee per day
);

-- Add trigger for updated_at (reusing existing update_updated_at_column function)
CREATE TRIGGER update_emotion_records_updated_at
    BEFORE UPDATE ON emotion_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emotion_records_date ON emotion_records(date);
CREATE INDEX IF NOT EXISTS idx_emotion_records_employee_id ON emotion_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_emotion_records_employee_date ON emotion_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_emotion_records_emotion ON emotion_records(emotion);

-- Enable Row Level Security (RLS)
ALTER TABLE emotion_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR EMOTION_RECORDS TABLE
-- ============================================

-- Policy 1: Only HR can view emotion records
CREATE POLICY "Only HR can view emotion records"
    ON emotion_records 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'HR'
        )
    );

-- Policy 2: Allow emotion records insert/update (for kiosk)
CREATE POLICY "Allow emotion records insert"
    ON emotion_records 
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow emotion records update"
    ON emotion_records 
    FOR UPDATE
    USING (true);

-- Policy 3: Only HR can delete emotion records
CREATE POLICY "Only HR can delete emotion records"
    ON emotion_records 
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'HR'
        )
    );

