const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';
const ALLOWED_BIN_IDS = new Set([
  '6adcec7fffd5d1605388b879',
  '6adcec93ac6210605a4f08ac',
]);

module.exports = async function handler(req, res) {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  if (!masterKey) {
    return res.status(500).json({ error: 'JSONBIN_MASTER_KEY is not configured in Vercel.' });
  }

  const binId = typeof req.query.binId === 'string' ? req.query.binId : '';
  if (!ALLOWED_BIN_IDS.has(binId)) {
    return res.status(400).json({ error: 'A valid binId is required.' });
  }

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const options = {
    headers: {
      'X-Master-Key': masterKey,
      ...(req.method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
  };

  if (req.method === 'PUT') {
    let record;
    try {
      record = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ error: 'A JSON object or array is required.' });
    }
    options.method = 'PUT';
    options.body = JSON.stringify(record);
  }

  try {
    const upstream = await fetch(
      `${JSONBIN_API_URL}/${encodeURIComponent(binId)}${req.method === 'GET' ? '/latest' : ''}`,
      options
    );
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch (error) {
    console.error('JSONBin proxy request failed:', error);
    return res.status(502).json({ error: 'Could not reach JSONBin.' });
  }
};
