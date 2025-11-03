import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { start_date, end_date, date, gender, department } = req.query;

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

        return res.status(200).json({ anonymous_emotions: data || [] });

    } catch (error) {
        console.error('Error fetching anonymous emotions:', error);
        return res.status(500).json({
            error: 'Failed to fetch anonymous emotions',
            details: error.message
        });
    }
}

