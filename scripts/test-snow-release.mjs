import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import {setsForGame,loadQuestionSet} from '../public/review-lab/catalog.js';
import {prepareSnowQuestions} from '../public/review-lab/snow-day-defenders/question-adapter.js';
const base=new URL('../public/review-lab/snow-day-defenders/',import.meta.url);
const source=fs.readFileSync(new URL('release-launch.js',base),'utf8').replace(/^import .*;$/gm,'').replace("import('/dev/snow-day-visuals/game.js?v=release-1')",'loadEngine()');
async function launch(id,fail=false){
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{children:[],value:'',hidden:false,disabled:false,textContent:'',append(o){this.children.push(o);if(!this.value)this.value=o.value;},addEventListener(name,fn){this[name]=fn;}});return nodes.get(id);};
 const context={URL,URLSearchParams,setsForGame,prepareSnowQuestions,loadQuestionSet:async id=>{if(fail)throw Error('offline');return loadQuestionSet(id);},window:{},document:{getElementById:get,createElement:()=>({})},location:{search:'?set='+id,href:'https://example.test/review-lab/snow-day-defenders/?set='+id,assign(url){this.assigned=String(url);}},history:{replaceState(a,b,url){this.url=String(url);}},enhanceTopicPicker:()=>({setDisabled(value){get('topic-choice').disabled=value;}}),loadEngine:async()=>{context.engineSet=context.window.SNOW_QUESTION_SET;}};
 vm.createContext(context);vm.runInContext(source,context);await new Promise(r=>setImmediate(r));return {context,get};
}
for(const id of ['scientific-method','constitution-basics','linear-equations']){
 const {context,get}=await launch(id);assert.equal(get('go').disabled,false);assert.equal(context.window.SNOW_RELEASE,true);assert.equal(context.engineSet.title,(await loadQuestionSet(id)).title);
 for(const q of context.engineSet.questions){assert.equal(q.choices.length,4);assert.ok(q.choices[q.answer]);}
 get('topic-choice').value='constitution-basics';get('topic-choice').change();assert.match(context.location.assigned,/set=constitution-basics/);
}
const bad=await launch('scientific-method',true);assert.equal(bad.get('go').disabled,true);assert.equal(bad.get('topic-retry').hidden,false);
const html=fs.readFileSync(new URL('index.html',base),'utf8');assert.match(html,/id="lab-open" hidden/);assert.match(html,/id="visual-test" hidden/);assert.match(html,/release-launch.js/);assert.ok(!html.includes('device-check-entry'));assert.ok(!html.includes('noindex'));
console.log('PASS: public launcher uses three shared banks, preserves set links, locks start on failure, hides developer controls and retains canonical indexing');
