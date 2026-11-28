import {readFile, readdir, access} from 'node:fs/promises';
import {CABINET_GAMES, TOOLS} from '../../public/teacher/cabinet-catalog.js';

const directory = new URL('../../data/resource-cards/', import.meta.url);
const homepageArtwork = {
  'block-builder': '/assets/images/brain-arcade/block-builder-flat-768.webp',
  'snow-day-defenders': '/assets/images/homepage/snow-day-defenders-flat-768.webp'
};

const publicRoot = new URL('../../public/', import.meta.url);


function validatePath(path) {
  const decoded = decodeURIComponent(path);
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s]/.test(path) ||
      decoded.split(/[/?#]/).includes('..') || decoded.includes('\\')) throw Error('Invalid local card path: '+path);
}

export async function loadCards() {
  const resources = new Map();
  const localFiles = new Map();
  function checkFile(path) {
    validatePath(path);
    const file = path.split(/[?#]/)[0];
    if (!localFiles.has(file)) localFiles.set(file, access(new URL('.'+file+(file.endsWith('/')?'index.html':''),publicRoot)));
    return localFiles.get(file);
  }
  async function responsiveSources(record) {
    if (record.imageSrcset || !record.image?.endsWith('-768.webp')) return record.imageSrcset;
    const candidates = [];
    for (const width of (record.image.endsWith('-cabinet-768.webp') ? [224,384,512] : [384,768,1536])) {
      const path = record.image.replace(/-768\.webp$/, '-'+width+'.webp');
      try { await checkFile(path); candidates.push(path+' '+width+'w'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    return candidates.length > 1 ? candidates.join(', ') : undefined;
  }
  async function add(id, record) {
    if (!id || !record.title?.trim() || resources.has(id)) throw Error('Invalid or duplicate resource: '+id);
    await checkFile(record.url);
    if (record.image) await checkFile(record.image);
    const imageSrcset = await responsiveSources(record);
    if (imageSrcset) {
      for (const candidate of imageSrcset.split(',')) {
        const [path, size] = candidate.trim().split(/\s+/);
        if (!/^\d+w$/.test(size)) throw Error('Invalid responsive artwork: '+id);
        await checkFile(path);
      }
    }
    let homeArt;
    if (homepageArtwork[id]) {
      const image = homepageArtwork[id];
      await checkFile(image);
      homeArt = {image, imageSrcset: await responsiveSources({image})};
    }
    resources.set(id, {...record,imageSrcset,homeArt,id});
  }
  for (const record of [...CABINET_GAMES,...TOOLS]) {
    await add(record.id,record);
  }
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.json')) continue;
    const records = JSON.parse(await readFile(new URL(file,directory),'utf8'));
    for (const [id, record] of Object.entries(records)) await add(id,record);
  }
  return resources;
}
