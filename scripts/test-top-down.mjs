import test from 'node:test';
import assert from 'node:assert/strict';
import { adventure as map } from '../public/arcade-review-games/shared/top-down/map.js';
import {createState,move,interact,doorOpen,completeChallenge,undo,resetPuzzle,shuffle} from '../public/arcade-review-games/shared/top-down/model.js';
const walk=(state,dir,count=1)=>{for(let i=0;i<count;i++)assert.equal(move(map,state,dir),true,`${dir} at ${JSON.stringify(state.player)}`);};
function firstSeal(state){walk(state,'up',3);walk(state,'right',2);assert.equal(doorOpen(map,state,map.doors[0]),true);walk(state,'up');walk(state,'right',2);walk(state,'down');walk(state,'right',2);}
test('full adventure can be completed using real movement and interactions',()=>{
 const s=createState(map);firstSeal(s);
 walk(s,'up',3);walk(s,'right');assert.deepEqual(interact(map,s),{type:'challenge',id:'archive'});
 s.attempts.archive=1;assert.equal(completeChallenge(map,s,'archive'),true);assert.equal(completeChallenge(map,s,'archive'),false);assert.equal(s.score,100);
 walk(s,'down',3);walk(s,'right',4);assert.equal(interact(map,s).type,'message');assert.equal(s.opened.includes('east'),true);assert.equal(s.keys.length,0);
 walk(s,'right',2);walk(s,'up',3);assert.equal(move(map,s,'right'),false);interact(map,s);
 walk(s,'down',3);walk(s,'right',2);assert.equal(move(map,s,'right'),false);interact(map,s);
 walk(s,'down',4);walk(s,'right');assert.equal(interact(map,s).type,'win');assert.equal(s.won,true);assert.equal(move(map,s,'left'),false);
});
test('locked gates cannot be bypassed and final exit needs both switches',()=>{
 const s=createState(map);walk(s,'up',3);walk(s,'up');walk(s,'right',4);walk(s,'down');assert.equal(move(map,s,'right'),false);
 s.player={x:18,y:10};assert.equal(interact(map,s).type,'message');assert.equal(s.won,false);
});
test('undo restores a pushed block and resetting a stuck puzzle preserves rewards',()=>{
 const s=createState(map);walk(s,'up',3);walk(s,'right');assert.equal(s.blocks[0].x,4);undo(s);assert.equal(s.blocks[0].x,3);assert.deepEqual(s.player,{x:2,y:6});
 s.attempts.archive=2;completeChallenge(map,s,'archive');s.activated.push('north-switch');resetPuzzle(map,s);
 assert.deepEqual(s.player,map.start);assert.deepEqual(s.blocks,map.blocks);assert.deepEqual(s.keys,['archive']);assert.deepEqual(s.activated,['north-switch']);assert.equal(s.score,50);
 const fresh=createState(map);assert.equal(fresh.score,0);assert.equal(fresh.keys.length,0);assert.equal(fresh.history.length,0);
});
test('question shuffling preserves correct-answer identity and source data',()=>{
 const items=['answer','b','c'];const result=shuffle(items,()=>0);assert.deepEqual(items,['answer','b','c']);assert.deepEqual(new Set(result),new Set(items));assert.notDeepEqual(result,items);
});
