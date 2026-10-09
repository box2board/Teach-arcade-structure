import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {topics} from '../public/arcade-review-games/shared/top-down/topics.js';
import {createAdventure} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {createReview,reviewSummary} from '../public/arcade-review-games/shared/top-down/review.js';

test('every offered topic supports every difficulty with unique review questions',()=>{
  assert.equal(new Set(topics.map(t=>t.id)).size,topics.length);
  assert.equal(new Set(topics.map(t=>t.questionSet)).size,topics.length);
  for(const topic of topics)for(const mode of ['explore','medium','hard']){
    const review=createReview(createAdventure(mode),topic.content.questions);
    assert.equal(reviewSummary(review).total,mode==='hard'?12:mode==='medium'?8:6);
  }
});
for(const topic of ['scientific-method','constitution'])test(topic+' selection, full Hard adventure, report and independent save restoration',()=>{
  const result=spawnSync(process.execPath,['scripts/test-top-down-outpost-ui.mjs'],{encoding:'utf8',env:{...process.env,QUEST_OUTPOST_TOPIC:topic,QUEST_OUTPOST_MODE:'hard'}});
  assert.equal(result.status,0,result.stdout+result.stderr);
});
