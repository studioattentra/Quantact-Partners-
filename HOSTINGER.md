# Going live on Hostinger — step by step

This repository is set up so that **GitHub builds the site and Hostinger only ever receives the finished `dist/` folder**. Nothing else (drafts, templates, build scripts, configuration) reaches the server. The content admin at `/admin/` logs in with GitHub and writes articles straight into this repository; the build then republishes automatically.

Allow about 45 minutes the first time. Everything below is a one-off.

---

## Part A — GitHub (10 minutes)

1. **Repository:** `github.com/studioattentra/Quantact-Partners-`, default branch `main`. The deploy workflow and the admin editor both work from `main`.
2. **Enable Actions.** *Actions* tab → enable workflows if prompted. The workflow is `.github/workflows/deploy-hostinger.yml`.
3. **Run it once.** *Actions → Build and deploy to Hostinger → Run workflow*. When it finishes, a new branch named **`hostinger`** exists containing only the deployable files. This branch is what Hostinger will pull.
4. **Protect `main`** (recommended): *Settings → Branches → Add rule*: block force-pushes and deletions. Turn on *Settings → Code security*: secret scanning and Dependabot alerts.
5. **Two-factor authentication** on every GitHub account that can push.

## Part B — GitHub OAuth App for the admin login (5 minutes)

The owner signs in to `/admin/` with his GitHub account, so he needs a GitHub account with **write access** to this repository (add him under *Settings → Collaborators* if it is not his repository).

1. GitHub → *Settings (profile) → Developer settings → OAuth Apps → New OAuth App*.
2. Application name: `Quantact Partners admin`.
   Homepage URL: `https://www.your-domain.co.uk`.
   Authorization callback URL: `https://www.your-domain.co.uk/admin/oauth/callback.php`.
3. Register, then **Generate a new client secret**. Copy the Client ID and the secret; you need them in Part D.

## Part C — Hostinger: domain, SSL, mailbox (10 minutes)

1. hPanel → *Websites → Add website* (or use the existing one) and point the domain at Hostinger (nameservers or A/CNAME records as hPanel shows).
2. *Security → SSL*: install the free certificate and switch **Force HTTPS** on.
3. *Emails → Create email account*: create `noreply@your-domain.co.uk` (any name). The contact form sends from this address; Hostinger only relays mail from real mailboxes on the domain.
4. *Advanced → PHP Configuration*: PHP **8.1 or newer** (8.2 default is fine). Nothing else needs changing.

## Part D — Private configuration file (5 minutes)

1. hPanel → *Files → File Manager*. Go **one level above** `public_html` (the domain folder) and create a folder named `private`.
2. Inside `private`, create `site-config.php` and paste the contents of `deploy/site-config.example.php` from this repository. Fill in:
   - `contact_to` – where enquiries go (currently the principal's Gmail).
   - `contact_from` – the mailbox created in Part C.
   - `site_origin` – `https://www.your-domain.co.uk` (exactly as the site is served, no trailing slash).
   - `github_client_id` / `github_client_secret` – from Part B.
3. Also create an empty folder `private/storage` (rate-limit counters and the enquiry log are written here, outside the web root).

Folder picture when done:

```
domains/your-domain.co.uk/
├── private/
│   ├── site-config.php
│   └── storage/
└── public_html/        ← Hostinger's Git deployment goes here
```

## Part E — Hostinger Git deployment (10 minutes)

1. hPanel → *Websites → Manage → Advanced → Git*.
2. **Create a new repository**:
   - Repository: `https://github.com/studioattentra/Quantact-Partners-.git` (for a private repo, click *Generate SSH key* in the same screen, add that key to the GitHub repository under *Settings → Deploy keys*, and use the SSH URL instead).
   - Branch: **`hostinger`**
   - Directory: leave empty (deploys into `public_html`).
3. Click *Create*, then *Deploy*. `public_html` now contains the site, including the hidden `.htaccess`.
4. Still in the Git screen, open **Auto deployment** and copy the webhook URL. In GitHub: *Settings → Secrets and variables → Actions → New repository secret*, name `HOSTINGER_DEPLOY_HOOK`, value = that URL. From now on every successful build updates the live site within a minute.

> If `public_html` already contained Hostinger's default `default.php`, delete it first; the Git deployment needs an empty folder.

## Part F — Checks (5 minutes)

- Open `https://www.your-domain.co.uk` – the site loads over HTTPS; the padlock is valid.
- Open `https://securityheaders.com` and test the domain – expect an **A** grade (CSP, HSTS, frame, nosniff, referrer and permissions headers are all set by `.htaccess`).
- Send a test enquiry from the contact form – expect "Thank you. Your enquiry has been sent" and an email in `contact_to`. (If PHP is not configured yet, the form falls back to opening the visitor's email app; that is expected.)
- Open `https://www.your-domain.co.uk/admin/` → *Login with GitHub* → authorise → the case-study list appears. Create a test article as a draft, then delete it.
- Confirm these return **404/403**, not content: `/content/`, `/templates/`, `/package.json`, `/api/config.php`, `/.git/`.

## Day-to-day

| Task | How |
|---|---|
| Publish a case study | `/admin/` → New Case Study → Publish. The build runs and the live site updates automatically. |
| Schedule one | Set a future publish date. The daily 06:15 UTC build publishes it. |
| Edit site text or services | Edit `index.html` in GitHub (or locally) and push to `main`. |
| Change the enquiry email | Edit `private/site-config.php` on Hostinger (no deploy needed). |
| Optional password lock on `/admin/` | `npm run hash-password`, save the `.htpasswd` line to `private/.htpasswd`, uncomment the block at the end of `.htaccess`. Note the `.htaccess` is regenerated on each deploy from `scripts/security-headers.mjs`, so make the change there. |

## If something does not work

- **Build fails on GitHub**: open the failed run; `npm run audit` stops the deploy if a secret-looking string or a private file would be published.
- **Contact form says "not configured"**: `site-config.php` is missing or in the wrong folder; it must be at `domains/<domain>/private/site-config.php`.
- **No email arrives**: check `contact_from` is a real mailbox on the domain and look in `private/storage/enquiries.log` – every valid submission is recorded there even if mail fails.
- **Admin login loops or fails**: the callback URL in the GitHub OAuth App must match `site_origin + /admin/oauth/callback.php` exactly, including `www`.
- **403 on the home page**: Hostinger's LiteSpeed rejected a directive in `.htaccess`; check *Files → Error logs* in hPanel and report the line.
