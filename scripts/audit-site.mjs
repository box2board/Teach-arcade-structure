import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve('public');
const site = 'https://www.teacharcade.com';
// Older page canonicals still use the bare domain, which redirects to this host.
const canonicalForComparison = value => value.replace(/^https:\/\/teacharcade\.com(?=\/)/, site);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }))).flat();
}

const attr = (html, tag, name, value, wanted) => {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) || [];
  const match = tags.find(candidate => new RegExp(`\\b${name}=["']${value}["']`, 'i').test(candidate));
  return match?.match(new RegExp(`\\b${wanted}=["']([^"']*)["']`, 'i'))?.[1] || '';
};
const titleOf = html => html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/<[^>]+>/g, '').trim() || '';
const routeFor = file => {
  const relative = `/${path.relative(root, file).split(path.sep).join('/')}`;
  return relative.endsWith('/index.html') ? relative.slice(0, -'index.html'.length) : relative;
};
const resolves = (href, file, allFiles) => {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(href) || href.includes('${')) return true;
  const clean = decodeURI(href.split(/[?#]/)[0]);
  const target = href.startsWith('/') ? path.join(root, clean) : path.resolve(path.dirname(file), clean);
  return allFiles.has(target) || allFiles.has(path.join(target, 'index.html')) || (!path.extname(target) && allFiles.has(`${target}.html`));
};

const files = await walk(root);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const allFiles = new Set(files);
const issues = [];
const unique = { title: new Map(), description: new Map(), canonical: new Map() };

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const relative = path.relative(process.cwd(), file);
  const robots = attr(html, 'meta', 'name', 'robots', 'content');
  const indexable = !/noindex/i.test(robots);
  const values = {
    title: titleOf(html),
    description: attr(html, 'meta', 'name', 'description', 'content'),
    canonical: attr(html, 'link', 'rel', 'canonical', 'href'),
  };
  if (indexable) {
    for (const [field, value] of Object.entries(values)) {
      if (!value) issues.push({ severity: 'HIGH', file: relative, issue: `Missing ${field}` });
      else unique[field].set(value, [...(unique[field].get(value) || []), relative]);
    }
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) issues.push({ severity: 'HIGH', file: relative, issue: `Expected one H1; found ${h1Count}` });
    if (values.canonical && canonicalForComparison(values.canonical) !== `${site}${routeFor(file)}`) {
      issues.push({ severity: 'CRITICAL', file: relative, issue: `Canonical does not match route (${values.canonical})` });
    }
  }
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); } catch { issues.push({ severity: 'HIGH', file: relative, issue: 'Malformed JSON-LD' }); }
  }
  const baseHref = html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  for (const link of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const href = baseHref && !/^(?:[a-z]+:|#|\/)/i.test(link[1]) ? `${baseHref}${link[1]}` : link[1];
    if (!resolves(href, file, allFiles)) issues.push({ severity: 'CRITICAL', file: relative, issue: `Broken link: ${link[1]}` });
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
const robotsPath = path.join(root, 'robots.txt');
const sitemap = await fs.readFile(sitemapPath, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
const sitemapSet = new Set(sitemapUrls);
if (!sitemapUrls.length) issues.push({ severity: 'CRITICAL', file: 'public/sitemap.xml', issue: 'Sitemap has no URLs' });
if (sitemapSet.size !== sitemapUrls.length) issues.push({ severity: 'HIGH', file: 'public/sitemap.xml', issue: 'Sitemap contains duplicate URLs' });

const expectedSitemapUrls = new Set();
for (const file of htmlFiles) {
  const relative = `/${path.relative(root, file).split(path.sep).join('/')}`;
  if (relative === '/404.html') continue;
  const html = await fs.readFile(file, 'utf8');
  if (/\bnoindex\b/i.test(attr(html, 'meta', 'name', 'robots', 'content'))) continue;
  expectedSitemapUrls.add(`${site}${routeFor(file)}`);
}
for (const url of expectedSitemapUrls) {
  if (!sitemapSet.has(url)) issues.push({ severity: 'HIGH', file: 'public/sitemap.xml', issue: `Missing indexable page: ${url}` });
}
for (const url of sitemapSet) {
  if (!expectedSitemapUrls.has(url)) issues.push({ severity: 'HIGH', file: 'public/sitemap.xml', issue: `Unexpected or non-indexable URL: ${url}` });
}
const robots = await fs.readFile(robotsPath, 'utf8');
if (!robots.split(/\r?\n/).some(line => line.trim() === `Sitemap: ${site}/sitemap.xml`)) {
  issues.push({ severity: 'HIGH', file: 'public/robots.txt', issue: `Sitemap directive must point to ${site}/sitemap.xml` });
}

for (const [field, values] of Object.entries(unique)) {
  for (const [value, pages] of values) {
    if (pages.length > 1) issues.push({ severity: 'HIGH', file: pages.join(', '), issue: `Duplicate ${field}: ${value}` });
  }
}

issues.sort((a, b) => ['CRITICAL', 'HIGH'].indexOf(a.severity) - ['CRITICAL', 'HIGH'].indexOf(b.severity));
if (issues.length) {
  console.error(issues.map(item => `${item.severity}\t${item.file}\t${item.issue}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Site audit passed: ${htmlFiles.length} HTML pages; internal links, indexable metadata, canonicals, H1s, uniqueness, JSON-LD, sitemap coverage, and robots sitemap host checked.`);
}
