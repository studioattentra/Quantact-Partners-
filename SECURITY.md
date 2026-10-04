# Security audit and hardening — Quantact Partners website

Audit date: 4 October 2026. Scope: everything in this repository plus the hosting setup it expects.

## 1. What this site is (and is not)

The site is **static**: HTML, CSS, JavaScript and images, served from the `dist/` folder. There is no application server, no database, no API of its own, no session cookies and no stored user accounts. The only dynamic pieces are:

| Piece | Where it runs | Who can use it |
|---|---|---|
| Enquiry form | Host's form handler (Netlify Forms) or the visitor's own email app | Anyone (public, by design) |
| Content admin `/admin/` | Decap CMS in the browser, authenticated by the host's identity service, writing to this Git repository through the host's Git Gateway | Invited owner only |
| Case-study build | Node script at deploy time | Host build, GitHub Action |

So several classic checklist items have no surface here. The table below records each requested item and what was done.

## 2. Checklist, item by item

| Requested | Finding | Action taken |
|---|---|---|
| Hide API keys | **None exist.** The code calls no third-party API with a key. The only external services are the host's own identity and form endpoints, which use the visitor's session, not a key. | Pattern scan of the full git history and of `dist/` for keys, tokens, JWTs and private keys: none found. The scan is now automated in `npm run audit`. |
| Check environment variables | The only variable read is `SITE_URL` (public domain) during build. No `.env` files are tracked. | `.gitignore` now blocks `.env*`, `*.pem`, `*.key`, `.htpasswd`, `.netlify/`, `dist/`. `NODE_ENV=production` set for the host build. |
| Protect admin routes | `/admin/` loaded its editor from a CDN at a floating version with no integrity check, and its preview code was an inline script. | Editor and identity widget pinned to exact versions with Subresource Integrity hashes; inline script moved to `admin/cms.js`; `/admin/*` gets `Cache-Control: no-store`, `X-Robots-Tag: noindex`, its own Content-Security-Policy and `frame-ancestors 'none'`; `robots.txt` disallows it. Optional second layer: web-server Basic Auth (section 4). |
| Add proper authentication | The admin signs in with GitHub (OAuth 2.0, 2FA available) through a small PHP relay on the site; the client secret stays in the private config, the state parameter is checked, and the token is handed to the editor window only on our own origin. The site never sees or stores a password. | Relay in `admin/oauth/`, setup in `HOSTINGER.md` Part B. The owner's GitHub account has full create/edit/delete rights over case studies and media, nothing else. |
| Users only access what they should (frontend) | Everything public is meant to be public. Drafts never reach the site because the build skips `published: false` and future-dated posts. | Build now emits a clean `dist/` containing only public files; the raw Markdown (including drafts), templates, scripts, lockfiles and config are no longer deployed. |
| Sanitise forms | Form fields had no length limits and no server-side validation of our own. | Client: `maxlength`, trimming, honeypot, 30-second cooldown. Server (`api/contact.php`): method and same-origin checks, allow-listed service value, length and format validation, control characters and CR/LF stripped so mail headers cannot be injected, UTF-8 subject encoding. Nothing from the form is ever written into a page. |
| Protect against XSS | Front end: one `innerHTML` use, fed only through an escaper. Build: Markdown from the admin was rendered unsanitised (acceptable for a trusted owner, but no defence if the owner account were compromised). | Markdown output is now passed through `sanitize-html` with an allow-list (no scripts, handlers, iframes or `javascript:` URLs; external links get `rel="noopener noreferrer"`). A strict Content-Security-Policy (`script-src 'self'`, `style-src 'self'`, `object-src 'none'`, `base-uri 'self'`) is sent on every page, so even an injected script could not run. Verified with zero CSP violations across all pages. |
| Rate limiting | No application server existed. | Form: `api/contact.php` enforces 5 submissions per IP per hour and 60 site-wide per hour (file-based counters outside the web root), plus honeypot and a client-side cooldown. Admin login is GitHub's (their throttling). Optional Basic Auth on `/admin/` adds a second gate. |
| Secure API endpoints | Two small PHP endpoints now exist: `api/contact.php` (POST only) and `admin/oauth/*` (login relay). | POST-only, same-origin, rate-limited, JSON responses with `no-store`; OAuth relay validates provider and scope, uses a random state in an HttpOnly/Secure/SameSite cookie, verifies TLS, and never exposes the client secret. `_lib.php` and `config.php` are blocked by `.htaccess`. |
| Check CORS | The site makes no cross-origin requests at all after self-hosting the fonts. No `Access-Control-Allow-Origin` header is set anywhere. | `connect-src 'self'` in the CSP enforces this going forward; `Cross-Origin-Resource-Policy: same-origin` and `Cross-Origin-Opener-Policy: same-origin` added. |
| Add security headers | None were set. | Added, from one source file (`scripts/security-headers.mjs`) written into `dist/_headers` (Netlify, Cloudflare Pages) and `dist/.htaccess` (Apache/cPanel): Content-Security-Policy, Strict-Transport-Security (2 years, preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, X-Permitted-Cross-Domain-Policies, plus directory listing off and HTTPS redirect for Apache. |
| Turn off debug mode | No debug mode or source maps exist; no `console` output in the front-end code. | `NODE_ENV=production` for builds; exposure check fails the build if a `.map` or log file ever lands in `dist/`. |
| Update dependencies | `npm audit`: 0 vulnerabilities before and after. | Updated marked 12 → 18, js-yaml 4 → 5, Three.js 0.160 → 0.186 (bundled and minified locally), added sanitize-html and bcryptjs; esbuild as a dev tool. Lockfile committed so builds are reproducible. |
| Remove what is not needed | Unused still-image renderer in the WebGL module; Google Fonts third-party request; floating CDN versions. | Removed the dead code; fonts self-hosted (`assets/fonts/`); CDN pinned. |
| Check for exposed files | On a static host the whole repository would have been served: drafts, templates, build scripts, `package.json`, `netlify.toml`, the GitHub workflow and these notes. | Deploy only `dist/`; `.htaccess` additionally denies dotfiles, `.md`, `.yml`, `.json`, `.toml`, `.mjs` and `/.git`; `scripts/check-exposure.mjs` scans `dist/` on every audit. |
| Secure the database | There is no database. Content lives in this Git repository. | Access is governed by GitHub permissions. Recommended: 2FA on the GitHub and host accounts, branch protection on `main`, and the host's deploy key limited to this repository (section 4). |
| Hash passwords properly | The site stores no passwords. The identity service hashes with bcrypt. | For the optional Basic-Auth layer, `npm run hash-password` generates a strong password and a bcrypt (cost 12) hash, with ready-made `.htpasswd` and Netlify lines. A first pair was generated and handed over separately; it is not stored in the repository. |
| Scan git for leaked secrets | No keys, tokens or private keys in any commit. **Two pieces of personal data remain in early history:** the principal's personal Gmail address and the +92 phone number (removed from the site on 4 October). | Left in history, because rewriting a shared branch is destructive. If you want them gone, say so and the history can be rewritten with a force-push; everyone with a clone must then re-clone. |
| Full security audit | Performed; this file is the report. | Lighthouse after hardening: accessibility 100, best practices 100, SEO 100. Zero CSP violations on home, case study, listing, privacy and admin shells. |

## 3. Verifying locally

```sh
npm install
npm run build        # generates pages and dist/, writes _headers and .htaccess
npm run audit        # npm audit + exposure scan of dist/
npm run serve        # serves dist/ with the production security headers on :8000
npm run hash-password            # new random password + bcrypt hash
npm run hash-password -- "your own passphrase"
```

## 4. Host-side settings (Hostinger)

The full click-by-click guide is in `HOSTINGER.md`. The security-relevant points:

1. **Deploy only the `hostinger` branch** (built by GitHub Actions from `dist/`) through hPanel → Git. Source, drafts and configuration never reach the server.
2. **Private configuration** lives in `domains/<domain>/private/site-config.php`, one level above `public_html`, so it is not web-accessible. It holds the enquiry mailbox and the GitHub OAuth App secret. `.htaccess` additionally blocks `config.php` and `_lib.php` if anyone ever places them inside `public_html`.
3. **Force HTTPS** in hPanel → SSL; `.htaccess` also redirects and sends HSTS.
4. **Admin login** = GitHub account with write access to the repository, via the site's own OAuth relay (`admin/oauth/`). Turn on 2FA for that GitHub account. Optional second lock: Basic Auth block at the end of `.htaccess` with `npm run hash-password`.
5. **Contact form** = `api/contact.php`: same-origin check, honeypot, per-IP (5/hour) and global (60/hour) rate limits, header-injection-safe mail, private log in `private/storage/`. Create the sender mailbox in hPanel → Emails.
6. **GitHub**: `main` protected against force-push, secret scanning and Dependabot alerts on, the Action's `npm run audit` and `npm run lint:php` gate every deploy.

## 5. Residual risks to be aware of

- The editor runs third-party JavaScript (Decap CMS, identity widget) from a CDN. Versions are pinned with integrity hashes, so a changed file will refuse to load; keep the pins current when upgrading.
- The owner's identity account is the single key to the content. Use a long unique password and 2FA where the host offers it.
- The form's email fallback (used only if `api/contact.php` is unreachable or unconfigured) opens the visitor's mail client addressed to the mailbox set in `assets/js/main.js`.
- Personal data in old git history (see section 2) remains until the history is rewritten.

## 6. Reporting a vulnerability

Please report security issues privately through the enquiry form on the website or to the owner directly, not in a public issue.
