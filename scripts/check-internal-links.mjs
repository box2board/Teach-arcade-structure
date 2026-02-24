import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const REPORT = path.join(ROOT, 'reports', 'broken-links-report.md');

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

async function existsTarget(linkPath) {
  const candidates = [];
  if (linkPath.endsWith('/')) candidates.push(path.join(PUBLIC_DIR, linkPath, 'index.html'));
  candidates.push(path.join(PUBLIC_DIR, `${linkPath}.html`));
  candidates.push(path.join(PUBLIC_DIR, linkPath));
  candidates.push(path.join(PUBLIC_DIR, linkPath, 'index.html'));
  for (const c of candidates) {
    try { if ((await fs.stat(c)).isFile()) return true; } catch {}
  }
  return false;
}

async function main() {
  const files = await walk(PUBLIC_DIR);
  const broken = [];
  for (const f of files) {
    const html = await fs.readFile(f, 'utf8');
    const links = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
    for (const href of links) {
      if (!href.startsWith('/')) continue;
      if (href.startsWith('//')) continue;
      const clean = href.split('?')[0].replace(/\/$/, '/');
      if (['/assets/', '/api/'].some((p) => clean.startsWith(p))) continue;
      if (!(await existsTarget(clean))) {
        broken.push({ file: path.relative(ROOT, f).replace(/\\/g, '/'), href: clean });
      }
    }
  }

  const lines = ['# Broken Internal Links Report', '', `Broken links found: ${broken.length}`, ''];
  broken.slice(0, 400).forEach((b) => lines.push(`- ${b.href} referenced in ${b.file}`));
  lines.push('');
  await fs.writeFile(REPORT, lines.join('\n'), 'utf8');
}

main().catch((e) => { console.error(e); process.exit(1); });
