-- SQL script to create the users table in Supabase
-- Run this in your Supabase SQL Editor
-- This table will be used for authentication instead of employees table

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Optional: for future password-based auth
    role TEXT NOT NULL DEFAULT 'HR', -- 'HR', 'ADMIN', etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for email (already unique, but index helps with lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
    ON users 
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Only service role can insert/update/delete users
-- (This will be handled by the admin API using service role key)

-- Example: Insert a test HR user
-- INSERT INTO users (name, email, role) 
-- VALUES ('Admin User', 'admin@example.com', 'HR')
-- ON CONFLICT (email) DO NOTHING;


