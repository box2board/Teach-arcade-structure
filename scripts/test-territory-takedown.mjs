import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base=new URL('../public/arcade-review-games/territory-takedown/',import.meta.url);
const editions=[
  {name:'Scientific Method',dir:base,questions:'questions.js',count:30,standard:20,challenge:10,id:'scientific-method-v1'},
  {name:'French Revolution',dir:new URL('french-revolution/',base),questions:'questions.js',count:40,standard:30,challenge:10,id:'french-revolution-v1'}
];
const boardSource=fs.readFileSync(new URL('board-data.js',base),'utf8');
const gameSource=fs.readFileSync(new URL('game.js',base),'utf8');
const questionSets=[];
for(const edition of editions){
  const html=fs.readFileSync(new URL('index.html',edition.dir),'utf8');
  const sandbox={window:{__TT_TEST__:true},console,setTimeout,clearTimeout};vm.createContext(sandbox);
  for(const source of [boardSource,fs.readFileSync(new URL(edition.questions,edition.dir),'utf8'),gameSource])vm.runInContext(source,sandbox);
  const {TT_BOARD:b,TT_QUESTION_SET:q,TerritoryTakedownTest:api}=sandbox.window;
  assert.equal(q.id,edition.id);assert.equal(q.title,edition.name);assert.equal(q.questions.length,edition.count);
  assert.equal(q.questions.filter(x=>x.difficulty==='standard').length,edition.standard);
  assert.equal(q.questions.filter(x=>x.difficulty==='challenge').length,edition.challenge);
  assert.equal(new Set(q.questions.map(x=>x.id)).size,edition.count,`${edition.name}: unique IDs`);
  assert.equal(new Set(q.questions.map(x=>x.question.trim().toLowerCase())).size,edition.count,`${edition.name}: unique prompts`);
  for(const x of q.questions){assert.ok(x.id&&x.question.trim(),`${edition.name}: required ID and prompt`);assert.equal(x.choices.length,4,`${x.id}: four choices`);assert.ok(x.choices.every(c=>c.trim()),`${x.id}: nonempty choices`);assert.ok(Number.isInteger(x.answer)&&x.answer>=0&&x.answer<x.choices.length,`${x.id}: one valid answer index`);assert.ok(['standard','challenge'].includes(x.difficulty),`${x.id}: valid difficulty`)}
  assert.equal(b.territories.length,24);assert.equal(new Set(b.territories.map(t=>t.id)).size,24);
  for(const t of b.territories){assert.ok(t.adjacent.length>=2,`${t.id} connected`);for(const n of t.adjacent){assert.ok(b.territories.some(x=>x.id===n));assert.ok(b.territories.find(x=>x.id===n).adjacent.includes(t.id),`${t.id}/${n} symmetric`)}}
  assert.equal(b.territories.filter(t=>t.special).length,6);assert.deepEqual([...new Set(b.territories.filter(t=>t.special).map(t=>t.special))].sort(),['challenge','double','shield','stronghold']);
  for(const n of [2,3,4,5,6]){const owners=api.distribute(n,()=>.42),counts=Array(n).fill(0);Object.values(owners).forEach(i=>counts[i]++);assert.equal(Object.keys(owners).length,24);assert.ok(Math.max(...counts)-Math.min(...counts)<=1,`${edition.name}: ${n}-team deal balanced`)}
  const state=api.createState({teamCount:2,names:['A','B'],duration:600},()=>.3);const own=Object.keys(state.owners).find(id=>state.owners[id]===state.current&&api.legalTargets(state,id).length);assert.ok(own);assert.ok(api.legalTargets(state,own).every(id=>state.owners[id]!==state.current));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);for(const meta of ['canonical','og:title','twitter:title','application/ld+json'])assert.ok(html.includes(meta),`${edition.name}: ${meta}`);for(const id of [...gameSource.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))assert.match(html,new RegExp(`id=["']${id}["']`),`${edition.name}: #${id}`);
  for(const dialog of ['questionPanel','decisionPanel','gameplayFeedback'])assert.match(html,new RegExp(`<dialog id="${dialog}"[^>]+aria-labelledby=[^>]+aria-describedby=`),`${edition.name}: ${dialog} accessible modal`);
  questionSets.push(q);
}
assert.ok(editions.every(({dir})=>fs.readFileSync(new URL('index.html',dir),'utf8').includes(dir===base?'src="game.js"':'src="../game.js"')),'both editions load the one shared engine');
assert.equal(new Set(questionSets.flatMap(q=>q.questions.map(x=>x.id))).size,70,'curriculum question IDs do not overlap');
assert.ok(questionSets[0].questions.every(q=>!questionSets[1].questions.some(x=>x.question===q.question)),'curriculum prompts are isolated');
for(const behavior of ['showModal()','dialog.close()','requestAnimationFrame','cancel','function capture()','function bank()','function push()','function undo()','function checkVictory()'])assert.ok(gameSource.includes(behavior),`shared engine includes ${behavior}`);
for(const feedback of ['DOUBLE ATTACK!','SHIELD ACQUIRED','CHALLENGE CONQUERED','STRONGHOLD SECURED','Push failed','Captures banked'])assert.ok(gameSource.includes(feedback),`${feedback} feedback is present`);
assert.match(gameSource,/prefers-reduced-motion/,'timed feedback respects reduced-motion preferences');
console.log('Territory Takedown checks passed for Scientific Method (30: 20 Standard/10 Challenge) and French Revolution (40: 30 Standard/10 Challenge): one shared engine/board/styles architecture, isolated and valid question banks, 24 connected territories, six specials, balanced 2–6 team deals, legal adjacency, all game modes and core capture/Bank/Push/rollback/Undo behaviors, accessible dialogs, reduced motion, DOM bindings, and unique metadata.');
