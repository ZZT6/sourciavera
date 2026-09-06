const KEY = 'sourciavera:founder-agree-count';

module.exports = async (req, res) => {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  res.setHeader('Cache-Control', 'no-store');

  if (!base || !token) {
    res.status(500).json({ error: 'storage not configured' });
    return;
  }

  try {
    const op = req.method === 'POST' ? 'incr' : 'get';
    const r = await fetch(`${base}/${op}/${KEY}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    const count = op === 'incr' ? data.result : (data.result ? parseInt(data.result, 10) : 0);
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: 'failed to update counter' });
  }
};
