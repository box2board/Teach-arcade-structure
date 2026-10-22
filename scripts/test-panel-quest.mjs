import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({window:{},console});
for(const f of ['paris-print-shop.js','panel-quest-engine.js'])vm.runInContext(fs.readFileSync(new URL('../public/prototypes/panel-quest/'+f,import.meta.url),'utf8'),context);
const e=context.window.PANEL_QUEST_EDITION,{Model}=context.PanelQuest;
let paths=0;const endings=new Set();
function explore(m,wrong){
 let steps=0;
 while(m.scene.type!=='ending'){
  assert(++steps<40,'No cycles or dead ends');const s=m.scene;
  if(s.type==='question'){
   assert.equal(m.advance(),false,'Unanswered question cannot skip');
   if(wrong){m.answer((s.question.correctIndex+1)%4);const saved=new Model(e,JSON.parse(JSON.stringify(m.state)));assert.equal(saved.stats.first,m.stats.first);assert.equal(saved.answerState().wrong.length,1);m=saved;}
   const right=s.question.correctIndex;m.answer(right);const first=m.stats.first,clues=m.state.clues.length;m.answer(right);assert.equal(m.stats.first,first,'Duplicate submit does not award twice');assert.equal(m.state.clues.length,clues);assert(m.advance());
  }else if(s.type==='investigation'){
   assert.equal(m.advance(),false,'Must inspect source');for(const item of s.items)m.inspect(item.id);assert(m.advance());
  }else{
   for(const o of s.options){const branch=new Model(e,JSON.parse(JSON.stringify(m.state)));assert(branch.choose(o.id));explore(branch,wrong);}return;
  }
  // Every transition must round-trip, preserving answer order and inventory.
  m=new Model(e,JSON.parse(JSON.stringify(m.state)));
 }
 paths++;endings.add(m.ending().id);assert.equal(m.stats.solved,10);assert.equal(m.stats.first,wrong?0:10);assert.equal(new Set(m.state.clues).size,m.state.clues.length);assert(m.state.clues.length>=12);assert(m.state.visited.includes('q6'));assert(m.state.visited.indexOf('q6')<m.state.visited.indexOf('q7'));
}
explore(new Model(e),false);explore(new Model(e),true);
assert.equal(endings.size,3);assert.equal(paths,24);
const original=new Model(e);assert.throws(()=>new Model(e,{...original.state,version:1}));
const permutations=new Set();for(let i=0;i<100;i++)permutations.add(new Model(e).answerState().order.join(''));assert(permutations.size>10);
// Engine independence: a different setting uses the same model without Paris data.
const science={id:'lab',version:1,start:'source',scenes:{source:{type:'investigation',items:[{id:'a',clue:'observation'}],next:'decision'},decision:{type:'decision',options:[{id:'report',next:'done',effects:{flags:{reported:true}}}]},done:{type:'ending'}},clues:{observation:{text:'Measured water temperature'}},endings:[{id:'report',when:{flags:{reported:true},clues:['observation']}}]};
const lab=new Model(science);lab.inspect('a');lab.advance();lab.choose('report');assert.equal(lab.ending().id,'report');
console.log(JSON.stringify({paths,endings:[...endings],saveRoundTrips:'pass',retryScoring:'pass',duplicateSubmit:'pass',randomization:permutations.size,secondEdition:'pass'},null,2));
