import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure as courthouse} from '../public/arcade-review-games/shared/top-down/map.js';
import {createAdventure as outpost} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {content} from '../public/arcade-review-games/shared/top-down/scientific-method.js';
import {validateAdventure} from '../public/arcade-review-games/shared/top-down/validate.js';
import {roomAt,objectiveFor,progressFor,rewardFor} from '../public/arcade-review-games/shared/top-down/presentation.js';
import {createState,move,obstacle,interact,completeChallenge,exitReady,resetPuzzle,adventureResults} from '../public/arcade-review-games/shared/top-down/model.js';
import {createReview,answerReview,reviewSummary} from '../public/arcade-review-games/shared/top-down/review.js';
function go(map,s,x,y){
 const queue=[{...s.player,path:[]}],seen=new Set();
 while(queue.length){const p=queue.shift();if(p.x===x&&p.y===y){p.path.forEach(d=>assert.equal(move(map,s,d),true));return;}
  for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){const next={x:p.x+dx,y:p.y+dy},id=next.x+','+next.y;if(seen.has(id)||obstacle(map,s,next)||s.blocks.some(b=>b.x===next.x&&b.y===next.y))continue;seen.add(id);queue.push({...next,path:[...p.path,dir]});}
 }throw Error('Unreachable '+x+','+y);
}
function earn(map,s,id){const e=s.review.encounters[id];while(e.index<e.questions.length)answerReview(s.review,id,e.questions[e.index].question.answer);assert.equal(completeChallenge(map,s,id),true);}
test('all adventures satisfy the reusable map contract',()=>{
 for(const mode of ['easy','medium','hard'])assert.equal(validateAdventure(courthouse(mode)).mode,mode);
 assert.equal(validateAdventure(outpost()).title,'Mosslight Outpost');
});
test('Outpost completes a distinct wide-room route with different keys, supplies and no sequence puzzle',()=>{
 const map=validateAdventure(outpost()),s=createState(map);s.review=createReview(map,content.questions);
 assert.equal(map.tiles.length,17);assert.equal(map.tiles[0].length,25);for(const room of map.rooms)assert.equal(room.viewMax-room.viewMin+1,13);assert.equal(map.rooms.length,4);assert.deepEqual(map.puzzles,[]);
 assert.deepEqual(progressFor(map,s),{label:'Stations',completed:0,total:4});
 go(map,s,9,12);s.facing='up';assert.equal(interact(map,s).id,'survey-chest');earn(map,s,'survey-chest');
 go(map,s,4,9);assert.equal(move(map,s,'up'),true);assert.match(s.moveFeedback.text,/Moss key used/);
 go(map,s,3,3);assert.equal(move(map,s,'right'),true);assert.match(interact(map,s).text,/CROSS/);
 go(map,s,10,4);s.facing='down';assert.match(interact(map,s).text,/Bridge raised/);
 go(map,s,9,6);s.facing='right';assert.equal(interact(map,s).id,'lens-chest');earn(map,s,'lens-chest');
 go(map,s,20,2);s.facing='right';assert.equal(interact(map,s).id,'cell-chest');earn(map,s,'cell-chest');
 go(map,s,14,6);for(let i=0;i<4;i++)assert.equal(move(map,s,'right'),true);
 go(map,s,16,7);assert.equal(move(map,s,'down'),true);assert.equal(move(map,s,'down'),true);
 assert.equal(roomAt(map,16,9).name,'04 · Beacon');assert.match(objectiveFor(map,s,roomAt(map,16,9)),/restore/);
 assert.deepEqual(progressFor(map,s),{label:'Stations',completed:4,total:4});
 go(map,s,22,14);assert.equal(adventureResults(map,s).bonusPoints,50);
 go(map,s,20,12);assert.equal(interact(map,s).type,'win');assert.equal(s.score,600);
 assert.deepEqual(reviewSummary(s.review),{total:6,completed:6,firstTry:6,attempts:6});
});
test('Outpost exit cannot bypass required review supplies and reset keeps the crossing and key use',()=>{
 const map=outpost(),s=createState(map),exit=map.objects.find(o=>o.id==='beacon');
 s.items=['cell'];assert.equal(exitReady(map,s,exit),false);s.items.push('lens');assert.equal(exitReady(map,s,exit),true);
 s.opened=['dock-gate','east-crossing'];s.usedKeys=['moss'];resetPuzzle(map,s);
 assert.deepEqual(s.opened,['dock-gate','east-crossing']);assert.deepEqual(s.usedKeys,['moss']);assert.equal(s.blocks.find(b=>b.kind==='mirror').x,4);
 const reward=rewardFor(map,{key:'moss'});assert.equal(reward.label,'Moss key');
});
test('configuration errors fail before play instead of silently producing broken maps',()=>{
 let map=outpost();map.objects[0].id=map.objects[1].id;assert.throws(()=>validateAdventure(map),/unique/);
 map=outpost();map.doors[1].plate='missing';assert.throws(()=>validateAdventure(map),/unknown plate/);
 map=outpost();map.objects.find(o=>o.type==='challenge').reward.value='missing';assert.throws(()=>validateAdventure(map),/unknown reward/);
 map=outpost();map.rooms[0].viewMax=99;assert.throws(()=>validateAdventure(map),/camera bounds/);
 map=outpost();map.objects.find(o=>o.type==='challenge').questionCount=0;assert.throws(()=>validateAdventure(map),/question count/);
 map=outpost();map.objects.find(o=>o.type==='bridgeSwitch').receiver='missing';assert.throws(()=>validateAdventure(map),/receiver and bridge/);
 map=outpost();map.rooms[0].objectiveRules[0].when.opened=['missing'];assert.throws(()=>validateAdventure(map),/condition reference/);
});
