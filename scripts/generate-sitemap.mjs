// Generates a clean, BOM-free sitemap that Google accepts.
import fs from "fs";
import path from "path";

const BASE_URL = "https://teacharcade.com";
const ROOT = process.cwd();

function walk(dir) {
  /** @type {string[]} */
  let out = [];
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out = out.concat(walk(p));
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}

function toUrl(filePath) {
  let url = filePath.replace(ROOT, "").replace(/\\/g, "/");
  // collapse /index.html to /
  url = url.replace(/\/index\.html$/i, "/");
  // strip duplicates like //tools//
  url = url.replace(/\/{2,}/g, "/");
  return `${BASE_URL}${url}`;
}

function generate() {
  // collect pages
  const htmlFiles = walk(ROOT).filter(p =>
    // exclude 404 + hidden or build files
    !/\/(404|node_modules|\.vercel|scripts)\//.test(p)
  );

  const today = new Date().toISOString().split("T")[0];

  // unique URLs
  const seen = new Set();
  const urls = [];
  for (const f of htmlFiles) {
    const loc = toUrl(f);
    if (seen.has(loc)) continue;
    seen.add(loc);
    const isTool = loc.includes("/tools/");
    const priority = loc === `${BASE_URL}/` ? "1.0" : isTool ? "0.8" : "0.9";
    const changefreq = isTool ? "monthly" : "weekly";
    urls.push(
`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    );
  }

  // NOTE: omit the XML declaration line so a stray BOM/whitespace can never break parsing.
  const xml =
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  const outPath = path.join(ROOT, "sitemap.xml");

  // Ensure fresh write and NO BOM:
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  const bytes = new TextEncoder().encode(xml);           // UTF-8, no BOM
  fs.writeFileSync(outPath, bytes);                      // write raw bytes

  // Tiny debug: print first 20 byte values so you can confirm there’s no BOM (239,187,191)
  const head = Array.from(bytes.slice(0, 20)).join(",");
  console.log(`Sitemap written (${seen.size} urls). First bytes: [${head}]`);
}

generate();
