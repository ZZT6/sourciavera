#!/usr/bin/env node
/**
 * Generates sitemap.xml from the HTML pages that actually exist in this repo.
 * Nothing in sitemap.xml is maintained by hand any more.
 *
 *   node scripts/generate-sitemap.mjs            write sitemap.xml
 *   node scripts/generate-sitemap.mjs --diff     print URLs added / removed / re-dated vs the committed sitemap.xml
 *   node scripts/generate-sitemap.mjs --check    exit 1 if sitemap.xml is out of date (writes nothing)
 *   node scripts/generate-sitemap.mjs --ci       build mode (used by vercel.json "buildCommand"): see "lastmod" below
 *   --verbose                                    also list every excluded page and the reason
 *
 * Which pages are listed
 *   Every *.html file under the repo root, mapped to its public URL (cleanUrls, no trailing slash,
 *   index.html -> directory URL). Not listed: 404/500 pages, drafts and test pages (by file name),
 *   pages whose <meta name="robots"|"googlebot"|"bingbot"> contains noindex, pages carrying the comment
 *   <!-- sitemap:exclude -->, pages that vercel.json redirects away, and the api/, scripts/, images/ folders.
 *
 * lastmod
 *   The date of the last Git commit that touched the page file (git log -1 --format=%cs). A page with
 *   uncommitted changes (or a new, untracked page) gets today's date, so running the script before a commit
 *   is already accurate. When Git history is unavailable or shallow (a Vercel build), the lastmod already
 *   stored in the committed sitemap.xml is kept for existing URLs, and only new URLs get today's date, so a
 *   build can never overwrite real dates with checkout dates.
 *
 * changefreq / priority: see RULES below (they reproduce the values the hand-written sitemap used).
 * The site is always https://sourciavera.com (no www).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://sourciavera.com';
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const argv = new Set(process.argv.slice(2));
const MODE_CHECK = argv.has('--check');
const MODE_DIFF = argv.has('--diff');
const MODE_CI = argv.has('--ci');
const VERBOSE = argv.has('--verbose');

const SKIP_DIRS = new Set(['.git', '.github', '.claude', '.vercel', 'node_modules', 'api', 'scripts', 'images', 'sourciavera.com-audit']);
const SKIP_BASENAME = /^(404|500|test|draft|drafts|tmp)$|^[_.]|^(draft|test)[-_]|[-_](draft|drafts)$/i;

// [pattern, changefreq, priority] - first match wins.
const RULES = [
  [/^\/$/, 'monthly', '1.0'],
  [/^\/es$/, 'monthly', '0.9'],
  [/^\/blog(\/es)?$/, 'weekly', '0.9'],
  [/^\/verification-services$/, 'monthly', '0.9'],
  [/^\/verification-services\/mexico$/, 'monthly', '0.8'],
  [/^\/verification-services\/[^/]+$/, 'monthly', '0.6'],
  [/^\/es\/verificacion-fabricas(\/mexico)?$/, 'monthly', '0.9'],
  [/^\/es\/verificacion-fabricas\/[^/]+$/, 'monthly', '0.6'],
  [/^\/(es\/)?categor(ies|ias)(\/.*)?$/, 'monthly', '0.7'],
  [/^\/(es\/)?(privacy|terms)$/, 'yearly', '0.3'],
  [/^\/(es\/)?about$/, 'yearly', '0.7'],
  [/^\/(es\/)?why-sourciavera$/, 'yearly', '0.8'],
  [/^\/(es\/)?small-batch$/, 'monthly', '0.7'],
  [/^\/(es\/)?(supply-chain-supervision-china|supervision-fabricas-china)$/, 'monthly', '0.8'],
  [/^\/blog\/(es\/)?(glossary-factory-verification-terms|glosario-terminos-verificacion)$/, 'monthly', '0.7'],
  [/^\/blog\/(es\/)?[^/]+$/, 'monthly', '0.8'],
];
const DEFAULT_RULE = ['monthly', '0.5'];

// Section order and labels in the generated file.
const SECTIONS = [
  ['Home and core pages (EN)', (u) => !u.startsWith('/es') && !u.startsWith('/blog') && !u.startsWith('/categories') && !u.startsWith('/verification-services')],
  ['Verification services and country pages (EN)', (u) => u.startsWith('/verification-services')],
  ['Product categories (EN)', (u) => u.startsWith('/categories')],
  ['Blog (EN)', (u) => u.startsWith('/blog') && !u.startsWith('/blog/es')],
  ['Home and core pages (ES)', (u) => u.startsWith('/es') && !u.startsWith('/es/verificacion-fabricas') && !u.startsWith('/es/categorias')],
  ['Verification services and country pages (ES)', (u) => u.startsWith('/es/verificacion-fabricas')],
  ['Product categories (ES)', (u) => u.startsWith('/es/categorias')],
  ['Blog (ES)', (u) => u.startsWith('/blog/es')],
];

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
      walk(path.join(dir, ent.name), out);
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(path.join(dir, ent.name));
    }
  }
  return out;
}

function toUrl(rel) {
  let p = rel.split(path.sep).join('/');
  if (p === 'index.html') return '/';
  if (p.endsWith('/index.html')) return '/' + p.slice(0, -'/index.html'.length);
  return '/' + p.slice(0, -'.html'.length);
}

function hasNoindex(html) {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const name = /name\s*=\s*["']([^"']+)["']/i.exec(tag);
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (name && content && /^(robots|googlebot|bingbot)$/i.test(name[1]) && /noindex/i.test(content[1])) return true;
  }
  return false;
}

function redirectSources() {
  const set = new Set();
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    for (const r of cfg.redirects || []) {
      if (r.has || /[():*?+]/.test(r.source)) continue; // only plain path redirects
      set.add(r.source.replace(/\/$/, '') || '/');
    }
  } catch { /* no vercel.json */ }
  return set;
}

function readOldSitemap() {
  const map = new Map();
  if (!fs.existsSync(SITEMAP)) return map;
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>(.*?)<\/loc>/.exec(m[1]);
    if (!loc) continue;
    const lm = /<lastmod>(.*?)<\/lastmod>/.exec(m[1]);
    const cf = /<changefreq>(.*?)<\/changefreq>/.exec(m[1]);
    const pr = /<priority>(.*?)<\/priority>/.exec(m[1]);
    map.set(loc[1], { lastmod: lm ? lm[1] : null, changefreq: cf ? cf[1] : null, priority: pr ? pr[1] : null });
  }
  return map;
}

function ruleFor(url) {
  for (const [re, cf, pr] of RULES) if (re.test(url)) return [cf, pr];
  return DEFAULT_RULE;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function build() {
  const old = readOldSitemap();
  const isRepo = git(['rev-parse', '--is-inside-work-tree'])?.trim() === 'true';
  const shallow = isRepo && git(['rev-parse', '--is-shallow-repository'])?.trim() === 'true';
  const useGitDates = isRepo && !shallow;
  const dirty = new Set();
  if (useGitDates) {
    const st = git(['status', '--porcelain', '-uall']) || '';
    for (const line of st.split('\n')) {
      if (!line.trim()) continue;
      let p = line.slice(3).trim();
      if (p.includes(' -> ')) p = p.split(' -> ')[1];
      dirty.add(p.replace(/^"|"$/g, ''));
    }
  }
  const redirects = redirectSources();
  const entries = [];
  const excluded = [];
  for (const file of walk(ROOT).sort()) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const base = path.basename(rel, '.html');
    const url = toUrl(rel);
    if (SKIP_BASENAME.test(base)) { excluded.push([url, 'file name looks like a 404/draft/test page']); continue; }
    const html = fs.readFileSync(file, 'utf8');
    if (hasNoindex(html)) { excluded.push([url, 'noindex']); continue; }
    if (/<!--\s*sitemap:exclude\s*-->/i.test(html)) { excluded.push([url, 'sitemap:exclude marker']); continue; }
    if (redirects.has(url)) { excluded.push([url, 'redirected away in vercel.json']); continue; }
    const loc = ORIGIN + (url === '/' ? '/' : url);
    let lastmod = null;
    if (useGitDates) {
      if (dirty.has(rel)) lastmod = today();
      else lastmod = (git(['log', '-1', '--format=%cs', '--', rel]) || '').trim() || null;
    }
    if (!lastmod) lastmod = (old.get(loc) && old.get(loc).lastmod) || today();
    const [changefreq, priority] = ruleFor(url);
    entries.push({ url, loc, lastmod, changefreq, priority });
  }
  return { entries, excluded, old, mode: useGitDates ? 'git dates' : (isRepo ? 'shallow clone: kept committed lastmod' : 'no git: kept committed lastmod') };
}

function render(entries) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <!-- Generated by scripts/generate-sitemap.mjs from the HTML pages in this repo. Do not edit by hand. -->'];
  const used = new Set();
  for (const [label, test] of SECTIONS) {
    const group = entries.filter((e) => !used.has(e.url) && test(e.url)).sort((a, b) => a.url.localeCompare(b.url));
    if (!group.length) continue;
    // keep "/" first inside the core group
    group.sort((a, b) => (a.url === '/' ? -1 : b.url === '/' ? 1 : 0));
    lines.push('', `  <!-- ${label} -->`);
    for (const e of group) {
      used.add(e.url);
      lines.push(`  <url><loc>${esc(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`);
    }
  }
  const rest = entries.filter((e) => !used.has(e.url));
  if (rest.length) {
    lines.push('', '  <!-- Other pages -->');
    for (const e of rest.sort((a, b) => a.url.localeCompare(b.url))) {
      lines.push(`  <url><loc>${esc(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`);
    }
  }
  lines.push('</urlset>', '');
  return lines.join('\n');
}

const { entries, excluded, old, mode } = build();
const xml = render(entries);
const current = fs.existsSync(SITEMAP) ? fs.readFileSync(SITEMAP, 'utf8').replace(/\r\n/g, '\n') : '';

const newLocs = new Set(entries.map((e) => e.loc));
const added = entries.filter((e) => !old.has(e.loc)).map((e) => e.loc);
const removed = [...old.keys()].filter((l) => !newLocs.has(l));
const redated = entries.filter((e) => old.has(e.loc) && old.get(e.loc).lastmod !== e.lastmod);
const reRuled = entries.filter((e) => old.has(e.loc) && (old.get(e.loc).changefreq !== e.changefreq || old.get(e.loc).priority !== e.priority));

if (MODE_DIFF || VERBOSE) {
  console.log(`pages listed: ${entries.length} (was ${old.size}) | lastmod source: ${mode}`);
  console.log(`added (${added.length}):`); added.forEach((u) => console.log('  +', u));
  console.log(`removed (${removed.length}):`); removed.forEach((u) => console.log('  -', u));
  console.log(`lastmod changed: ${redated.length} | changefreq/priority changed: ${reRuled.length}`);
  reRuled.forEach((e) => console.log(`  ~ ${e.url}: ${old.get(e.loc).changefreq}/${old.get(e.loc).priority} -> ${e.changefreq}/${e.priority}`));
  console.log(`excluded (${excluded.length}):`); excluded.forEach(([u, why]) => console.log(`  x ${u}  (${why})`));
  if (MODE_DIFF) process.exit(0);
}

if (MODE_CHECK) {
  if (current === xml) { console.log('sitemap.xml is up to date'); process.exit(0); }
  console.error('sitemap.xml is out of date - run: node scripts/generate-sitemap.mjs');
  process.exit(1);
}

if (current !== xml) {
  fs.writeFileSync(SITEMAP, xml, 'utf8');
  console.log(`sitemap.xml written: ${entries.length} URLs (${added.length} added, ${removed.length} removed, ${redated.length} re-dated) [${mode}${MODE_CI ? ', ci' : ''}]`);
} else {
  console.log(`sitemap.xml unchanged: ${entries.length} URLs [${mode}]`);
}
