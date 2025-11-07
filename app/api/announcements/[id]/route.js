import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// DELETE - Delete/deactivate an announcement (HR only)
export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        
        // Check authentication
        const employeeId = request.cookies.get('hr_auth')?.value;
        
        if (!employeeId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Verify user is HR
        const { data: employee, error: empError } = await supabaseAdmin
            .from('employees')
            .select('id, department')
            .eq('id', employeeId)
            .single();

        if (empError || !employee || employee.department !== 'HR') {
            return NextResponse.json({ error: 'Unauthorized. HR access required.' }, { status: 403 });
        }

        // Deactivate announcement instead of deleting
        const { error } = await supabaseAdmin
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Error deleting announcement:', error);
            return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error in announcements DELETE API:', e);
        return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
    }
}

