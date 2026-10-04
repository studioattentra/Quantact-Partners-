#!/usr/bin/env node
/**
 * Local preview of dist/ WITH the production security headers applied,
 * so Content-Security-Policy problems show up before deployment.
 *   npm run serve        → http://localhost:8000
 */

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, ADMIN, STATIC_ASSETS } from './security-headers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = parseInt(process.env.PORT || '8000', 10);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.yml': 'text/yaml; charset=utf-8', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath.includes('..')) { res.writeHead(400); return res.end(); }
    let file = path.join(ROOT, urlPath);
    let s = await stat(file).catch(() => null);
    if (s && s.isDirectory()) { file = path.join(file, 'index.html'); s = await stat(file).catch(() => null); }
    if (!s) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const base = path.basename(file);
    if (base.startsWith('.') || base === '_headers') { res.writeHead(404); return res.end(); }
    const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ...(urlPath.startsWith('/admin/') ? ADMIN : SITE), ...(urlPath.startsWith('/assets/') ? STATIC_ASSETS : {}) };
    delete headers['Strict-Transport-Security']; // meaningless over plain http locally
    res.writeHead(200, headers);
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500); res.end('Error'); }
}).listen(PORT, () => console.log(`Serving dist/ with security headers on http://localhost:${PORT}`));
