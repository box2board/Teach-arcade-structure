import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildContentIndex } from "../lib/contentIndex.js";
import { buildPageTextIndex } from "../lib/pageTextIndex.js";
import { resolveContentLinks } from "../lib/resolveContentLinks.js";
import { contentMappings } from "../data/contentMappings.js";

const outputDir = path.resolve("public", "data");
const dataDir = path.resolve("data");

await mkdir(outputDir, { recursive: true });
await mkdir(dataDir, { recursive: true });

const contentIndex = await buildContentIndex();
const { pageTextMap, topicSubjectMap } = await buildPageTextIndex();
const resolvedContent = resolveContentLinks({
  contentItems: contentIndex,
  contentMappings,
  pageTextMap,
  topicSubjectMap,
});

const contentOutputPath = path.join(outputDir, "contentIndex.json");
const pageTextOutputPath = path.join(outputDir, "pageTextMap.json");
const dataContentOutputPath = path.join(dataDir, "contentIndex.json");
const dataPageTextOutputPath = path.join(dataDir, "pageTextMap.json");

await writeFile(contentOutputPath, `${JSON.stringify(resolvedContent, null, 2)}\n`);
await writeFile(pageTextOutputPath, `${JSON.stringify(pageTextMap, null, 2)}\n`);
await writeFile(dataContentOutputPath, `${JSON.stringify(resolvedContent, null, 2)}\n`);
await writeFile(dataPageTextOutputPath, `${JSON.stringify(pageTextMap, null, 2)}\n`);

console.log(`Synced content index to ${contentOutputPath}`);
console.log(`Synced page text map to ${pageTextOutputPath}`);
