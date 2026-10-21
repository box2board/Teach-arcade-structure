import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir = new URL('./',import.meta.url);
let html = await readFile(new URL('index.html',dir),'utf8');
for (const name of ['styles.css','mobile.css']) {
  const css = await readFile(new URL(name,dir),'utf8');
  html = html.replace(`<link rel="stylesheet" href="${name}">`,()=>`<style>\n${css}\n</style>`);
}
for (const name of ['startup.js','scenarios.js','game.js']) {
  const js = await readFile(new URL(name,dir),'utf8');
  html = html.replace(`<script src="${name}"></script>`,()=>`<script>\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
if (/<script[^>]+src=|<link[^>]+stylesheet/.test(html)) throw new Error('Preview still contains external code');
const output = process.argv[2] || fileURLToPath(new URL('colony-builder-iphone-preview.html',dir));
await writeFile(output,html);
console.log(output);
