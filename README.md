# Quantact Partners — M. Umer Aijaz

Single-page portfolio site for an accounting and advisory practice.
Glassmorphism interface over live WebGL backdrops built with Three.js.

## Run locally

Any static server works. For example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

The scenes are loaded as an ES module, so the page must be served over HTTP rather than opened from the file system.

## Structure

```
index.html            page markup
assets/css/style.css  design system, layout, animations
assets/js/scene.js    Three.js shader scenes (hero, water, silk, office, smoke, stills)
assets/js/main.js     loader, navigation, reveals, counters, chart, tilt, cursor
assets/img/logo.png   brand mark
assets/vendor/        Three.js (MIT)
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
