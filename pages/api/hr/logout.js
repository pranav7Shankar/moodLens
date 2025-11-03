export default function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    res.setHeader('Set-Cookie', 'hr_auth=; Path=/; Max-Age=0');
    res.status(200).json({ success: true });
}


