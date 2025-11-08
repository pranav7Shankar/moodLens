import { createClient } from '@supabase/supabase-js';

let supabaseAdminClient = null;

function getSupabaseAdmin() {
    if (supabaseAdminClient) {
        return supabaseAdminClient;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error('Missing SUPABASE_URL environment variable');
    }

    if (!serviceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    supabaseAdminClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
    });

    return supabaseAdminClient;
}

// Create a proxy that lazily initializes the client
export const supabaseAdmin = new Proxy({}, {
    get(target, prop) {
        const client = getSupabaseAdmin();
        const value = client[prop];
        
        // If it's a function, bind it to the client
        if (typeof value === 'function') {
            return value.bind(client);
        }
        
        // If it's an object (like storage), return it directly
        return value;
    }
});

