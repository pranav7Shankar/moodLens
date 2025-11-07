import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { data, error } = await supabaseAdmin
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return NextResponse.json({ employee: data });
    } catch (e) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const formData = await request.formData();
        
        const updates = {};
        if (formData.get('name')) updates.name = formData.get('name');
        if (formData.get('gender')) updates.gender = formData.get('gender');
        if (formData.get('age')) updates.age = Number(formData.get('age'));
        if (formData.get('department')) updates.department = formData.get('department');
        if (formData.get('email')) updates.email = formData.get('email');
        
        const imageFile = formData.get('image');
        if (imageFile && imageFile instanceof File) {
            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileExt = imageFile.name.split('.').pop() || 'jpg';
            const filePath = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('employee-images')
                .upload(filePath, buffer, { contentType: imageFile.type || 'image/jpeg', upsert: true });
            if (uploadError) throw uploadError;
            const { data: pub } = supabaseAdmin.storage.from('employee-images').getPublicUrl(uploadData.path);
            updates.employee_image = pub.publicUrl;
        }

        const { data, error } = await supabaseAdmin
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ employee: data });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const { error } = await supabaseAdmin
            .from('employees')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}

