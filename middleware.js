import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for middleware (using service role for admin access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // Check if accessing HR dashboard routes
    if (pathname.startsWith('/hr') && !pathname.startsWith('/hr/login') && !pathname.startsWith('/api')) {
        const cookie = request.cookies.get('hr_auth');
        
        // Check if cookie exists
        if (!cookie || !cookie.value || cookie.value.length < 10) {
            return NextResponse.redirect(new URL('/hr/login', request.url));
        }
        
        // Validate that the user exists in the database and is active
        try {
            if (!supabaseUrl || !supabaseServiceKey) {
                console.error('Supabase credentials not configured');
                return NextResponse.redirect(new URL('/hr/login', request.url));
            }
            
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const userId = cookie.value;
            
            // Query users table to verify user exists and is active
            const { data: user, error } = await supabase
                .from('users')
                .select('id, is_active, role')
                .eq('id', userId)
                .eq('is_active', true)
                .single();
            
            // If user not found or not active, redirect to login
            if (error || !user) {
                // Clear invalid cookie
                const response = NextResponse.redirect(new URL('/hr/login', request.url));
                response.cookies.delete('hr_auth');
                return response;
            }
            
            // Check if user has HR or ADMIN role
            if (user.role !== 'HR' && user.role !== 'ADMIN') {
                // Clear invalid cookie
                const response = NextResponse.redirect(new URL('/hr/login', request.url));
                response.cookies.delete('hr_auth');
                return response;
            }
        } catch (error) {
            console.error('Middleware authentication error:', error);
            // On error, redirect to login for security
            const response = NextResponse.redirect(new URL('/hr/login', request.url));
            response.cookies.delete('hr_auth');
            return response;
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/hr/:path*', '/hr'],
};

