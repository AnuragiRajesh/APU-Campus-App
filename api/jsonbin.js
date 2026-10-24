const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';
const ALLOWED_BIN_IDS = new Set([
  '6adcec7fffd5d1605388b879',
  '6adcec93ac6210605a4f08ac',
]);

async function getRequestRecord(req) {
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    body = Buffer.concat(chunks).toString('utf8');
  }

  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (!body.trim()) throw new Error('Request body is empty.');
    try {
      body = JSON.parse(body);
    } catch {
      throw new Error('Request body must be valid JSON.');
    }
  }

  if (!body || typeof body !== 'object') {
    throw new Error('A JSON object or array is required.');
  }
  return body;
}

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
      record = await getRequestRecord(req);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    options.method = 'PUT';
    options.body = JSON.stringify(record);
    if (!options.body) {
      return res.status(400).json({ error: 'Request body serialized to an empty value.' });
    }
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
