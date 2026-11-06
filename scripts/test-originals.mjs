import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QUESTION_SETS,loadQuestionSet} from '../public/review-lab/catalog.js';
import {originalCopy} from '../public/teacher/originals.js';
import {setInput,teacherBank} from '../public/teacher/set-contract.js';
import {prepareQuestionDeck,categoryClashBoard} from '../public/review-lab/question-decks.js';
import {prepareSnowQuestions} from '../public/review-lab/snow-day-defenders/question-adapter.js';
import {validateQuestions} from '../public/review-lab/snow-day-defenders/gear.js';
import {CrossingWorld} from '../public/arcade-review-games/crossing-quest/engine.js';
import {ReviewSession} from '../public/review-lab/raceway-rivals/engine.js';
import {createSession,command} from '../public/review-lab/treasure-trail/engine.js';
const id='00000000-0000-4000-8000-000000000001';
test('every official bank copies independently with all questions, answers and explanations',async()=>{
 for(const meta of QUESTION_SETS){
  const bank=await loadQuestionSet(meta.id),before=JSON.stringify(bank),copy=originalCopy(bank);
  assert.equal(copy.visibility,'private');if(bank.subject==='English Language Arts')assert.equal(copy.subject,'ELA');assert.equal(copy.questions.length,bank.questions.length);
  bank.questions.forEach((q,i)=>{assert.deepEqual(copy.questions[i].answer,q.answer);assert.equal(copy.questions[i].explanation,q.explanation||'');});
  copy.questions[0].choices[0]='Edited by teacher';copy.questions.splice(1);
  assert.equal(JSON.stringify(bank),before);
 }
});
for(const count of [1,2,4,5,10,11,12,25])test(`${count}-question sets publish and complete every fixed-size adapter`,async()=>{
 const source=await loadQuestionSet('us-history--world-war-i');const input=originalCopy(source);input.questions=Array.from({length:count},(_,i)=>structuredClone(input.questions[i%input.questions.length]));input.questions[0].answer=[0,2];
 const bank=teacherBank({...setInput({...input,visibility:'public'}),id});
 assert.equal(prepareQuestionDeck(bank).length,count);assert.equal(categoryClashBoard(bank).categories.flatMap(c=>c.questions).length,count);
 assert.equal(validateQuestions(prepareSnowQuestions(bank)).questions.length,count);
 const world=new CrossingWorld(bank);for(let stage=0;stage<3;stage++)for(const stop of ['island','finish']){world.openCheckpoint(stop);for(let q=0;q<2;q++){assert.ok(world.question);assert.equal(world.answer(world.question.answer),true);world.continueAnswer();}}
 assert.equal(world.records.length,12);assert.equal(world.correct,12);
 const race=new ReviewSession(bank,{questionCount:16,laps:2});while(!race.complete)race.answer(race.question.answer);assert.equal(race.correct,32);
 const trail=createSession({bank,seed:1});
 for(let round=0;round<3;round++){
  trail.players.solo.x=trail.world.chests[0].x;trail.players.solo.y=trail.world.chests[0].y;assert.equal(command(trail,{type:'open'}).ok,true);assert.equal(trail.quiz.questions.length,Math.min(5,count));
  while(trail.phase==='quiz'){const q=trail.quiz.questions[trail.quiz.index];assert.equal(command(trail,{type:'answer',questionId:q.id,choice:q.answer}).ok,true);assert.equal(command(trail,{type:'next'}).ok,true);}
 }
});
test('empty and unfinished sets stay private; copying retains multiple correct answers',async()=>{
 const bank=structuredClone(await loadQuestionSet('scientific-method'));bank.questions[0].answer=[0,2];const copy=originalCopy(bank);assert.deepEqual(copy.questions[0].answer,[0,2]);
 assert.equal(setInput({...copy,questions:[]}).visibility,'private');
 assert.throws(()=>setInput({...copy,questions:[],visibility:'public'}));
 assert.throws(()=>teacherBank({...copy,id,questions:[]}));
 assert.throws(()=>setInput({...copy,questions:[{...copy.questions[0],answer:[]}],visibility:'public'}));
});
