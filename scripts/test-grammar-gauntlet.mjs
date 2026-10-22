import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Runs the real shared engine with a small DOM/canvas fixture. This is a logic
// and content check, not a replacement for visual browser testing.
class Element {
 constructor(){this.children=[];this.hidden=false;this.style={};this.textContent='';this.dataset={};this.disabled=false;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};}
 addEventListener(){} focus(){} appendChild(b){this.children.push(b)} replaceChildren(){this.children=[]} get firstElementChild(){return this.children[0]} click(){if(!this.disabled)this.onclick?.()}
}
const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
const ctx=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,val)=>(target[key]=val,true)});
const canvas=element('game');Object.assign(canvas,{width:960,height:480,getContext:()=>ctx});
const document={getElementById:element,querySelectorAll:()=>[],addEventListener(){},hidden:false,createElement:()=>new Element()};
const context=vm.createContext({window:null,document,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>1000},location:{reload(){},href:''},console,URLSearchParams,Math});context.window=context;
const html=fs.readFileSync('public/arcade-review-games/ela/grammar-gauntlet.html','utf8');
for(const match of html.matchAll(/<script(?: src="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/g)){
 const src=match[1]?.split('?')[0];
 if(src&&/shell|arcade-results/.test(src))continue;
 vm.runInContext(src?fs.readFileSync('public'+src,'utf8'):match[2],context,{filename:src||'grammar-inline.js'});
}
const TA=context.TASideScroller,game=context.TA_GAME,physics=context.TA_PHYSICS_PRESETS.earth;
assert.equal(game.questions.length,50);assert.equal(game.level.questionPoints.length,20);
assert(game.questions.every(q=>q.choices.length===4&&q.explanation&&Number.isInteger(q.correctIndex)));
assert(!html.includes('function tryJump('),'No standalone movement implementation');
assert(html.includes('side-scroller-engine/v1.2/core.js'),'Loads stable shared core');
const visual=TA.VisualValidator.validate(game.level),gameplay=TA.LevelValidator.validate(game.level,physics),design=TA.LevelDesignValidator.validate(game.level);
assert.equal(visual.counts.error,0,JSON.stringify(visual.issues));assert.equal(gameplay.issues.length,0,JSON.stringify(gameplay.issues));assert(design.ok,JSON.stringify(design.issues));
for(const difficulty of ['easy','medium','hard']){
 const e=new TA.Engine({canvas,config:{player:physics},level:game.level,theme:game.theme,questions:game.questions,themeId:game.id,difficulty});context.TA_ACTIVE_GAME=e;
 const expected=difficulty==='easy'?3:difficulty==='medium'?2:0;
 assert.equal(e.checkpoints.filter(c=>c.active).length,expected);
 assert.equal(e.questions.length,50);
 for(const q of e.questions){const original=game.questions.find(x=>x.id===q.id);assert.equal(q.choices[q.correctIndex],original.choices[original.correctIndex]);}
 e.state='playing';e.update(1/120);TA.render(e);
 // Exercise the real engine question callback, reward and station completion on all 20 stations.
 for(let i=0;i<20;i++){
   const trigger=e.questionTriggers[i],q=e.questions[i],before=e.stats.score;trigger.active=false;e.ask(trigger);
   const buttons=element('question-choices').children,answer=buttons[q.correctIndex];answer.click();answer.click();
   assert.equal(e.state,'question','Explanations stay visible until Continue');
   element('question-continue').click();element('question-continue').click();
   assert.equal(e.stats.answered,i+1);assert.equal(e.stats.correct,i+1);assert(e.stats.score>=before+500);assert.equal(trigger.active,false);
 }
 assert.equal(e.stats.answered,20);assert.equal(e.stats.correct,20);
 if(difficulty==='hard')assert.equal(e.stats.boostTimer,0);
 e.player.x=game.level.finish.x;e.player.y=game.level.finish.y;e.finishFrame(1/120);
 assert.equal(e.state,'won');assert(!element('endOverlay').classes.has('hidden'));assert.match(element('endSummary').textContent,/20\/20 \(100%\)/);
 console.log('PASS',difficulty,': checkpoints, answer mapping, 20 questions, scoring guard, station completion, rewards, finish, rendering');
}
// Wrong answers resolve once, provide feedback and do not award correct-answer points.
const e=new TA.Engine({canvas,config:{player:physics},level:game.level,theme:game.theme,questions:game.questions,difficulty:'easy'});context.TA_ACTIVE_GAME=e;e.ask(e.questionTriggers[0]);const wrong=(e.questions[0].correctIndex+1)%4;element('question-choices').children[wrong].click();element('question-continue').click();assert.equal(e.stats.answered,1);assert.equal(e.stats.correct,0);assert.equal(e.stats.score,0);
console.log('PASS incorrect-answer feedback and scoring');
console.log('QA warnings:',JSON.stringify({visual:visual.issues,design:design.warnings}));
// Traverse the actual collision geometry with hazards disabled to isolate course
// reachability. Question columns must activate even along the higher routes.
const routeEngine=new TA.Engine({canvas,config:{player:physics},level:game.level,theme:game.theme,questions:game.questions,difficulty:'hard'});
context.TA_ACTIVE_GAME=routeEngine;routeEngine.state='playing';routeEngine.movers.forEach(m=>m.active=false);
for(let frame=0;frame<18000&&routeEngine.state!=='won';frame++){
 if(routeEngine.state==='question'){
  const q=routeEngine.questions[routeEngine.stats.answered];element('question-choices').children[q.correctIndex].click();element('question-continue').click();
 }
 routeEngine.keys.arrowright=true;
 const p=routeEngine.player;
 routeEngine.keys[' ']=[[960,1088],[2720,2816],[3500,3548],[4544,4640]].some(([start,end])=>p.x+26>start-70&&p.x<end);
 routeEngine.update(1/120);
}
assert.equal(routeEngine.state,'won',JSON.stringify({player:routeEngine.player,stats:routeEngine.stats}));
assert.equal(routeEngine.stats.answered,20);assert.equal(routeEngine.stats.deaths,0);
console.log('PASS continuous physics traversal, 20 mandatory question columns, slope seams, gaps and zero falls');
