import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_BASE = (process.env.NGROK_URL || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract subpath after /api
  const urlObj = new URL(req.url || '/api', 'http://localhost');
  const pathname = urlObj.pathname || '/api';
  const search = urlObj.search || '';
  const suffix = pathname.replace(/^\/api/, '');
  const targetUrl = `${BACKEND_BASE}/api${suffix}${search}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      } as any,
      body: req.method && req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', message: (err as Error)?.message || 'Unknown error' });
  }
}

