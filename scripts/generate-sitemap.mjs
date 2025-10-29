// /scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const baseUrl = "https://teacharcade.com";

// Recursively scan all .html files in the repo
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (
      file.endsWith(".html") &&
      !file.includes("404") &&
      !file.includes("template")
    ) {
      results.push(filePath);
    }
  }
  return results;
}

// Build the sitemap XML
function generateSitemap(urls) {
  const date = new Date().toISOString().split("T")[0];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${u.includes("/tools/") ? "monthly" : "weekly"}</changefreq>
    <priority>${u === "/" ? "1.0" : u.includes("/tools/") ? "0.8" : "0.9"}</priority>
  </url>`
      )
      .join("\n") +
    `\n</urlset>`;

  return xml;
}

// Get relative URL paths for all pages
const htmlFiles = getHtmlFiles(rootDir);
const urls = htmlFiles
  .map((filePath) => {
    const relative = filePath.replace(rootDir, "").replace(/\\/g, "/");
    return relative === "/index.html" ? "/" : relative;
  })
  // Deduplicate
  .filter((v, i, a) => a.indexOf(v) === i)
  // Sort cleanly
  .sort();

// Generate XML
const sitemapXml = generateSitemap(urls);

// Write to root
const outPath = path.join(rootDir, "sitemap.xml");
fs.writeFileSync(outPath, sitemapXml, "utf8");

console.log(`✅ Generated sitemap.xml with ${urls.length} URLs`);
