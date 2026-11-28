import {readFile, readdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {availability} from '../public/assets/resource-availability.js';
import {loadCards} from './resource-cards/catalog.mjs';
import {renderCard} from './resource-cards/render.mjs';
import {applyLibraryAvailability} from './resource-cards/library-links.mjs';

const root = new URL('../public/', import.meta.url);
const libraries = ['arcade-review-games/index.html','brain-arcade/index.html','tools/index.html','mini-games/index.html'];
const marker = /<!-- resource-card (\{[^\n]*?\}) -->([\s\S]*?)<!-- \/resource-card -->/g;

export function renderPlacements(html, resources, unavailable) {
  let count = 0;
  function card(placement) {
    const resource = resources.get(placement.id);
    if (!resource) throw Error('Unknown resource ID: '+placement.id);
    count++;
    return renderCard(resource,placement,unavailable.has(resource.url));
  }
  let singles = 0;
  let lists = 0;
  const result = html.replace(marker, (_, json) => {
    singles++;
    return '<!-- resource-card '+json+' -->'+card(JSON.parse(json))+'<!-- /resource-card -->';
  }).replace(/<!-- resource-list ([\s\S]*?) -->([\s\S]*?)<!-- \/resource-list -->/g, (_, json) => {
    lists++;
    const {view,items} = JSON.parse(json);
    const contents = items.map(item => {
      const placement = typeof item === 'string' ? {id:item} : item;
      const markup = card({...placement,view});
      if (!placement.tile) return markup;
      if (!/^[a-z-]+$/.test(placement.tile)) throw Error('Invalid subject tile theme');
      return '<li class="hub-tile hub-tile--'+placement.tile+'">'+markup+'</li>';
    });
    return '<!-- resource-list '+json+' -->\n'+contents.join('\n')+'\n<!-- /resource-list -->';
  });
  if (lists !== (html.match(/<!-- resource-list /g)??[]).length || lists !== (html.match(/<!-- \/resource-list -->/g)??[]).length)
    throw Error('Unpaired resource-list marker');
  if (singles !== (html.match(/<!-- resource-card /g)??[]).length || singles !== (html.match(/<!-- \/resource-card -->/g)??[]).length)
    throw Error('Unpaired resource-card marker');
  return {html:result,count};
}

export async function buildResourceCards({check=false}={}) {
  const resources = await loadCards();
  const unavailable = new Map();
  for (const [id, state] of Object.entries(availability)) {
    const resource = resources.get(id);
    if (!resource || !['live','coming-soon'].includes(state)) throw Error('Invalid resource availability: '+id);
    if (state==='coming-soon') unavailable.set(resource.url,resource);
  }
  const subjects = await readdir(new URL('subjects/',root),{recursive:true});
  const pages = ['index.html',...subjects.filter(x=>x.endsWith('.html')).map(x=>'subjects/'+x),...libraries];
  const updates = [];
  let count = 0;
  let migrated = 0;
  for (const page of pages) {
    const file = new URL(page,root);
    const original = await readFile(file,'utf8');
    try {
      const result = renderPlacements(original,resources,unavailable);
      if (result.count) { count+=result.count; migrated++; }
      const html = libraries.includes(page) ? applyLibraryAvailability(result.html,'/'+page,unavailable) : result.html;
      if (html !== original) updates.push({file,html});
    } catch (error) { throw Error(page+' — '+error.message,{cause:error}); }
  }
  if (check && updates.length) throw Error('Regenerate stale resource cards in '+updates.map(x=>x.file.pathname).join(', '));
  for (const {file,html} of updates) await writeFile(file,html);
  console.log(`Resource cards: ${count} placements across ${migrated} pages.`);
}
if (process.argv[1]===fileURLToPath(import.meta.url)) await buildResourceCards({check:process.argv.includes('--check')});
