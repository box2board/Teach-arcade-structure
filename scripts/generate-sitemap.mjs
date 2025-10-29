// /scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const BASE_URL = "https://teacharcade.com";
const ROOT = process.cwd();

// Recursively find .html files
function getHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (entry.endsWith(".html") && !entry.includes("404")) {
      results.push(fullPath);
    }
  }
  return results;
}

// Build sitemap URLs
function buildUrls(files) {
  const today = new Date().toISOString().split("T")[0];
  return files.map((filePath) => {
    let url = filePath.replace(ROOT, "").replace(/\\/g, "/");
    if (url.endsWith("/index.html")) url = url.replace("/index.html", "/");
    return `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.includes("/tools/") ? "monthly" : "weekly"}</changefreq>
    <priority>${url === "/" ? "1.0" : url.includes("/tools/") ? "0.8" : "0.9"}</priority>
  </url>`;
  });
}

// Main generator
function generateSitemap() {
  const files = getHtmlFiles(ROOT);
  const urls = [...new Set(buildUrls(files))].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>\n`;

  const output = path.join(ROOT, "sitemap.xml");

  // ✅ Write cleanly with no BOM or leading whitespace
  fs.writeFileSync(output, Buffer.from(xml, "utf8"));

  console.log(`✅ Generated sitemap.xml with ${files.length} pages`);
}

generateSitemap();
