import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildContentIndex } from '../lib/contentIndex.js';
const root=path.resolve('public'),lab=path.join(root,'science-lab');
for(const file of (await readdir('tests/science-lab')).filter(f=>f.endsWith('.cjs')).sort()){
 const result=spawnSync(process.execPath,[path.join('tests/science-lab',file)],{encoding:'utf8'});
 process.stdout.write(result.stdout);process.stderr.write(result.stderr);
 assert.equal(result.status,0,`Science Lab interaction suite failed: ${file}`);
}
const catalog={};vm.createContext(catalog);vm.runInContext(await readFile(path.join(lab,'experiments.js'),'utf8'),catalog);vm.runInContext(await readFile(path.join(lab,'catalog.js'),'utf8'),catalog);
const guided=vm.runInContext('Object.values(INVESTIGATIONS).filter(i=>i.route)',catalog);
assert.equal(guided.length,7);assert.equal(vm.runInContext('Object.values(INVESTIGATIONS).filter(i=>!i.route).length',catalog),10);
for(const item of guided){await access(path.join(lab,item.route));await access(path.join(lab,item.teacher));assert.ok(item.saveKey&&item.total>0);}
for(const file of (await readdir(lab)).filter(f=>f.endsWith('.html'))){
 const html=await readFile(path.join(lab,file),'utf8');
 for(const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){
  const value=match[1];if(/^(?:https?:|data:|#|mailto:)/.test(value))continue;
  const clean=value.split(/[?#]/)[0];const target=clean.startsWith('/')?path.join(root,clean):path.join(lab,clean);
  try{await access(target)}catch{await access(path.join(target,'index.html'))}
 }
 assert.ok(!html.includes('chatgpt.site'),'native labs must not depend on the private preview');
 if(file==='lab-report.html')assert.match(html,/<meta name="robots" content="noindex,follow">/);
 else{const route=file==='index.html'?'/science-lab/':'/science-lab/'+file;assert.ok(html.includes(`href="https://www.teacharcade.com${route}"`));assert.match(html,/<meta name="description" content="[^"]+">/);}
}
const items=(await buildContentIndex()).filter(i=>i.canonicalUrl.startsWith('/science-lab/'));
assert.equal(items.length,7);assert.ok(items.every(i=>i.contentType==='simulation'&&i.canonicalUrl.endsWith('-investigation.html')));
const science=await readFile(path.join(root,'subjects/science/index.html'),'utf8');assert.match(science,/href="\/science-lab\/"/);
for(const subject of ['biology','life-science','physical-science','physics','chemistry','earth-space-science','environmental-science','stem-engineering']){
 const html=await readFile(path.join(root,'subjects/science',subject,'index.html'),'utf8');assert.match(html,/ta-science-lab-entry/);assert.match(html,/href="\/science-lab\/[a-z]+-investigation.html"/);
}
console.log('PASS: seven native lab routes, ten explorations, all relative/parent assets, subject navigation, canonical metadata, non-indexed reports, and seven discoverable simulations.');
