import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body || {};
        
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }
        
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }
        
        // Normalize inputs for case-insensitive comparison
        const normalizedName = name.trim().toLowerCase();
        const normalizedEmail = email.trim().toLowerCase();
        
        // First, check if the person exists in employees table with HR department
        const { data: employees, error: employeeError } = await supabaseAdmin
            .from('employees')
            .select('id, name, email, department')
            .ilike('email', normalizedEmail)
            .eq('department', 'HR');
        
        if (employeeError) {
            console.error('Database query error:', employeeError);
            return NextResponse.json({ 
                error: 'Database error',
                details: 'Failed to verify employee. Please try again later.'
            }, { status: 500 });
        }
        
        // Check if employee exists in HR department
        if (!employees || employees.length === 0) {
            return NextResponse.json({ 
                error: 'Unauthorized access',
                details: 'Unauthorized access'
            }, { status: 403 });
        }
        
        // Find matching employee by name (case-insensitive)
        const matchingEmployee = employees.find(emp => 
            emp.name && 
            emp.name.trim().toLowerCase() === normalizedName
        );
        
        if (!matchingEmployee) {
            return NextResponse.json({ 
                error: 'Unauthorized access',
                details: 'Unauthorized access'
            }, { status: 403 });
        }
        
        // Check if user already exists with this email
        const { data: existingUsers, error: userCheckError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .ilike('email', normalizedEmail);
        
        if (userCheckError) {
            console.error('Database query error:', userCheckError);
            return NextResponse.json({ 
                error: 'Database error',
                details: 'Failed to check existing users. Please try again later.'
            }, { status: 500 });
        }
        
        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json({ 
                error: 'User already exists',
                details: 'An account with this email already exists. Please sign in instead.'
            }, { status: 409 });
        }
        
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create new user in users table
        const userRole = role || 'HR'; // Default to HR if not specified
        const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
                name: matchingEmployee.name, // Use name from employees table
                email: matchingEmployee.email, // Use email from employees table
                password_hash: passwordHash,
                role: userRole,
                is_active: true
            })
            .select('id, name, email, role')
            .single();
        
        if (createError || !newUser) {
            console.error('User creation error:', createError);
            return NextResponse.json({ 
                error: 'Failed to create account',
                details: 'Unable to create user account. Please try again later.'
            }, { status: 500 });
        }
        
        // Auto-login: Set cookie with user ID for session management
        const response = NextResponse.json({ 
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
        response.cookies.set('hr_auth', newUser.id, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8 // 8 hours
        });
        
        return response;
    } catch (e) {
        console.error('Signup error:', e);
        return NextResponse.json({ 
            error: 'Server error', 
            details: e.message 
        }, { status: 500 });
    }
}

