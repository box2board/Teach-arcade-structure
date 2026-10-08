import assert from 'node:assert/strict';
import {Race,ReviewSession,SEGMENT_LENGTH,JUICE_DRAIN} from '../public/review-lab/raceway-rivals/engine.js';
import {loadQuestionSet} from '../public/review-lab/catalog.js';
const bank=await loadQuestionSet('scientific-method');
for(const questionCount of [8,12,16])for(const laps of [1,2,3,5]){
 const review=new ReviewSession({...bank,questions:bank.questions.slice(0,20)},{questionCount,laps},()=>.25);
 const chosen=review.selected.map(q=>q.id).sort();
 assert.equal(new Set(chosen).size,questionCount);assert.equal(review.deck.length,questionCount*laps);
 for(let lap=0;lap<laps;lap++){
  const order=review.deck.slice(lap*questionCount,(lap+1)*questionCount).map(q=>q.id);
  assert.deepEqual([...order].sort(),chosen);
  if(lap)assert.notDeepEqual(order,review.deck.slice((lap-1)*questionCount,lap*questionCount).map(q=>q.id));
 }
 const race=new Race({questionCount,laps});
 race.state='countdown';const frozen=JSON.stringify(race.rivals);
 for(let i=0;i<60;i++)race.update(.05,{gas:true});
 assert.equal(race.state,'race');assert.equal(race.distance,0);assert.equal(race.speed,0);assert.equal(race.juice,75);assert.equal(JSON.stringify(race.rivals),frozen);
 for(let batch=0;batch<race.totalSegments;batch++){
  race.juice=0;
  for(let q=0;q<4;q++){const ok=review.answer((review.question.answer+1)%4);race.juice+=ok?25:10}
  if(batch)race.stopsCompleted++;
  race.state='race';let depleted=false;
  for(let ticks=0;ticks<5000&&race.state==='race';ticks++){
   race.update(.05,{gas:true});if(race.juice===0){depleted=true;if(race.distance<race.nextGate)assert.equal(race.state,'race')}
  }
  assert(depleted);assert.equal(race.state,batch===race.totalSegments-1?'finished':'pit');
  assert.equal(race.distance,(batch+1)*SEGMENT_LENGTH);
  if(race.state==='pit'){const paused=JSON.stringify(race);race.update(.05,{gas:true});assert.equal(JSON.stringify(race),paused)}
 }
 assert(review.complete);assert.equal(review.correct,0);assert.equal(review.missed.length,questionCount);assert.equal(race.distance,race.totalDistance);
}
const perfect=new Race();perfect.juice=100;
while(perfect.state==='race')perfect.update(.05,{gas:true});
assert(perfect.time>38&&perfect.time<41);assert(perfect.juice<5,'perfect charge nearly depleted at checkpoint');
const empty=new Race();empty.juice=0;for(let i=0;i<100;i++)empty.update(.05,{gas:true});assert.equal(empty.speed,140);assert.equal(empty.state,'race');
empty.x=1.2;for(let i=0;i<100;i++)empty.update(.05,{gas:true});assert.equal(empty.speed,40,'off-road car still crawls with empty juice');
const sprint=new Race();sprint.juice=100;for(let i=0;i<16;i++)sprint.update(.05,{gas:true});assert.equal(sprint.speed,460);
const fuel=sprint.juice;for(let i=0;i<10;i++)sprint.update(.05,{gas:true,brake:true});assert.equal(sprint.speed,0);assert.equal(sprint.juice,fuel);
sprint.boost=3;for(let i=0;i<22;i++)sprint.update(.05,{gas:true});assert.equal(sprint.speed,620);
assert.equal(JUICE_DRAIN,2.5);
assert.throws(()=>new ReviewSession({...bank,questions:bank.questions.slice(0,10)},{questionCount:16}));
const allCorrect=new ReviewSession(bank,{questionCount:8,laps:3});while(!allCorrect.complete)allCorrect.answer(allCorrect.question.answer);assert.equal(allCorrect.firstCorrect,8);assert.equal(allCorrect.correct,24);
console.log('PASS: 8/12/16 questions × 1/2/3/5 laps, same unique questions shuffled each lap, four-question batches, fixed gates, all-wrong completion, countdown freezes grid, perfect-charge checkpoint timing, empty-fuel driving, brake priority and repetition scores.');
