const STAR_KEYS = [1, 2, 3, 4, 5].map((n) => `sourciavera:founder-rating:${n}`);

module.exports = async (req, res) => {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  res.setHeader('Cache-Control', 'no-store');

  if (!base || !token) {
    res.status(500).json({ error: 'storage not configured' });
    return;
  }

  try {
    if (req.method === 'POST') {
      const star = parseInt(req.query && req.query.star, 10);
      if (![1, 2, 3, 4, 5].includes(star)) {
        res.status(400).json({ error: 'invalid star' });
        return;
      }
      await fetch(`${base}/incr/${STAR_KEYS[star - 1]}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    const r = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(STAR_KEYS.map((k) => ['GET', k]))
    });
    const results = await r.json();
    const counts = results.map((item) => (item && item.result ? parseInt(item.result, 10) : 0));
    const total = counts.reduce((a, b) => a + b, 0);
    const sum = counts.reduce((a, c, i) => a + c * (i + 1), 0);
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    res.status(200).json({ counts, total, average });
  } catch (err) {
    res.status(500).json({ error: 'failed to update rating' });
  }
};
