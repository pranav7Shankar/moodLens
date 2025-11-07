import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ employees: data });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Convert Web API Request to Node.js-like request for formidable
        const formData = await request.formData();
        
        // Create a temporary file-like structure for formidable
        const name = formData.get('name') || '';
        const gender = formData.get('gender') || '';
        const age = Number(formData.get('age') || 0);
        const department = formData.get('department') || '';
        const email = formData.get('email') || '';
        const imageFile = formData.get('image');

        let employee_image = null;
        if (imageFile && imageFile instanceof File) {
            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileExt = imageFile.name.split('.').pop() || 'jpg';
            const filePath = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('employee-images')
                .upload(filePath, buffer, { contentType: imageFile.type || 'image/jpeg' });
            if (uploadError) throw uploadError;
            const { data: pub } = supabaseAdmin.storage.from('employee-images').getPublicUrl(uploadData.path);
            employee_image = pub.publicUrl;
        }

        const { data, error } = await supabaseAdmin
            .from('employees')
            .insert([{ name, gender, age, department, email, employee_image }])
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ employee: data }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create employee', details: e.message }, { status: 500 });
    }
}

