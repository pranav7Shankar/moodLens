-- SQL script to create the attendance table in Supabase
-- Run this in your Supabase SQL Editor
-- This matches your existing schema structure (UUID primary keys, TIMESTAMP WITH TIME ZONE)

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    date DATE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    gender TEXT,
    age_range_low INTEGER,
    age_range_high INTEGER,
    present BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Add trigger for updated_at (reusing existing update_updated_at_column function)
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR ATTENDANCE TABLE
-- ============================================

-- Policy 1: Only HR can view attendance records
CREATE POLICY "Only HR can view attendance"
    ON attendance 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'HR'
        )
    );

-- Policy 2: Allow attendance insert (for kiosk)
-- Note: The kiosk uses service role key which bypasses RLS,
-- but this policy allows flexibility for future authenticated users
CREATE POLICY "Allow attendance insert"
    ON attendance 
    FOR INSERT
    WITH CHECK (true);

-- Policy 3: Only HR can update attendance records
CREATE POLICY "Only HR can update attendance"
    ON attendance 
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'HR'
        )
    );

-- Policy 4: Only HR can delete attendance records
CREATE POLICY "Only HR can delete attendance"
    ON attendance 
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() 
            AND users.role = 'HR'
        )
    );

