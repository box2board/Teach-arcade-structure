import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve('public');
const preferredHost = 'https://www.teacharcade.com';
const bareHost = 'https://teacharcade.com';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }))).flat();
}

for (const file of await walk(root)) {
  if (!file.endsWith('.html')) continue;
  const html = await fs.readFile(file, 'utf8');
  const normalized = html.replace(/<(?:link|meta)\b[^>]*>|<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script\s*>/gi, tag => {
    const isSeoTag = /^<(?:link|meta)\b/i.test(tag) &&
      (/^<link\b/i.test(tag) && /\brel=["']canonical["']/i.test(tag) ||
       /^<meta\b/i.test(tag) && /\b(?:property|name)=["'](?:og:|twitter:)/i.test(tag));
    const isJsonLd = /^<script\b/i.test(tag);
    return isSeoTag || isJsonLd ? tag.replaceAll(bareHost, preferredHost) : tag;
  });
  if (normalized !== html) await fs.writeFile(file, normalized);
}
