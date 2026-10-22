// Interaction-level DOM simulation; not a substitute for visual browser QA.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {QUESTION_SETS,GAMES,loadQuestionSet,gamesForSet,gameUrl} from '../public/review-lab/catalog.js';
import {TOOLS,CABINET_GAMES} from '../public/teacher/cabinet-catalog.js';
const html=await readFile(new URL('../public/teacher/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../public/teacher/workspace.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Element{
 constructor(tag='div',text=''){this.tagName=tag;this.textContent=text;this.children=[];this.value='';this.hidden=false;this.dataset={};this.attributes={};this.open=false;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 showModal(){this.open=true;}
 close(){this.open=false;}
 focus(){this.focused=true;}
 querySelector(tag){for(const child of this.children){if(child.tagName===tag)return child;const found=child.querySelector?.(tag);if(found)return found;}return null;}
 before(...nodes){this.beforeNodes=nodes;}
 addEventListener(name,fn){(this.listeners??={})[name]=fn;}
 get options(){return this.children;}
}
function setup(configured=false,fetchOverride){
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 let now=Date.now(),hash='';const location={search:'',assign(url){this.assigned=url;},get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:`#${value}`;}},handlers={};
 const context=vm.createContext({QUESTION_SETS,GAMES,TOOLS,CABINET_GAMES,loadQuestionSet,gamesForSet,gameUrl,URLSearchParams,
 document:{getElementById:id=>{assert.ok(elements[id],`Unknown element ${id}`);return elements[id];},createElement:tag=>new Element(tag),querySelectorAll:()=>[],querySelector:()=>null},
 Option:class extends Element{constructor(text,value){super('option',text);this.value=value;}},location,
 Date:class extends Date{static now(){return now;}},setInterval:fn=>{handlers.tick=fn;return 1;},clearInterval:()=>{delete handlers.tick;},
 window:{addEventListener:(name,fn)=>{handlers[name]=fn;},scrollTo(){}},fetch:fetchOverride|| (async()=>({ok:true,json:async()=>({configured,user:null})}))});
 vm.runInContext(source,context);
 return {elements,context,location,advance:seconds=>{now+=seconds*1000;handlers.tick?.();},route:()=>vm.runInContext('route()',context),run:code=>vm.runInContext(code,context)};
}
test('code requests block double submits, show a countdown, and allow code entry while waiting',async()=>{
 let sends=0,resolveSend;
 const app=setup(true,async url=>{
  if(url.includes('action=login')){sends++;await new Promise(r=>{resolveSend=r;});return {ok:true,json:async()=>({ok:true,retryAfter:60})};}
  return {ok:true,json:async()=>({configured:true,user:null})};
 });
 await new Promise(r=>setTimeout(r,0));app.elements.email.value='teacher@example.test';
 const pending=app.elements['login-form'].onsubmit({preventDefault(){}});
 await app.elements['login-form'].onsubmit({preventDefault(){}});assert.equal(sends,1);assert.equal(app.elements.email.disabled,true);
 resolveSend();await pending;assert.equal(app.elements['verify-form'].hidden,false);assert.equal(app.elements['resend-code'].disabled,true);assert.ok(!app.elements.code.disabled);
 assert.match(app.elements['code-wait'].textContent,/60 seconds/);
 await app.elements['resend-code'].onclick();assert.equal(sends,1);
 app.advance(59);assert.match(app.elements['code-wait'].textContent,/1 second\./);app.advance(1);assert.equal(app.elements['resend-code'].disabled,false);
});
test('server cooldown survives switching away from an email and back',async()=>{
 let sends=0;const app=setup(true,async url=>url.includes('action=login')?(sends++,{ok:false,status:429,json:async()=>({error:'Please wait 19 seconds before trying again.',retryAfter:19})}):{ok:true,json:async()=>({configured:true,user:null})});
 await new Promise(r=>setTimeout(r,0));app.elements.email.value='Teacher@example.test';await app.elements['login-form'].onsubmit({preventDefault(){}});
 assert.match(app.elements['code-wait'].textContent,/19 seconds/);assert.equal(app.elements['send-code'].disabled,true);
 app.elements.email.value='other@example.test';app.elements.email.oninput();assert.equal(app.elements['send-code'].disabled,false);
 app.elements.email.value=' teacher@example.test ';app.elements.email.oninput();assert.equal(app.elements['send-code'].disabled,true);
 app.advance(19);assert.equal(app.elements['send-code'].disabled,false);assert.equal(sends,1);
});
test('topic cards launch game selection directly; preview remains separate',()=>{
 const app=setup(),actions=app.elements.catalog.children[0].children.at(-1);
 assert.equal(actions.children[0].textContent,'Choose a game →');assert.equal(actions.children[1].textContent,'Preview questions');
 actions.children[0].onclick();assert.ok(app.location.hash.includes(encodeURIComponent(QUESTION_SETS[0].id)));
 app.route();assert.equal(app.elements.games.hidden,false);assert.equal(app.elements['selected-title'].textContent,QUESTION_SETS[0].title);
});
test('expired session offers sign-in instead of treating auth as unconfigured',async()=>{
 const app=setup(true,async()=>({ok:false,status:401,json:async()=>({error:'Session expired'})}));
 await new Promise(r=>setTimeout(r,0));
 assert.equal(app.elements['login-form'].hidden,false);assert.equal(app.elements['account-unavailable'].hidden,true);
 assert.match(app.elements.notice.textContent,/session has ended/);
});
test('failed favorites keep verified account available and offer retry',async()=>{
 let fail=true;
 const app=setup(true,async url=>({ok:!url.includes('favorites')||!fail,status:503,json:async()=>url.includes('favorites')?(fail?{error:'Unavailable'}:{ids:[QUESTION_SETS[0].id]}):{configured:true,user:{id:'teacher-a',email:'teacher@example.test',plan:'free'}}}));
 await new Promise(r=>setTimeout(r,0));assert.equal(app.elements.profile.hidden,false);assert.equal(app.elements['retry-account'].hidden,false);
 fail=false;await app.elements['retry-account'].onclick();assert.equal(app.elements['retry-account'].hidden,true);assert.equal(app.run('saved.size'),1);
});
test('post-login save failure remains retryable without pretending it was saved',async()=>{
 let fail=true;
 const app=setup(true,async url=>({ok:!url.includes('action=save')||!fail,status:503,json:async()=>url.includes('action=save')?{error:'Unavailable'}:{configured:true,user:null}}));
 await new Promise(r=>setTimeout(r,0));
 app.run(`user={id:'teacher-a'};pendingSave=${JSON.stringify(QUESTION_SETS[0].id)};returnRoute='saved';`);
 await app.run('finishPendingSave()');assert.equal(app.run('saved.size'),0);assert.equal(app.elements['retry-save'].hidden,false);assert.match(app.elements['auth-status'].textContent,/could not be saved/);
 fail=false;await app.elements['retry-save'].onclick();assert.equal(app.run('saved.size'),1);assert.equal(app.run('pendingSave'),null);assert.equal(app.location.hash,'#saved');
});
test('load-more moves keyboard focus to first newly revealed topic',()=>{
 const app=setup();app.elements.more.onclick();assert.equal(app.elements.catalog.children[24].querySelector('button').focused,true);
});
test('invalid game bookmark leaves saved-only view and restores public topics',()=>{
 const app=setup();app.location.hash='#saved';app.route();app.location.hash='#games&set=invalid';app.route();
 assert.equal(app.elements['library-title'].textContent,'Question Library');assert.equal(app.elements.catalog.children.length,24);
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
test('Cabinet sections browse real public games and tools without account writes',()=>{
 const app=setup();app.location.hash='#tools&view=browse';app.route();assert.equal(app.elements.tools.hidden,false);assert.equal(app.elements['cabinet-tools'].children.length,TOOLS.length);
 for(const card of app.elements['cabinet-tools'].children){const content=card.children[1],open=content.children.at(-2),save=content.children.at(-1);assert.ok(TOOLS.some(t=>t.url===open.href));assert.equal(open.target,'_blank');assert.equal(save.disabled,true);}
 app.location.hash='#my-games&view=browse';app.route();assert.equal(app.elements['cabinet-games'].children.length,CABINET_GAMES.length);
 for(const [i,game] of CABINET_GAMES.entries()){
  const open=app.elements['cabinet-games'].children[i].children[1].children.at(-2);
  assert.equal(open.href,game.chooseTopic?'#sets':game.url);
  if(!game.chooseTopic){assert.equal(open.target,'_blank');assert.equal(open.onclick,undefined);}
 }
});
test('saved games and tools use server bookmarks and are cleared on logout',async()=>{
 const app=setup(true,async url=>({ok:true,json:async()=>url.includes('action=favorites')?{ids:[]}:url.includes('action=cabinet')?{items:[{type:'tool',id:'timer'},{type:'game',id:'raceway-rivals'}]}:url.includes('action=logout')?{ok:true}:{configured:true,cabinetEnabled:true,user:{id:'teacher-a',email:'teacher@example.test',plan:'free'}}}));
 await new Promise(r=>setTimeout(r,0));app.location.hash='#tools';app.route();assert.equal(app.elements['cabinet-tools'].children.length,1);assert.match(app.elements['tools-summary'].textContent,/1 saved/);
 const remove=app.elements['cabinet-tools'].children[0].children[1].children.at(-1);assert.equal(remove.disabled,false);await remove.onclick();assert.equal(app.run("bookmarks.has('tool:timer')"),false);
 await app.elements.logout.onclick();assert.equal(app.run('bookmarks.size'),0);assert.equal(app.run('cabinetLoaded'),false);
});
test('a saved Arcade Review Game survives collection reload and opens directly',async()=>{
 const game=CABINET_GAMES.find(g=>g.title==='WWI Trench Run');let items=[];
 const app=setup(true,async(url,options)=>{
  if(url.includes('action=save-item'))items=[JSON.parse(options.body)];
  return {ok:true,json:async()=>url.includes('action=favorites')?{ids:[]}:url.includes('action=cabinet')?{items}:url.includes('action=save-item')?{ok:true}:{configured:true,cabinetEnabled:true,user:{id:'teacher-a'}}};
 });
 await new Promise(r=>setTimeout(r,0));app.location.hash='#my-games&view=browse';app.route();
 const card=app.elements['cabinet-games'].children[CABINET_GAMES.indexOf(game)];await card.children[1].children.at(-1).onclick();
 await app.run('account()');app.location.hash='#my-games';app.route();
 const saved=app.elements['cabinet-games'].children;assert.equal(saved.length,1);assert.equal(saved[0].children[1].children.at(-2).href,game.url);
 assert.equal(saved[0].children[1].children.at(-1).attributes['aria-pressed'],'true');
});
test('Cabinet tools point to real local resources and creation remains explicitly planned',async()=>{
 for(const tool of TOOLS){assert.ok(tool.url.startsWith('/'));const path=tool.url.endsWith('/')?tool.url+'index.html':tool.url;assert.ok((await readFile(new URL('../public'+path,import.meta.url),'utf8')).length>0);}
 assert.ok(html.includes('My Arcade Cabinet')||html.includes('MY ARCADE CABINET'));assert.ok(html.includes('TEACHER GAME CREATION · PLANNED'));assert.ok(html.includes('No custom game is created or saved from this page'));
 assert.ok(!source.includes('localStorage'));assert.ok(!html.includes('Stripe'));
});

test('question-set sign-in return preserves create intent and only uses allowlisted destinations',async()=>{
 const app=setup();await new Promise(r=>setTimeout(r,0));
 app.location.search='?return=teacher-sets&intent=create';assert.equal(app.run('returnToQuestionSets()'),true);assert.equal(app.location.assigned,'/teacher/sets/?create=1');
 app.location.search='?return=teacher-sets';app.run('returnToQuestionSets()');assert.equal(app.location.assigned,'/teacher/sets/');
 app.location.search='?return=https://example.test';assert.equal(app.run('returnToQuestionSets()'),false);
});
