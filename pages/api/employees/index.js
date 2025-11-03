import formidable from 'formidable';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return res.status(200).json({ employees: data });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to fetch employees' });
        }
    }

    if (req.method === 'POST') {
        try {
            const form = formidable({});
            const [fields, files] = await form.parse(req);
            const name = (fields.name && fields.name[0]) || '';
            const gender = (fields.gender && fields.gender[0]) || '';
            const age = Number((fields.age && fields.age[0]) || 0);
            const department = (fields.department && fields.department[0]) || '';
            const imageFile = files.image && files.image[0];

            let employee_image = null;
            if (imageFile) {
                const arrayBuffer = await fsReadFile(imageFile.filepath);
                const fileExt = (imageFile.originalFilename || 'jpg').split('.').pop();
                const filePath = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabaseAdmin
                    .storage
                    .from('employee-images')
                    .upload(filePath, arrayBuffer, { contentType: imageFile.mimetype || 'image/jpeg' });
                if (uploadError) throw uploadError;
                const { data: pub } = supabaseAdmin.storage.from('employee-images').getPublicUrl(uploadData.path);
                employee_image = pub.publicUrl;
            }

            const { data, error } = await supabaseAdmin
                .from('employees')
                .insert([{ name, gender, age, department, employee_image }])
                .select()
                .single();
            if (error) throw error;
            return res.status(201).json({ employee: data });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to create employee', details: e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function fsReadFile(path) {
    const fs = await import('fs');
    return fs.readFileSync(path);
}


