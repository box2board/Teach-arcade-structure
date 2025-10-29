// scripts/generate-sitemap.mjs
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://teacharcade.com";
const IGNORE_DIRS = ["node_modules", ".git", ".vercel", "assets", "scripts"];
const IGNORE_FILES = ["robots.txt", "sitemap.xml"];

function normalizePath(p) {
  let rel = p.replace(/\\/g, "/");
  if (!rel.startsWith("/")) rel = "/" + rel;
  rel = rel.replace(/\/index\.html$/i, "/");
  rel = rel.replace(/\/{2,}/g, "/");
  return rel;
}

function metaFor(p) {
  if (p === "/") return { changefreq: "weekly", priority: 1.0 };
  if (p.startsWith("/subjects")) return { changefreq: "weekly", priority: 0.9 };
  if (p.startsWith("/tools")) return { changefreq: "monthly", priority: 0.8 };
  return { changefreq: "monthly", priority: 0.7 };
}

async function getFiles(dir, root) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const d of dirents) {
    const abs = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (IGNORE_DIRS.includes(d.name)) continue;
      files.push(...await getFiles(abs, root));
    } else if (d.name.endsWith(".html") && !IGNORE_FILES.includes(d.name)) {
      files.push(abs);
    }
  }
  return files;
}

(async () => {
  const root = path.resolve(__dirname, "..");
  const allFiles = await getFiles(root, root);

  const seen = new Set();
  const entries = [];

  for (const file of allFiles) {
    const relPath = normalizePath(path.relative(root, file));
    const loc = SITE_URL + relPath;
    if (seen.has(loc)) continue;
    seen.add(loc);

    const stat = await fs.stat(file);
    const { changefreq, priority } = metaFor(relPath);

    entries.push({
      loc,
      lastmod: new Date(stat.mtime).toISOString().split("T")[0],
      changefreq,
      priority
    });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  for (const u of entries) {
    xml.push(
      "  <url>",
      `    <loc>${u.loc}</loc>`,
      `    <lastmod>${u.lastmod}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority}</priority>`,
      "  </url>"
    );
  }

  xml.push("</urlset>");

  await fs.writeFile(path.join(root, "sitemap.xml"), xml.join("\n"));
  console.log(`✅ Generated sitemap.xml with ${entries.length} unique URLs`);
})();
