import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, password } = body || {};
        
        if (!name || !password) {
            return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
        }
        
        // Normalize name for case-insensitive comparison
        const normalizedName = name.trim().toLowerCase();
        
        // Query users table for matching name
        const { data: users, error: queryError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, password_hash, role, is_active')
            .ilike('name', normalizedName)
            .eq('is_active', true);
        
        if (queryError) {
            console.error('Database query error:', queryError);
            return NextResponse.json({ 
                error: 'Database error',
                details: 'Failed to verify credentials. Please try again later.'
            }, { status: 500 });
        }
        
        // Check if we found any users with this name
        if (!users || users.length === 0) {
            return NextResponse.json({ 
                error: 'Invalid credentials',
                details: 'No user found with this name. Please check your credentials and try again.'
            }, { status: 401 });
        }
        
        // Find user with matching password
        let matchingUser = null;
        for (const user of users) {
            if (user.password_hash) {
                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                if (passwordMatch) {
                    matchingUser = user;
                    break;
                }
            }
        }
        
        if (!matchingUser) {
            return NextResponse.json({ 
                error: 'Invalid credentials',
                details: 'Incorrect name or password. Please check your credentials and try again.'
            }, { status: 401 });
        }
        
        // Check if user has HR role (or admin role)
        if (matchingUser.role !== 'HR' && matchingUser.role !== 'ADMIN') {
            return NextResponse.json({ 
                error: 'Access denied',
                details: 'You do not have permission to access the HR dashboard.'
            }, { status: 403 });
        }
        
        // Set cookie with user ID for session management
        const response = NextResponse.json({ 
            success: true,
            user: {
                id: matchingUser.id,
                name: matchingUser.name,
                email: matchingUser.email,
                role: matchingUser.role
            }
        });
        response.cookies.set('hr_auth', matchingUser.id, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8 // 8 hours
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

