import assert from 'node:assert/strict';
import {PinballPhysics,BALL_PACE} from '../public/arcade-review-games/review-pinball/physics.js';
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
assert.equal(paced.ball.vy,-1080*.85,'Launch speed is reduced by 15%');
paced.ball={x:254,y:500,vx:2000,vy:0,r:10};paced.step(1/240);
assert.ok(Math.hypot(paced.ball.vx,paced.ball.vy)<=1350*BALL_PACE+.001,'Powered shots respect the reduced speed ceiling');
paced.keys.left=true;const angle=paced.flippers[0].angle;paced.step(1/240);
assert.ok(Math.abs(paced.flippers[0].angle-angle+15/240)<.00001,'Flipper response is not slowed with the ball');
assert.equal(paced.time,2/240,'Ball pace must not stretch session clocks');
console.log('Ball pace: reduced launch and speed ceiling, responsive flippers, and real-time clocks passed.');
