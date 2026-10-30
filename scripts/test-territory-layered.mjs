import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../public/arcade-review-games/territory-takedown/',import.meta.url);
// Exercise the actual engine in a deterministic DOM harness. Hooks are injected
// into this VM only; the shipped game has no state-editing test interface.
class Node {
 constructor(){this.children=[];this.parts={};this.attributes={};this.dataset={};this.open=false;this.className='';this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};this.classList={toggle:(c,on)=>{const a=new Set(this.className.split(' '));on?a.add(c):a.delete(c);this.className=[...a].join(' ')},add:c=>this.classList.toggle(c,true)};}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes;this.replacements=(this.replacements||0)+1}
 querySelector(key){return this.parts[key]??=new Node()}
 setAttribute(k,v){this.attributes[k]=v}
 showModal(){this.open=true}close(){this.open=false}focus(){}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)};
let tasks=new Map(),next=1;
const document={currentScript:null,createElement:()=>new Node(),getElementById:get,querySelectorAll:()=>[]};
const context={window:{__TT_TEST__:true},document,URL,console,confirm:()=>true,matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>fn(),clearInterval:()=>{},clearTimeout:id=>tasks.delete(id),setTimeout:fn=>{const id=next++;tasks.set(id,fn);return id}};
vm.createContext(context);
for(const name of ['board-data.js','questions.js','map-renderer.js'])vm.runInContext(fs.readFileSync(new URL(name,root),'utf8'),context);
let source=fs.readFileSync(new URL('game.js',root),'utf8');
source=source.replace('window.TerritoryTakedownTest=',`window.flow={reset(c){sound=false;tasks.clear();config={teamCount:2,names:[],duration:600,mode:'timed',difficulty:'standard',...c};state=createState(config,()=>.3);render();return state},get(){return state},selectTerritory,answer,continueResolution,push,bank,undo,togglePause,tick,points,checkVictory,finishTimed,render};window.TerritoryTakedownTest=`);
context.tasks=tasks;vm.runInContext(source,context);
const api=context.window.flow,board=context.window.TT_BOARD,arena=get('arena');
function flush(){for(let rounds=0;tasks.size&&rounds<5;rounds++){const list=[...tasks.values()];tasks.clear();list.forEach(fn=>fn())}}
function reset(){return api.reset({})}
function attack(target,s=api.get()){
 const t=board.territories.find(t=>t.id===target),from=t.adjacent[0];s.phase='select-source';s.source=null;s.target=null;s.owners[from]=s.current;s.owners[target]=(s.current+1)%s.teams.length;
 assert.equal(api.selectTerritory(from),true);assert.equal(api.selectTerritory(target),true);return s;
}
function resolve(correct=true){const s=api.get();api.answer(correct?s.question.answer:(s.question.answer+1)%4);api.continueResolution();flush();return api.get()}
let s=reset();const image=arena.children[0],overlay=arena.children[1],first=overlay.children[0];
assert.equal(overlay.children.length,21);const imageBefore=JSON.stringify(image);
attack('t3');const gold=overlay.children.find(b=>b.dataset.id===s.source);assert.ok(gold.className.includes('selected'));assert.equal(gold.props['--team'],s.teams[0].color);
const expected=board.territories.find(t=>t.id===s.source).adjacent.filter(id=>s.owners[id]!==s.current).sort();assert.deepEqual(overlay.children.filter(b=>b.className.includes('legal')).map(b=>b.dataset.id).sort(),Array.from(expected));
resolve();assert.equal(s.owners.t3,0);assert.equal(s.shields.t3,true);assert.equal(s.phase,'push-bank');assert.equal(arena.children[0],image);assert.equal(overlay.children[0],first);assert.equal(JSON.stringify(image),imageBefore);
assert.match(overlay.children[2].attributes['aria-label'],/active shield/);assert.equal(overlay.children[2].props['--team'],s.teams[0].color);
api.bank();flush();assert.equal(s.current,1);assert.equal(s.owners.t3,0);
attack('t3');resolve();assert.equal(s.owners.t3,0,'shield blocks ownership change');assert.equal(s.shields.t3,undefined);get('continueBtn').onclick();assert.equal(s.current,0);
s=reset();attack('t1');resolve();api.push();assert.equal(s.isPush,true);attack('t4');resolve(false);assert.equal(s.owners.t1,1,'failed Push rolls most recent capture back');assert.equal(s.current,1);
s=reset();attack('t1');resolve(false);assert.equal(s.owners.t1,1);assert.equal(s.current,1);
s=reset();attack('t5');resolve();assert.equal(s.bonusAttack,true);assert.equal(s.phase,'select-source');assert.equal(s.current,0);
s=reset();attack('t8');assert.equal(s.question.difficulty,'challenge');resolve();assert.equal(s.owners.t8,0);
s=reset();const before=api.points(0);s.owners.t13=1;const unowned=api.points(0);s.owners.t13=0;assert.equal(api.points(0)-unowned,2);
s=reset();attack('t1');resolve();api.undo();s=api.get();assert.equal(s.owners.t1,1);assert.equal(arena.children[0],image);
api.togglePause();const remaining=s.timeLeft;api.tick();assert.equal(s.timeLeft,remaining);assert.equal(api.selectTerritory('t1'),false);api.togglePause();api.tick();assert.equal(s.timeLeft,remaining-1);
for(const n of [2,3,4,5,6]){s=api.reset({teamCount:n});assert.equal(s.teams.length,n);assert.equal(new Set(overlay.children.map(b=>b.props['--team'])).size,n)}
s=api.reset({mode:'target',target:12});for(const t of board.territories)s.owners[t.id]=0;api.checkVictory();assert.equal(s.ended,true);
s=api.reset({mode:'domination'});for(const t of board.territories)s.owners[t.id]=0;api.checkVictory();assert.equal(s.ended,true);
s=api.reset({duration:1});api.tick();assert.equal(s.ended,true);
assert.equal(arena.replacements,1,'scenery and controls mount only once across turns, undo, rematches and team counts');
// Geometry at real available map widths: uncropped ratio, edge clearance,
// 44px minimum hit areas, and no tap target covering a neighboring marker center.
for(const width of [272,310,354,700,1180,1394]){
 const height=width*2/3,size=Math.max(44,Math.min(width*.07,84));
 const rects=board.territories.map(t=>({id:t.id,x:width*t.x/100,y:height*t.y/100}));
 for(const r of rects){assert.ok(r.x-size/2>=0&&r.x+size/2<=width,`${width}: ${r.id} horizontal bounds`);assert.ok(r.y-size/2>=0&&r.y+size/2<=height,`${width}: ${r.id} vertical bounds`)}
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)assert.ok(Math.hypot(rects[i].x-rects[j].x,rects[i].y-rects[j].y)>=Math.max(29,size/2),`${width}: markers collide: ${rects[i].id}/${rects[j].id}`);
}
console.log('Layered board: capture/failure, adjacency, Push rollback, Bank, Double Attack, shield acquire/block, Challenge questions, Stronghold points, Undo, pause/timer, all victory modes, 2–6 colors, stable image/buttons and phone-to-projector geometry passed.');
