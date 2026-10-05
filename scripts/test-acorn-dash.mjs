import assert from 'node:assert/strict';
import {CrossingWorld} from '../public/arcade-review-games/crossing-quest/engine.js';
import bank from '../public/arcade-review-games/crossing-quest/questions.js';
import { QUESTION_SETS, loadQuestionSet } from '../public/arcade-review-games/crossing-quest/question-sets.js';
assert.equal(QUESTION_SETS.length,1);
assert.equal((await loadQuestionSet('scientific-method')).id,bank.id);
await assert.rejects(loadQuestionSet('not-a-set'));
for(const difficulty of ['relaxed','classic','challenge']){
 const w=new CrossingWorld(bank,difficulty);w.start();
 w.player={row:0,x:416};w.update(.01);assert.equal(w.state,'playing');assert.equal(w.acorns,1);w.update(.01);assert.equal(w.acorns,1);
 for(let stage=0;stage<3;stage++){
  w.acorns=3;
  for(const stop of ['island','finish']){w.openCheckpoint(stop);for(let i=0;i<2;i++){w.answer(w.question.answer);w.continueAnswer();}}
  assert.equal(w.state,'playing');assert(w.returning);assert.equal(w.checkpoint,0);
  w.hit('Test');assert.equal(w.player.row,0);assert(w.move('down'));
  w.hop=0;w.player.row=8;w.update(.01);assert.equal(w.stashed,3*(stage+1));assert.equal(w.acorns,0);
  if(stage<2){assert.equal(w.state,'transition');w.nextStage();assert(!w.returning);assert.equal(w.collected.size,0);}
 }
 assert.equal(w.state,'won');assert.equal(w.records.length,12);
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
