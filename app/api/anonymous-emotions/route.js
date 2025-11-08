import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const start_date = searchParams.get('start_date');
        const end_date = searchParams.get('end_date');
        const date = searchParams.get('date');
        const gender = searchParams.get('gender');
        const department = searchParams.get('department');

        let query = supabaseAdmin
            .from('anonymous_emotions')
            .select('*')
            .order('date', { ascending: false });

        // Support date range or single date
        if (start_date && end_date) {
            query = query.gte('date', start_date).lte('date', end_date);
        } else if (date) {
            query = query.eq('date', date);
        }

        // Filter by gender if provided
        if (gender && gender !== 'all') {
            query = query.eq('gender', gender);
        }

        // Filter by department if provided
        if (department && department !== 'all') {
            query = query.eq('department', department);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ anonymous_emotions: data || [] });

    } catch (error) {
        console.error('Error fetching anonymous emotions:', error);
        return NextResponse.json({
            error: 'Failed to fetch anonymous emotions',
            details: error.message
        }, { status: 500 });
    }
}

