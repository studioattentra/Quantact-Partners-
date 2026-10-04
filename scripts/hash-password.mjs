#!/usr/bin/env node
/**
 * Generates a strong password (or hashes one you supply) with bcrypt, cost 12,
 * and prints ready-to-paste lines for the common ways to put a password in
 * front of /admin/ on a static host.
 *
 *   npm run hash-password                 → generates a random 24-character password
 *   npm run hash-password -- "my secret"  → hashes the password you pass
 *
 * The plain password is printed once and never stored. Keep the hash in the
 * host configuration (.htpasswd, Netlify/Cloudflare settings), never in the
 * public site folder.
 */

import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_!@#%&*';
const generate = (n = 24) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

const supplied = process.argv.slice(2).join(' ').trim();
const password = supplied || generate();
if (supplied && supplied.length < 12) {
  console.error('Choose a password of at least 12 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const user = process.env.ADMIN_USER || 'admin';

console.log('\nPassword (shown once, store it in a password manager):\n');
console.log('  ' + password + '\n');
console.log('bcrypt hash (cost 12):\n');
console.log('  ' + hash + '\n');
console.log('Apache / cPanel  →  .htpasswd line (keep the file outside public_html):\n');
console.log('  ' + user + ':' + hash + '\n');
console.log('Netlify (Pro plan) →  in _headers under /admin/*:\n');
console.log('  Basic-Auth: ' + user + ':' + password + '    (Netlify stores it; it is not published)\n');
console.log('Check: bcrypt.compareSync(password, hash) =', bcrypt.compareSync(password, hash));
