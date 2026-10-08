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
  for(let ticks=0;ticks<5000&&['race','recovering'].includes(race.state);ticks++){
   race.update(.05,{gas:true,left:race.x>.08,right:race.x<-.08});if(race.juice===0){depleted=true;if(race.distance<race.nextGate)assert.equal(race.state,'race')}
  }
  assert(depleted);assert.equal(race.state,batch===race.totalSegments-1?'finished':'pit');
  assert.equal(race.distance,(batch+1)*SEGMENT_LENGTH);
  if(race.state==='pit'){const paused=JSON.stringify(race);race.update(.05,{gas:true});assert.equal(JSON.stringify(race),paused)}
 }
 assert(review.complete);assert.equal(review.correct,0);assert.equal(review.missed.length,questionCount);assert.equal(race.distance,race.totalDistance);
}
const perfect=new Race();perfect.juice=100;
while(perfect.state==='race')perfect.update(.05,{gas:true,left:perfect.x>.08,right:perfect.x<-.08});
assert(perfect.time>38&&perfect.time<41);assert(perfect.juice<5,'perfect charge nearly depleted at checkpoint');
const empty=new Race();empty.juice=0;for(let i=0;i<100;i++)empty.update(.05,{gas:true});assert.equal(empty.speed,280);assert.equal(empty.state,'race');
const sprint=new Race();sprint.rivals=[];sprint.juice=100;for(let i=0;i<16;i++)sprint.update(.05,{gas:true});assert.equal(sprint.speed,460);
const fuel=sprint.juice;for(let i=0;i<10;i++)sprint.update(.05,{gas:true,brake:true});assert.equal(sprint.speed,0);assert.equal(sprint.juice,fuel);
sprint.boost=3;for(let i=0;i<22;i++)sprint.update(.05,{gas:true});assert.equal(sprint.speed,620);
assert.equal(JUICE_DRAIN,2.5);
assert.throws(()=>new ReviewSession({...bank,questions:bank.questions.slice(0,10)},{questionCount:16}));
const allCorrect=new ReviewSession(bank,{questionCount:8,laps:3});while(!allCorrect.complete)allCorrect.answer(allCorrect.question.answer);assert.equal(allCorrect.firstCorrect,8);assert.equal(allCorrect.correct,24);
console.log('PASS: 8/12/16 questions × 1/2/3/5 laps, same unique questions shuffled each lap, four-question batches, fixed gates, all-wrong completion, countdown freezes grid, perfect-charge checkpoint timing, empty-fuel driving, brake priority and repetition scores.');

const momentum=new Race();momentum.rivals=[];momentum.speed=620;momentum.juice=0;
for(let i=0;i<20;i++)momentum.update(.05,{gas:true,left:momentum.x>.08,right:momentum.x<-.08});
assert(momentum.speed>590,'fuel loss retains high-speed momentum');
for(let i=0;i<280;i++)momentum.update(.05,{gas:true,left:momentum.x>.08,right:momentum.x<-.08});assert(momentum.speed>=280);
const fall=new Race();fall.speed=460;fall.x=1.2;fall.update(.05,{gas:true});assert.equal(fall.state,'recovering');assert.equal(fall.falls,1);
const rivals=fall.rivals[0].distance,distance=fall.distance,charge=fall.juice;
for(let i=0;i<28;i++)fall.update(.05,{gas:true});assert.equal(fall.state,'race');assert.equal(fall.x,0);assert.equal(fall.distance,distance);assert.equal(fall.juice,charge);assert(fall.rivals[0].distance>rivals);assert.equal(fall.speed,368);
fall.state='countdown';fall.countdown=2;const grid=JSON.stringify(fall);
for(let i=0;i<39;i++)fall.update(.05,{gas:true});assert.equal(fall.state,'countdown');assert.equal(fall.speed,368);assert.equal(fall.distance,distance);assert.equal(fall.juice,charge);
fall.update(.05,{gas:true});assert.equal(fall.state,'race');assert.equal(fall.speed,368);
const unattended=new Race();unattended.juice=100;for(let i=0;i<800&&unattended.state==='race';i++)unattended.update(.05,{gas:true});assert.equal(unattended.state,'recovering','bends require steering');
console.log('PASS: gradual fuel-empty momentum, road fall with brief recovery and rival progress, steering required in bends, two-second restart preserves speed and fuel.');

const parked=new Race();parked.rivals=[];
for(let i=0;i<40;i++)parked.update(.05,{right:true,brake:true});
assert.equal(parked.x,0,'stationary car cannot slide sideways');
const steering=new Race();steering.rivals=[];steering.speed=460;
steering.update(.01,{gas:true,right:true});assert(steering.steering>0&&steering.steering<1);
for(let i=0;i<15;i++)steering.update(.02,{gas:true});
assert(steering.steering<.001,'steering centers promptly after release');
const contact=new Race();contact.speed=620;contact.juice=100;
contact.rivals=[{distance:20,x:0,speed:0,pace:420,color:'#ff667b'}];
contact.update(.05,{gas:true});assert.equal(contact.contacts,1,'swept contact catches a fast overtake');
assert(contact.speed>550,'light contact retains most momentum');assert(Math.abs(contact.x)<1.1);
const contactCount=contact.contacts;contact.rivals[0].distance=contact.distance;contact.rivals[0].x=contact.x;
contact.update(.05,{gas:true});assert.equal(contact.contacts,contactCount,'contact cooldown prevents repeated penalties');
const protectedCar=new Race();protectedCar.speed=460;protectedCar.shield=8;
protectedCar.rivals=[{distance:20,x:0,speed:0,pace:420,color:'#ff667b'}];
protectedCar.update(.05,{gas:true});assert.equal(protectedCar.speed,460,'shield absorbs contact speed loss');
const slowFall=new Race();slowFall.speed=50;slowFall.x=1.3;slowFall.update(.05,{brake:true});
for(let i=0;i<28;i++)slowFall.update(.05);assert.equal(slowFall.speed,0,'recovery cannot accelerate a stopped car');
const competitive=new Race();competitive.juice=100;
for(let i=0;i<600;i++)competitive.update(.05,{gas:true,left:competitive.x>.08,right:competitive.x<-.08});
assert(competitive.rivals.some(r=>Math.abs(r.distance-competitive.distance)<1500),'rivals remain in racing range at normal pace');
assert(competitive.rivals.every(r=>r.speed>390&&r.speed<480));
console.log('PASS: steering response and centering, stationary grip, swept light contact, cooldown, shields, fair recovery, competitive independent rival pace.');
