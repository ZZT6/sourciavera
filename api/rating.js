// Star rating for the homepage founder quote. Storage: Upstash Redis (Vercel KV REST) through KV_REST_API_URL / KV_REST_API_TOKEN.
// Real votes only, one vote per visitor, counted on the server:
//  - a visitor is identified by an HttpOnly cookie (random id; only its HMAC is stored) -> one vote per browser, kept even if localStorage is cleared;
//  - a hashed IP address can place at most MAX_PER_IP votes in 30 days (so clearing cookies does not allow repeated voting; a few people behind one office IP still can vote);
//  - votes must come from this site (Origin check) and be a POST with a star from 1 to 5.
// Nothing here is shown to Google as structured data (no aggregateRating): the average and the count are displayed on the page only.
const crypto = require('crypto');

const STAR_KEYS = [1, 2, 3, 4, 5].map((n) => `sourciavera:founder-rating:${n}`);
const VOTER_PREFIX = 'sourciavera:founder-rating:voter:';
const IP_PREFIX = 'sourciavera:founder-rating:ip:';
const MAX_PER_IP = 3;
const IP_WINDOW_SECONDS = 30 * 24 * 3600;
const VOTER_TTL_SECONDS = 2 * 365 * 24 * 3600;

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  res.setHeader('Cache-Control', 'no-store');

  if (!base || !token) {
    res.status(500).json({ error: 'storage not configured' });
    return;
  }

  const hmac = (value) => crypto.createHmac('sha256', token).update(String(value)).digest('hex');
  const pipeline = async (commands) => {
    const r = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands)
    });
    return r.json();
  };
  const summary = async () => {
    const results = await pipeline(STAR_KEYS.map((k) => ['GET', k]));
    const counts = results.map((item) => (item && item.result ? parseInt(item.result, 10) : 0));
    const total = counts.reduce((a, b) => a + b, 0);
    const sum = counts.reduce((a, c, i) => a + c * (i + 1), 0);
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    return { counts, total, average };
  };

  try {
    const cookies = parseCookies(req.headers.cookie);
    const rid = /^[a-f0-9]{48}$/.test(cookies.sv_rid || '') ? cookies.sv_rid : null;

    if (req.method === 'POST') {
      const star = parseInt(req.query && req.query.star, 10);
      if (![1, 2, 3, 4, 5].includes(star)) {
        res.status(400).json({ error: 'invalid star' });
        return;
      }
      const origin = req.headers.origin || '';
      const host = req.headers.host || '';
      if (!origin || new URL(origin).host !== host) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      const visitor = rid || crypto.randomBytes(24).toString('hex');
      const voterKey = VOTER_PREFIX + hmac(visitor);
      const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || '').trim();
      const ipKey = IP_PREFIX + hmac(ip);
      const cookie = `sv_rid=${visitor}; Path=/; Max-Age=${VOTER_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;

      // 1) this browser already voted?
      const [existing] = await pipeline([['GET', voterKey]]);
      if (existing && existing.result) {
        res.setHeader('Set-Cookie', cookie);
        res.status(409).json({ error: 'already rated', myStar: parseInt(existing.result, 10), ...(await summary()) });
        return;
      }
      // 2) too many votes from this address in the window?
      const [ipCount] = await pipeline([['INCR', ipKey]]);
      const n = ipCount && ipCount.result ? parseInt(ipCount.result, 10) : 1;
      if (n === 1) await pipeline([['EXPIRE', ipKey, IP_WINDOW_SECONDS]]);
      if (n > MAX_PER_IP) {
        res.setHeader('Set-Cookie', cookie);
        res.status(429).json({ error: 'too many ratings from this network', ...(await summary()) });
        return;
      }
      // 3) record the visitor first (SET NX), then count the star: a race between two requests of the same visitor counts once
      const [setRes] = await pipeline([['SET', voterKey, String(star), 'NX', 'EX', VOTER_TTL_SECONDS]]);
      if (!setRes || setRes.result !== 'OK') {
        res.setHeader('Set-Cookie', cookie);
        res.status(409).json({ error: 'already rated', ...(await summary()) });
        return;
      }
      await pipeline([['INCR', STAR_KEYS[star - 1]]]);
      res.setHeader('Set-Cookie', cookie);
      res.status(200).json({ myStar: star, ...(await summary()) });
      return;
    }

    // GET: totals, plus this browser's own star when its cookie is known
    const data = await summary();
    if (rid) {
      const [mine] = await pipeline([['GET', VOTER_PREFIX + hmac(rid)]]);
      if (mine && mine.result) data.myStar = parseInt(mine.result, 10);
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'failed to update rating' });
  }
};
