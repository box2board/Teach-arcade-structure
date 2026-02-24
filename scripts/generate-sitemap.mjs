import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const SITE = 'https://teacharcade.com';
const MIN_WORDS = 300;

const EXCLUDED_PATHS = new Set(['/404.html', '/submit.html']);

const stripHtml = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
  .replace(/<header[\s\S]*?<\/header>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && full.endsWith('.html')) files.push(full);
  }
  return files;
}

function relToUrlPath(fileAbs) {
  const rel = '/' + path.relative(PUBLIC_DIR, fileAbs).replace(/\\/g, '/');
  if (rel.endsWith('/index.html')) return rel.slice(0, -'/index.html'.length) + '/';
  return rel.replace(/\.html$/, '');
}

function detectRedirectWrapper(html) {
  return /http-equiv=["']refresh["']/i.test(html) || /window\.location(?:\.replace|\.href|\s*=)/i.test(html);
}

function hasNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

function placeholder(html) {
  return /coming soon|lorem ipsum|\bTBD\b|placeholder/i.test(html);
}

function lastMod(file) {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim();
    if (iso) return iso;
  } catch {}
  return null;
}

async function main() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const files = await walk(PUBLIC_DIR);
  const included = [];
  const excluded = [];

  for (const file of files) {
    const rel = '/' + path.relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    const html = await fs.readFile(file, 'utf8');
    const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
    const reasons = [];

    if (EXCLUDED_PATHS.has(rel)) reasons.push('explicitly excluded alias');
    if (hasNoindex(html)) reasons.push('meta robots noindex');
    if (detectRedirectWrapper(html)) reasons.push('redirect wrapper');
    if (placeholder(html)) reasons.push('placeholder language');
    if (words < MIN_WORDS) reasons.push(`low content (${words} words < ${MIN_WORDS})`);

    if (reasons.length) {
      excluded.push({ rel, reasons: reasons.join('; '), words });
      continue;
    }

    const stat = await fs.stat(file);
    included.push({
      rel,
      loc: `${SITE}${relToUrlPath(file)}`,
      lastmod: lastMod(file) || stat.mtime.toISOString(),
      words
    });
  }

  included.sort((a, b) => a.loc.localeCompare(b.loc));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${included.map((p) => `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p.loc === SITE + '/' ? '1.0' : '0.6'}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;

  await fs.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf8');

  const audit = [`# Sitemap Audit`, '', `Included URLs: ${included.length}`, `Excluded URLs: ${excluded.length}`, '', '## Included', ...included.map((p) => `- ${p.loc} (${p.words} words)`), '', '## Excluded', ...excluded.map((p) => `- ${p.rel} — ${p.reasons}`), ''].join('\n');
  await fs.writeFile(path.join(REPORTS_DIR, 'sitemap-audit.md'), audit, 'utf8');

  console.log(`Generated sitemap.xml (${included.length} URLs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
