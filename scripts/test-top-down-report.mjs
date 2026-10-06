import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport,reportText} from '../public/arcade-review-games/shared/top-down/report.js';
import {createAdventure} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {content} from '../public/arcade-review-games/shared/top-down/scientific-method.js';
import {createState} from '../public/arcade-review-games/shared/top-down/model.js';
import {createReview,answerReview} from '../public/arcade-review-games/shared/top-down/review.js';
import {encodeSave,decodeSave} from '../public/arcade-review-games/shared/top-down/save.js';
import {createMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
function fixture(){const map=createAdventure(),state=createState(map);state.review=createReview(map,content.questions);return {map,state};}
test('unattempted work has no accuracy; unfinished adventures remain marked in progress',()=>{
 const {map,state}=fixture(),r=buildReport(map,content,state,0);
 assert.equal(r.total,6);assert.equal(r.attempted,0);assert.equal(r.firstTryAccuracy,null);assert.equal(r.retries,0);assert.equal(r.complete,false);
 assert.match(reportText(r),/Not yet available/);assert.match(reportText(r),/Adventure: In progress/);
});
test('report distinguishes correct answers, initial errors, repeated attempts and unanswered questions',()=>{
 const {map,state}=fixture(),[id,e]=Object.entries(state.review.encounters)[0];
 const first=e.questions[0].question;answerReview(state.review,id,first.answer);
 const second=e.questions[1].question,wrong=second.choices.find(c=>c!==second.answer);
 answerReview(state.review,id,wrong);answerReview(state.review,id,wrong);
 let r=buildReport(map,content,state,125.9,{student:'  Alex  ',created:'2026-10-06T12:00:00Z'});
 assert.equal(r.completed,1);assert.equal(r.attempted,2);assert.equal(r.firstTryAccuracy,50);assert.equal(r.attempts,2);assert.equal(r.retries,0);
 answerReview(state.review,id,second.answer);r=buildReport(map,content,state,125.9,{student:'Alex'});
 assert.equal(r.completed,2);assert.equal(r.attempts,3);assert.equal(r.retries,1);assert.equal(r.firstTryAccuracy,50);
 const text=reportText(r);assert.match(text,/Student: Alex/);assert.match(text,/2m 5s/);assert.match(text,/1 correct on the first try \/ 2 attempted/);
 assert.deepEqual(r.questions[1].responses,[wrong,second.answer]);
 // No answer key or explanations are exported for questions the player has not answered.
 assert.equal(r.questions[2].responses.length,0);assert.equal('answer' in r.questions[2],false);
});
test('reports survive save/resume and keep treasure points separate from academic performance',()=>{
 const {map,state}=fixture(),[id,e]=Object.entries(state.review.encounters)[0];answerReview(state.review,id,e.questions[0].question.answer);
 const saved=decodeSave(encodeSave(map,content.questions,state,createMotion(state),60),createAdventure,content.questions);
 assert.deepEqual(buildReport(map,content,saved.state,60,{created:'same'}),buildReport(map,content,state,60,{created:'same'}));
 state.collected.push('field-token');state.score=100;state.won=true;
 const r=buildReport(map,content,state,60);assert.equal(r.complete,true);assert.equal(r.points.reviewPoints,100);assert.equal(r.points.bonusPoints,50);assert.equal(r.firstTryAccuracy,100);
});
