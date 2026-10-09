import {createWorld} from './world.js';
import {prepareQuestionDeck} from '../question-decks.js';
export const RULES=Object.freeze({version:1,juicePerCorrect:12,digCost:4,digCooldown:650,restoreMs:6500,chestQuestions:5,speed:185});
export const JEWELS=Object.freeze([{id:'amethyst',name:'Amethyst',value:10,color:'#c997ff',weight:30},{id:'emerald',name:'Emerald',value:20,color:'#5aeead',weight:17},{id:'ruby',name:'Ruby',value:40,color:'#ff5e80',weight:9.5},{id:'diamond',name:'Diamond',value:100,color:'#b3f6ff',weight:3.5}]);
export function createSession({bank,duration=120,seed=Date.now(),avatar=0}={}){
 if(![120,300,600].includes(duration))throw Error('Choose a supported session length.');
 let rng=seed>>>0;const random=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296};
 const world=createWorld(seed);const player={id:'solo',x:800,y:888,juice:0,score:0,jewels:0,dug:0,answered:0,correct:0,emptyStreak:0,lastDig:-650,collection:Object.fromEntries(JEWELS.map(j=>[j.id,0]))};
 const session={id:'trail-'+seed,rulesVersion:RULES.version,mode:'solo',bankId:bank.id,bankTitle:bank.title,duration:duration*1000,elapsed:0,phase:'play',avatar,world,players:{solo:player},quiz:null,events:[],sequence:0,deck:prepareQuestionDeck(bank,random),cursor:0,bank,random,attempts:[]};
 return session;
}
function emit(s,type,data){const event={sequence:++s.sequence,at:s.elapsed,type,...data};s.events.push(event);return event;}
export function advance(s,ms){if(s.phase==='end'||s.phase==='paused')return;s.elapsed=Math.min(s.duration,s.elapsed+Math.max(0,ms));if(s.elapsed===s.duration){s.phase='end';s.quiz=null;emit(s,'session-ended',{});}}
export function nearestChest(s,id='solo'){const p=s.players[id];return s.world.chests.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<65)}
export function nearestPatch(s,id='solo'){const p=s.players[id];return s.world.plots.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<43).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]}
function blocked(s,x,y){return s.world.trees.some(t=>Math.hypot(x-t.x,(y-t.y)*1.4)<18*t.s)||s.world.stones.some(r=>Math.hypot(x-r.x,(y-r.y)*1.3)<r.s+9)||Math.hypot((x-144)/1.3,y-712)<38;}
export function command(s,cmd){
 const p=s.players[cmd.playerId||'solo'];if(!p)return {ok:false,reason:'Player unavailable.'};
 if(cmd.type==='pause'&&s.mode==='solo'&&['play','quiz'].includes(s.phase)){s.resumePhase=s.phase;s.phase='paused';return {ok:true}}
 if(cmd.type==='resume'&&s.phase==='paused'){s.phase=s.resumePhase;return {ok:true}}
 if(s.phase==='end'||s.phase==='paused')return {ok:false,reason:'Session is not active.'};
 if(cmd.type==='move'&&s.phase==='play'){
  const dx=Number(cmd.dx),dy=Number(cmd.dy),dt=Math.min(Math.max(Number(cmd.ms)||0,0),50);if(!Number.isFinite(dx)||!Number.isFinite(dy))return {ok:false};const len=Math.hypot(dx,dy)||1;
  const x=Math.max(215,Math.min(1385,p.x+dx/len*RULES.speed*dt/1000)),y=Math.max(160,Math.min(960,p.y+dy/len*RULES.speed*dt/1000));if(!blocked(s,x,p.y))p.x=x;if(!blocked(s,p.x,y))p.y=y;return {ok:true};
 }
 if(cmd.type==='open'&&s.phase==='play'){const c=nearestChest(s,p.id);if(!c)return {ok:false,reason:'Walk closer to a chest.'};const questions=[];for(let i=0;i<RULES.chestQuestions;i++){if(s.cursor>=s.deck.length){s.deck=prepareQuestionDeck(s.bank,s.random);s.cursor=0}const next=s.deck[s.cursor++];if(questions.some(q=>q.id===next.id)){i--;continue}questions.push(next)}s.quiz={id:'chest-round-'+(s.sequence+1),chestId:c.id,playerId:p.id,questions,index:0,answered:false,right:0,earned:0};s.phase='quiz';emit(s,'chest-opened',{playerId:p.id,chestId:c.id});return {ok:true};}
 if(cmd.type==='answer'&&s.phase==='quiz'){const q=s.quiz,question=q.questions[q.index];if(q.playerId!==p.id||q.answered||cmd.questionId!==question.id||!Number.isInteger(cmd.choice)||cmd.choice<0||cmd.choice>3)return {ok:false,reason:'Answer already recorded or unavailable.'};q.answered=true;p.answered++;const correct=cmd.choice===question.answer;if(correct){p.correct++;p.juice+=RULES.juicePerCorrect;q.right++;q.earned+=RULES.juicePerCorrect}s.attempts.push({id:question.id,correct,choice:cmd.choice,question:question.question,correctAnswer:question.choices[question.answer],explanation:question.explanation||''});return {ok:true,event:emit(s,'answer-recorded',{playerId:p.id,questionId:question.id,correct,juiceEarned:correct?RULES.juicePerCorrect:0})};}
 if(cmd.type==='next'&&s.phase==='quiz'&&s.quiz.playerId===p.id&&s.quiz.answered){const q=s.quiz;q.index++;if(q.index<q.questions.length){q.answered=false;return {ok:true}}const c=s.world.chests.find(c=>c.id===q.chestId),free=s.world.chestSpots.map((_,i)=>i).filter(i=>!s.world.chests.some(c=>c.slot===i));const slot=free[Math.floor(s.random()*free.length)];Object.assign(c,s.world.chestSpots[slot],{slot});s.phase='play';s.quiz=null;return {ok:true,event:emit(s,'chest-relocated',{playerId:p.id,chestId:c.id,slot,earned:q.earned})};}
 if(cmd.type==='dig'&&s.phase==='play'){const patch=nearestPatch(s,p.id);if(!patch)return {ok:false,reason:'Stand on an earth patch to dig.'};if(patch.ready>s.elapsed)return {ok:false,reason:'This ground is restoring. Try another patch.'};if(s.elapsed-p.lastDig<RULES.digCooldown)return {ok:false,reason:'Finish your shovel swing first.'};if(p.juice<RULES.digCost)return {ok:false,reason:'Find a chest to earn more juice.'};p.lastDig=s.elapsed;p.juice-=RULES.digCost;p.dug++;patch.ready=s.elapsed+RULES.restoreMs;let roll=s.random()*100;let jewel=null;for(const j of JEWELS){roll-=j.weight;if(roll<0){jewel=j;break}}if(!jewel&&p.emptyStreak>=2)jewel=JEWELS[0];patch.gem=jewel;if(jewel){p.emptyStreak=0;p.score+=jewel.value;p.jewels++;p.collection[jewel.id]++}else p.emptyStreak++;return {ok:true,event:emit(s,'patch-dug',{playerId:p.id,patchId:patch.id,jewel,juiceSpent:RULES.digCost})};}
 return {ok:false,reason:'Action unavailable.'};
}
// JSON-safe transport shape for a future authoritative multiplayer service.
// It deliberately excludes question answers, RNG, and local rendering effects.
export function snapshot(s){return {id:s.id,rulesVersion:s.rulesVersion,mode:s.mode,bankId:s.bankId,phase:s.phase,elapsed:s.elapsed,duration:s.duration,sequence:s.sequence,players:structuredClone(s.players),chests:s.world.chests.map(c=>({...c})),patches:s.world.plots.map(p=>({id:p.id,x:p.x,y:p.y,ready:p.ready,gem:p.gem?.id||null}))};}
export function rankPlayers(players){return Object.values(players).sort((a,b)=>b.score-a.score||b.jewels-a.jewels||b.correct-a.correct||a.id.localeCompare(b.id));}
