// scripts/build-search-index.mjs
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(PUBLIC_DIR, "search-index.json");

// ---------------- helpers ----------------
function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupe(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const v = String(x || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function toInternalOrExternal(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (!s.startsWith("/")) return "/" + s;
  return s;
}

function titleFromPath(p) {
  const clean = (p || "").split("?")[0].replace(/\/+$/, "");
  const last = clean.split("/").filter(Boolean).pop() || "Teach Arcade";
  const noExt = last.replace(/\.html?$/i, "");
  const words = noExt.replace(/[-_]+/g, " ");
  return words.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function classifyByPath(p) {
  const clean = (p || "").split("?")[0];
  const parts = clean.split("/").filter(Boolean);
  if (!parts.length) return "page";

  if (parts[0] === "subjects") return "topic";
  if (parts[0] === "tools") return "tool";
  if (parts[0] === "store") return "store";

  const gameFolders = new Set([
    "arcade-review-games",
    "choose-your-path-adventure",
    "decision-simulator",
    "escape",
    "print-play-games"
  ]);

  if (gameFolders.has(parts[0])) return "game";

  return "page";
}

function tagsFromPath(p) {
  const clean = (p || "").split("?")[0];
  const parts = clean.split("/").filter(Boolean);
  const tags = [];

  if (!parts.length) return tags;

  // Subjects
  if (parts[0] === "subjects") {
    tags.push("type:topic");
    if (parts[1]) tags.push(`subject:${slugify(parts[1])}`);
    if (parts[2]) tags.push(`subject:${slugify(parts[2])}`);
    const last = parts[parts.length - 1].replace(/\.html?$/i, "");
    if (last && last !== "index") tags.push(`topic:${slugify(last)}`);
    return tags;
  }

  // Tools
  if (parts[0] === "tools") {
    tags.push("type:tool");
    tags.push("format:tool");
    tags.push("subject:all");
    tags.push("platform:web");
    const last = parts[parts.length - 1].replace(/\.html?$/i, "");
    if (last && last !== "index") tags.push(`tool:${slugify(last)}`);
    return tags;
  }

  // Store
  if (parts[0] === "store") {
    tags.push("type:store");
    tags.push("format:merch");
    return tags;
  }

  // Game folders
  const gameFolders = new Set([
    "arcade-review-games",
    "choose-your-path-adventure",
    "decision-simulator",
    "escape",
    "print-play-games"
  ]);

  if (gameFolders.has(parts[0])) {
    tags.push("type:game");
    tags.push("format:game");
    tags.push("platform:web");
    tags.push(`category:${slugify(parts[0])}`);
    const last = parts[parts.length - 1].replace(/\.html?$/i, "");
    if (last && last !== "index") tags.push(`topic:${slugify(last)}`);
    return tags;
  }

  return tags;
}

async function readJsonIfExists(filePath, fallback = []) {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

async function readSitemapPaths() {
  const smPath = path.join(PUBLIC_DIR, "sitemap.xml");
  const out = [];

  try {
    const xml = await fs.readFile(smPath, "utf8");
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi))
      .map((m) => m[1])
      .filter(Boolean);

    for (const loc of locs) {
      try {
        const u = new URL(loc);
        out.push(u.pathname + (u.search || ""));
      } catch {}
    }
  } catch {}

  return out;
}

// ---------------- original site manifests ----------------

function manifestToRecord(x, defaultType) {
  if (!x || !x.title || !x.url) return null;

  const title = String(x.title).trim();
  const url = toInternalOrExternal(x.url);
  const description = String(x.description || "").trim();
  const subject = String(x.subject || "").trim();

  const tags = dedupe([
    ...(Array.isArray(x.tags) ? x.tags : []),
    ...tagsFromPath(url)
  ]);

  return {
    title,
    url,
    type: String(x.type || defaultType).trim(),
    description,
    subject,
    tags,
    source: `manifest:${defaultType}`
  };
}

// ---------------- main ----------------
async function main() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  // 1) Pages from sitemap
  const sitemapPaths = await readSitemapPaths();
  const pageRecords = sitemapPaths
    .filter((p) => p && !p.includes("/assets/"))
    .map((p) => {
      const url = toInternalOrExternal(p);
      const type = classifyByPath(url);
      const tags = dedupe(tagsFromPath(url));

      return {
        title: titleFromPath(url),
        url,
        type,
        description: "",
        subject: "",
        tags,
        source: "sitemap"
      };
    });

  // 2) Optional manifests for items not in sitemap
  const gamesManifest = await readJsonIfExists(path.join(DATA_DIR, "games.json"), []);
  const toolsManifest = await readJsonIfExists(path.join(DATA_DIR, "tools.json"), []);
  const storeManifest = await readJsonIfExists(path.join(DATA_DIR, "store-items.json"), []);

  const manifestRecords = [
    ...gamesManifest.map((x) => manifestToRecord(x, "game")).filter(Boolean),
    ...toolsManifest.map((x) => manifestToRecord(x, "tool")).filter(Boolean),
    ...storeManifest.map((x) => manifestToRecord(x, "store")).filter(Boolean)
  ];

  // 4) Merge + dedupe by URL+Title
  const map = new Map();
  const keyFor = (r) => `${String(r.url).toLowerCase()}||${String(r.title).toLowerCase()}`;

  for (const rec of [...pageRecords, ...manifestRecords]) {
    const k = keyFor(rec);
    if (!map.has(k)) {
      map.set(k, rec);
    } else {
      const existing = map.get(k);
      existing.tags = dedupe([...(existing.tags || []), ...(rec.tags || [])]);
      if (!existing.description && rec.description) existing.description = rec.description;
      if (!existing.subject && rec.subject) existing.subject = rec.subject;
      map.set(k, existing);
    }
  }

  const out = Array.from(map.values());
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Built public/search-index.json with ${out.length} records.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
