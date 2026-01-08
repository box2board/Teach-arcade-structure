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

// ✅ Your NEW Apps Script Web App URL (no query params here)
const RESOURCES_API_BASE =
  "https://script.google.com/macros/s/AKfycbwtXCA5kdNxVzAZejxQMz4cQYzuR6wzd9bJ1SghtQXLrV41W1zXUuSPF97fKwUURAhO/exec";

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

// ---------------- Apps Script resources ----------------
function withQuery(base, paramsObj) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(paramsObj || {})) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

async function fetchResourcesFromAppsScript() {
  const url = withQuery(RESOURCES_API_BASE, { action: "all" });

  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      "User-Agent": "TeachArcadeSearchIndexer/1.0"
    }
  });

  if (!res.ok) throw new Error(`Resources API failed: ${res.status}`);

  const data = await res.json();

  if (!data || data.ok !== true || !Array.isArray(data.items)) {
    throw new Error("Resources API must return { ok:true, items:[...] }");
  }

  return data.items;
}

function gradeTagsFromString(gradesStr) {
  const tags = [];
  const g = String(gradesStr || "").trim();
  if (!g) return tags;

  const compact = g.replace(/\s+/g, "");
  if (/^\d+\-\d+$/.test(compact)) {
    tags.push(`grade:${compact}`);
    return tags;
  }

  if (/k-?2|primary/i.test(g)) tags.push("grade:k-2");
  if (/3-?5|elementary/i.test(g)) tags.push("grade:3-5");
  if (/6-?8|middle|ms/i.test(g)) tags.push("grade:6-8");
  if (/9-?12|high|hs/i.test(g)) tags.push("grade:9-12");

  return tags;
}

function mapResourceToRecord(item) {
  // Expected Apps Script shape:
  // { title, url, type, subject, grades, description, tags:[], topic }
  const title = String(item.title || "").trim();
  const url = toInternalOrExternal(item.url);
  if (!title || !url) return null;

  const topicName = String(item.topic || "").trim(); // tab name
  const subject = String(item.subject || "").trim();
  const typeLabel = String(item.type || "").trim();
  const description = String(item.description || "").trim();

  const tags = ["type:resource"];

  if (topicName) tags.push(`topic:${slugify(topicName)}`);
  if (subject) tags.push(`subject:${slugify(subject)}`);
  if (typeLabel) tags.push(`format:${slugify(typeLabel)}`);

  tags.push(...gradeTagsFromString(item.grades));

  if (Array.isArray(item.tags)) {
    for (const t of item.tags) {
      const raw = String(t || "").trim();
      if (!raw) continue;
      if (raw.includes(":")) tags.push(raw.toLowerCase());
      else tags.push(`tag:${slugify(raw)}`);
    }
  }

  return {
    title,
    url,
    type: "resource",
    description,
    subject,
    tags: dedupe(tags),
    source: "apps-script"
  };
}

// ---------------- manifests ----------------
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

  // 2) Resources from Apps Script
  let resourceRecords = [];
  try {
    const items = await fetchResourcesFromAppsScript();
    resourceRecords = items.map(mapResourceToRecord).filter(Boolean);
  } catch (e) {
    console.warn("WARNING: resources fetch failed:", String(e?.message || e));
  }

  // 3) Optional manifests for items not in sitemap
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

  for (const rec of [...pageRecords, ...resourceRecords, ...manifestRecords]) {
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
