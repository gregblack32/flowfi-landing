// Vercel Serverless Function — FlowFi Waitlist API
// Deploy: Place in /api/waitlist.js and Vercel auto-creates the endpoint
// Endpoint: POST https://flowfi.com.au/api/waitlist

const ALLOWED_ORIGINS = [
  'https://flowfi.com.au',
  'https://www.flowfi.com.au',
  'http://localhost:3000',
];

const waitlist = new Set();

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, source } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    if (waitlist.has(email.toLowerCase())) {
      return res.status(409).json({
        error: 'Already on waitlist',
        message: "You're already on the waitlist! We'll be in touch soon."
      });
    }

    const entry = {
      email: email.toLowerCase(),
      source: source || 'unknown',
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    waitlist.add(email.toLowerCase());

    console.log(`[Waitlist] New signup: ${email} via ${source}`);

    return res.status(200).json({
      success: true,
      message: "You're on the list! We'll email you when it's your turn.",
      position: waitlist.size + 127,
    });

  } catch (error) {
    console.error('[Waitlist] Error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
