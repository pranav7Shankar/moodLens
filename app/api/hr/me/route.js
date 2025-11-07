import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
    try {
        // Get user ID from cookie
        const userId = request.cookies.get('hr_auth')?.value;
        
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // Fetch user details from users table
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role')
            .eq('id', userId)
            .eq('is_active', true)
            .single();
        
        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.role // Map role to department for backward compatibility
        });
    } catch (e) {
        console.error('Error fetching user info:', e);
        return NextResponse.json({ 
            error: 'Server error', 
            details: e.message 
        }, { status: 500 });
    }
}

