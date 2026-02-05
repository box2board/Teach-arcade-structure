import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "your",
  "about",
  "free",
  "lesson",
  "lessons",
  "activities",
  "activity",
  "resources",
  "teach",
  "arcade",
  "subject",
  "topics",
  "topic",
  "unit",
  "units",
  "guide",
  "guides",
  "classroom",
  "ready",
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

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
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

const isRedirectPage = (html) =>
  /http-equiv=["']refresh["']/i.test(html) ||
  /window\.location\.replace/i.test(html);

const buildKeywordSet = (content, slug = "") => {
  const normalized = normalizeText(content);
  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  const tokenCounts = new Map();
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
  }

  const rankedTokens = Array.from(tokenCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([token]) => token);

  const phrases = new Set();
  if (slug) {
    phrases.add(slug.replace(/-/g, " "));
  }

  const headingText = normalizeText(content);
  const headingWords = headingText.split(" ").filter(Boolean);
  if (headingWords.length && headingWords.length <= 5) {
    phrases.add(headingWords.join(" "));
  }

  return Array.from(new Set([...rankedTokens, ...phrases])).filter(Boolean);
};

const extractPageText = (html) => {
  const title = extractMeta(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = extractMeta(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  const ogDescription = extractMeta(
    html,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  const headings = [
    ...extractHtmlText(html, "h1"),
    ...extractHtmlText(html, "h2"),
    ...extractHtmlText(html, "h3"),
  ];
  const firstParagraph = extractHtmlText(html, "p")[0] || "";
  const combined = [title, description, ogDescription, ...headings, firstParagraph]
    .map((value) => normalizeText(stripTags(value)))
    .filter(Boolean)
    .join(" ");

  return combined;
};

const walkSubjects = async (dir, baseDir, results = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkSubjects(fullPath, baseDir, results);
    } else if (entry.name.endsWith(".html")) {
      results.push({
        fullPath,
        relativePath: path.relative(baseDir, fullPath),
      });
    }
  }
  return results;
};

const resolvePageKey = (relativePath) => {
  const segments = relativePath.split(/[\\/]/).filter(Boolean);
  if (segments[0] !== "subjects") return null;
  const fileName = segments[segments.length - 1];
  if (fileName === "index.html") {
    const subjectSlug = segments[segments.length - 2];
    return { key: `subjects/${subjectSlug}`, slug: subjectSlug, type: "subject" };
  }
  const topicSlug = fileName.replace(/\.html$/, "");
  const subjectSlug = segments.length >= 3 ? segments[segments.length - 2] : null;
  return {
    key: `topics/${topicSlug}`,
    slug: topicSlug,
    type: "topic",
    subjectSlug,
  };
};

export const buildPageTextIndex = async ({
  publicDir = path.resolve("public"),
} = {}) => {
  const subjectsDir = path.join(publicDir, "subjects");
  const files = await walkSubjects(subjectsDir, publicDir);
  const pageTextMap = {};
  const topicSubjectMap = {};
  for (const file of files) {
    const html = await readFile(file.fullPath, "utf8");
    if (isRedirectPage(html)) continue;
    const pageKey = resolvePageKey(file.relativePath);
    if (!pageKey) continue;
    const text = extractPageText(html);
    pageTextMap[pageKey.key] = buildKeywordSet(text, pageKey.slug);
    if (pageKey.type === "topic" && pageKey.subjectSlug) {
      topicSubjectMap[pageKey.slug] = pageKey.subjectSlug;
    }
  }
  return { pageTextMap, topicSubjectMap };
};

export const buildPageTextMap = async (options = {}) => {
  const { pageTextMap } = await buildPageTextIndex(options);
  return pageTextMap;
};
