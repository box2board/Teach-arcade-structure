import assert from 'node:assert/strict';
import {createGame,stages} from '../public/mini-games/games/avalanche-escape/engine.js';
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
// Every generated row keeps a real body-width corridor; a steering-only route
// follower can traverse every stage without needing invulnerability or dash.
let maxObjects=0,patterns=new Set(),counts=[0,0,0],botHits=0,idleHits=0;
for(let seed=1;seed<=60;seed++){
 const g=createGame('avalanche-escape',rng(seed)),idle=createGame('avalanche-escape',rng(seed));g.start();idle.start();const seen=new Set();
 for(let frame=0;frame<2701;frame++){
  const row=g.s.rows.filter(r=>r.y<480).sort((a,b)=>b.y-a.y)[0];
  g.setInput(row?Math.max(-1,Math.min(1,(row.gapX-g.s.x)/4)):0);g.tick(1/60);idle.tick(1/60);
  maxObjects=Math.max(maxObjects,g.s.objects.length);
  assert(Number.isFinite(g.s.score));assert(g.s.energy>=0&&g.s.energy<=1);
  for(const r of g.s.rows){if(seen.has(r.id))continue;seen.add(r.id);counts[g.s.stage]++;patterns.add(r.pattern);
   for(const o of g.s.objects.filter(o=>o.waveId===r.id&&o.type!=='star'))assert(Math.abs(o.x-r.gapX)>o.r+15+20,'Safe corridor remains open');
  }
 }
 assert.equal(g.s.time,45);assert.equal(g.s.phase,'finished');botHits+=g.s.hits;idleHits+=idle.s.hits;
}
assert.equal(botHits,0,'All sampled routes can be cleared with normal steering');assert(idleHits>60,'Standing still is meaningfully worse');assert.equal(patterns.size,3);assert(counts[2]>counts[1]&&counts[1]>counts[0]);assert(maxObjects<80);
const g=createGame();g.start();g.s.spawn=9999;
for(let i=0;i<9;i++){const multiplier=g.s.multiplier,before=g.s.score;g.s.objects=[{type:'star',x:g.s.x,y:440,r:15,speed:0}];g.tick(.01);assert(Math.abs(g.s.score-before-(25*multiplier+.02))<.0001);}
assert.equal(g.s.multiplier,4);assert.equal(g.s.bestCombo,9);
g.s.objects=[{type:'rock',x:g.s.x,y:440,r:24,speed:0,waveId:1}];g.tick(.01);assert.equal(g.s.multiplier,1);assert.equal(g.s.combo,0);assert.equal(g.s.hits,1);
g.pause();const time=g.s.time;g.tick(3);assert.equal(g.s.time,time);g.resume();g.tick(1);assert(g.s.time>time);g.start();assert.equal(g.s.bestCombo,0);assert.equal(g.s.multiplier,1);assert.equal(g.s.hits,0);
assert(stages[2].speed>stages[1].speed&&stages[1].gap<stages[0].gap);
console.log(`PASS: 60 seeded full rounds, ${botHits} guided hits vs ${idleHits} idle hits, three patterns, increasing density, score multipliers/reset, pause/replay; max ${maxObjects} objects.`);
