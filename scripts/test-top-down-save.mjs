import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeSave,decodeSave,createSaveStore} from '../public/arcade-review-games/shared/top-down/save.js';
import {createAdventure} from '../public/arcade-review-games/shared/top-down/map.js';
import {content} from '../public/arcade-review-games/shared/top-down/constitution.js';
import {createState} from '../public/arcade-review-games/shared/top-down/model.js';
import {createMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
import {createReview,answerReview} from '../public/arcade-review-games/shared/top-down/review.js';
const fixture=()=>{const map=createAdventure('hard'),state=createState(map);state.review=createReview(map,content.questions);return {map,state,motion:createMotion(state)};};
test('save restores difficulty, fractional position, rewards, puzzles, undo and shuffled review attempts',()=>{
 const {map,state,motion}=fixture();motion.x+=.15;
 state.keys.push('library');state.opened.push('test-gate');state.sequences.signal=2;state.discovered.push('clue');
 state.history.push({player:{...state.player},blocks:structuredClone(state.blocks)});
 const [id,encounter]=Object.entries(state.review.encounters)[0],q=encounter.questions[0].question;
 answerReview(state.review,id,q.choices.find(c=>c!==q.answer));
 const saved=decodeSave(encodeSave(map,content.questions,state,motion,73.5),createAdventure,content.questions);
 assert.deepEqual(saved.state,state);assert.deepEqual(saved.position,{x:motion.x,y:motion.y});assert.equal(saved.elapsed,73.5);assert.equal(saved.mode,'hard');
 answerReview(saved.state.review,id,q.answer);
 const next=decodeSave(encodeSave(map,content.questions,saved.state,motion,74),createAdventure,content.questions);
 assert.equal(next.state.review.encounters[id].index,1);
 assert.deepEqual(next.state.review.encounters[id].questions, saved.state.review.encounters[id].questions);
});
test('bad saves and changed map/question content are rejected without breaking startup',()=>{
 const {map,state,motion}=fixture(),raw=encodeSave(map,content.questions,state,motion,0);
 for(const bad of [null,'broken','{}',raw.replace('checksum','bad-checksum')])assert.equal(decodeSave(bad,createAdventure,content.questions),null);
 assert.equal(decodeSave(raw,createAdventure,content.questions.map(q=>({...q,text:q.text+' changed'}))),null);
 assert.equal(decodeSave(raw,mode=>({...createAdventure(mode),start:{x:2,y:2}}),content.questions),null);
 state.player.x=999;assert.equal(decodeSave(encodeSave(map,content.questions,state,motion,0),createAdventure,content.questions),null);
});
test('completed games are not offered as unfinished saves',()=>{
 const {map,state,motion}=fixture();state.won=true;
 assert.equal(decodeSave(encodeSave(map,content.questions,state,motion,0),createAdventure,content.questions),null);
});
test('storage isolates adventures and handles quota/blocked access safely',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const a=createSaveStore('a',()=>storage),b=createSaveStore('b',()=>storage);
 assert.equal(a.write('saved'),true);assert.equal(a.read(),'saved');assert.equal(b.read(),null);a.clear();assert.equal(a.read(),null);
 const blocked=createSaveStore('a',()=>{throw Error('blocked');});
 assert.equal(blocked.write('saved'),false);assert.equal(blocked.read(),null);blocked.clear();
 const quota=createSaveStore('a',()=>({...storage,setItem(){throw Error('quota');}}));assert.equal(quota.write('saved'),false);
});
