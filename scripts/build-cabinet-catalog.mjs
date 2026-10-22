import {readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../public/',import.meta.url);
const decode=text=>text.replace(/<[^>]*>/g,'').replace(/&(amp|lt|gt|quot|#39);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[name])).trim();
export function arcadeEntries(html){
 const legacy=html.match(/const games=(\[[\s\S]*?\]);/);
 if(legacy)return JSON.parse(legacy[1]);
 return [...html.matchAll(/<article\b[^>]*class="card [^"]*"[^>]*>([\s\S]*?)<\/article>/g)].map(([,card])=>({
  title:decode(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),
  href:card.match(/<a\b[^>]*href="([^"]+)"/)?.[1],
  desc:decode(card.match(/<p class="desc">([\s\S]*?)<\/p>/)?.[1]||''),
  subject:decode(card.match(/<span class="badge subject">([\s\S]*?)<\/span>/)?.[1]||''),
  icon:decode(card.match(/<div class="icon"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'▶')
 }));
}
export async function buildCabinetCatalog(){
 const entries=arcadeEntries(await readFile(new URL('arcade-review-games/index.html',root),'utf8'));
 if(!entries.length)throw Error('No Arcade Review Games found; check the public library markup.');
 const games=[];const seen=new Set();
 for(const entry of entries){
  if(!entry.title||!entry.desc||!entry.href?.startsWith('/')||entry.href.startsWith('//'))throw Error('Incomplete Arcade Review Game entry.');
  const url=entry.href.replace(/index\.html$/,'');
  if(seen.has(url))continue;seen.add(url);
  await access(new URL(url.slice(1)+(url.endsWith('/')?'index.html':''),root));
  games.push({id:'arcade:'+url,title:entry.title,url,description:entry.desc,subject:entry.subject,symbol:entry.icon||'▶',collection:'Arcade Review Games'});
 }
 await writeFile(new URL('teacher/arcade-catalog.js',root),'// Generated from the public Arcade Review Games library. Run node scripts/build-cabinet-catalog.mjs.\nexport const ARCADE_GAMES=Object.freeze('+JSON.stringify(games,null,2)+'.map(Object.freeze));\n');
 console.log(`Cabinet catalog: ${games.length} Arcade Review Games`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildCabinetCatalog();
