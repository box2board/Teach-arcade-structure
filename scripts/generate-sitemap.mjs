// scripts/generate-sitemap.mjs
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const BASE_URL = 'https://teacharcade.com';

// folders to scan for .html files
const ROOT = resolve('.');                  // repo root
const INCLUDE_DIRS = [
  '.',                 // root
  'subjects',
  'subjects/social-studies',
  'subjects/social-studies/us-history',
  'tools'
];

// skip these names/folders
const EXCLUDE = new Set([
  'node_modules','assets','.vercel','.git','.github',
  '404.html','404','_private','drafts'
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);

    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (st.isFile() && name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function asUrlPath(fileAbs) {
  // normalize to repo-relative path
  let p = fileAbs.replace(ROOT, '').replace(/\\/g,'/'); // windows safe
  if (p.startsWith('/')) p = p.slice(1);

  // index.html => directory URL
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -'/index.html'.length) + '/';
  }
  return p;
}

function priorityFor(path) {
  if (path === '') return 1.0;                      // homepage
  if (path === 'subjects/' || path === 'tools/') return 0.9;
  if (path.startsWith('subjects/social-studies/')) return 0.8;
  return 0.7;
}

function changefreqFor(path) {
  if (path === '' || path.endsWith('/')) return 'weekly';
  return 'monthly';
}

function lastmodFor(fileAbs) {
  const t = statSync(fileAbs).mtime;
  return t.toISOString().slice(0,10); // YYYY-MM-DD
}

// collect files
const files = [];
for (const d of INCLUDE_DIRS) {
  const dir = resolve(d);
  files.push(...walk(dir));
}

// Always include homepage even if no index in root (but you do)
if (!files.find(f => f.endsWith('/index.html'))) {
  files.push(resolve('index.html'));
}

// Build URL entries
const urls = files.map(abs => {
  const p = asUrlPath(abs);             // e.g. 'tools/' or 'about.html'
  const loc = p === '' ? BASE_URL + '/' : `${BASE_URL}/${p}`;
  return {
    loc,
    lastmod: lastmodFor(abs),
    changefreq: changefreqFor(p),
    priority: priorityFor(p)
  };
});

// XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync('sitemap.xml', xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
