export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { password } = req.body || {};
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        // Get admin password from environment variable
        const adminPassword = process.env.HR_ADMIN_PASSWORD;
        
        if (!adminPassword) {
            console.error('HR_ADMIN_PASSWORD environment variable is not set');
            return res.status(500).json({ 
                error: 'Server configuration error',
                details: 'Admin password not configured. Please set HR_ADMIN_PASSWORD in your .env.local file.'
            });
        }
        
        // Simple password comparison
        if (password !== adminPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Set cookie
        const cookie = `hr_auth=1; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 8}`;
        res.setHeader('Set-Cookie', cookie);
        
        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ 
            error: 'Server error', 
            details: e.message 
        });
    }
}


