// scripts/generate-robots.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE = 'https://teacharcade.com';

const robots =
`User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
console.log('Generated robots.txt');
