// TEMPORARY self-test of the Upstash commands used by api/rating.js, on a throw-away key prefix only. Deleted right after use.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const base = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return res.status(500).json({ error: 'no storage' });
  const k = 'sourciavera:selftest:' + Date.now();
  const r = await fetch(`${base}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['SET', k + ':v', '4', 'NX', 'EX', 60], ['SET', k + ':v', '5', 'NX', 'EX', 60], ['GET', k + ':v'], ['INCR', k + ':n'], ['INCR', k + ':n'], ['EXPIRE', k + ':n', 60], ['DEL', k + ':v'], ['DEL', k + ':n']]) });
  res.status(200).json(await r.json());
};
