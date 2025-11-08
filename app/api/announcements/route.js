import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET - Fetch all active announcements
export async function GET(request) {
    try {
        const { data: announcements, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching announcements:', error);
            return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
        }

        return NextResponse.json({ announcements: announcements || [] });
    } catch (e) {
        console.error('Error in announcements API:', e);
        return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
    }
}

// POST - Create a new announcement
export async function POST(request) {
    try {
        // Get current logged-in user ID from cookie
        const userId = request.cookies.get('hr_auth')?.value;
        
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { title, message, priority } = body || {};

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const { data: announcement, error } = await supabaseAdmin
            .from('announcements')
            .insert([{
                title: title.trim(),
                message: message.trim(),
                priority: priority || 'normal', // 'low', 'normal', 'high', 'urgent'
                created_by: userId,
                is_active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating announcement:', error);
            return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
        }

        return NextResponse.json({ success: true, announcement });
    } catch (e) {
        console.error('Error in announcements POST API:', e);
        return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
    }
}

