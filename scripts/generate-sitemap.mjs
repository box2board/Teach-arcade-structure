// scripts/generate-sitemap.mjs
import fs from 'fs';
import path from 'path';
const SITE = 'https://teacharcade.com';

const ROOT = path.join(process.cwd(), 'public'); // crawl the built site
const OUT  = path.join(ROOT, 'sitemap.xml');

// ignore these files/folders while crawling
const IGNORE_DIRS = new Set(['assets']);
const IGNORE_FILES = new Set(['404.html']);

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) yield* walk(path.join(dir, e.name));
    } else {
      if (!IGNORE_FILES.has(e.name)) yield path.join(dir, e.name);
    }
  }
}

// map a file path under /public to a URL path
function fileToUrl(fileAbs) {
  let rel = path.relative(ROOT, fileAbs).replace(/\\/g, '/');
  if (rel.endsWith('index.html')) {
    rel = rel.slice(0, -'index.html'.length);
  } else if (rel.endsWith('.html')) {
    // keep .html pages (your site uses them)
  } else if (!/\.(html|htm)$/i.test(rel)) {
    return null; // skip non-pages
  }
  return (rel.startsWith('/') ? '' : '/') + rel;
}

// simple priority/frequency heuristics
function metaFor(urlPath) {
  if (urlPath === '/') return { changefreq: 'weekly', priority: '1.0' };
  if (urlPath.startsWith('/tools')) return { changefreq: 'monthly', priority: '0.8' };
  return { changefreq: 'weekly', priority: '0.9' };
}

const seen = new Set();
const urls = [];

for (const file of walk(ROOT)) {
  const urlPath = fileToUrl(file);
  if (!urlPath) continue;
  const key = urlPath === '' ? '/' : urlPath;
  if (seen.has(key)) continue;
  seen.add(key);

  const stat = fs.statSync(file);
  const lastmod = stat.mtime.toISOString().slice(0, 10);

  const { changefreq, priority } = metaFor(key);
  urls.push({ loc: SITE + key, lastmod, changefreq, priority });
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => 
    `  <url>\n` +
    `    <loc>${u.loc}</loc>\n` +
    `    <lastmod>${u.lastmod}</lastmod>\n` +
    `    <changefreq>${u.changefreq}</changefreq>\n` +
    `    <priority>${u.priority}</priority>\n` +
    `  </url>`
  ).join('\n') +
  `\n</urlset>\n`;

fs.writeFileSync(OUT, xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs at ${OUT}`);
