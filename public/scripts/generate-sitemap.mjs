// scripts/generate-sitemap.mjs
import { promises as fs } from "fs";
import path from "path";

const SITE = "https://teacharcade.com";
const PUBLIC_DIR = path.join(process.cwd(), "public");

const EXCLUDE = new Set([
  "/assets/",
  "/api/",            // just in case
  "/404.html"
]);

function shouldInclude(relPath) {
  if (!relPath.endsWith(".html")) return false;
  for (const x of EXCLUDE) if (relPath.startsWith(x)) return false;
  return true;
}

function priorityFor(urlPath) {
  // simple depth-based priorities
  const depth = urlPath.split("/").filter(Boolean).length;
  if (urlPath === "/") return 1.0;
  if (depth <= 2) return 0.9;
  if (depth === 3) return 0.85;
  return 0.8;
}

async function walk(dir, base = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.join(base, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) {
      out.push(...await walk(full, rel));
    } else {
      const relPath = "/" + rel;
      if (shouldInclude(relPath)) out.push(relPath);
    }
  }
  return out;
}

function toUrl(loc) {
  // strip /index.html to canonicalize
  const normalized = loc.endsWith("/index.html")
    ? loc.replace(/\/index\.html$/, "/")
    : loc;
  return SITE + normalized;
}

function lastmodISO(stats) {
  return new Date(stats.mtime).toISOString();
}

async function main() {
  const pages = await walk(PUBLIC_DIR, "");
  const urls = [];
  for (const p of pages) {
    const full = path.join(PUBLIC_DIR, p.slice(1));
    const stat = await fs.stat(full);
    urls.push({
      loc: toUrl(p),
      lastmod: lastmodISO(stat),
      priority: priorityFor(p)
    });
  }

  // Always include the homepage
  if (!urls.find(u => u.loc === SITE + "/")) {
    urls.unshift({ loc: SITE + "/", lastmod: new Date().toISOString(), priority: 1.0 });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority.toFixed(2)}</priority>
  </url>`).join("\n") +
    `\n</urlset>\n`;

  await fs.writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), xml, "utf8");
  console.log(`Generated sitemap.xml with ${urls.length} URLs at ${path.join(PUBLIC_DIR, "sitemap.xml")}`);
}

main().catch(err => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
