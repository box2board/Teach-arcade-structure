import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import interactiveContent from "../data/interactiveContent.js";

const outputDir = path.resolve("public", "data");
const outputPath = path.join(outputDir, "interactiveContent.json");

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(interactiveContent, null, 2)}\n`);

console.log(`Synced interactive content to ${outputPath}`);
