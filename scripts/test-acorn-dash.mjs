import assert from 'node:assert/strict';
import {CrossingWorld,roadHit,roadShapes} from '../public/arcade-review-games/crossing-quest/engine.js';
import {ROUTES,CELL,WIDTH} from '../public/arcade-review-games/crossing-quest/config.js';
import bank from '../public/arcade-review-games/crossing-quest/questions.js';
import { QUESTION_SETS, loadQuestionSet } from '../public/arcade-review-games/crossing-quest/question-sets.js';
assert.equal(QUESTION_SETS.length,253);
assert.equal((await loadQuestionSet('scientific-method')).id,bank.id);
await assert.rejects(loadQuestionSet('not-a-set'));
for(const difficulty of ['relaxed','classic','challenge']){
 const w=new CrossingWorld(bank,difficulty);w.start();
 w.player={row:0,x:416};w.update(.01);assert.equal(w.state,'goal-help');assert.equal(w.acorns,1);
 const frozen=w.time;w.update(.05);assert.equal(w.time,frozen);w.continueHunt();w.update(.01);assert.equal(w.state,'playing');assert.equal(w.acorns,1);
 for(let stage=0;stage<3;stage++){
  w.acorns=3;
  for(const stop of ['island','finish']){w.openCheckpoint(stop);for(let i=0;i<2;i++){w.answer(w.question.answer);w.continueAnswer();}}
  assert.equal(w.state,'return-ready');assert(w.returning);assert.equal(w.checkpoint,0);w.beginReturn();assert.equal(w.state,'playing');
  w.hit('Test');assert.equal(w.player.row,0);assert(w.move('down'));
  w.hop=0;w.player.row=8;w.update(.01);assert.equal(w.stashed,3*(stage+1));assert.equal(w.acorns,0);
  if(stage<2){assert.equal(w.state,'transition');w.nextStage();assert(!w.returning);assert.equal(w.collected.size,0);}
 }
 assert.equal(w.state,'won');assert.equal(w.records.length,12);
}
for(const row of [5,7]){
 const lane={row},o={x:100,width:88};
 assert(!roadHit({x:90,row},lane,o),'Empty space ahead of bicycle must not collide');
 assert(!roadHit({x:199,row},lane,o),'Empty space behind bicycle must not collide');
 for(const wheel of roadShapes(lane,o).circles)assert(roadHit({x:wheel.x+2,row},lane,o),'Visible wheel overlap must collide');
}
const w=new CrossingWorld(bank);w.start();w.invulnerable=0;w.shield=0;
const lane=w.route.lanes.find(l=>l.type==='sprinkler');w.time=2.8-lane.row*.9;w.player={row:lane.row,x:160};assert(w.sprinklers(lane)[0].active);w.update(.01);assert.equal(w.lives,3);assert.equal(w.player.row,8);
for(const difficulty of ['relaxed','classic','challenge']){
 const w=new CrossingWorld(bank,difficulty);const lane=w.route.lanes.find(l=>l.type==='sprinkler');
 w.time=(1.8-lane.row*.9+7)/(w.route.speed*w.difficulty.speed);
 assert(w.sprinklers(lane)[0].warning);assert(!w.sprinklers(lane)[0].active);
 assert(1.3/(w.difficulty.speed*1.16)>.89,'Every warning lasts at least .89 seconds');
}
console.log('PASS: catalog loading/rejection, pickups, minimum-acorn gate, rewards, return checkpoints, stash/reset, full state flow at every difficulty, sprinkler collisions and warning phases.');

assert.equal(new Set(ROUTES.map(r=>r.scene)).size,3);
assert.equal(new Set(ROUTES.map(r=>r.lanes.map(l=>l.type+':'+(l.kind||'')).join(','))).size,3);
for(const route of ROUTES){
 assert.deepEqual(route.nuts.slice(3,5).map(n=>n.row),[4,4]);
 assert.equal(route.nuts[8].row,0);
 for(const n of route.nuts){assert.equal((n.x-32)%CELL,0);assert(n.x>0&&n.x<WIDTH);}
 for(const lane of route.lanes){
  if(lane.type==='road'){
   const o={x:100,width:lane.width};const shapes=roadShapes(lane,o);
   assert.equal(shapes.segments.length,lane.kind==='ball'?0:3);
   for(const shape of shapes.circles)assert(roadHit({x:shape.x+2,row:lane.row},lane,o));
  }
  if(lane.type==='sprinkler')for(const difficulty of ['relaxed','classic','challenge']){
   const w=new CrossingWorld(bank,difficulty);w.stage=ROUTES.indexOf(route);
   w.time=(1.8-lane.row*.9-(lane.phase||0)+14)/(route.speed*w.difficulty.speed);
   const heads=w.sprinklers(lane);assert.deepEqual(heads.map(h=>h.x),lane.heads);
   assert(heads[0].warning);assert(!heads[0].active);
   w.time+=1/(route.speed*w.difficulty.speed);assert(w.sprinklers(lane)[0].active);
  }
 }
}
console.log('PASS: distinct route layouts, reachable-grid acorns, ball/bicycle geometry on every path, and sprinkler warning/active phases at every difficulty.');
