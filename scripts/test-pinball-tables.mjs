import assert from 'node:assert/strict';
import {PinballPhysics} from '../public/arcade-review-games/review-pinball/physics.js';
import {TABLES} from '../public/arcade-review-games/review-pinball/tables.js';
for(const table of TABLES){
 for(const assist of [false,true])for(const power of [.1,.3,.5,.7,.9,1]){
  let entered=0,returned=0,drained=0;
  const e=new PinballPhysics({table,assist,onPlayfield:()=>entered++,onLaneReturn:()=>returned++,onDrain:()=>drained++});e.launch(power);
  for(let i=0;i<240*60&&e.ball&&!returned;i++){e.step(1/240);if(e.ball)assert.ok(Object.values(e.ball).every(Number.isFinite));}
  assert.equal(entered+returned,1,`${table.id}: launch must enter or return, ${power}`);
  if(power===.1){assert.equal(returned,1);assert.equal(drained,0);}
  if(power===1){assert.equal(entered,1);assert.equal(drained,1,'Unattended full launch drains without a trap');}
 }
 for(const ramp of table.ramps){const m=ramp.mouth;
 for(const speed of [320,1200]){
  const hits=[];const e=new PinballPhysics({table,onHit:(id,value)=>hits.push({id,value})});
  e.ball={x:m.x,y:m.y+2,vx:0,vy:-speed,r:10};e.step(1/60);assert.ok(e.ride,'Actual entrance captures shot');
  for(let i=0;i<240*10&&e.ride;i++)e.step(1/240);
  assert.equal(e.ride,null,'Channel always exits');assert.equal(hits.filter(h=>h.id==='ramp').length,speed===1200?1:0);
  assert.ok(e.ball.vy>0,'Both completed and weak shots return downhill');
 }
 }
 for(let target=0;target<table.targets.length;target++){
  const t=table.targets[target],hits=[];const e=new PinballPhysics({table,onHit:id=>hits.push(id)});
  e.ball={x:t.x-15,y:t.y,vx:300,vy:0,r:10};e.step(1/240);assert.ok(hits.includes('target'+target),'Each treasure/bank target is reachable');
 }
 console.log(`${table.name}: both modes, weak/full launch, cap entry, unattended drain, ramp completion/rollback and four targets passed.`);
}

const cosmic=TABLES.find(t=>t.id==='cosmic');
for(const assist of [false,true]){
 let scores=0;const e=new PinballPhysics({table:cosmic,assist,onHit:id=>{if(id==='scoop')scores++;}}),s=cosmic.scoop;
 e.ball={x:s.x,y:s.y+22,vx:0,vy:-600,r:10};for(let i=0;i<20&&!e.scoopRide;i++)e.step(1/240);assert.ok(e.scoopRide);assert.equal(scores,1);
 const time=e.time;for(let i=0;i<120;i++)e.step(1/240);assert.ok(e.scoopRide);assert.equal(e.ball.vy,0);
 while(e.scoopRide)e.step(1/240);assert.ok(e.time-time>=s.hold);assert.equal(e.ball.vy,s.eject.vy);assert.equal(e.ball.vx,s.eject.vx);assert.equal(scores,1);
 e.ball={x:s.x,y:s.y,vx:0,vy:0,r:10};e.step(1/240);assert.equal(e.scoopRide,null,'Cooldown prevents immediate recapture');
 e.prepareBall();assert.equal(e.scoopRide,null);assert.equal(e.scoopCooldown,0);
 const f=new PinballPhysics({table:cosmic,assist});f.keys.right=true;f.ball={x:355,y:416,vx:0,vy:180,r:10};for(let i=0;i<12;i++)f.step(1/240);assert.ok(f.ball.vy<-100,'Upper flipper sends ball upward with right control');
 assert.ok(f.flippers[2].angle>Math.PI,'Upper flipper follows the right button');
}
console.log('Cosmic scoop: capture, single score, timed hold, ejection, recapture cooldown/reset, and upper-flipper impulse passed.');
