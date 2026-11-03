import {readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateCatalog} from '../public/teacher/catalog-contract.js';
import {GAMES} from '../public/review-lab/catalog.js';

const root=new URL('../public/',import.meta.url);
const decode=text=>text.replace(/<[^>]*>/g,'').replace(/&(amp|lt|gt|quot|#39|nbsp);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:' '}[name])).trim();
const attribute=(tag,name)=>decode(tag?.match(new RegExp('\\b'+name+'=["\\\']([^"\\\']*)["\\\']','i'))?.[1]||'');
const artwork=html=>{
 const img=html.match(/<img\b[^>]*>/)?.[0];
 return {image:attribute(img,'src'),imageAlt:attribute(img,'alt')};
};
export function arcadeEntries(html){
 const legacy=html.match(/const games=(\[[\s\S]*?\]);/);
 if(legacy)return JSON.parse(legacy[1]);
 return [...html.matchAll(/(<article\b[^>]*class="card [^"]*"[^>]*>)([\s\S]*?)<\/article>/g)].map(([,tag,card])=>({
  id:attribute(tag,'data-resource-id'),
  title:decode(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),
  href:attribute(card.match(/<a\b[^>]*>/)?.[0],'href'),
  desc:decode(card.match(/<p class="desc">([\s\S]*?)<\/p>/)?.[1]||''),
  subject:decode(card.match(/<span class="badge subject">([\s\S]*?)<\/span>/)?.[1]||''),
  icon:decode(card.match(/<div class="icon"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'▶'),
  ...artwork(card.match(/<a\b[^>]*class="art"[^>]*>([\s\S]*?)<\/a>/)?.[1]||'')
 }));
}
export function brainEntries(html){
 return [...html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)]
 .filter(([,tag])=>attribute(tag,'class').split(/\s+/).includes('game-card'))
 .map(([,tag,card])=>({id:attribute(tag,'data-resource-id'),title:decode(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),
  href:attribute(tag,'href'),desc:decode(card.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||''),
  icon:decode(card.match(/<div class="icon"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'▶'),...artwork(card)}));
}
export function toolEntries(html){
 return [...html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)]
 .filter(([,tag])=>attribute(tag,'class').split(/\s+/).includes('card-link'))
 .map(([,tag,card])=>({
  id:attribute(tag,'data-resource-id'),title:decode(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),
  href:attribute(tag,'href'),desc:decode(card.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||''),
  icon:decode(card.match(/<div class="emoji"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'✦'),...artwork(card)
 }));
}
async function checkAssets(items){
 for(const item of items){
  const path=item.url.split(/[?#]/)[0];
  await access(new URL(path.slice(1)+(path.endsWith('/')?'index.html':''),root));
  if(item.image){
   if(!item.image.startsWith('/')||item.image.startsWith('//')||item.image.includes('..'))throw Error(`Use a local artwork path for ${item.title}.`);
   await access(new URL(item.image.slice(1).split(/[?#]/)[0],root));
  }
 }
}
async function resources(entries,collection){
 if(!entries.length)throw Error(`No ${collection} found; check the public library markup.`);
 const items=entries.map(entry=>({id:entry.id,title:entry.title,url:entry.href?.replace(/index\.html(?=[?#]|$)/,''),description:entry.desc,
  ...(entry.subject?{subject:entry.subject}:{}),symbol:entry.icon||'▶',collection,
  ...(entry.image?{image:entry.image,imageAlt:entry.imageAlt||entry.title}:{})}));
 validateCatalog(items,collection);await checkAssets(items);return items;
}
export const cabinetGames=entries=>resources(entries,'Arcade Review Games');
export const cabinetTools=entries=>resources(entries,'Teacher Tools');
export const cabinetBrainGames=entries=>resources(entries,'Brain Arcade');
const moduleText=(name,items,source)=>`// Generated from ${source}. Run node scripts/build-cabinet-catalog.mjs.\nimport {validateCatalog} from './catalog-contract.js';\nexport const ${name}=Object.freeze(validateCatalog(${JSON.stringify(items,null,2)},'${name}').map(Object.freeze));\n`;
export async function buildCabinetCatalog(){
 const [arcadeHtml,toolsHtml,brainHtml]=await Promise.all([readFile(new URL('arcade-review-games/index.html',root),'utf8'),readFile(new URL('tools/index.html',root),'utf8'),readFile(new URL('brain-arcade/index.html',root),'utf8')]);
 const games=await cabinetGames(arcadeEntries(arcadeHtml)),tools=await cabinetTools(toolEntries(toolsHtml)),brain=await cabinetBrainGames(brainEntries(brainHtml));
 validateCatalog([...games,...brain,...GAMES],'all games');await checkAssets(GAMES);
 await writeFile(new URL('teacher/arcade-catalog.js',root),moduleText('ARCADE_GAMES',games,'the public Arcade Review Games library'));
 await writeFile(new URL('teacher/brain-catalog.js',root),moduleText('BRAIN_GAMES',brain,'the public Brain Arcade library'));
 await writeFile(new URL('teacher/tool-catalog.js',root),moduleText('TOOLS',tools,'the public Teacher Tools library'));
 console.log(`Cabinet catalog: ${games.length} Arcade Review Games, ${GAMES.length} Review Lab games, ${brain.length} Brain Arcade games, ${tools.length} tools`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildCabinetCatalog();
