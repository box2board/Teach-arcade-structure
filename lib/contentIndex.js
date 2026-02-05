import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CONTENT_ROOTS = [
  { dir: "arcade-review-games", contentType: "game" },
  { dir: "brain-arcade", contentType: "game" },
  { dir: "games", contentType: "game" },
  { dir: "arcade", contentType: "game" },
  { dir: "escape-rooms", contentType: "escape-room" },
  { dir: "simulations", contentType: "simulation" },
  { dir: "tools", contentType: "tool" },
  { dir: "choose-your-path-adventure", contentType: "interactive" },
  { dir: "movie-guides/guides", contentType: "movie-guide" },
  { dir: "teacher-guides", contentType: "interactive" },
  { dir: "guides", contentType: "interactive" },
  { dir: "movies", contentType: "interactive" },
];

const EXCLUDED_SEGMENTS = new Set([
  "assets",
  "images",
  "img",
  "css",
  "js",
  "fonts",
  "scripts",
  "videos",
]);

const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractMeta = (html, pattern) => {
  const match = html.match(pattern);
  return match ? match[1].trim() : "";
};

const extractHtmlText = (html, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const matches = [];
  let match;
  while ((match = regex.exec(html))) {
    matches.push(match[1]);
  }
  return matches;
};

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractKeywords = (html) => {
  const title = extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = extractMeta(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  const headings = [
    ...extractHtmlText(html, "h1"),
    ...extractHtmlText(html, "h2"),
    ...extractHtmlText(html, "h3"),
  ];
  const text = [title, description, ...headings]
    .map((value) => normalizeText(stripTags(value)))
    .filter(Boolean)
    .join(" ");
  const tokens = text
    .split(" ")
    .filter((token) => token.length > 2);
  return Array.from(new Set(tokens));
};

const buildCanonicalUrl = (relativePath) => {
  const normalized = `/${relativePath.replace(/\\/g, "/")}`;
  if (normalized.endsWith("/index.html")) {
    return normalized.replace(/index\.html$/, "");
  }
  return normalized;
};

const buildIdFromUrl = (canonicalUrl) => {
  const clean = canonicalUrl.replace(/[?#].*$/, "").replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  return parts[parts.length - 1] || clean.replace(/\W+/g, "-");
};

const shouldSkipPath = (relativePath) => {
  const segments = relativePath.split(/[\\/]/).filter(Boolean);
  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) return true;
  if (/debug/i.test(relativePath)) return true;
  if (!relativePath.endsWith(".html")) return true;
  return false;
};

const walkDir = async (dir, baseDir, results = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      await walkDir(fullPath, baseDir, results);
    } else if (!shouldSkipPath(relativePath)) {
      results.push({ fullPath, relativePath });
    }
  }
  return results;
};

const isListingIndex = (relativePath, rootDir) => {
  if (!relativePath.endsWith("index.html")) return false;
  const rootSegments = rootDir.split(/[\\/]/).filter(Boolean);
  const pathSegments = relativePath.split(/[\\/]/).filter(Boolean);
  const depthBeyondRoot = pathSegments.length - rootSegments.length;
  return depthBeyondRoot <= 1;
};

const parseEscapeRooms = async (publicDir) => {
  const roomsDir = path.join(publicDir, "escape", "rooms");
  try {
    const roomEntries = await readdir(roomsDir, { withFileTypes: true });
    const rooms = [];
    for (const entry of roomEntries) {
      if (!entry.isDirectory()) continue;
      const roomSlug = entry.name;
      const dataPath = path.join(roomsDir, roomSlug, "data.js");
      const data = await readFile(dataPath, "utf8").catch(() => "");
      const titleMatch = data.match(/title:\s*['"]([^'"]+)['"]/i);
      const minutesMatch = data.match(/minutes:\s*([0-9]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : `Escape Room: ${roomSlug}`;
      const duration = minutesMatch ? `${minutesMatch[1]} minutes` : "";
      const canonicalUrl = `/escape/?room=${roomSlug}`;
      rooms.push({
        id: roomSlug,
        title,
        contentType: "escape-room",
        canonicalUrl,
        subjects: [],
        topics: [],
        keywords: ["escape", "escape room", roomSlug.replace(/-/g, " ")],
        blurb: "",
        duration,
        deviceNotes: "",
        icon: "",
      });
    }
    return rooms;
  } catch (error) {
    return [];
  }
};

const parseHtmlContent = async (fullPath, relativePath, contentType) => {
  const html = await readFile(fullPath, "utf8");
  const title =
    extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i) ||
    extractHtmlText(html, "h1")[0] ||
    path.basename(relativePath, ".html");
  const description =
    extractMeta(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ) || "";
  const paragraphs = extractHtmlText(html, "p");
  const blurb = description || (paragraphs[0] ? stripTags(paragraphs[0]) : "");
  const keywords = extractKeywords(html);
  const canonicalUrl = buildCanonicalUrl(relativePath);
  return {
    id: buildIdFromUrl(canonicalUrl),
    title: stripTags(title),
    contentType,
    canonicalUrl,
    subjects: [],
    topics: [],
    keywords,
    blurb,
    duration: "",
    deviceNotes: "",
    icon: "",
  };
};

export const buildContentIndex = async ({
  publicDir = path.resolve("public"),
  contentRoots = DEFAULT_CONTENT_ROOTS,
} = {}) => {
  const items = [];
  for (const root of contentRoots) {
    const rootDir = path.join(publicDir, root.dir);
    try {
      const rootStat = await stat(rootDir);
      if (!rootStat.isDirectory()) continue;
    } catch (error) {
      continue;
    }

    const files = await walkDir(rootDir, publicDir);
    for (const file of files) {
      if (isListingIndex(file.relativePath, root.dir)) continue;
      const item = await parseHtmlContent(
        file.fullPath,
        file.relativePath,
        root.contentType,
      );
      items.push(item);
    }
  }

  const escapeRooms = await parseEscapeRooms(publicDir);
  items.push(...escapeRooms);

  const byCanonicalUrl = new Map();
  for (const item of items) {
    if (!item.canonicalUrl || byCanonicalUrl.has(item.canonicalUrl)) continue;
    byCanonicalUrl.set(item.canonicalUrl, item);
  }

  return Array.from(byCanonicalUrl.values());
};
