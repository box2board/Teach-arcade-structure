import assert from 'node:assert/strict';
import {createMagnet} from '../public/mini-games/games/magnet-mayhem/engine.js';
const g=createMagnet(()=>.5);g.start();g.aim(450,320);g.hold(true);g.tick(.3);assert(g.s.ball.vx>0);g.start();g.aim(450,320);g.hold(false);g.tick(.3);assert(g.s.ball.vx<0);
g.start();Object.assign(g.s.ball,{x:g.s.goal.x,y:g.s.goal.y,vx:0,vy:0});g.tick(.001);assert.equal(g.s.gates,1);assert.equal(g.s.score,25);assert(Math.hypot(g.s.goal.x-g.s.ball.x,g.s.goal.y-g.s.ball.y)>180);
g.pause();const t=g.s.time;g.tick(3);assert.equal(g.s.time,t);assert.equal(g.s.attract,false);g.resume();g.tick(9);assert.equal(g.s.barriers.length,2);
for(let seed=0;seed<20;seed++){const g=createMagnet();g.start();for(let i=0;i<2400;i++){g.aim(300+250*Math.sin(i/130),320+220*Math.cos(i/110));g.hold(i%90<45);g.tick(1/60);assert(Number.isFinite(g.s.ball.x)&&Number.isFinite(g.s.ball.y));assert(Math.hypot(g.s.ball.vx,g.s.ball.vy)<400);}assert.equal(g.s.phase,'finished');assert.equal(g.s.time,40);g.start();assert.equal(g.s.score,0);}
console.log('PASS: attraction/repulsion, scoring and goal relocation, pause/resume, obstacle progression, 20 full rounds, bounded speeds and replay.');
for(let seed=1;seed<=10;seed++){let n=seed;const random=()=>((n=(n*1664525+1013904223)>>>0)/4294967296),g=createMagnet(random);g.start();for(let i=0;i<2400;i++){g.aim(g.s.goal.x,g.s.goal.y);g.hold(true);g.tick(1/60);}assert(g.s.gates>=3,'simple attraction route must reach several gates');}
console.log('PASS: simple pull-to-gate control completes multiple gates across ten seeded rounds.');
