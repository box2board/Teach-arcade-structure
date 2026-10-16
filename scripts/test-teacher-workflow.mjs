// Interaction-level DOM simulation; not a substitute for visual browser QA.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {QUESTION_SETS,GAMES,loadQuestionSet,gamesForSet,gameUrl} from '../public/review-lab/catalog.js';
const html=await readFile(new URL('../public/teacher/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../public/teacher/workspace.js',import.meta.url),'utf8')).replace(/^import .*;\n/,'');
class Element{
 constructor(tag='div',text=''){this.tagName=tag;this.textContent=text;this.children=[];this.value='';this.hidden=false;this.dataset={};this.attributes={};this.open=false;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 showModal(){this.open=true;}
 close(){this.open=false;}
 focus(){}
 before(...nodes){this.beforeNodes=nodes;}
 addEventListener(name,fn){(this.listeners??={})[name]=fn;}
 get options(){return this.children;}
}
function setup(configured=false){
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 let hash='';const location={search:'',get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:`#${value}`;}},handlers={};
 const context=vm.createContext({QUESTION_SETS,GAMES,loadQuestionSet,gamesForSet,gameUrl,URLSearchParams,
 document:{getElementById:id=>{assert.ok(elements[id],`Unknown element ${id}`);return elements[id];},createElement:tag=>new Element(tag),querySelectorAll:()=>[]},
 Option:class extends Element{constructor(text,value){super('option',text);this.value=value;}},location,
 window:{addEventListener:(name,fn)=>{handlers[name]=fn;},scrollTo(){}},fetch:async()=>({ok:true,json:async()=>({configured,user:null})})});
 vm.runInContext(source,context);
 return {elements,context,location,route:()=>vm.runInContext('route()',context),run:code=>vm.runInContext(code,context)};
}
test('topic cards launch game selection directly; preview remains separate',()=>{
 const app=setup(),actions=app.elements.catalog.children[0].children.at(-1);
 assert.equal(actions.children[0].textContent,'Choose a game →');assert.equal(actions.children[1].textContent,'Preview questions');
 actions.children[0].onclick();assert.ok(app.location.hash.includes(encodeURIComponent(QUESTION_SETS[0].id)));
 app.route();assert.equal(app.elements.games.hidden,false);assert.equal(app.elements['selected-title'].textContent,QUESTION_SETS[0].title);
});
test('every compatible game receives the chosen topic in a clearly labeled new tab',()=>{
 const app=setup();
 for(const set of [QUESTION_SETS[0],QUESTION_SETS.at(-1)]){
  app.location.hash=`#games&set=${encodeURIComponent(set.id)}`;app.route();
  assert.equal(app.elements['game-catalog'].children.length,gamesForSet(set.id).length);
  for(const card of app.elements['game-catalog'].children){const link=card.children[1].children.at(-1);const url=new URL(link.href,'https://preview.test');assert.equal(url.searchParams.get('set'),set.id);assert.equal(url.searchParams.get('from'),'teacher-hq');assert.equal(link.target,'_blank');assert.match(link.attributes['aria-label'],/in a new tab/);}
 }
});
test('unconfigured saving is disabled and account form stays hidden',async()=>{
 const app=setup();await new Promise(r=>setTimeout(r,0));
 assert.equal(app.elements.catalog.children[0].children.at(-1).children[2].disabled,true);
 assert.equal(app.elements['login-form'].hidden,true);assert.equal(app.elements['account-unavailable'].hidden,false);
 app.location.hash='#saved';app.route();assert.match(app.elements['saved-help'].textContent,/coming soon/);
 const back=app.elements.catalog.children[0].children[1];back.onclick();assert.equal(app.location.hash,'#sets');
});
test('invalid topic links recover to library and future features are not navigation links',()=>{
 const app=setup();app.location.hash='#games&set=not-a-topic';app.route();assert.equal(app.elements.sets.hidden,false);
 const nav=html.match(/<nav[\s\S]*?<\/nav>/)[0];for(const path of ['assignments','classes','reports'])assert.ok(!nav.includes(`#${path}`));
 assert.ok(html.includes('no join code or teacher report is created'));
 assert.ok(!html.includes('href="/review-lab/acorn-dash/"'));
});
test('HQ topic picker keeps chosen topic and makes reselection optional; public entry unchanged',async()=>{
 const picker=(await readFile(new URL('../public/review-lab/topic-picker.js',import.meta.url),'utf8')).replace('export function','function');
 for(const from of ['teacher-hq','public']){
  const select=new Element('select');select.id='topic';select.value=QUESTION_SETS[0].id;
  const context=vm.createContext({URLSearchParams,location:{search:`?set=${select.value}&from=${from}`},document:{createElement:tag=>new Element(tag)},select,sets:QUESTION_SETS});
  vm.runInContext(picker+'; enhanceTopicPicker(select,sets);',context);
  const fieldset=select.beforeNodes[0];
  assert.equal(select.value,QUESTION_SETS[0].id);
  if(from==='teacher-hq'){const details=fieldset.beforeNodes[0];assert.equal(details.tagName,'details');assert.match(details.children[0].textContent,/Topic ready:/);assert.equal(details.open,false);assert.ok(details.children.includes(select));}
  else assert.equal(fieldset.beforeNodes,undefined);
 }
});
