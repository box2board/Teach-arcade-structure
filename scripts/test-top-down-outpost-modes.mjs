import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createAdventure} from '../public/arcade-review-games/shared/top-down/outpost.js';
import {content} from '../public/arcade-review-games/shared/top-down/scientific-method.js';
import {createState,move,interact,doorOpen,resetPuzzle,exitReady} from '../public/arcade-review-games/shared/top-down/model.js';
import {createReview,answerReview,reviewSummary} from '../public/arcade-review-games/shared/top-down/review.js';
import {completeChallenge} from '../public/arcade-review-games/shared/top-down/model.js';
import {validateAdventure} from '../public/arcade-review-games/shared/top-down/validate.js';
import {encodeSave,decodeSave} from '../public/arcade-review-games/shared/top-down/save.js';
import {createMotion} from '../public/arcade-review-games/shared/top-down/motion.js';
for(const mode of ['medium','hard']){
 test(mode+' full DOM route earns crank, balances all crates, crosses canal, wins and resumes',()=>{
   const result=spawnSync(process.execPath,['scripts/test-top-down-outpost-ui.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,QUEST_OUTPOST_MODE:mode},encoding:'utf8'});
   assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 });
 test(mode+' needs all counterweights and a review-earned crank; canal has one crossing',()=>{
   const map=validateAdventure(createAdventure(mode)),s=createState(map);s.review=createReview(map,content.questions);
   assert.equal(reviewSummary(s.review).total,mode==='hard'?12:8);
   const gate=map.doors.find(d=>d.id==='beacon-gate');
   s.items=['lens','cell'];assert.equal(exitReady(map,s,map.objects.find(o=>o.type==='exit')),false,'Supplies alone cannot bypass the drawbridge requirement');
   for(let i=0;i<gate.plates.length;i++){
     assert.equal(doorOpen(map,s,gate),false);
     const p=map.plates.find(p=>p.id===gate.plates[i]),b=s.blocks.filter(b=>b.kind!=='mirror')[i];b.x=p.x;b.y=p.y;
   }
   assert.equal(doorOpen(map,s,gate),true);
   const b=s.blocks.find(b=>b.kind!=='mirror');b.x--;assert.equal(doorOpen(map,s,gate),false);
   s.player={x:19,y:9};s.facing='down';assert.match(interact(map,s).text,/crank required/i);assert.equal(s.opened.includes('beacon-drawbridge'),false);
   s.player={x:20,y:10};assert.equal(move(map,s,'down'),false);
   const encounter=s.review.encounters['crank-chest'];answerReview(s.review,'crank-chest',encounter.questions[0].question.answer);
   assert.equal(completeChallenge(map,s,'crank-chest'),false);assert.equal(s.tools.includes('crank'),false);
   while(encounter.index<encounter.questions.length)answerReview(s.review,'crank-chest',encounter.questions[encounter.index].question.answer);
   assert.equal(completeChallenge(map,s,'crank-chest'),true);
   s.player={x:19,y:9};assert.match(interact(map,s).text,/Drawbridge/);assert.equal(s.tools.includes('crank'),true);
   s.player={x:20,y:10};assert.equal(move(map,s,'down'),true);
   for(let x=13;x<=23;x++)assert.equal(map.tiles[11][x],x===20?'.':'~');
   s.items=['lens','cell'];assert.equal(exitReady(map,s,map.objects.find(o=>o.type==='exit')),true);
   resetPuzzle(map,s);assert.equal(s.opened.includes('beacon-drawbridge'),true);assert.equal(s.tools.includes('crank'),true);
   const restored=decodeSave(encodeSave(map,content.questions,s,createMotion(s),20),createAdventure,content.questions);
   assert.equal(restored.state.tools.includes('crank'),true);assert.equal(restored.state.opened.includes('beacon-drawbridge'),true);
 });
}
test('bridge control configurations require a real tool or receiver and a real bridge',()=>{
 let map=createAdventure('medium');map.objects.find(o=>o.id==='beacon-lift').requiresTool='missing';assert.throws(()=>validateAdventure(map),/unknown tool/);
 map=createAdventure('medium');delete map.objects.find(o=>o.id==='beacon-lift').requiresTool;assert.throws(()=>validateAdventure(map),/receiver and bridge/);
 map=createAdventure('medium');map.objects.find(o=>o.id==='beacon-lift').bridge='missing';assert.throws(()=>validateAdventure(map),/receiver and bridge/);
});
test('a combined tool and receiver bridge requires both and consumes neither tool nor earned progress',()=>{
 const map=createAdventure('medium'),lift=map.objects.find(o=>o.id==='beacon-lift');lift.receiver='optics-receiver';validateAdventure(map);
 const s=createState(map);s.player={x:19,y:9};s.facing='down';
 assert.match(interact(map,s).text,/crank required/i);
 s.tools.push('crank');assert.match(interact(map,s).text,/light power/);assert.equal(s.opened.includes(lift.bridge),false);
 const mirror=s.blocks.find(b=>b.kind==='mirror');mirror.x=5;mirror.y=3;mirror.orientation='\\';
 assert.match(interact(map,s).text,/Drawbridge/);assert.equal(s.tools.includes('crank'),true);
 const activated=s.activated.length;assert.match(interact(map,s).text,/safe to cross/);assert.equal(s.activated.length,activated);
});
