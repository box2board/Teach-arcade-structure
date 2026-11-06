import assert from 'node:assert/strict';
import {createHoops,shotPower,judgeShot,makeWindow,DURATION,CHARGE_TIME,TARGET} from '../public/mini-games/games/free-throws/engine.js';
assert.equal(shotPower(0),0);assert.equal(shotPower(CHARGE_TIME),1);assert(Math.abs(shotPower(CHARGE_TIME*2))<1e-9);
for(const time of [0,15,35]){const w=makeWindow(time);assert(judgeShot(TARGET-w,w).make);assert(judgeShot(TARGET+w,w).make);assert(!judgeShot(TARGET+w+.001,w).make);for(const offset of [-.12,0,.12])assert(judgeShot(shotPower(CHARGE_TIME*TARGET+offset),w).make,'Reasonable release timing succeeds in every stage');}
let events=[];const g=createHoops(e=>events.push(e));g.start();g.tick(2);assert.equal(g.state.phase,'playing');
for(let i=0;i<5;i++){assert(g.begin());const cfg=g.config(),locked=cfg.hoop.x;g.tick(CHARGE_TIME*TARGET);assert.equal(g.config().hoop.x,locked);assert(g.release());assert(!g.release());g.tick(1.06);assert.equal(g.state.makes,i+1);}
assert.equal(g.state.specialMakes,1);assert.equal(g.state.swishes,5);assert.equal(g.state.bestStreak,5);assert(g.state.last.multiplier===2);
assert(g.begin());g.tick(.05);g.release();g.tick(1.1);assert.equal(g.state.streak,0);assert.equal(g.state.last.make,false);
g.begin();g.tick(.2);g.pause();const t=g.state.time;assert(!g.state.holding);g.tick(4);assert.equal(g.state.time,t);g.resume();assert(!g.release());g.tick(50);assert.equal(g.state.phase,'finished');assert.equal(events.filter(e=>e.type==='finish').length,1);g.tick(50);assert.equal(events.filter(e=>e.type==='finish').length,1);
const b=createHoops();b.start();b.tick(2);b.tick(39);b.begin();b.tick(.75);b.release();b.tick(.25);assert.equal(b.state.time,40);assert.equal(b.state.phase,'buzzer');b.tick(1);assert.equal(b.state.phase,'finished');assert.equal(b.state.makes,1,'Pre-buzzer release counts after time expires');assert.equal(b.state.result.time,DURATION);
for(const fps of [10,30,60,120]){const game=createHoops();game.start();for(let i=0;i<fps*42+2;i++)game.tick(1/fps);assert.equal(game.state.phase,'finished');assert.equal(game.state.time,40);assert.equal(game.state.result.attempts,0);assert.equal(game.state.result.accuracy,0);}
g.start();assert.equal(g.state.score,0);assert.equal(g.state.attempts,0);assert.equal(g.state.phase,'countdown');
console.log('PASS: forgiving green zone at all stages, fixed ball timing, assisted aim lock, swishes/gold/streaks, misses, pause/cancel, buzzer shots, one finish event, replay and 10–120 FPS timing.');
