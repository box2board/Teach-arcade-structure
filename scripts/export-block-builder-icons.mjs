import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ICON_DIR = path.resolve('public/assets/block-builder/icons/svg');
const OUT32 = path.resolve('public/assets/block-builder/icons/png/32');
const OUT48 = path.resolve('public/assets/block-builder/icons/png/48');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('sharp is not installed. Skipping PNG export. Install with: npm i -D sharp');
    return;
  }

  await mkdir(OUT32, { recursive: true });
  await mkdir(OUT48, { recursive: true });

  const files = (await readdir(ICON_DIR)).filter((file) => file.endsWith('.svg'));

  for (const file of files) {
    const svgPath = path.join(ICON_DIR, file);
    const svg = await readFile(svgPath);
    const name = file.replace(/\.svg$/, '.png');
    await sharp(svg).resize(32, 32).png().toFile(path.join(OUT32, name));
    await sharp(svg).resize(48, 48).png().toFile(path.join(OUT48, name));
  }

  await writeFile(path.resolve('public/assets/block-builder/icons/png/.generated'), new Date().toISOString());
  console.log(`Exported ${files.length} icon files to 32px and 48px PNG sets.`);
}

main();
