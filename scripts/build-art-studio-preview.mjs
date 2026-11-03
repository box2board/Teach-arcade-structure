// Build the exact modular editor into an offline, dependency-free review fragment.
// Usage: node scripts/build-art-studio-preview.mjs /workspace/art-studio-prototype.html
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../public/tools/art-studio');
const html=readFileSync(resolve(base,'index.html'),'utf8');
const markup=html.slice(html.indexOf('<div id="art-studio"'),html.indexOf('<script type="module"'));
const css=readFileSync(resolve(base,'studio.css'),'utf8').replace('body{margin:0}','');
const modules=['state','image-selection','image-mask','sample-image','objects','templates','storage','export','canvas','ui','object-menu','selection-tools','creation-tools','resource-builders','image-editor','crop-editor','app'];
let js=modules.map(name=>readFileSync(resolve(base,name+'.js'),'utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
if(process.argv[3]){const project=JSON.parse(readFileSync(resolve(process.argv[3]),'utf8'));js=js.replace("const initial=newProject();initial.name='A little curiosity';initial.pages=[buildTemplate('Classroom Poster')];",'const initial='+JSON.stringify(project)+';');}
const output=process.argv[2]||'/workspace/art-studio-prototype.html';
writeFileSync(output,markup+'\n<style>\n'+css+'\n#art-studio{height:850px;min-height:740px}@media(max-width:720px){#art-studio{height:auto}}\n</style>\n<script>\n(()=>{\n'+js.replace(/<\/script/gi,'<\\/script')+'\n})();\n</script>\n');
console.log(output);
