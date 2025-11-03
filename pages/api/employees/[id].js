import formidable from 'formidable';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return res.status(200).json({ employee: data });
        } catch (e) {
            return res.status(404).json({ error: 'Employee not found' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const form = formidable({});
            const [fields, files] = await form.parse(req);
            const updates = {};
            if (fields.name) updates.name = fields.name[0];
            if (fields.gender) updates.gender = fields.gender[0];
            if (fields.age) updates.age = Number(fields.age[0]);
            if (fields.department) updates.department = fields.department[0];
            const imageFile = files.image && files.image[0];
            if (imageFile) {
                const arrayBuffer = await fsReadFile(imageFile.filepath);
                const fileExt = (imageFile.originalFilename || 'jpg').split('.').pop();
                const filePath = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabaseAdmin
                    .storage
                    .from('employee-images')
                    .upload(filePath, arrayBuffer, { contentType: imageFile.mimetype || 'image/jpeg', upsert: true });
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
            return res.status(200).json({ employee: data });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to update employee' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabaseAdmin
                .from('employees')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return res.status(204).end();
        } catch (e) {
            return res.status(500).json({ error: 'Failed to delete employee' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function fsReadFile(path) {
    const fs = await import('fs');
    return fs.readFileSync(path);
}


