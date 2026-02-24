import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const REPORTS_DIR = path.join(ROOT, 'reports');

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
  .replace(/<header[\s\S]*?<\/header>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const get = (re, html) => (html.match(re)?.[1] || '').trim();
const isRedirect = (html) => /http-equiv=["']refresh["']/i.test(html) || /window\.location(?:\.replace|\.href|\s*=)/i.test(html);
const noindex = (html) => /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
const placeholder = (html) => /coming soon|lorem ipsum|\bTBD\b|placeholder/i.test(html);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

function toSitePath(abs) {
  const rel = '/' + path.relative(PUBLIC_DIR, abs).replace(/\\/g, '/');
  return rel.endsWith('/index.html') ? rel.replace(/index\.html$/, '') : rel;
}

async function main() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const files = await walk(PUBLIC_DIR);
  const pages = [];

  for (const f of files) {
    const html = await fs.readFile(f, 'utf8');
    const body = strip(html);
    pages.push({
      file: path.relative(ROOT, f).replace(/\\/g, '/'),
      url: toSitePath(f),
      title: get(/<title>([^<]*)<\/title>/i, html),
      h1: get(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html).replace(/<[^>]+>/g, '').trim(),
      metaDescription: get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html),
      words: body.split(/\s+/).filter(Boolean).length,
      redirect: isRedirect(html),
      noindex: noindex(html),
      placeholder: placeholder(html)
    });
  }

  const dupTitles = new Map();
  const dupH1 = new Map();
  for (const p of pages) {
    if (p.title) dupTitles.set(p.title, [...(dupTitles.get(p.title) || []), p.url]);
    if (p.h1) dupH1.set(p.h1, [...(dupH1.get(p.h1) || []), p.url]);
  }

  const titleDups = [...dupTitles.entries()].filter(([, u]) => u.length > 1);
  const h1Dups = [...dupH1.entries()].filter(([, u]) => u.length > 1);
  const critical = pages.filter((p) => !p.title || !p.h1 || !p.metaDescription || p.redirect || p.placeholder);

  const inventory = ['# Page Inventory', '', '| URL | File | Title | H1 | Word count | Flags |', '|---|---|---|---|---:|---|'];
  pages.sort((a, b) => a.url.localeCompare(b.url)).forEach((p) => {
    const flags = [p.noindex && 'noindex', p.redirect && 'redirect', p.placeholder && 'placeholder', p.words < 300 && 'thin'].filter(Boolean).join(', ');
    inventory.push(`| ${p.url} | ${p.file} | ${p.title || '—'} | ${p.h1 || '—'} | ${p.words} | ${flags || '—'} |`);
  });

  const gate = [
    '# AdSense Content Gate Report', '',
    `Total pages scanned: ${pages.length}`,
    `Pages under 300 words: ${pages.filter((p) => p.words < 300).length}`,
    `Redirect wrappers: ${pages.filter((p) => p.redirect).length}`,
    `Placeholder pages: ${pages.filter((p) => p.placeholder).length}`,
    `Missing meta description: ${pages.filter((p) => !p.metaDescription).length}`,
    '', '## Duplicate titles',
    ...(titleDups.length ? titleDups.map(([t, u]) => `- ${t}: ${u.join(', ')}`) : ['- none']),
    '', '## Duplicate H1s',
    ...(h1Dups.length ? h1Dups.map(([h, u]) => `- ${h}: ${u.join(', ')}`) : ['- none']),
    '', '## Critical pages to review',
    ...critical.slice(0, 120).map((p) => `- ${p.url} (${p.file})`),
    ''
  ].join('\n');

  const sitemapXml = await fs.readFile(path.join(PUBLIC_DIR, 'sitemap.xml'), 'utf8').catch(() => '');
  const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://teacharcade.com', ''));
  const noindexInSitemap = pages.filter((p) => p.noindex && sitemapLocs.includes(p.url));
  const noindexReport = ['# Noindex/Sitemap Mismatch', '', ...noindexInSitemap.map((p) => `- ${p.url} (${p.file})`), ''].join('\n');

  await fs.writeFile(path.join(REPORTS_DIR, 'page-inventory.md'), inventory.join('\n'), 'utf8');
  await fs.writeFile(path.join(REPORTS_DIR, 'content-gate-report.md'), gate, 'utf8');
  await fs.writeFile(path.join(REPORTS_DIR, 'noindex-mismatch.md'), noindexReport, 'utf8');

  if (critical.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
