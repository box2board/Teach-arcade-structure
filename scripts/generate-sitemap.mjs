// scripts/generate-sitemap.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE = 'https://teacharcade.com';

const EXCLUDE = new Set([
  '/404.html'
]);

function toUrl(fileAbs) {
  const rel = '/' + path.relative(PUBLIC_DIR, fileAbs).replace(/\\/g, '/');
  if (!rel.endsWith('.html')) return null;
  if (EXCLUDE.has(rel)) return null;
  // map /index.html -> /
  return rel.endsWith('/index.html')
    ? SITE + rel.slice(0, -'/index.html'.length) + '/'
    : SITE + rel.replace(/\.html$/, '');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(p));
    else files.push(p);
  }
  return files;
}

function fmtDate(d) {
  return new Date(d).toISOString();
}

async function main() {
  const all = await walk(PUBLIC_DIR);
  const pages = [];
  for (const f of all) {
    const url = toUrl(f);
    if (!url) continue;
    const contents = await fs.readFile(f, 'utf8');
    if (/name=\"robots\"\\s+content=\"noindex/i.test(contents)) {
      continue;
    }
    const stat = await fs.stat(f);
    pages.push({ url, lastmod: fmtDate(stat.mtime) });
  }

  // homepage first, then alphabetical
  pages.sort((a, b) => (a.url === SITE + '/' ? -1 : b.url === SITE + '/' ? 1 : a.url.localeCompare(b.url)));

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.url === SITE + '/' ? '1.0' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>
`;

  const outPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  await fs.writeFile(outPath, xml.trim() + '\n', 'utf8');
  console.log(`Generated sitemap.xml with ${pages.length} URLs at ${outPath}`);
}

main().catch(err => {
  console.error('sitemap generation failed:', err);
  process.exit(1);
});
