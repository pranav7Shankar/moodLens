import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// DELETE - Delete/deactivate an announcement
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

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

