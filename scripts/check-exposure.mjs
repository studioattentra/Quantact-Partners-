#!/usr/bin/env node
/**
 * Exposure check for the deployable folder.
 *   npm run audit   (runs `npm audit` first, then this)
 *
 * Fails (exit 1) if dist/ contains anything that should never be public
 * (source, config, drafts, environment files, archives) or if any file in
 * dist/ looks like it carries a credential. Warns about Markdown/YAML that
 * is not the admin configuration.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const FORBIDDEN = [
  /(^|\/)\.env(\..*)?$/, /\.pem$/, /\.key$/, /\.p12$/, /\.pfx$/, /\.htpasswd$/, /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/, /\.map$/, /\.log$/, /\.sql$/, /\.bak$/, /\.zip$/, /\.tar(\.gz)?$/,
  /(^|\/)package(-lock)?\.json$/, /(^|\/)netlify\.toml$/, /(^|\/)(templates|content|scripts)(\/|$)/,
  /(^|\/)CHANGES\.md$/, /(^|\/)README\.md$/, /(^|\/)SECURITY\.md$/, /(^|\/)HOSTINGER\.md$/, /\.mjs$/,
  /(^|\/)api\/config\.php$/, /(^|\/)site-config(\.example)?\.php$/, /(^|\/)deploy(\/|$)/, /(^|\/)_headers$/,
];
const ALLOWED_DATA = [/(^|\/)admin\/config\.yml$/, /(^|\/)case-studies\/index\.json$/, /(^|\/)robots\.txt$/, /(^|\/)sitemap\.xml$/, /(^|\/)\.htaccess$/];
const TEXT = /\.(html|css|js|json|yml|yaml|txt|xml|md|php|htaccess)$/;
const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/, /sk-[A-Za-z0-9]{32,}/, /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AIza[0-9A-Za-z_-]{30,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /(api[_-]?key|secret|token|passw(or)?d)\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
];

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out); else out.push(p);
  }
  return out;
}

try { await stat(DIST); } catch { console.error('dist/ not found. Run `npm run build` first.'); process.exit(1); }

const files = await walk(DIST);
const rel = (f) => path.relative(DIST, f).split(path.sep).join('/');
let errors = 0, warnings = 0;

for (const f of files) {
  const r = rel(f);
  if (FORBIDDEN.some((re) => re.test(r)) && !ALLOWED_DATA.some((re) => re.test(r))) { console.error('FORBIDDEN in dist:', r); errors++; continue; }
  if (/\.(md|ya?ml)$/.test(r) && !ALLOWED_DATA.some((re) => re.test(r))) { console.warn('warning: data file in dist:', r); warnings++; }
  if (TEXT.test(r)) {
    const txt = await readFile(f, 'utf8');
    for (const re of SECRET_PATTERNS) {
      const m = txt.match(re);
      if (m) { console.error(`POSSIBLE SECRET in ${r}: ${m[0].slice(0, 12)}…`); errors++; }
    }
  }
}

console.log(`Checked ${files.length} files in dist/: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
