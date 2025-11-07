-- SQL script to create the announcements table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on is_active and created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_active_created ON public.announcements(is_active, created_at DESC);

-- Create an index on created_by for HR queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to view active announcements
CREATE POLICY "Anyone can view active announcements"
    ON public.announcements
    FOR SELECT
    USING (is_active = true);

-- Create a policy that allows HR users to create announcements
CREATE POLICY "HR users can create announcements"
    ON public.announcements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = announcements.created_by
            AND (users.role = 'HR' OR users.role = 'ADMIN')
        )
    );

-- Create a policy that allows HR users to update/delete their own announcements
CREATE POLICY "HR users can manage announcements"
    ON public.announcements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = announcements.created_by
            AND (users.role = 'HR' OR users.role = 'ADMIN')
        )
    );

-- Optional: Add a comment to the table
COMMENT ON TABLE public.announcements IS 'Stores announcements/messages from HR to be displayed on the employee dashboard';

