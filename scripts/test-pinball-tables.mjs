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
 const ramp=table.ramps[0],m=ramp.mouth;
 for(const speed of [320,1200]){
  const hits=[];const e=new PinballPhysics({table,onHit:(id,value)=>hits.push({id,value})});
  e.ball={x:m.x,y:m.y+2,vx:0,vy:-speed,r:10};e.step(1/60);assert.ok(e.ride,'Actual entrance captures shot');
  for(let i=0;i<240*10&&e.ride;i++)e.step(1/240);
  assert.equal(e.ride,null,'Channel always exits');assert.equal(hits.filter(h=>h.id==='ramp').length,speed===1200?1:0);
  assert.ok(e.ball.vy>0,'Both completed and weak shots return downhill');
 }
 for(let target=0;target<table.targets.length;target++){
  const t=table.targets[target],hits=[];const e=new PinballPhysics({table,onHit:id=>hits.push(id)});
  e.ball={x:t.x-15,y:t.y,vx:300,vy:0,r:10};e.step(1/240);assert.ok(hits.includes('target'+target),'Each treasure/bank target is reachable');
 }
 console.log(`${table.name}: both modes, weak/full launch, cap entry, unattended drain, ramp completion/rollback and four targets passed.`);
}
