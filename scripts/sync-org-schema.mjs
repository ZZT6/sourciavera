#!/usr/bin/env node
/* Rewrites the Organization JSON-LD block (@id https://sourciavera.com/#organization) on every page that has one,
 * from scripts/org-schema.json. Usage: node scripts/sync-org-schema.mjs [--check]   (--check: report only, exit 1 if any page differs) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'org-schema.json'), 'utf8'));
const CHECK = process.argv.includes('--check');
const SKIP = new Set(['node_modules', '.git', '.vercel', '.github']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function build(lang) {
  const l = cfg[lang];
  const founder = { ...cfg.founder, jobTitle: l.jobTitle };
  const { '@context': ctx, '@type': type, '@id': id, name, foundingDate, url, logo, address, areaServed, knowsLanguage, email, telephone, priceRange, currenciesAccepted, sameAs } = cfg.common;
  return {
    '@context': ctx, '@type': type, '@id': id, name, foundingDate, url, logo, description: l.description, address, areaServed,
    availableLanguage: l.availableLanguage, knowsLanguage, email, telephone, priceRange, currenciesAccepted,
    serviceType: l.serviceType, founder, sameAs,
  };
}

const re = /(<script type="application\/ld\+json">\s*)(\{[\s\S]*?\})(\s*<\/script>)/g;
let changed = 0, seen = 0;
for (const file of walk(ROOT, [])) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  const lang = /^(es|blog\/es)\//.test(rel) ? 'es' : 'en';
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  let hit = false;
  const out = src.replace(re, (all, a, json, z) => {
    let d; try { d = JSON.parse(json); } catch { return all; }
    const nlText = (o) => JSON.stringify(o, null, 2).replace(/\n/g, nl);
    if (Array.isArray(d['@graph'])) {                       // home pages: the Organization sits inside a @graph
      const i = d['@graph'].findIndex((n) => n && n['@id'] === cfg.common['@id']);
      if (i < 0) return all;
      hit = true;
      const { '@context': _ctx, ...node } = build(lang);
      d['@graph'][i] = node;
      return a + nlText(d) + z;
    }
    if (d['@id'] !== cfg.common['@id']) return all;
    hit = true;
    const text = nlText(build(lang));
    return a + text + z;
  });
  if (!hit) continue;
  seen++;
  if (out !== src) {
    changed++;
    console.log((CHECK ? 'differs  ' : 'rewrote  ') + rel + '  [' + lang + ']');
    if (!CHECK) fs.writeFileSync(file, out);
  }
}
console.log(`${seen} pages carry the Organization block, ${changed} ${CHECK ? 'differ' : 'rewritten'}`);
if (CHECK && changed) process.exit(1);
