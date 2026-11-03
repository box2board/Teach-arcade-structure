// DOM interaction regression checks; visual QA is performed separately in preview.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {SET_SUBJECTS,completeQuestion,setInput,teacherBank,MAX_QUESTIONS,correctAnswers} from '../public/teacher/set-contract.js';
import {GAMES} from '../public/review-lab/catalog.js';
const html=await readFile(new URL('../public/teacher/sets/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../public/teacher/sets/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.value='';this.hidden=false;this.dataset={};this.attributes={};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){this.focused=true;}
 querySelector(tag){return this.children.find(c=>c.tagName===tag)||this.children.map(c=>c.querySelector?.(tag)).find(Boolean);}
 get lastElementChild(){return this.children.at(-1);}
}
// Expose function closures only inside this test's evaluated source.
async function app(fetchImpl,search=''){
 const navigations=[];
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 const tabs=['mine','saved','public'].map(view=>Object.assign(new Element('button'),{dataset:{view}}));
 const context=vm.createContext({GAMES,SET_SUBJECTS,completeQuestion,setInput,teacherBank,MAX_QUESTIONS,correctAnswers,URLSearchParams,structuredClone,history:{replaceState(){}},location:{search,assign:url=>navigations.push(url)},window:{confirm:()=>true,addEventListener(){}},fetch:fetchImpl,document:{getElementById:id=>elements[id],createElement:tag=>new Element(tag),querySelectorAll:selector=>selector==='[data-view]'?tabs:[]}});
 const hooks=await vm.runInContext('(async()=>{'+source+';return {editSet,save,openSet,list,editing:()=>editing,dirty:()=>dirty};})()',context);
 return {elements,hooks,tabs,navigations};
}
const id='00000000-0000-4000-8000-000000000001';
const reply=data=>({ok:true,json:async()=>data});
test('draft create, save, edit after save, and save again retain the new question text',async()=>{
 let stored,writes=[];
 const editor=await app(async(url,options)=>{
  if(url.startsWith('/api/teacher?'))return reply({user:{id:'teacher-a'}});
  if(options.method==='POST'){const body=JSON.parse(options.body);writes.push(body);stored={...body,id,owner_id:'teacher-a',revision:(stored?.revision||0)+1,visibility:'private'};return reply({set:structuredClone(stored)});}
  return reply({sets:[]});
 });
 await editor.hooks.editSet();editor.elements['set-title'].value='My science draft';editor.elements['set-title'].oninput();
 await editor.hooks.save();assert.equal(writes.length,1);assert.equal(editor.hooks.dirty(),false);
 const prompt=editor.elements['question-editor'].children[0].querySelector('textarea');prompt.value='Updated after first save';prompt.oninput();
 await editor.hooks.save();assert.equal(writes[1].questions[0].question,'Updated after first save');assert.equal(writes[1].revision,1);
});
test('failed save preserves question edits and offers retry without claiming success',async()=>{
 const editor=await app(async(url,options)=>url.startsWith('/api/teacher?')?reply({user:{id:'teacher-a'}}):options.method==='POST'?{ok:false,status:502,json:async()=>({error:'Connection failed; try again.'})}:reply({sets:[]}));
 await editor.hooks.editSet();editor.elements['set-title'].value='Keep my edits';editor.elements['set-title'].oninput();await editor.hooks.save();
 assert.equal(editor.hooks.dirty(),true);assert.equal(editor.hooks.editing().title,'Keep my edits');assert.match(editor.elements['editor-status'].textContent,/Connection failed/);assert.equal(editor.elements['editor-fields'].disabled,false);
});

test('signed-out Create opens sign-in with a create return intent instead of focusing the header',async()=>{
 const editor=await app(async url=>reply(url.startsWith('/api/teacher?')?{user:null}:{sets:[]}));
 await editor.elements['new-set'].onclick();
 assert.deepEqual(editor.navigations,['/teacher/?return=teacher-sets&intent=create#account']);
 assert.equal(editor.elements['sign-in'].focused,undefined);
 assert.equal(editor.hooks.editing(),null);
});
test('signed-in Create and the sign-in return open the question editor',async()=>{
 const fetch=async url=>reply(url.startsWith('/api/teacher?')?{user:{id:'teacher-a'}}:{sets:[]});
 const editor=await app(fetch);await editor.elements['new-set'].onclick();
 assert.equal(editor.elements['set-editor'].hidden,false);assert.equal(editor.elements['set-title'].focused,true);
 const returned=await app(fetch,'?create=1');assert.equal(returned.elements['set-editor'].hidden,false);assert.equal(returned.hooks.editing().visibility,'private');
});

test('checkboxes select, deselect, save and reload multiple correct answers independently',async()=>{
 let stored;
 const editor=await app(async(url,options)=>{
  if(url.startsWith('/api/teacher?'))return reply({user:{id:'teacher-a'}});
  if(options.method==='POST'){stored={...JSON.parse(options.body),id,owner_id:'teacher-a',revision:1};return reply({set:structuredClone(stored)});}
  return reply({sets:[]});
 });
 await editor.hooks.editSet();editor.elements['set-title'].value='Multiple answers';editor.elements['set-title'].oninput();
 const boxes=()=>editor.elements['question-editor'].children[0].children.find(e=>e.className==='answer-list').children.map(row=>row.children[0]);
 assert.ok(boxes().every(b=>b.type==='checkbox'));
 for(const i of [0,2]){boxes()[i].checked=true;boxes()[i].onchange();}
 await editor.hooks.save();assert.deepEqual(stored.questions[0].answer,[0,2]);assert.equal(boxes()[0].checked,true);assert.equal(boxes()[2].checked,true);assert.equal(boxes()[1].checked,false);
 boxes()[0].checked=false;boxes()[0].onchange();await editor.hooks.save();assert.deepEqual(stored.questions[0].answer,[2]);
});
