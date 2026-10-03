import assert from 'node:assert/strict';
import {PinballPhysics,BALL_PHYSICS} from '../public/arcade-review-games/review-pinball/physics.js';
import {CircuitRush} from '../public/arcade-review-games/review-pinball/scoring.js';
for(const assist of [false,true]){
 let drains=0,hits=0;const engine=new PinballPhysics({assist,onDrain:()=>drains++,onHit:()=>hits++});engine.launch();let reachedPlayfield=false;
 for(let i=0;i<240*35&&engine.ball;i++){engine.step(1/240);const b=engine.ball;if(b){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));if(b.x<438&&b.y<500)reachedPlayfield=true;}}
 assert.ok(reachedPlayfield,'Launch must leave the shooter lane');assert.equal(drains,1,'An unattended ball must eventually drain');assert.ok(hits>0,'Launch must encounter scoring features');
}
for(const [side,x] of [['left',195],['right',315]]){
 const engine=new PinballPhysics();engine.ball={x,y:735,vx:0,vy:180,r:10};engine.keys[side]=true;for(let i=0;i<12;i++)engine.step(1/240);assert.ok(engine.ball.vy< -400,side+' flipper must send a descending ball upward');
}
let hits=0;const engine=new PinballPhysics({onHit:()=>hits++});engine.hit('bumper0',100);engine.hit('bumper0',100);assert.equal(hits,1,'One contact must not award points repeatedly in a physics tick');
console.log('Pinball physics: launch, scoring, drains, both flippers, and duplicate-contact checks passed.');

// Isolate a bumper to distinguish rebound physics from the rest of the table.
const isolated={rails:[],bumpers:[{x:250,y:250,r:30}],targets:[],flippers:[]};
function bumperContact(vx,vy){
 let contacts=0;const p=new PinballPhysics({table:isolated,onHit:()=>contacts++});
 p.ball={x:289.9,y:250,vx,vy,r:10};p.step(.001);
 return {p,contacts};
}
const direct=bumperContact(-400,0);
assert.ok(direct.p.ball.vx>350 && direct.p.ball.vx<450,'Direct bumper hit has a bounded powered rebound');
assert.equal(direct.contacts,1);
const graze=bumperContact(-20,180);
assert.ok(graze.p.ball.vx>0 && graze.p.ball.vx<30,'Grazing contact must not become a strong sideways launch');
assert.ok(Math.abs(graze.p.ball.vy-180)<2,'Grazing contact preserves tangent momentum');
const separating=bumperContact(150,0);
assert.ok(separating.p.ball.vx<151,'A ball already leaving a bumper must not get kicked again');
assert.equal(separating.contacts,0,'Separating overlap is not a new scoring impact');
const before=direct.p.ball.vx;direct.p.step(.001);
assert.ok(direct.p.ball.vx<=before,'An outgoing ball must not accumulate additional bumper impulses');
const rubber=new PinballPhysics({table:isolated});
rubber.ball={x:200,y:9,vx:350,vy:-5,r:10};
assert.equal(rubber.segment(100,0,300,0,0,.88,{x:0,y:0},90),true);
assert.equal(rubber.ball.vx,350,'Slingshot force must not invent tangential velocity');
assert.ok(rubber.ball.vy>0 && rubber.ball.vy<6,'Slingshot kick scales down for a gentle contact');
assert.equal(rubber.segment(100,0,300,0,0,.88,{x:0,y:0},90),false,'Separating contact is not another slingshot impact');
console.log('Bumper tuning: direct, grazing, separating, repeated-contact, and slingshot momentum checks passed.');

const paced=new PinballPhysics();paced.launch();
assert.equal(paced.ball.vy,-1080,'Launch restores the original fast shooter-lane speed');
paced.ball={x:254,y:500,vx:2000,vy:0,r:10};paced.step(1/240);
assert.ok(Math.hypot(paced.ball.vx,paced.ball.vy)<=BALL_PHYSICS.maxSpeed+.001,'Runaway speed is bounded for collision stability');
paced.keys.left=true;const angle=paced.flippers[0].angle;paced.step(1/240);
assert.ok(Math.abs(paced.flippers[0].angle-angle+15/240)<.00001,'Flipper response is not slowed with the ball');
assert.equal(paced.time,2/240,'Ball pace must not stretch session clocks');
console.log('Launch: fast shooter lane, runaway guard, responsive flippers, and real-time clocks passed.');

const empty={rails:[],bumpers:[],targets:[],flippers:[]};
const rising=new PinballPhysics({table:empty});rising.ball={x:254,y:450,vx:0,vy:-400,r:10};
let previousSpeed=400;
for(let i=0;i<60;i++){rising.step(1/240);const speed=Math.abs(rising.ball.vy);assert.ok(speed<previousSpeed,'Upward travel slows continuously');previousSpeed=speed;}
const falling=new PinballPhysics({table:empty});falling.ball={x:254,y:450,vx:0,vy:100,r:10};previousSpeed=100;
for(let i=0;i<60;i++){falling.step(1/240);assert.ok(falling.ball.vy>previousSpeed,'Downhill travel accelerates continuously');previousSpeed=falling.ball.vy;}
const rebound=new PinballPhysics({table:empty});rebound.ball={x:254,y:109,vx:80,vy:-400,r:10};
rebound.segment(150,100,350,100,0,.72);
assert.equal(rebound.ball.vx,80,'Passive rebound preserves tangent momentum');
assert.ok(rebound.ball.vy>0 && rebound.ball.vy<400,'Passive rebound loses energy');
const free=new PinballPhysics({table:empty});free.ball={x:254,y:450,vx:1300,vy:0,r:10};free.step(1/240);
assert.ok(free.ball.vx>1290,'Ordinary fast travel is not flattened to the previous 1,147-unit cap');
console.log('Momentum: upward slowdown, downhill acceleration, passive rebound losses, and variable speed passed.');

function rampShot(speed){
 const events=[],p=new PinballPhysics({onHit:id=>events.push(id)});p.ball={x:147,y:475.5,vx:0,vy:-speed,r:10};
 p.step(1/240);assert.ok(p.ride,'Upward shot crosses the actual ramp mouth');
 const entrySpeed=p.ride.speed;let minSpeed=entrySpeed,steps=0;
 while(p.ride && steps++<240*8){p.step(1/240);if(p.ride)minSpeed=Math.min(minSpeed,p.ride.speed);}
 assert.ok(!p.ride,'Ramp traversal must finish or roll back');
 return {p,events,entrySpeed,minSpeed};
}
const complete=rampShot(900);
assert.equal(complete.events.filter(id=>id==='ramp').length,1,'Completed ramp scores exactly once');
assert.ok(complete.minSpeed<complete.entrySpeed-150,'Ramp climb slows under gravity');
assert.ok(complete.p.ball.vy>0,'Completed ramp returns downhill near the right flipper');
const weak=rampShot(350);
assert.ok(!weak.events.includes('ramp'),'A weak shot that rolls back earns no completion points');
assert.ok(weak.p.ball.vy>0 && Math.abs(weak.p.ball.x-147)<2,'Weak ramp shot rolls back out of its entrance');
const miss=new PinballPhysics();miss.ball={x:230,y:477,vx:0,vy:-900,r:10};miss.step(1/240);
assert.ok(!miss.ride,'A shot that misses the mouth must not be captured by the ramp');
complete.p.launch();assert.ok(!complete.p.ride && !complete.p.orbitEntry,'A fresh ball clears lane state');
console.log('Ramp: entrance accuracy, variable momentum, completed scoring, weak-shot rollback, and state reset passed.');
let loops=0;const loop=new PinballPhysics({onHit:id=>{if(id==='orbit')loops++;}});
loop.ball={x:85,y:231,vx:0,vy:-500,r:10};loop.step(1/240);
assert.equal(loop.orbitEntry?.side,'left','Loop starts at an upward lane entrance');
loop.ball={x:250,y:125,vx:300,vy:0,r:10};loop.step(1/240);
loop.ball={x:410,y:229,vx:0,vy:500,r:10};loop.step(1/240);
assert.equal(loops,1,'Loop scores only after crossing the top and exiting the opposite lane');
loop.step(1/240);assert.equal(loops,1,'Loop completion does not score again on the next tick');
console.log('Loop: entrance, top crossing, opposite exit, and single completion score passed.');

const spinnerTable={...empty,spinner:{x:254,y:420,width:48,value:150}};
for(const direction of [-1,1]){
 const events=[],p=new PinballPhysics({table:spinnerTable,onHit:(id,value)=>events.push([id,value])});
 const control=new PinballPhysics({table:empty});
 p.ball={x:254,y:420-direction,vx:20,vy:direction*700,r:10};control.ball={...p.ball};
 p.step(1/240);control.step(1/240);
 assert.deepEqual(events,[['spinner',150]],'Both gate directions score a swept crossing');
 assert.deepEqual(p.ball,control.ball,'Spinner does not inject momentum or redirect the ball');
 const speed=Math.abs(p.spinnerSpeed);p.step(1/240);assert.ok(Math.abs(p.spinnerSpeed)<speed,'Gate rotation decays');
 assert.equal(events.length,1,'No duplicate crossing on the following tick');
}
const missedGate=new PinballPhysics({table:spinnerTable,onHit:()=>assert.fail('Missed gate must not score')});
missedGate.ball={x:310,y:419,vx:0,vy:700,r:10};missedGate.step(1/240);
const rush=new CircuitRush();assert.equal(rush.factor(0),1);
assert.equal(rush.record('bumper0',0),false);assert.equal(rush.shots.size,0);
rush.record('ramp',1);rush.record('ramp',2);assert.equal(rush.shots.size,1);
rush.record('orbit',3);assert.equal(rush.record('spinner',4),true);
assert.equal(rush.factor(4),2);assert.equal(rush.remaining(4),15);
assert.equal(rush.record('ramp',5),false);assert.equal(rush.shots.size,0,'No stacking during a rush');
assert.equal(rush.factor(19),1,'Rush expires exactly at fifteen seconds');
rush.record('ramp',20);rush.drain();assert.ok(rush.shots.has('ramp'),'Unfinished shot progress persists across balls');
rush.record('orbit',21);rush.record('spinner',22);rush.drain();assert.equal(rush.factor(22),1,'A drained ball ends its live rush');
console.log('Spinner and Circuit Rush: both directions, misses, unchanged momentum, decay, unique shots, expiry, and drain passed.');
