import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {QUESTION_SETS} from '../public/review-lab/catalog.js';
const root=path.resolve('public'),catalog=JSON.parse(fs.readFileSync(path.join(root,'print-play-games/crossword-catalog.json'))).resources;
const supported=Object.values(JSON.parse(fs.readFileSync('crossword-data/subjects.json'))).map(s=>s.subject);
const expected=QUESTION_SETS.filter(s=>supported.includes(s.subject));
const questionIds=new Set(expected.map(s=>s.id));
assert.equal(new Set(catalog.map(r=>r.id)).size,catalog.length,'Crossword catalog IDs must be unique');
assert.ok(catalog.every(r=>questionIds.has(r.id)),'Every crossword must match a current reusable question set');
const urls=new Set();
for(const r of catalog){
 assert.ok(supported.includes(r.subject));assert.ok(r.category);assert.equal(r.gradeBand,'7–12');
 const bytes=fs.readFileSync(r.source);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sourceSha256,`Stale source reference: ${r.id}`);
 for(const url of [...Object.values(r.pdfs),...Object.values(r.previews),r.puzzles]){
  assert.ok(url.startsWith('/print-play-games/')&&!url.includes('..'));assert.ok(!urls.has(url),`Duplicate asset: ${url}`);urls.add(url);
  const asset=path.join(root,url);assert.ok(fs.statSync(asset).isFile()&&fs.statSync(asset).size>0,url);
  if(url.endsWith('.pdf'))assert.equal(fs.readFileSync(asset).subarray(0,5).toString(),'%PDF-');
 }
 const puzzles=JSON.parse(fs.readFileSync(path.join(root,r.puzzles)));let last=new Set();
 for(const [level,count] of [['easy',10],['medium',15],['hard',20]]){
  const answers=new Set(puzzles[level].entries.map(e=>e.gridAnswer));assert.equal(answers.size,count);assert.equal(puzzles[level].entries.length,count);assert.ok([...last].every(a=>answers.has(a)));last=answers;
 }
}
console.log(`Crossword assets passed: ${catalog.length} curated topics, ${catalog.length*4} PDFs, ${catalog.length*3} previews; all match current reusable question sets.`);
