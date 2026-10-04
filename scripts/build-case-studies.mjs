#!/usr/bin/env node
/**
 * Builds the Case Studies section from Markdown files in content/case-studies/.
 *
 *   npm run build
 *
 * Outputs:
 *   case-studies/<slug>/index.html   one page per published post
 *   case-studies/index.html          listing page with category filters
 *   case-studies/index.json          feed used by the homepage section
 *   sitemap.xml                      regenerated with every published URL
 *
 * A post is published when `published: true` and its `date` is not in the
 * future. Scheduling therefore works by setting a future date; the daily
 * build in .github/workflows/case-studies.yml publishes it when the day comes.
 */

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content', 'case-studies');
const OUT = path.join(ROOT, 'case-studies');
const TEMPLATES = path.join(ROOT, 'templates');
const SITE_URL = (process.env.SITE_URL || 'https://www.quantactpartners.co.uk').replace(/\/$/, ''); // [TO BE CONFIRMED] final domain

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const humanDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('Missing front matter');
  return { data: yaml.load(m[1]) || {}, body: m[2] };
}

function render(template, vars) {
  // {{root}} is substituted last so it also applies inside the footer partial
  const out = template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : (k === 'root' ? '{{root}}' : '')));
  return out.replace(/\{\{root\}\}/g, vars.root || '');
}
const rel = (root, p) => (p && p.startsWith('/') ? root + p.slice(1) : p);

function card(p, index = 0, level = 'h3', root = '../') {
  return `          <article class="post glass reveal" data-delay="${(index % 3) * 120}" data-category="${esc(slugify(p.category))}">
            <a href="${root}case-studies/${esc(p.slug)}/" class="post__wrap">
              <div class="post__media"><img src="${esc(rel(root, p.image))}" alt="${esc(p.image_alt)}" width="1200" height="800" loading="lazy"><span class="tag">${esc(p.category)}</span></div>
              <div class="post__body">
                <${level}>${esc(p.title)}</${level}>
                <p class="post__excerpt">${esc(p.excerpt)}</p>
                <div class="post__meta"><span>${esc(p.author)}</span><span><time datetime="${isoDate(p.date)}">${humanDate(p.date)}</time></span><span>${p.reading_time || 5} min read</span><i aria-hidden="true">→</i></div>
              </div>
            </a>
          </article>`;
}

async function main() {
  const footer = await readFile(path.join(TEMPLATES, 'footer.html'), 'utf8');
  const postTpl = await readFile(path.join(TEMPLATES, 'case-study.html'), 'utf8');
  const indexTpl = await readFile(path.join(TEMPLATES, 'case-studies-index.html'), 'utf8');

  const files = (await readdir(CONTENT)).filter((f) => f.endsWith('.md'));
  const today = new Date().toISOString().slice(0, 10);
  const posts = [];

  for (const f of files) {
    const raw = await readFile(path.join(CONTENT, f), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const date = isoDate(data.date || today);
    const published = data.published === true && date <= today;
    posts.push({ ...data, slug, date, updated: isoDate(data.updated || data.date || today), body, published, file: f });
  }

  const live = posts.filter((p) => p.published).sort((a, b) => (a.date < b.date ? 1 : -1));
  const skipped = posts.filter((p) => !p.published);

  // reset output folder (keeps nothing stale)
  if (existsSync(OUT)) await rm(OUT, { recursive: true });
  await mkdir(OUT, { recursive: true });

  for (const p of live) {
    const dir = path.join(OUT, p.slug);
    await mkdir(dir, { recursive: true });
    const sources = (p.sources || []).map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('');
    const assumptions = (p.assumptions || []).map((s) => `<li>${esc(s)}</li>`).join('');
    const caveats = (p.caveats || []).map((s) => `<li>${esc(s)}</li>`).join('');
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.title,
      description: p.seo_description || p.excerpt,
      image: SITE_URL + p.image,
      datePublished: p.date,
      dateModified: p.updated,
      author: { '@type': 'Organization', name: p.author || 'Quantact Partners' },
      publisher: { '@type': 'Organization', name: 'Quantact Partners', logo: { '@type': 'ImageObject', url: SITE_URL + '/assets/img/logo.png' } },
      mainEntityOfPage: `${SITE_URL}/case-studies/${p.slug}/`,
      articleSection: p.category,
      inLanguage: 'en-GB',
    });
    const html = render(postTpl, {
      root: '../../',
      site_url: SITE_URL,
      slug: p.slug,
      title: esc(p.title),
      excerpt: esc(p.excerpt),
      seo_title: esc(p.seo_title || `${p.title} | Quantact Partners`),
      seo_description: esc(p.seo_description || p.excerpt),
      category: esc(p.category),
      author: esc(p.author || 'Quantact Partners'),
      image: esc(rel('../../', p.image)),
      image_alt: esc(p.image_alt),
      date_iso: p.date,
      date_human: humanDate(p.date),
      updated_iso: p.updated,
      updated_human: humanDate(p.updated),
      jurisdiction: esc(p.jurisdiction || 'United Kingdom'),
      tax_year: esc(p.tax_year || ''),
      reading_time: p.reading_time || 5,
      effective_date_human: p.effective_date ? humanDate(p.effective_date) : humanDate(p.date),
      review_date_human: p.review_date ? humanDate(p.review_date) : '[TO BE CONFIRMED]',
      related_service: esc(p.related_service || 'vat-bookkeeping'),
      related_service_title: esc(p.related_service_title || 'Our services'),
      cta_text: esc(p.cta_text || 'Discuss your accounting needs'),
      sources_html: sources || '<li>None listed.</li>',
      assumptions_html: assumptions || '<li>None listed.</li>',
      caveats_html: caveats || '<li>None listed.</li>',
      body: marked.parse(p.body, { mangle: false, headerIds: false }),
      json_ld: jsonLd,
      footer,
    });
    await writeFile(path.join(dir, 'index.html'), html);
  }

  const categories = [...new Set(live.map((p) => p.category))].sort();
  const filterButtons = categories.map((c) => `<button type="button" class="chip" data-filter="${esc(slugify(c))}">${esc(c)}</button>`).join('\n          ');
  await writeFile(path.join(OUT, 'index.html'), render(indexTpl, {
    root: '../',
    site_url: SITE_URL,
    filter_buttons: filterButtons,
    cards: live.map((p, i) => card(p, i, 'h2', '../')).join('\n'),
    footer,
  }));

  await writeFile(path.join(OUT, 'index.json'), JSON.stringify({
    generated: new Date().toISOString(),
    posts: live.map((p) => ({
      title: p.title, slug: p.slug, url: `/case-studies/${p.slug}/`, excerpt: p.excerpt, category: p.category,
      author: p.author || 'Quantact Partners', date: p.date, updated: p.updated, image: p.image, image_alt: p.image_alt,
      reading_time: p.reading_time || 5,
    })),
  }, null, 2));

  // Legal pages share the page shell and footer
  const pageTpl = await readFile(path.join(TEMPLATES, 'page.html'), 'utf8');
  const legal = [
    { file: 'privacy.html', body: 'privacy-body.html', title: 'Privacy Policy | Quantact Partners', description: 'How Quantact Partners collects, uses and protects personal data from visitors and enquiries, under UK GDPR.' },
    { file: 'disclaimer.html', body: 'disclaimer-body.html', title: 'Website Disclaimer | Quantact Partners', description: 'Information on this website is general guidance for UK readers, not advice. Read the full disclaimer and terms of use.' },
  ];
  for (const pg of legal) {
    const body = await readFile(path.join(TEMPLATES, pg.body), 'utf8');
    await writeFile(path.join(ROOT, pg.file), render(pageTpl, { root: '', site_url: SITE_URL, path: pg.file, title: pg.title, description: pg.description, body, footer }));
  }

  const urls = [
    `${SITE_URL}/`, `${SITE_URL}/case-studies/`, `${SITE_URL}/privacy.html`, `${SITE_URL}/disclaimer.html`,
    ...live.map((p) => `${SITE_URL}/case-studies/${p.slug}/`),
  ];
  await writeFile(path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');

  console.log(`Built ${live.length} case stud${live.length === 1 ? 'y' : 'ies'} and ${legal.length} legal pages.`);
  skipped.forEach((p) => console.log(`  skipped ${p.file} (${p.published === false ? 'draft' : 'scheduled for ' + p.date})`));
}

main().catch((e) => { console.error(e); process.exit(1); });
