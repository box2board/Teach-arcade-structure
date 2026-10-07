import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createAdventure,chooseAdventure,layouts} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {createState,resetPuzzle} from '../public/arcade-review-games/shared/top-down/model.js';
import {validateAdventure} from '../public/arcade-review-games/shared/top-down/validate.js';
import {createReview,answerReview} from '../public/arcade-review-games/shared/top-down/review.js';
import {createMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
import {encodeSave,decodeSave} from '../public/arcade-review-games/shared/top-down/save.js';
import {content} from '../public/arcade-review-games/shared/top-down/scientific-method.js';

for(const layout of ['westward','southbound'])for(const mode of ['explore','medium','hard']){
  test(`${layout} ${mode}: full continuous movement route, reviews, puzzle gates, win, report and resume`,()=>{
    const result=spawnSync(process.execPath,['scripts/test-top-down-outpost-ui.mjs'],{cwd:new URL('..',import.meta.url),encoding:'utf8',env:{...process.env,QUEST_OUTPOST_MODE:mode,QUEST_OUTPOST_LAYOUT:layout}});
    assert.equal(result.status,0,result.stdout+result.stderr);
  });
}
test('new-adventure selection reaches all curated layouts and unknown layouts fail',()=>{
  for(const mode of ['explore','medium','hard'])for(const [i,layout] of layouts.entries()){
    const map=validateAdventure(chooseAdventure(mode,()=>i/3+.01));assert.equal(map.layout,layout.id);
    const another=createAdventure(mode,layout.id);map.blocks[0].x=99;assert.notEqual(another.blocks[0].x,99);
  }
  assert.throws(()=>createAdventure('hard','missing'),/Unknown Outpost layout/);
});
test('all nine layouts retain their geometry, question attempts and fractional position through saves and reset',()=>{
  for(const mode of ['explore','medium','hard'])for(const layout of layouts){
    const map=validateAdventure(createAdventure(mode,layout.id)),s=createState(map);s.review=createReview(map,content.questions);
    const entry=s.review.encounters['survey-chest'].questions[0];answerReview(s.review,'survey-chest',entry.question.choices.find(c=>c!==entry.question.answer));
    const motion=createMotion(s);motion.x+=.12;
    const restored=decodeSave(encodeSave(map,content.questions,s,motion,15),createAdventure,content.questions);
    assert.deepEqual(restored.map,map);assert.deepEqual(restored.state.review,s.review);assert.equal(restored.position.x,motion.x);
    restored.state.blocks[0].x++;restored.state.items.push('lens');restored.state.opened.push('east-crossing');
    resetPuzzle(restored.map,restored.state);
    assert.deepEqual(restored.state.blocks,map.blocks);assert.ok(restored.state.items.includes('lens'));assert.ok(restored.state.opened.includes('east-crossing'));
  }
});
test('pre-layout classic saves still resume; invalid or mismatched layout metadata is rejected',()=>{
  const map=createAdventure('hard'),s=createState(map);s.review=createReview(map,content.questions);
  const legacy={...map};delete legacy.layout;delete legacy.layoutLabel;
  const oldSave=encodeSave(legacy,content.questions,s,createMotion(s),12);
  assert.equal(decodeSave(oldSave,createAdventure,content.questions).map.layout,'classic');
  for(const layout of ['missing','westward',42]){
    const mismatched={...map,layout};
    assert.equal(decodeSave(encodeSave(mismatched,content.questions,s,createMotion(s),12),createAdventure,content.questions),null);
  }
});
