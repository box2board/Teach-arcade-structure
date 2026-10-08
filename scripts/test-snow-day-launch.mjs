import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {setsForGame,loadQuestionSet} from '../public/review-lab/catalog.js';
import {prepareSnowQuestions} from '../public/review-lab/snow-day-defenders/question-adapter.js';

const source=fs.readFileSync(new URL('../public/review-lab/snow-day-defenders/launch.js',import.meta.url),'utf8')
 .replace(/^import .*?;\n/gm,'').replace("import('./game.js?v=17')",'Promise.resolve(engineModule)');
async function setup(preset,fail=false){
 const nodes=new Map(),get=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',children:[],handlers:{},disabled:false,hidden:false,textContent:'',append(option){this.children.push(option);if(!this.value)this.value=option.value;},addEventListener(type,handler){this.handlers[type]=handler;}});
  return nodes.get(id);
 };
 const loaded=[],window={},history={replaceState(...args){this.url=args[2];}};
 const engineModule={configureQuestionSet(set){loaded.push(set.title);}};
 const ctx={document:{getElementById:get,createElement:()=>({})},window,location:{href:'https://teacharcade.com/review-lab/snow-day-defenders/'+preset,search:preset},history,URL,URLSearchParams,Promise,setsForGame,prepareSnowQuestions,engineModule,
  loadQuestionSet:async id=>{if(fail){fail=false;throw new Error('Simulated question load failure');}return loadQuestionSet(id);}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const settle=async()=>{for(let i=0;i<50&&vm.runInContext('loading',ctx);i++)await new Promise(resolve=>setTimeout(resolve,10));assert.equal(vm.runInContext('loading',ctx),false);};
 await settle();return {get,loaded,window,history,settle};
}
const preset=await setup('?set=constitution-basics');
assert.equal(preset.get('topic-choice').value,'constitution-basics');assert.equal(preset.window.SNOW_QUESTION_SET.questions.length,20);assert.equal(preset.get('start').disabled,false);assert.equal(preset.get('topic-choice').children.length,3);
preset.get('topic-choice').value='linear-equations';await preset.get('topic-choice').handlers.change();
assert.equal(preset.loaded.at(-1),'One-Variable Linear Equations');assert.equal(preset.history.url.searchParams.get('set'),'linear-equations');
const fallback=await setup('?set=missing-topic');assert.equal(fallback.get('topic-choice').value,'scientific-method');assert.equal(fallback.window.SNOW_QUESTION_SET.questions.length,24);
const retry=await setup('',true);assert.equal(retry.get('start').disabled,true);assert.equal(retry.get('topic-retry').hidden,false);assert.equal(retry.get('topic-choice').disabled,false);
await retry.get('topic-retry').handlers.click();assert.equal(retry.get('start').disabled,false);assert.equal(retry.get('topic-retry').hidden,true);
console.log('PASS: public topic preset, invalid preset fallback, bank switching, URL update, disabled launch on load failure, and recovery with retry.');
