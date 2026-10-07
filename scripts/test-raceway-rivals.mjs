import assert from 'node:assert/strict';
import {Race,ReviewSession} from '../public/review-lab/raceway-rivals/engine.js';
import {loadQuestionSet} from '../public/review-lab/catalog.js';
const bank=await loadQuestionSet('scientific-method');
for(const count of [12,20,24]){
 const session=new ReviewSession({...bank,questions:bank.questions.slice(0,count)});
 assert.equal(new Set(session.deck.map(q=>q.id)).size,Math.min(count,20));
 const race=new Race();
 for(let stage=0;stage<5;stage++){
  const end=Math.floor(session.deck.length*(stage+1)/5);
  while(session.index<end)session.answer((session.question.answer+1)%4);
  if(stage>0)race.stopsCompleted++;
  race.state='race';race.juice=40;
  for(let ticks=0;ticks<10000&&race.state==='race';ticks++)race.update(.05,{gas:true});
  assert.equal(race.state,stage===4?'finished':'pit');
  if(stage<4){const frozen=JSON.stringify(race);race.update(.05,{gas:true});assert.equal(JSON.stringify(race),frozen)}
 }
 assert(session.complete);assert.equal(session.correct,0);assert.equal(session.missed.length,session.deck.length);
 assert.equal(race.distance,12000);
}
const session=new ReviewSession(bank);while(!session.complete)session.answer(session.question.answer);
assert.equal(session.correct,20);assert.equal(session.missed.length,0);
console.log('PASS: 12/20/24-question banks, unique coverage, five batches, four compulsory gates, paused rivals, all-wrong race completion, first-attempt records.');
