import test from 'node:test';
import assert from 'node:assert/strict';
import {adventure,createAdventure} from '../public/arcade-review-games/shared/top-down/map.js';
import {content} from '../public/arcade-review-games/shared/top-down/constitution.js';
import {createState,move,obstacle,interact,completeChallenge,exitReady,resetPuzzle,doorOpen,cluesReady} from '../public/arcade-review-games/shared/top-down/model.js';
import {createReview,answerReview,reviewSummary} from '../public/arcade-review-games/shared/top-down/review.js';
function go(map,s,x,y){
 const queue=[{...s.player,path:[]}],seen=new Set();
 while(queue.length){
  const here=queue.shift();
  if(here.x===x&&here.y===y){for(const dir of here.path)assert.equal(move(map,s,dir),true);return;}
  for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){
   const next={x:here.x+dx,y:here.y+dy},key=next.x+','+next.y;
   if(seen.has(key)||obstacle(map,s,next)||s.blocks.some(b=>b.x===next.x&&b.y===next.y))continue;
   seen.add(key);queue.push({...next,path:[...here.path,dir]});
  }
 }throw Error('Unreachable '+x+','+y);
}
function earn(map,s,id){
 const encounter=s.review.encounters[id];
 while(encounter.index<encounter.questions.length){
  const result=answerReview(s.review,id,encounter.questions[encounter.index].question.answer);
  assert.equal(result.type,'correct');
 }
 assert.equal(completeChallenge(map,s,id),true);
}
test('Hard completes the two-block gate, key chain, split clues and six-step code with real movement',()=>{
 const map=createAdventure('hard'),s=createState(map);s.review=createReview(map,content.questions);
 const encounters=Object.values(s.review.encounters);
 assert.equal(map.mode,'hard');assert.equal(encounters.length,6);
 assert.ok(encounters.every(e=>e.questions.length===2));
 assert.equal(new Set(encounters.flatMap(e=>e.questions.map(q=>q.question.id))).size,12);
 for(const dir of ['up','up','up','right','right'])assert.equal(move(map,s,dir),true);
 assert.equal(doorOpen(map,s,map.doors[0]),false);
 go(map,s,2,8);assert.equal(move(map,s,'right'),true);assert.equal(move(map,s,'right'),true);
 assert.equal(doorOpen(map,s,map.doors[0]),false);
 go(map,s,5,7);assert.equal(move(map,s,'down'),true);
 assert.equal(doorOpen(map,s,map.doors[0]),true);
 go(map,s,9,3);s.facing='right';assert.equal(interact(map,s).id,'archive');earn(map,s,'archive');
 go(map,s,10,11);assert.equal(move(map,s,'down'),false);assert.match(s.moveFeedback.text,/Workshop key/);
 go(map,s,11,9);s.facing='right';assert.equal(interact(map,s).id,'workshop-key-chest');earn(map,s,'workshop-key-chest');
 go(map,s,10,11);assert.equal(move(map,s,'down'),true);assert.match(s.moveFeedback.text,/Workshop key used/);
 assert.deepEqual(s.usedKeys,['workshop']);assert.deepEqual(s.keys,['archive']);
 go(map,s,10,15);assert.equal(move(map,s,'right'),true);
 go(map,s,12,14);s.facing='down';assert.match(interact(map,s).text,/Mirror rotated/);
 go(map,s,9,16);s.facing='left';assert.match(interact(map,s).text,/Bridge raised/);
 go(map,s,11,20);s.facing='right';assert.equal(interact(map,s).id,'hammer-pickup');earn(map,s,'hammer-pickup');
 go(map,s,4,5);assert.equal(move(map,s,'up'),true);
 go(map,s,4,3);s.facing='up';assert.equal(interact(map,s).id,'seal-crystal');earn(map,s,'seal-crystal');
 go(map,s,4,11);assert.equal(move(map,s,'down'),true);
 go(map,s,2,16);s.facing='right';assert.equal(interact(map,s).id,'lantern-chest');earn(map,s,'lantern-chest');
 go(map,s,4,20);s.facing='down';assert.match(interact(map,s).text,/PART 1/);
 assert.equal(cluesReady(map.puzzles[0],s),false);
 go(map,s,12,22);s.facing='right';assert.match(interact(map,s).text,/PART 2/);
 assert.equal(cluesReady(map.puzzles[0],s),true);
 go(map,s,13,6);assert.equal(move(map,s,'right'),true);assert.deepEqual(s.usedKeys,['workshop','archive']);
 go(map,s,17,2);s.facing='right';assert.equal(interact(map,s).id,'power-chest');earn(map,s,'power-chest');
 for(const id of map.puzzles[0].sequence){const o=map.objects.find(o=>o.id===id);go(map,s,o.x-1,o.y);s.facing='right';const result=interact(map,s);assert.doesNotMatch(result.text,/Next:/);}
 go(map,s,18,10);assert.equal(interact(map,s).type,'win');
 assert.equal(s.score,1200);assert.deepEqual(reviewSummary(s.review),{total:12,completed:12,firstTry:12,attempts:12});
});
test('Hard needs both clues and blocks, allows repeated switches, and keeps earned progress on recovery',()=>{
 const map=createAdventure('hard'),s=createState(map),p=map.puzzles[0];
 s.player={x:15,y:3};s.facing='right';s.discovered.push('signal-start');
 assert.match(interact(map,s).text,/both faded tablets/);assert.deepEqual(s.sequences,{});
 s.tools.push('lantern');s.player={x:12,y:22};s.facing='right';interact(map,s);
 s.player={x:15,y:3};interact(map,s);
 s.player={x:17,y:6};interact(map,s);interact(map,s);assert.equal(s.sequences.signals,3);
 interact(map,s);assert.equal(s.sequences.signals,0);assert.deepEqual(s.activated,[]);
 s.blocks[0]={id:'stone',x:5,y:6};s.blocks[1]={id:'second-stone',x:5,y:9};assert.equal(doorOpen(map,s,map.doors[0]),true);
 s.opened.push('workshop-gate');s.usedKeys.push('workshop');
 resetPuzzle(map,s);assert.equal(doorOpen(map,s,map.doors[0]),false);
 assert.equal(doorOpen(map,s,map.doors.find(d=>d.id==='workshop-gate')),true);
 assert.equal(cluesReady(p,s),true);assert.deepEqual(s.tools,['lantern']);assert.deepEqual(s.usedKeys,['workshop']);
});
test('Easy requires six unique questions in three chests while keeping loose tools and simple puzzles',()=>{
 const map=createAdventure('easy'),s=createState(map);s.review=createReview(map,content.questions);
 const encounters=Object.values(s.review.encounters),entries=encounters.flatMap(e=>e.questions);
 assert.equal(encounters.length,3);assert.ok(encounters.every(e=>e.questions.length===2));
 assert.equal(new Set(entries.map(e=>e.question.id)).size,6);
 assert.equal(map.objects.find(o=>o.id==='hammer-pickup').type,'tool');
 assert.equal(map.rooms.length,3);assert.equal(map.puzzles[0].sequence.length,3);
 for(const dir of ['up','up','up','right','right'])assert.equal(move(map,s,dir),true);
 go(map,s,12,9);assert.deepEqual(s.tools,['hammer']);
 go(map,s,9,3);s.facing='right';assert.equal(interact(map,s).id,'archive');
 answerReview(s.review,'archive',s.review.encounters.archive.questions[0].question.answer);
 assert.equal(completeChallenge(map,s,'archive'),false);assert.deepEqual(s.keys,[]);
 earn(map,s,'archive');
 go(map,s,4,5);assert.equal(move(map,s,'up'),true);
 go(map,s,4,3);s.facing='up';assert.equal(interact(map,s).id,'seal-crystal');earn(map,s,'seal-crystal');
 go(map,s,13,6);assert.equal(move(map,s,'right'),true);
 for(const [x,y] of [[15,3],[17,6],[15,3]]){go(map,s,x,y);s.facing='right';interact(map,s);}
 const exit=map.objects.find(o=>o.type==='exit');assert.equal(exitReady(map,s,exit),false);
 go(map,s,17,2);s.facing='right';assert.equal(interact(map,s).id,'power-chest');earn(map,s,'power-chest');
 go(map,s,18,10);assert.equal(interact(map,s).type,'win');
 assert.equal(s.score,600);assert.deepEqual(reviewSummary(s.review),{total:6,completed:6,firstTry:6,attempts:6});
});
test('Medium allocates twelve unique questions across five encounters and shuffles choices',()=>{
 const map=createAdventure('medium'),r=createReview(map,content.questions,()=>0);
 const entries=Object.values(r.encounters).flatMap(e=>e.questions);
 assert.equal(entries.length,12);assert.equal(new Set(entries.map(e=>e.question.id)).size,12);
 assert.equal(r.encounters['hammer-pickup'].questions.length,2);
 assert.equal(r.encounters.archive.questions.length,3);
 assert.equal(r.encounters['seal-crystal'].questions.length,2);
 assert.equal(r.encounters['power-chest'].questions.length,3);
 assert.notDeepEqual(entries[0].question.choices,content.questions.find(q=>q.id===entries[0].question.id).choices);
 assert.equal(adventure.objects.find(o=>o.id==='hammer-pickup').type,'tool');
 assert.equal(createReview(createAdventure('easy'),content.questions).encounters.archive.questions.length,2);
});
test('partial encounters cannot award rewards; retries and recovery preserve progress',()=>{
 const map=createAdventure('medium'),s=createState(map);s.review=createReview(map,content.questions);
 const encounter=s.review.encounters['hammer-pickup'],entry=encounter.questions[0];
 assert.equal(completeChallenge(map,s,'hammer-pickup'),false);
 const wrong=entry.question.choices.find(c=>c!==entry.question.answer);
 assert.equal(answerReview(s.review,'hammer-pickup',wrong).type,'wrong');
 assert.equal(answerReview(s.review,'hammer-pickup',wrong).type,'ignored');
 assert.equal(answerReview(s.review,'hammer-pickup',entry.question.answer).type,'correct');
 resetPuzzle(map,s);assert.equal(encounter.index,1);assert.deepEqual(s.tools,[]);
 assert.equal(completeChallenge(map,s,'hammer-pickup'),false);
 earn(map,s,'hammer-pickup');assert.deepEqual(s.tools,['hammer']);assert.equal(s.score,150);
 assert.equal(completeChallenge(map,s,'hammer-pickup'),false);assert.equal(s.score,150);
 assert.deepEqual(reviewSummary(s.review),{total:12,completed:2,firstTry:1,attempts:3});
});
test('Medium route earns all five rewards and wins with real movement',()=>{
 const map=createAdventure('medium'),s=createState(map);s.review=createReview(map,content.questions);
 for(const dir of ['up','up','up','right','right'])assert.equal(move(map,s,dir),true);
 go(map,s,10,19);s.facing='right';assert.equal(interact(map,s).id,'hammer-pickup');earn(map,s,'hammer-pickup');
 go(map,s,9,3);s.facing='right';assert.equal(interact(map,s).id,'archive');earn(map,s,'archive');
 go(map,s,4,5);assert.equal(move(map,s,'up'),true);
 go(map,s,4,3);s.facing='up';assert.equal(interact(map,s).id,'seal-crystal');earn(map,s,'seal-crystal');
 go(map,s,4,11);assert.equal(move(map,s,'down'),true);
 go(map,s,2,16);s.facing='right';assert.equal(interact(map,s).id,'lantern-chest');earn(map,s,'lantern-chest');
 go(map,s,4,20);s.facing='down';assert.match(interact(map,s).text,/BOTTOM → TOP → BOTTOM → TOP/);
 assert.deepEqual(s.discovered,['signal-code']);
 go(map,s,13,6);assert.equal(move(map,s,'right'),true);
 go(map,s,17,2);s.facing='right';assert.equal(interact(map,s).id,'power-chest');earn(map,s,'power-chest');
 for(const [x,y] of [[17,6],[15,3],[17,6],[15,3]]){go(map,s,x,y);s.facing='right';interact(map,s);}
 go(map,s,18,10);assert.equal(interact(map,s).type,'win');
 assert.equal(s.score,1200);assert.deepEqual(reviewSummary(s.review),{total:12,completed:12,firstTry:12,attempts:12});
});
test('signal puzzle cannot claim the exit is open before the power-cell reward',()=>{
 const map=createAdventure('medium'),s=createState(map);s.items.push('seal-crystal');s.discovered.push('signal-code');
 for(const [x,y] of [[17,6],[15,3],[17,6],[15,3]]){s.player={x,y};s.facing='right';var result=interact(map,s);}
 assert.match(result.text,/missing supplies/);assert.equal(exitReady(map,s,map.objects.find(o=>o.type==='exit')),false);
});
test('insufficient and invalid question banks fail before an adventure starts',()=>{
 assert.throws(()=>createReview(createAdventure('medium'),content.questions.slice(0,4)),/unique questions/);
 assert.throws(()=>createReview(adventure,[content.questions[0],content.questions[0]]),/IDs/);
});

test('library inscription requires the lantern; journal and progress survive reset',()=>{
 const map=createAdventure('medium'),s=createState(map);
 s.player={x:4,y:20};s.facing='down';
 assert.match(interact(map,s).text,/Earn the lantern/);assert.deepEqual(s.discovered,[]);
 s.player={x:17,y:6};s.facing='right';assert.match(interact(map,s).text,/Use your lantern/);assert.deepEqual(s.sequences,{});
 s.tools.push('lantern');s.player={x:4,y:20};s.facing='down';
 assert.match(interact(map,s).text,/BOTTOM → TOP → BOTTOM → TOP/);
 interact(map,s);assert.deepEqual(s.discovered,['signal-code']);
 resetPuzzle(map,s);assert.deepEqual(s.discovered,['signal-code']);assert.deepEqual(s.tools,['lantern']);
 s.player={x:15,y:3};s.facing='right';assert.match(interact(map,s).text,/reset/);assert.equal(s.sequences.signals,0);
 s.player={x:17,y:6};s.facing='right';interact(map,s);assert.equal(s.sequences.signals,1);
});
test('Medium geometry has five room views with floor objects and south branches',()=>{
 const map=createAdventure('medium');assert.equal(map.rooms.length,5);assert.equal(map.tiles.length,25);
 assert.ok(map.tiles.every(row=>row.length===21));
 for(const o of [...map.objects,...map.doors,...map.plates,...map.blocks])assert.equal(map.tiles[o.y][o.x],'.',o.id);
 for(const point of [{x:10,y:12},{x:10,y:13},{x:4,y:12},{x:4,y:13}]){
  assert.equal(map.rooms.filter(r=>point.x>=r.min&&point.x<=r.max&&point.y>=r.minY&&point.y<=r.maxY).length,1);
 }
 assert.equal(createAdventure('easy').tiles.length,13);
});
