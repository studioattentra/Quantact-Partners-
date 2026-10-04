# Quantact Partners — M. Umer Aijaz

Single-page portfolio site for an accounting and advisory practice.
Glassmorphism interface over live WebGL backdrops built with Three.js.

## Run locally

```sh
npm install
npm run build     # generates case-study pages, legal pages, sitemap and the deployable dist/ folder
npm run serve     # serves dist/ with the production security headers at http://localhost:8000
npm run audit     # dependency audit + exposed-file and secret scan of dist/
```

Hosting: see `HOSTINGER.md` (GitHub Actions builds `dist/` into the `hostinger` branch; hPanel → Git pulls it). The scenes are loaded as an ES module, so the page must be served over HTTP rather than opened from the file system. Security notes and host settings: `SECURITY.md`.

## Structure

```
index.html            page markup
assets/css/style.css  design system, layout, animations
assets/js/scene.js    Three.js shader scenes (hero, water, silk, office, smoke, stills)
assets/js/main.js     loader, navigation, reveals, counters, chart, tilt, cursor, calculators, form
assets/fonts/         self-hosted web fonts (OFL)
assets/img/           brand mark, portrait, badges, case-study images
assets/vendor/        Three.js (MIT), bundled from npm by `npm run vendor:three`
content/case-studies/ Markdown case studies (edited through /admin/)
templates/, scripts/  page shells and the build
api/, admin/oauth/    PHP contact handler and GitHub login relay (run on Hostinger)
deploy/               example private configuration for the server
dist/                 generated deployable site (not committed)
```

## Palette

| Role     | Hex       |
|----------|-----------|
| Teal     | `#004B49` |
| Sage     | `#B7C7A3` |
| Ivory    | `#F6F5EF` |
| Charcoal | `#1F2523` |

## Contact details

The enquiry form's email fallback address is the `FIRM_EMAIL` constant in `assets/js/main.js`. Case studies are managed at `/admin/`; see `CHANGES.md`.
