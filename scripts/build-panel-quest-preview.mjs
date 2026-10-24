// Bundle the exact repository edition as an offline, self-contained preview.
import fs from 'node:fs';
import path from 'node:path';
const dir=new URL('../public/prototypes/panel-quest/',import.meta.url);
let html=fs.readFileSync(new URL('index.html',dir),'utf8');
const css=fs.readFileSync(new URL('panel-quest.css',dir),'utf8').replace(/url\("(art\/[^"\)]+)"\)/g,(_,file)=>'url("data:image/webp;base64,'+fs.readFileSync(new URL(file,dir)).toString('base64')+'")');
html=html.replace('<link rel="stylesheet" href="panel-quest.css">','<style>'+css+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(new URL(file,dir),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
const assets=Object.fromEntries(Array.from({length:6},(_,i)=>['art/panel-'+i+'.webp','data:image/webp;base64,'+fs.readFileSync(new URL('art/panel-'+i+'.webp',dir)).toString('base64')]));
// One copy per image; the edition's art and cover reference these same strings.
html=html.replace('<script>PanelQuest.mount', '<script>const bundledArt='+JSON.stringify(assets)+';PANEL_QUEST_EDITION.art=PANEL_QUEST_EDITION.art.map(p=>bundledArt[p]);PANEL_QUEST_EDITION.cover=bundledArt[PANEL_QUEST_EDITION.cover];PanelQuest.mount');
const out=path.resolve(process.argv[2]||'panel-quest-paris-preview.html');fs.writeFileSync(out,html);console.log(out);
