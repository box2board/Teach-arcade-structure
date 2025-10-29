// /scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const BASE_URL = "https://teacharcade.com";
const ROOT_DIR = process.cwd();

// Recursively find .html files
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

function cleanUrl(filePath) {
  const rel = filePath.replace(ROOT_DIR, "").replace(/\\/g, "/");
  if (rel.endsWith("/index.html")) return rel.replace("/index.html", "/");
  return rel;
}

function generateXml(urls) {
  const today = new Date().toISOString().split("T")[0];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) => `  <url>
    <loc>${BASE_URL}${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.includes("/tools/") ? "monthly" : "weekly"}</changefreq>
    <priority>${u === "/" ? "1.0" : u.includes("/tools/") ? "0.8" : "0.9"}</priority>
  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  return xml;
}

const files = getHtmlFiles(ROOT_DIR);
const urls = [
  ...new Set(
    files
      .map(cleanUrl)
      .filter((u) => !u.includes("404") && !u.includes("template"))
  ),
].sort();

const xml = generateXml(urls);

// 🔒 Always ensure file starts with XML declaration (no stray spaces)
fs.writeFileSync(path.join(ROOT_DIR, "sitemap.xml"), xml.trimStart(), "utf8");

console.log(`✅ Sitemap generated successfully with ${urls.length} URLs.`);
