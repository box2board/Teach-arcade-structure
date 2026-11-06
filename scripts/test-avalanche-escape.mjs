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
   for(const o of g.s.objects.filter(o=>o.waveId===r.id&&o.type!=='flake'&&o.type!=='ramp'))assert(Math.abs(o.x-r.gapX)>o.r+15+20,'Safe corridor remains open');
  }
 }
 assert.equal(g.s.time,45);assert.equal(g.s.phase,'finished');botHits+=g.s.hits;idleHits+=idle.s.hits;
}
assert.equal(botHits,0,'All sampled routes can be cleared with normal steering');assert(idleHits>60,'Standing still is meaningfully worse');assert.equal(patterns.size,3);assert(counts[2]>counts[1]&&counts[1]>counts[0]);assert(maxObjects<80);
const g=createGame();g.start();g.s.spawn=9999;
for(let i=0;i<9;i++){const multiplier=g.s.multiplier,before=g.s.score;g.s.objects=[{type:'flake',x:g.s.x,y:440,r:15,speed:0}];g.tick(.01);assert(Math.abs(g.s.score-before-(25*multiplier+.02))<.0001);}
assert.equal(g.s.multiplier,4);assert.equal(g.s.bestCombo,9);
g.s.objects=[{type:'rock',x:g.s.x,y:440,r:24,speed:0,waveId:1}];g.tick(.01);assert.equal(g.s.multiplier,1);assert.equal(g.s.combo,0);assert.equal(g.s.hits,1);
g.pause();const time=g.s.time;g.tick(3);assert.equal(g.s.time,time);g.resume();g.tick(1);assert(g.s.time>time);g.start();assert.equal(g.s.bestCombo,0);assert.equal(g.s.multiplier,1);assert.equal(g.s.hits,0);
assert(stages[2].speed>stages[1].speed&&stages[1].gap<stages[0].gap);
console.log(`PASS: 60 seeded full rounds, ${botHits} guided hits vs ${idleHits} idle hits, three patterns, increasing density, score multipliers/reset, pause/replay; max ${maxObjects} objects.`);

// Boost accelerates every terrain object and its row together, not the timer.
const normal=createGame(),boost=createGame();normal.start();boost.start();
for(const game of [normal,boost]){game.s.spawn=999;game.s.objects=[{type:'rock',x:80,y:0,r:24,speed:185,waveId:1}];game.s.rows=[{id:1,y:0,speed:185,checked:false}];}
boost.hold(true);normal.tick(.5);boost.tick(.5);assert(boost.s.objects[0].y>normal.s.objects[0].y*1.4);assert.equal(boost.s.objects[0].y,boost.s.rows[0].y);assert.equal(boost.s.time,normal.s.time);assert(boost.s.distance>normal.s.distance*1.4);
boost.hold(false);boost.tick(.75);assert(boost.s.speedFactor<1.01,'Speed eases back after release');
boost.hold(true);boost.tick(3);assert.equal(boost.s.boostReady,false);assert.equal(boost.s.boosting,false);boost.hold(false);boost.tick(1);assert.equal(boost.s.boostReady,true);boost.hold(true);boost.tick(.1);assert.equal(boost.s.boosting,true);
console.log('PASS: boost accelerates objects, rows and scenery, preserves round timing, eases out and avoids empty-reserve pulsing.');
// The high trail is a real height-gated reward for boosting onto a ramp.
function jumpTrial(boosting){const game=createGame();game.start();game.s.spawn=999;game.s.objects=[{type:'ramp',x:300,y:400,r:35,speed:185},...[60,150,240].map(d=>({type:'flake',x:300,y:400-d,z:100*Math.sin(Math.PI*d/300),air:true,r:15,speed:185}))];game.hold(boosting);let peak=0;for(let i=0;i<240;i++){game.tick(1/120);peak=Math.max(peak,game.s.height);}return {game,peak};}
const hop=jumpTrial(false),launch=jumpTrial(true);assert.equal(hop.game.s.airBonuses,1);assert.equal(launch.game.s.airBonuses,3);assert(launch.peak>hop.peak*2);assert.equal(launch.game.s.height,0);assert.equal(launch.game.s.jumps,1);
const air=createGame();air.start();air.s.spawn=999;air.s.jump={progress:100,length:300,maxHeight:100,speed:0};air.s.objects=[{type:'rock',x:300,y:440,r:24,speed:0}];air.tick(.01);assert.equal(air.s.hits,0);const frozenHeight=air.s.height;air.pause();air.tick(1);assert.equal(air.s.height,frozenHeight);air.resume();air.s.jump.progress=300;air.tick(.01);assert.equal(air.s.hits,1);
console.log('PASS: normal hop collects 1 air token, boosted launch collects all 3, height-aware hazards, airborne pause and safe landing.');

// Glancing contact counts, distant passes do not, and height gates remain intact.
for(const [dx,dy,z,expected] of [[43,0,0,true],[-43,0,0,true],[32,25,0,true],[0,40,0,true],[48,0,0,false],[0,46,0,false],[0,0,100,false]]){
 const game=createGame();game.start();game.s.spawn=999;const token={type:'flake',x:300+dx,y:440+dy,z,r:15,speed:0};game.s.objects=[token];game.tick(.01);assert.equal(!!token.hit,expected,`Pickup at ${dx},${dy},${z}`);const combo=game.s.combo;game.tick(.01);assert.equal(game.s.combo,combo,'A collected token only counts once');
}
console.log('PASS: left/right clips and diagonal edge pickups count; distant misses and unreachable air tokens do not; no duplicate pickup rewards.');
