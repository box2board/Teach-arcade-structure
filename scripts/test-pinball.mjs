import assert from 'node:assert/strict';
import {PinballPhysics} from '../public/arcade-review-games/review-pinball/physics.js';
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
