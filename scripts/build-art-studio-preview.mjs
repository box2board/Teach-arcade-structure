// Build the exact modular editor into an offline, dependency-free review fragment.
// Usage: node scripts/build-art-studio-preview.mjs /workspace/art-studio-prototype.html
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../public/tools/art-studio');
const html=readFileSync(resolve(base,'index.html'),'utf8');
const markup=html.slice(html.indexOf('<div id="art-studio"'),html.indexOf('<script type="module"'));
const css=readFileSync(resolve(base,'studio.css'),'utf8').replace('body{margin:0}','');
const modules=['state','objects','templates','storage','export','canvas','ui','app'];
const js=modules.map(name=>readFileSync(resolve(base,name+'.js'),'utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
const output=process.argv[2]||'/workspace/art-studio-prototype.html';
writeFileSync(output,markup+'\n<style>\n'+css+'\n#art-studio{height:850px;min-height:740px}@media(max-width:720px){#art-studio{height:auto}}\n</style>\n<script>\n(()=>{\n'+js.replace(/<\/script/gi,'<\\/script')+'\n})();\n</script>\n');
console.log(output);
