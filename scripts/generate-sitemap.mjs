// scripts/generate-sitemap.mjs
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const SITE_URL = "https://teacharcade.com";

// Directories we should NOT crawl
const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".vercel", ".github", ".next",
  "assets", "scripts" // static assets & build scripts
]);

// Files we should NOT include
const IGNORE_FILES = new Set([
  "sitemap.xml", "robots.txt"
]);

// --- HELPERS ---
const toISODate = (d) => new Date(d).toISOString().slice(0, 10);

function normalizePath(p) {
  // make it a web path with a leading slash
  let rel = p.replace(/\\/g, "/");
  if (!rel.startsWith("/")) rel = "/" + rel;
  // fold index.html to directory root
  rel = rel.replace(/\/index\.html$/i, "/");
  // collapse double slashes
  rel = rel.replace(/\/{2,}/g, "/");
  return rel;
}

function metaFor(webPath) {
  // Set sensible priorities/frequencies by section
  if (webPath === "/")               return { changefreq: "weekly",  priority: 1.0 };
  if (webPath.startsWith("/subjects")) return { changefreq: "weekly",  priority: 0.9 };
  if (webPath.startsWith("/tools"))    return { changefreq: "monthly", priority: 0.8 };
  if (webPath === "/about.html" || webPath === "/privacy.html" || webPath === "/terms.html")
                                      return { changefreq: "yearly",  priority: 0.6 };
  return { changefreq: "monthly", priority: 0.7 };
}

async function walk(dirAbs, rootAbs, out = []) {
  const dirents = await fs.readdir(dirAbs, { withFileTypes: true });
  for (const d of dirents) {
    if (d.isDirectory()) {
      if (IGNORE_DIRS.has(d.name)) continue;
      await walk(path.join(dirAbs, d.name), rootAbs, out);
    } else {
      const name = d.name;
      if (IGNORE_FILES.has(name)) continue;
      if (!name.endsWith(".html")) continue;

      const abs = path.join(dirAbs, name);
      const rel = path.relative(rootAbs, abs);
      out.push(abs);
    }
  }
  return out;
}

async function main() {
  const root = path.resolve(__dirname, ".."); // repo root
  const htmlFiles = await walk(root, root);

  // Build entries and dedupe
  const seen = new Set();
  const entries = [];

  for (const abs of htmlFiles) {
    const stat = await fs.stat(abs);
    const webPath = normalizePath(path.relative(root, abs));
    const loc = SITE_URL + webPath;

    if (seen.has(loc)) continue;
    seen.add(loc);

    const { changefreq, priority } = metaFor(webPath);

    entries.push({
      loc,
      lastmod: toISODate(stat.mtimeMs || stat.mtime),
      changefreq,
      priority
    });
  }

  // Sort: homepage first, then alphabetical
  entries.sort((a, b) => {
    if (a.loc === SITE_URL + "/") return -1;
    if (b.loc === SITE_URL + "/") return 1;
    return a.loc.localeCompare(b.loc);
  });

  // XML output
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(u => [
      `  <url>`,
      `    <loc>${u.loc}</loc>`,
      `    <lastmod>${u.lastmod}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority.toFixed(1)}</priority>`,
      `  </url>`
    ].join("\n")),
    `</urlset>\n`
  ].join("\n");

  await fs.writeFile(path.join(root, "sitemap.xml"), xml, "utf8");
  console.log(`Generated sitemap.xml with ${entries.length} unique URLs`);
}

main().catch(err => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
