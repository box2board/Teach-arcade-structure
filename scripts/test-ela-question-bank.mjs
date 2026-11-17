import {BANK_SETS} from '../public/review-lab/bank-catalog.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('../question-bank/ela/manifest.json',import.meta.url)));
const hashes=JSON.parse(await fs.readFile(new URL('../question-bank/source-hashes.json',import.meta.url)));
assert.equal(manifest.subject,'English Language Arts');
assert.equal(manifest.gradeBand,'7–12');
assert.equal(manifest.setCount,45);assert.equal(manifest.questionCount,900);assert.equal(manifest.sets.length,45);
const reviewLabHtml=await fs.readFile(new URL('../public/review-lab/index.html',import.meta.url),'utf8');
assert.match(reviewLabHtml,/id="topic-filters"/,'Review Lab has a subject filter container');
assert(BANK_SETS.some(set=>set.subject==='English Language Arts'),'The shared catalog supplies the ELA option');
const categoryCounts={'Literature & Literary Analysis':12,'Reading & Informational Text':3,'Language, Grammar & Vocabulary':5,'Writing & Composition':1,'Research, Argument & Media Literacy':4};
const categories={},ids=new Set();
const norm=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
function similarity(a,b){const previous=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let diagonal=previous[0];previous[0]=i;for(let j=1;j<=b.length;j++){const old=previous[j];previous[j]=Math.min(previous[j]+1,previous[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));diagonal=old;}}return 1-previous[b.length]/Math.max(a.length,b.length,1);}
for(const [index,set] of manifest.sets.entries()){
 assert(!ids.has(set.id));ids.add(set.id);assert.equal(set.questionCount,20);
 assert(!set.file.startsWith('/')&&!set.file.split('/').includes('..'));
 const source=`question-bank/ela/${set.file}`,bytes=await fs.readFile(new URL(`../${source}`,import.meta.url));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[source],`${set.title} source hash`);
 const copy=await fs.readFile(new URL(`../public/review-lab/question-sets/library/ela/${set.file}`,import.meta.url));
 assert.deepEqual(copy,bytes);
 const bank=JSON.parse(bytes);assert.equal(bank.id,set.id);assert.equal(bank.title,set.title);assert.equal(bank.category,set.category);assert.equal(bank.subject,manifest.subject);
 assert.deepEqual(bank.questions.map(q=>q.id),Array.from({length:20},(_,i)=>i+1));
 const skills={recall:0,understanding:0,reasoning:0},positions=[0,0,0,0],seen=new Set(),prompts=[];
 for(const q of bank.questions){
  assert(q.question.trim());assert.equal(q.choices.length,4);assert(q.choices.every(c=>typeof c==='string'&&c.trim()));
  assert.equal(new Set(q.choices.map(norm)).size,4);assert(Number.isInteger(q.correctAnswer)&&q.correctAnswer>=0&&q.correctAnswer<4);
  assert(['recall','understanding','reasoning'].includes(q.skill));skills[q.skill]++;positions[q.correctAnswer]++;
  assert(!seen.has(norm(q.question)),`${set.title} duplicate prompt`);seen.add(norm(q.question));prompts.push(q.question);
 }
 if(index<25)for(let i=0;i<prompts.length;i++)for(let j=i+1;j<prompts.length;j++)assert(similarity(prompts[i],prompts[j])<=0.82,`${set.title} near-duplicate prompts #${i+1}/#${j+1}`);
 if(index<25)assert.deepEqual(skills,{recall:7,understanding:8,reasoning:5},set.title);
 assert.deepEqual(positions,[5,5,5,5],set.title);
 if(index<25)categories[set.category]=(categories[set.category]||0)+1;
}
assert.deepEqual(categories,categoryCounts);
console.log('PASS ELA: 45 secondary sets, 900 questions, legacy first-batch skill mix, exact IDs and key balance, unique prompts and choices, hashes, and static copies.');
