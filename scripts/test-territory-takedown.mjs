import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base=new URL('../public/arcade-review-games/territory-takedown/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const sandbox={window:{__TT_TEST__:true},console,setTimeout,clearTimeout};vm.createContext(sandbox);
for(const file of ['board-data.js','questions.js','game.js'])vm.runInContext(fs.readFileSync(new URL(file,base),'utf8'),sandbox);
const {TT_BOARD:b,TT_QUESTION_SET:q,TerritoryTakedownTest:api}=sandbox.window;
assert.equal(b.territories.length,24);assert.equal(new Set(b.territories.map(t=>t.id)).size,24);
for(const t of b.territories){assert.ok(t.adjacent.length>=2,`${t.id} connected`);for(const n of t.adjacent){assert.ok(b.territories.some(x=>x.id===n));assert.ok(b.territories.find(x=>x.id===n).adjacent.includes(t.id),`${t.id}/${n} symmetric`)}}
assert.equal(b.territories.filter(t=>t.special).length,6);assert.deepEqual([...new Set(b.territories.filter(t=>t.special).map(t=>t.special))].sort(),['challenge','double','shield','stronghold']);
assert.equal(q.questions.length,30);assert.equal(q.questions.filter(x=>x.difficulty==='standard').length,20);assert.equal(q.questions.filter(x=>x.difficulty==='challenge').length,10);assert.equal(new Set(q.questions.map(x=>x.id)).size,30);
for(const x of q.questions){assert.ok(x.choices.length>=2);assert.ok(x.answer>=0&&x.answer<x.choices.length)}
for(const n of [2,3,4,5,6]){const owners=api.distribute(n,()=>.42),counts=Array(n).fill(0);Object.values(owners).forEach(i=>counts[i]++);assert.equal(Object.keys(owners).length,24);assert.ok(Math.max(...counts)-Math.min(...counts)<=1,`${n}-team deal balanced`)}
const s=api.createState({teamCount:2,names:['A','B'],duration:600},()=>.3);const own=Object.keys(s.owners).find(id=>s.owners[id]===s.current&&api.legalTargets(s,id).length);assert.ok(own);assert.ok(api.legalTargets(s,own).every(id=>s.owners[id]!==s.current));
assert.equal((html.match(/<h1\b/g)||[]).length,1);for(const meta of ['canonical','og:title','twitter:title','application/ld+json'])assert.ok(html.includes(meta));for(const id of [...fs.readFileSync(new URL('game.js',base),'utf8').matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))assert.match(html,new RegExp(`id=["']${id}["']`),`#${id}`);
assert.match(html,/<dialog id="questionPanel"[^>]+aria-labelledby="questionText"[^>]+aria-describedby="questionMeta"/,'question uses a labelled native modal dialog');
assert.match(html,/<dialog id="decisionPanel"[^>]+aria-labelledby="decisionTitle"[^>]+aria-describedby="decisionRisk"/,'Bank/Push uses a labelled native modal dialog');
assert.match(html,/<dialog id="gameplayFeedback"[^>]+aria-labelledby="feedbackTitle"[^>]+aria-describedby="feedbackDetail"/,'capture feedback uses a labelled native modal dialog');
const gameJs=fs.readFileSync(new URL('game.js',base),'utf8');
for(const behavior of ['showModal()','dialog.close()','requestAnimationFrame','cancel'])assert.ok(gameJs.includes(behavior),`question dialog includes ${behavior}`);
for(const feedback of ['DOUBLE ATTACK!','SHIELD ACQUIRED','CHALLENGE CONQUERED','STRONGHOLD SECURED','Push failed','Captures banked'])assert.ok(gameJs.includes(feedback),`${feedback} feedback is present`);
assert.match(gameJs,/prefers-reduced-motion/,'timed feedback respects reduced-motion preferences');
console.log('Territory Takedown checks passed: 24 connected territories, six specials, 30 questions, balanced 2–6 team deals, legal adjacency, accessible question/decision/feedback dialogs, special and rollback feedback, reduced motion, DOM bindings, and metadata.');
