import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body || {};
        
        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        
        // Get admin password from environment variable
        const adminPassword = process.env.HR_ADMIN_PASSWORD;
        
        if (!adminPassword) {
            console.error('HR_ADMIN_PASSWORD environment variable is not set');
            return NextResponse.json({ 
                error: 'Server configuration error',
                details: 'Admin password not configured. Please set HR_ADMIN_PASSWORD in your .env.local file.'
            }, { status: 500 });
        }
        
        // Simple password comparison
        if (password !== adminPassword) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
        
        // Set cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('hr_auth', '1', {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8
        });
        
        return response;
    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ 
            error: 'Server error', 
            details: e.message 
        }, { status: 500 });
    }
}

