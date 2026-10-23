import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {answerIndices,selectedIndices,isCorrectAnswer,answerText,remapAnswer,validSelection} from '../public/review-lab/answers.js';
import {bindAnswerChoices,clearAnswerChoices} from '../public/review-lab/answer-picker.js';
import {prepareQuestionDeck,categoryClashBoard} from '../public/review-lab/question-decks.js';
import {validateQuestionBank} from '../public/review-lab/question-banks.js';
import {prepareSnowQuestions} from '../public/review-lab/snow-day-defenders/question-adapter.js';
import {validateQuestions} from '../public/review-lab/snow-day-defenders/gear.js';
import {CrossingWorld} from '../public/arcade-review-games/crossing-quest/engine.js';
import {ReviewSession} from '../public/review-lab/raceway-rivals/engine.js';
import {createSession,command} from '../public/review-lab/treasure-trail/engine.js';
import {teacherBank} from '../public/teacher/set-contract.js';
import {QUESTION_SETS,loadQuestionSet,GAMES} from '../public/review-lab/catalog.js';
const question={id:'q',question:'Which are even?',prompt:'Which are even?',choices:['2','3','4','5'],answer:[0,2],explanation:'2 and 4 are even.'};
const bank={id:'multi-test',title:'Multiple answers',questions:Array.from({length:12},(_,i)=>({...structuredClone(question),id:'q'+i}))};
class Element{
 constructor(tag='div',doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes={};this.style={};this.dataset={};this.textContent='';this.disabled=false;this.hidden=false;this.classList={add:(...names)=>names.forEach(n=>(this.classes??=new Set()).add(n))};}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}
 appendChild(n){this.append(n);}
 before(node){if(!this.parentElement)return;const siblings=this.parentElement.children;node.parentElement=this.parentElement;siblings.splice(siblings.indexOf(this),0,node);}
 after(node){if(!this.parentElement)return;const siblings=this.parentElement.children;node.parentElement=this.parentElement;siblings.splice(siblings.indexOf(this)+1,0,node);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 querySelectorAll(tag){return this.children.flatMap(c=>[...(tag==='button'&&c.tagName==='button'?[c]:[]),...c.querySelectorAll(tag)]);}
 focus(){this.ownerDocument.activeElement=this;}
 click(){if(!this.disabled)this.onclick?.();}
}
function dom(){const doc={createElement:tag=>new Element(tag,doc)},parent=new Element('div',doc),container=new Element('div',doc);parent.append(container);const buttons=question.choices.map(text=>Object.assign(doc.createElement('button'),{textContent:text}));container.append(...buttons);return {doc,parent,container,buttons};}
test('exact-set scoring rejects subsets, extra choices, empty/duplicate/invalid submissions',()=>{
 for(const answer of [0,[0],[2],[0,1,2],[],[0,0,2],[0,2,4],['0',2],null])assert.equal(isCorrectAnswer(question,answer),false,JSON.stringify(answer));
 assert.equal(isCorrectAnswer(question,[2,0]),true);assert.equal(isCorrectAnswer({...question,answer:2},2),true);assert.equal(isCorrectAnswer({...question,answer:[2]},2),true);
 assert.equal(answerText(question),'2; 4');assert.equal(answerText(question,[1,3]),'3; 5');
});
test('question validation and both shuffle adapters retain every correct answer',()=>{
 validateQuestionBank(bank);validateQuestions(prepareSnowQuestions(bank));
 for(let seed=0;seed<20;seed++){
  let state=seed+1;const random=()=>((state=(state*1664525+1013904223)>>>0)/2**32);
  for(const q of [...prepareQuestionDeck(bank,random),...prepareSnowQuestions(bank,random).questions])assert.deepEqual(answerIndices(q).map(i=>q.choices[i]).sort(),['2','4']);
 }
 for(const answer of [[],[0,0],[4],[-1],['0']])assert.throws(()=>validateQuestionBank({...bank,questions:bank.questions.map(q=>({...q,answer}))}));
});
test('all selected answer state is retained until Submit, deselects independently and submits once',()=>{
 const {parent,container,buttons}=dom(),submissions=[];const picker=bindAnswerChoices(container,question,value=>submissions.push(value));
 assert.equal(parent.children[0].className,'multi-answer-hint');assert.equal(picker.submit.disabled,true);
 buttons[0].click();buttons[2].click();buttons[0].click();assert.equal(submissions.length,0);assert.equal(buttons[2].attributes['aria-pressed'],'true');
 buttons[0].click();picker.submit.click();picker.submit.click();buttons[1].click();assert.deepEqual(submissions,[[0,2]]);assert.ok(buttons.every(b=>b.disabled));
});
test('single-answer questions submit on first click and fresh questions clear old selections and controls',()=>{
 const {parent,container,buttons}=dom(),submissions=[];bindAnswerChoices(container,question,()=>{});buttons[0].click();
 bindAnswerChoices(container,{...question,answer:1},v=>submissions.push(v));assert.equal(parent.children.length,1);assert.equal(buttons[0].attributes['aria-pressed'],undefined);
 buttons[1].click();buttons[1].click();assert.deepEqual(submissions,[1]);
 clearAnswerChoices(container);
});
test('teacher create-to-game contract and Category Clash board preserve multiple answers',()=>{
 const saved={...bank,id:'00000000-0000-4000-8000-000000000001',subject:'Science'};const playable=teacherBank(saved);validateQuestionBank(playable);
 assert.deepEqual(playable.questions[0].answer,[0,2]);
 for(const q of categoryClashBoard(playable).categories.flatMap(c=>c.questions))assert.deepEqual(q.answer.split('; ').sort(),['2','4']);
});
test('Acorn Dash awards nothing for partial selections and records complete selections after shuffling',()=>{
 const world=new CrossingWorld(bank,'relaxed',()=>.3);world.openCheckpoint('island');let q=world.question;
 assert.deepEqual(answerIndices(q).map(i=>q.choices[i]).sort(),['2','4']);world.answer([answerIndices(q)[0]]);assert.equal(world.feedback.correct,false);world.continueAnswer();
 q=world.question;world.answer([...answerIndices(q)].reverse());assert.equal(world.feedback.correct,true);assert.equal(world.records.length,2);assert.equal(world.answer(q.answer),false);
});
test('Raceway Rivals scores full selections only and protects saved selections from mutation',()=>{
 const review=new ReviewSession(bank,{questionCount:8});const selection=[0,2];assert.equal(review.answer(selection),true);selection.push(1);assert.deepEqual(review.records[0].selected,[0,2]);assert.equal(review.answer([0]),false);assert.equal(review.correct,1);
});
test('Treasure Trail credits juice once only for an entire correct selection',()=>{
 const session=createSession({bank,seed:1}),p=session.players.solo,chest=session.world.chests[0];p.x=chest.x;p.y=chest.y;assert.equal(command(session,{type:'open'}).ok,true);
 let q=session.quiz.questions[0];let result=command(session,{type:'answer',questionId:q.id,choice:[answerIndices(q)[0]]});assert.equal(result.event.correct,false);assert.equal(p.juice,0);command(session,{type:'next'});
 q=session.quiz.questions[1];result=command(session,{type:'answer',questionId:q.id,choice:answerIndices(q)});assert.equal(result.event.correct,true);assert.equal(p.juice,12);assert.deepEqual(session.attempts[1].correctAnswer.split('; ').sort(),['2','4']);assert.equal(command(session,{type:'answer',questionId:q.id,choice:q.answer}).ok,false);assert.equal(p.juice,12);
});
// Execute the real game scoring callbacks with DOM and audiovisual boundaries stubbed.
for(const [game,path,start,end] of [
 ['Review Pinball','review-pinball/game.js','function answer(i)','function pause()'],
 ['Slime Slinger','slime-slinger/game-slime-falls.js','function answer(index)','function '],
 ['Power Clash','power-clash/game.js','  function answerQuestion(','  function startTouchAction'],
 ['Category Clash','category-clash/game.js','  function submitIndividual(','  function resetTimer']
])test(game+' uses exact multiple-answer scoring in its real callback',async()=>{
 const source=await readFile(new URL('../public/review-lab/'+path,import.meta.url),'utf8'),at=source.indexOf(start),stop=source.indexOf(end,at+start.length),fn=source.slice(at,stop);
 for(const selection of [[0],[0,2],[0,1,2]]){
  const {doc,container}=dom(),nodes=new Map();const get=id=>{if(['answers','answer-grid'].includes(id))return container;if(!nodes.has(id))nodes.set(id,new Element('div',doc));return nodes.get(id);};
  const ctx=vm.createContext({answerIndices,selectedIndices,isCorrectAnswer,answerText,clearAnswerChoices,document:doc,$:get,state:game==='Power Clash'?{displayQuestion:question,feedbackLock:false,currentQuestion:question,activePlayer:1,questionMode:'opening'}:game==='Category Clash'?{current:{ci:0,qi:0}}:'review',current:question,answered:false,attempts:0,correct:0,earned:0,ammo:0,academicStreak:0,questionOrigin:'preload',preloadAsked:0,preloadGoal:10,perfectLoadBonus:false,remaining:100,panel:{querySelector:()=>null},fighters:[null,{juice:0}],data:{categories:[{questions:[{...question,answer:'2; 4',answerIndices:[0,2]}]}]},cleanAnswer:x=>x,escapeHtml:x=>x,beep(){},hud(){},syncHud(){},playTone(){},sound(){},judge(){},nextQuestion(){},startRound(){},endRound(){},window:{setTimeout(){}},selection});
  vm.runInContext(fn+'\n'+(game==='Category Clash'?"submitIndividual('',selection)":game==='Power Clash'?'answerQuestion(selection)':'answer(selection)'),ctx);
  const right=selection.length===2;
  if(game==='Power Clash')assert.equal(ctx.fighters[1].juice,right?10:0);
  else if(game==='Category Clash')assert.match(get('individualControls').innerHTML,right?/✓ Correct!/:/Not quite/);
  else assert.equal(ctx.correct,right?1:0);
 }
});
test('all current public banks still validate and load through every compatible game',async()=>{
 assert.equal(GAMES.filter(g=>g.supportsQuestionBank).length,8);
 for(const set of QUESTION_SETS)validateQuestionBank(await loadQuestionSet(set.id));
});
