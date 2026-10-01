import test from 'node:test';
import assert from 'node:assert/strict';
import {adventure,createAdventure} from '../public/arcade-review-games/shared/top-down/map.js';
import {content} from '../public/arcade-review-games/shared/top-down/constitution.js';
import {createState,move,obstacle,interact,completeChallenge,exitReady,resetPuzzle} from '../public/arcade-review-games/shared/top-down/model.js';
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
test('Medium allocates ten unique questions across four encounters and shuffles choices',()=>{
 const map=createAdventure('medium'),r=createReview(map,content.questions,()=>0);
 const entries=Object.values(r.encounters).flatMap(e=>e.questions);
 assert.equal(entries.length,10);assert.equal(new Set(entries.map(e=>e.question.id)).size,10);
 assert.equal(r.encounters['hammer-pickup'].questions.length,2);
 assert.equal(r.encounters.archive.questions.length,3);
 assert.equal(r.encounters['seal-crystal'].questions.length,2);
 assert.equal(r.encounters['power-chest'].questions.length,3);
 assert.notDeepEqual(entries[0].question.choices,content.questions.find(q=>q.id===entries[0].question.id).choices);
 assert.equal(adventure.objects.find(o=>o.id==='hammer-pickup').type,'tool');
 assert.equal(createReview(createAdventure('easy'),content.questions).encounters.archive.questions.length,1);
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
 assert.deepEqual(reviewSummary(s.review),{total:10,completed:2,firstTry:1,attempts:3});
});
test('Medium route earns all four rewards and wins with real movement',()=>{
 const map=createAdventure('medium'),s=createState(map);s.review=createReview(map,content.questions);
 for(const dir of ['up','up','up','right','right'])assert.equal(move(map,s,dir),true);
 go(map,s,11,9);s.facing='right';assert.equal(interact(map,s).id,'hammer-pickup');earn(map,s,'hammer-pickup');
 go(map,s,9,3);s.facing='right';assert.equal(interact(map,s).id,'archive');earn(map,s,'archive');
 go(map,s,4,5);assert.equal(move(map,s,'up'),true);
 go(map,s,4,3);s.facing='up';assert.equal(interact(map,s).id,'seal-crystal');earn(map,s,'seal-crystal');
 go(map,s,13,6);assert.equal(move(map,s,'right'),true);
 go(map,s,17,2);s.facing='right';assert.equal(interact(map,s).id,'power-chest');earn(map,s,'power-chest');
 go(map,s,15,3);s.facing='right';interact(map,s);
 go(map,s,17,6);s.facing='right';interact(map,s);
 go(map,s,15,3);s.facing='right';interact(map,s);
 go(map,s,18,10);assert.equal(interact(map,s).type,'win');
 assert.equal(s.score,1000);assert.deepEqual(reviewSummary(s.review),{total:10,completed:10,firstTry:10,attempts:10});
});
test('signal puzzle cannot claim the exit is open before the power-cell reward',()=>{
 const map=createAdventure('medium'),s=createState(map);s.items.push('seal-crystal');
 for(const [x,y] of [[15,3],[17,6],[15,3]]){s.player={x,y};s.facing='right';var result=interact(map,s);}
 assert.match(result.text,/missing supplies/);assert.equal(exitReady(map,s,map.objects.find(o=>o.type==='exit')),false);
});
test('insufficient and invalid question banks fail before an adventure starts',()=>{
 assert.throws(()=>createReview(createAdventure('medium'),content.questions.slice(0,4)),/unique questions/);
 assert.throws(()=>createReview(adventure,[content.questions[0],content.questions[0]]),/IDs/);
});
