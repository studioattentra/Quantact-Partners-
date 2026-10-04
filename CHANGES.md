# Changes applied from the principal's brief

## Hostinger / GitHub readiness, 4 October 2026
- Deployment: GitHub Action builds the site and publishes only `dist/` to a `hostinger` branch; hPanel → Git pulls it into `public_html` (guide: `HOSTINGER.md`). Netlify files removed.
- Contact form: `api/contact.php` (validation, same-origin, honeypot, rate limits, header-safe mail, private log). Front end posts there and falls back to the visitor's email app if the handler is unavailable.
- Admin login: GitHub OAuth through the site's own PHP relay (`admin/oauth/`); Decap config switched to the `github` backend.
- `.htaccess` rewritten for LiteSpeed/Apache with SetEnvIf-based headers, HTTPS redirect, denied private files, caching and compression.
- Private settings template: `deploy/site-config.example.php`. PHP syntax is linted in the deploy workflow.

## Security hardening, 4 October 2026
Full report in `SECURITY.md`. In short: strict Content-Security-Policy and the other standard security headers generated from one source file into `dist/_headers` and `dist/.htaccess`; only a clean `dist/` folder is deployed (no drafts, templates, scripts or config exposed); admin editor pinned with Subresource Integrity and no inline scripts; Markdown sanitised at build time; form length limits, honeypot and resend cooldown; fonts self-hosted so no third-party request remains; dependencies updated (marked 18, js-yaml 5, Three.js 0.186, sanitize-html, bcryptjs); `npm run audit` scans for exposed files and secrets; `npm run hash-password` produces bcrypt hashes for an optional Basic-Auth lock on `/admin/`. Git history scan found no secrets, but the principal's old Gmail address and phone number remain in early commits (see SECURITY.md §2).

## Update, 4 October 2026 (later the same day)
- The principal's portrait is now in the About section frame (`assets/img/umer-aijaz.jpg`, lightly desaturated to sit with the palette).
- All bracketed placeholders were removed from the site. Contact now points to the enquiry form; legal pages say registered details are available on request; the Calendly button was replaced by a "Book your free call" button that jumps to the form. The form's email fallback delivers to the Gmail address originally supplied, set as the `FIRM_EMAIL` constant in `assets/js/main.js`, until a firm mailbox exists.
- Image slots now hold original illustrations in the palette: a books-and-online-store illustration for the case study and two certification badge graphics (plain text, no third-party logos). Replace with official badge images when they arrive.
- The list of items still needed (section b below) therefore no longer appears on the site itself; it remains here as a to-do list.

Date: 4 October 2026 · Branch: `claude/accountant-portfolio-glassmorphism-rofnks`

The visual design (palette, typography, glass panels, WebGL backdrops and animations) was left as it was, per the instruction that accompanied the brief. Everything below is content, structure and functionality.

---

## (a) Changes made, by section

### 0. Rules applied throughout
- Palette unchanged: Ledger Teal `#004B49`, Sage `#B7C7A3`, Paper `#F6F5EF`, Ink `#1F2523`. Sage is used only for labels and accents on dark backgrounds, never for body text on Paper.
- One font pairing site-wide (Cormorant Garamond for headings, Inter for text). No other fonts are loaded.
- Experience is phrased as "a new firm led by an accountant with 6+ years of UK practice experience" (hero, stats, about, footer). Nothing implies the firm itself is six years old.
- All figures are in GBP. A repository-wide search finds no `$` amounts.
- Invented metrics, awards, testimonials and pricing were removed. Unknown facts are shown as `[TO BE CONFIRMED]`, `[FIRM_EMAIL]`, `[CALENDLY_LINK]` or `[COMPANY NUMBER]`.
- Accessibility: real links and buttons, labelled inputs, alt text on every image, keyboard-reachable mobile menu (opens on the burger, closes on Escape, `aria-expanded`/`aria-hidden` kept in sync). Lighthouse accessibility: 100 on the home page, case-study page and privacy page.
- One small token change for legibility: the faint text colour (used for footer small print and captions) was raised from 38% to 52% ivory so it passes WCAG AA. Same hue, same theme.

### 1. Services
- The four old cards were removed and replaced with eight numbered cards (01–08) in the brief's order, each with a one-line hook.
- Each card's "Learn more" scrolls to and opens a matching expandable detail block under "Service details". Every block has three sub-headings (What's included · Client benefit · What's outside scope) with UK-accurate interim copy wrapped in `<!-- PRINCIPAL TO REPLACE -->` … `<!-- END PRINCIPAL TO REPLACE -->` comments in `index.html`.
- Added the "Industries we work with" chip strip (Retail · Manufacturing · E-Commerce · Construction · Media · YouTube creators · Agencies · Software & Tech · Hospitality · Finance · Non-profits) and the line "Serving businesses across the United Kingdom."
- Footer "Services" column and the mobile menu now list the eight services and link to the detail blocks.

### 2. About / principal credibility
- Name corrected from "Ijaz" to **M. Umer Aijaz** in the title tag, about, contact, footer and metadata. **Please confirm the spelling** (see questions).
- The approved bio is used verbatim, as three paragraphs.
- Certifications row added with two badge slots: `assets/img/badge-qbo.png` (alt "QuickBooks Online Certified badge") and `assets/img/badge-xero.png` (alt "Xero Certified badge"). Both are palette-coloured placeholders until the real badges arrive.
- Software expertise line added: Xero · QuickBooks Online · TaxCalc.
- Portrait slot `assets/img/umer-aijaz.jpg` added inside the existing media frame (desaturated teal treatment, same vertical light-line frame as before). Placeholder image until the photo arrives.
- No qualifications, awards or memberships UI exists; the signature line reads "Principal, Quantact Partners" only.

### 3. Stats
- Replaced the four invented counters with: **6+** years of UK practice experience (principal) · **2** platform certifications (QuickBooks Online, Xero) · **24h** enquiry response time · **UK** focused, HMRC & Companies House filings.
- Heading changed to "Built on experience, not volume." with a one-line note that the firm is new and led by an experienced principal.
- The count-up animation is kept for the three numeric values; "UK" is static.

### 4. Hero dashboard and calculators
- All dashboard figures converted to £ with consistent illustrative values (Revenue £186,400 − Expenses £72,250 = Net profit £114,150) and the caption "Illustrative demo data — not client figures."
- The chart now has four switchable series (Revenue, Expenses, Profit/Loss, Cash flow) with the period label "Jan–May 2026", an animated morph between series, and a one-line definition under the axis that changes with the series. Each stat tile has an "i" tooltip button with the metric definition (keyboard-focusable).
- "Key Insights" copy is generic and carries a "Sample text" label.
- New **Calculators** section and nav item with three client-side tools, each labelled "Estimates only — UK figures", showing its formula, the effective date of any rate used, and the caveat "For guidance only. Confirm figures with your accountant before acting.":
  1. Profit margin (gross and net) — inputs: revenue, cost of sales, operating expenses.
  2. Break-even — fixed costs ÷ contribution margin %, optional unit price for break-even units.
  3. VAT — add or remove VAT at the UK standard rate. The rate is a single constant `UK_VAT_STANDARD_RATE = 0.20` in `assets/js/main.js` with an effective-date comment (4 January 2011); the displayed rate and date are read from that constant.
- Inputs validate (negative values, zero revenue, margin outside 0–100%) and show inline messages.

### 5. Case Studies and publishing system
- "Insights" renamed to **Case Studies** everywhere (nav, mobile menu, footer, section id `#case-studies`). The three placeholder articles were removed.
- One case study added: *E-commerce accounting case study: VAT treatment of book sales* (category VAT, byline Quantact Partners). It covers UK jurisdiction, tax year 2026/27, effective date 1 October 2026, review date 1 October 2027, six GOV.UK source links, assumptions and caveats, a related-service link and CTA. Featured image slot: `assets/img/case-ecommerce-vat.jpg` with alt text.
  - **Note:** LinkedIn is blocked from the environment the site was built in, so the article could not be fetched. The case study was written from scratch on the same subject using UK VAT rules. The principal should check it against his original article and adjust the facts of the scenario.
- Publishing system (option (a) from the brief, Decap CMS committing Markdown):
  - Content lives in `content/case-studies/*.md` with front matter for every field in the brief: title · slug · excerpt · body · category · tags · author · date · updated · published · featured image + alt · SEO title/description · jurisdiction · tax year · effective date · review date · reading time · official source links · assumptions · caveats · related service + CTA text.
  - `npm run build` (`scripts/build-case-studies.mjs`) generates `case-studies/<slug>/index.html`, the listing page `case-studies/index.html` with category filters, a JSON feed `case-studies/index.json` (the home page reads it to show the latest three posts; static markup remains as a fallback), the two legal pages, and `sitemap.xml`.
  - Admin UI at `/admin/` (`admin/index.html`, `admin/config.yml`) with editorial workflow (Draft → In review → Ready → Publish), live preview styled with the site CSS, and scheduling by publish date.
  - `.github/workflows/case-studies.yml` rebuilds on content changes and once a day at 06:15 UTC (so scheduled posts go live) and commits the output. `netlify.toml` lets Netlify run the same build on every commit.
- Categories available in the admin: VAT, Tax Planning, Accounts, Bookkeeping, Payroll & CIS, Software.

### 6. Enquiries, contact and CTA
- Primary CTA text is now "Discuss your accounting needs" on the nav button, hero button, about button, CTA section and sub-page navs.
- CTA copy: free 30-minute consultation call · "We reply within 24 hours" · Monday to Friday, 9am–5pm UK time · pricing agreed after the call.
- Calendly button added with placeholder `[CALENDLY_LINK]`.
- Old contact details (Gmail address, +92 phone number, "Lahore, Pakistan") removed from the CTA and footer. Contact now shows `[FIRM_EMAIL]`, business hours and response time. No phone or address fields are shown.
- Enquiry form added: Name · Business email · Company (optional) · Service interest (select of the eight services + "Not sure yet") · Message · GDPR consent checkbox linking to the Privacy Policy. No file uploads; the message placeholder asks people not to send financial documents. Honeypot field for spam.
  - Wiring: the form is marked up for Netlify Forms (`data-netlify="true"`), which captures submissions automatically if the site is hosted on Netlify. On any other host, the script falls back to opening the visitor's email app with a pre-filled message to `[FIRM_EMAIL]`. Client-side validation shows inline, screen-reader-linked errors.
- "Client Portal" nav link removed (not in the brief). See questions.

### 7. Legal and footer
- New pages: `privacy.html` (Privacy Policy) and `disclaimer.html` (Website Disclaimer, also serving as terms of use until terms are approved). Original UK-context text covering controller identity, data collected, lawful bases, retention, sharing and transfers, cookies, data-subject rights and ICO complaints, security, children, changes; and general-guidance-not-advice, calculators, accuracy, links, no client relationship, regulatory information, IP, acceptable use, governing law.
- Footer legal wording added on every page: entity name `[TO BE CONFIRMED]`, "registered in England & Wales, company number [COMPANY NUMBER]", registered office, UK GDPR / ICO note, and "Information on this site is general guidance, not advice."
- Footer links: Privacy Policy → `privacy.html`; Website Disclaimer and Terms → `disclaimer.html` until terms are approved. Copyright line is "© 2026 Quantact Partners."
- Social icons reduced to LinkedIn only (X and Instagram accounts were never supplied). The LinkedIn link is `#` until the profile URL is confirmed.

### 8. Images and misc
- Placeholder images in `assets/img/`, all in the palette: `umer-aijaz.jpg` (portrait), `badge-qbo.png`, `badge-xero.png`, `case-ecommerce-vat.jpg`. The hero keeps its generated WebGL backdrop; no stock photo is required there.
- `<title>` and meta description set to "Quantact Partners — UK accounting, tax & VAT for growing businesses. Led by M. Umer Aijaz." Open Graph tags, canonical URLs, `robots.txt` (admin disallowed) and `sitemap.xml` added. Site language set to `en-GB`.
- Sub-pages use depth-relative paths, so the site also works from a sub-folder.
- All anchors in the nav, mobile menu and footer were checked with a script against the built pages: none broken.

### 9. Checks performed
- Desktop (1440px) and mobile (390px) renders of every page; mobile has no horizontal overflow; mobile menu opens, closes on Escape and returns focus to the burger.
- Calculators exercised: £100,000 / £40,000 / £25,000 → 35.0% net margin; £50,000 fixed at 25% with £100 price → 2,000 units; £120 gross → £100.00 net.
- Empty form submission shows five inline errors and focuses the first field.
- Repository search: no `$` amounts, no "Ijaz", no old stats, no old contact details.
- Lighthouse: accessibility 100 (home, case study, privacy), SEO 100, best practices 96 (remaining points relate to the WebGL canvas in a headless browser).

---

## (b) Placeholders and assets still needed

| Placeholder / asset | Where | Needed |
|---|---|---|
| `[FIRM_EMAIL]` | CTA, footer, enquiry form fallback (`assets/js/main.js`), privacy and disclaimer pages, templates | Hosting-provided firm mailbox |
| `[CALENDLY_LINK]` | CTA "Book a call on Calendly" button | Calendly booking URL |
| `[COMPANY NUMBER]` | Footer legal line, privacy and disclaimer pages | Companies House number |
| `[TO BE CONFIRMED: legal entity name]` | Footer, legal pages | Exact registered name |
| `[TO BE CONFIRMED]` registered office, ICO registration, AML supervisor, PII details, hosting and email providers, log retention | Legal pages | From the principal |
| Site domain | `scripts/build-case-studies.mjs` (`SITE_URL`), `admin/config.yml`, `robots.txt`, canonical/OG tags in `index.html` | Final domain (currently `https://www.quantactpartners.co.uk`) |
| `assets/img/umer-aijaz.jpg` | About portrait | Professional photo (portrait orientation, ≥ 900×1200) |
| `assets/img/badge-qbo.png`, `assets/img/badge-xero.png` | About certifications | Official badge images (square PNG) |
| `assets/img/case-ecommerce-vat.jpg` | Case study featured image | Landscape image ≥ 1200×800 |
| Final service copy | `index.html` between `<!-- PRINCIPAL TO REPLACE -->` comments (8 blocks) | 3–4 sentences per service |
| LinkedIn profile URL | Footer social icon | URL |

---

## (c) Questions for the principal

1. **Name spelling.** The brief says "Aijaz"; the earlier site and the Gmail address suggested "Ijaz". The site now reads **M. Umer Aijaz** everywhere. Please confirm.
2. **Client Portal.** The link was removed. Should it return later as a "Coming soon" item, or stay out?
3. **Case study content.** The LinkedIn article could not be retrieved, so the published case study is an original piece on the same topic. Does the scenario match the real engagement closely enough, or should details (client type, channels, the correction route) be changed?
4. **Social links.** Only LinkedIn is shown. Are there other firm profiles to add?
5. **Hosting.** The content admin's email/password login depends on Netlify Identity (recommended, free tier). If you prefer another host, a small GitHub OAuth relay is needed instead (see (d)).
6. **Legal review.** The privacy policy and disclaimer are drafts. Who will review them, and is there a professional body or AML supervisor to name?

---

## (d) How the case-study publishing system works

**What it is.** Case studies are Markdown files in `content/case-studies/`. A small build script turns them into web pages. The admin screen at `/admin/` is Decap CMS, a hosted editor that writes those Markdown files into the GitHub repository for you; no developer is involved in day-to-day publishing.

**Logging in.**
1. On Netlify (recommended): the site owner enables *Identity* and *Git Gateway* in the Netlify dashboard, sets registration to *Invite only*, and invites the principal's email address. He accepts the invitation, sets a password, and from then on goes to `https://<your-domain>/admin/` and signs in with that email and password.
2. On another host: change `backend` in `admin/config.yml` to the `github` backend and point `base_url` at an OAuth relay (a few lines of serverless code, documented by Decap). Login is then "Sign in with GitHub" using an account that has write access to the repository.

**Writing and publishing.**
- *New case study* → fill in the fields (title, slug, excerpt, category, featured image and alt text, SEO fields, jurisdiction, tax year, effective and review dates, sources, assumptions, caveats, related service) and the article body in the Markdown editor. The right-hand pane previews the article in the site's styling.
- *Draft / preview:* with editorial workflow on, a saved entry starts as **Draft** and is not on the site. Move it to **In review** and **Ready** as you like; nothing is public until **Publish**.
- *Publish:* click **Publish** (and make sure the *Published* toggle is on). The commit triggers a rebuild; the page appears at `/case-studies/<slug>/`, on the listing page and on the home page within a few minutes.
- *Schedule:* set the *Publish date* to a future date and publish. The daily build (06:15 UTC) makes it live on that date.
- *Edit:* open the entry, change it, publish again. Update the *Updated date* so the page shows when it was revised.
- *Unpublish:* turn the *Published* toggle off and publish, or delete the entry. The page is removed on the next build.
- *Images:* upload through the image field; files go to `assets/img/case-studies/`.

**Rebuilds.** Netlify runs `npm run build` on every commit (see `netlify.toml`). For any other host, the GitHub Action in `.github/workflows/case-studies.yml` runs the same build on content changes and daily, and commits the generated pages. Locally: `npm install` once, then `npm run build`.

**Where things are.**
```
content/case-studies/      Markdown posts (the source of truth)
templates/                 page shells: case study, listing, legal pages, footer
scripts/build-case-studies.mjs   the build
case-studies/              generated pages and feed (do not edit by hand)
admin/                     Decap CMS admin UI and field configuration
privacy.html, disclaimer.html    generated from templates/*-body.html
```
