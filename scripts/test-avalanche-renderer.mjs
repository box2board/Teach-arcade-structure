import fs from 'node:fs';import {fileURLToPath} from 'node:url';import vm from 'node:vm';import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('../public/mini-games/games/',import.meta.url));
const listeners={},els={};let raf,events=0;
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function el(id){return els[id]??= {id,style:{},textContent:'',hidden:false,tagName:id==='canvas'?'CANVAS':'BUTTON',addEventListener(n,f){listeners[id+':'+n]=f;},getContext:()=>ctx,getBoundingClientRect:()=>({width:600,height:650,left:0}),focus(){},setPointerCapture(){},querySelector:s=>el(s.slice(1))};}
const sandbox={console,Math,Number,Set,Promise,Image:class{constructor(){this.width=200;this.height=250;}set src(v){this.onload();}},ResizeObserver:class{constructor(f){this.f=f;}observe(){this.f();}},devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>el('root'),addEventListener(){}},window:{addEventListener(){},dispatchEvent(){events++;}},CustomEvent:class{},requestAnimationFrame:f=>raf=f};
let src=fs.readFileSync(base+'avalanche-escape/engine.js','utf8').replaceAll('export ','')+'\n'+fs.readFileSync(base+'avalanche-escape/game.js','utf8').replace(/^import .*;\n/,'');
vm.createContext(sandbox);vm.runInContext(src+'\nglobalThis.test={game,begin,pause,resume,keys,held};',sandbox);await new Promise(r=>setImmediate(r));
const t=sandbox.test;t.begin();for(let i=0;i<120;i++)raf(i*16.667);assert(t.game.s.time>1);t.keys.add('arrowright');const x=t.game.s.x;for(let i=120;i<140;i++)raf(i*16.667);assert(t.game.s.x>x);t.keys.clear();t.held.add('dash');for(let i=140;i<170;i++)raf(i*16.667);assert(t.game.s.energy<1);t.pause();const time=t.game.s.time;for(let i=170;i<190;i++)raf(i*16.667);assert.equal(t.game.s.time,time);t.resume();for(let i=190;i<3100;i++)raf(i*16.667);assert.equal(t.game.s.phase,'finished');assert.equal(events,1);assert.equal(els.time.textContent,'0.0');assert.equal(els.overlay.hidden,false);t.begin();assert.equal(t.game.s.time,0);assert.equal(t.game.s.hits,0);console.log('PASS: start, steering, dash, pause/resume, 45-second finish, one completion event and replay');
const project=vm.runInContext('projectSlope',sandbox);
let lastY=0,lastR=0;
for(let y=-45;y<=650;y++){
 const p=project(75,y,30);assert(p.y>=200,'No obstacle enters through the sky');assert(p.y>=lastY,'Travel stays toward foreground');assert(p.r>=lastR,'Approach grows with depth');lastY=p.y;lastR=p.r;
 if(y>=340){assert.equal(p.x,75);assert.equal(p.y,y+60);assert.equal(p.r,30);}
}
assert(project(75,0,30).r<project(75,300,30).r);
console.log('PASS: slope-only spawning, monotonic ground approach, depth scaling, exact collision alignment near player');

// A 10 FPS device must still get a 45-second round, not a 90-second one.
t.begin();for(let i=0;i<=460;i++)raf(i*100);assert.equal(t.game.s.phase,'finished');assert.equal(t.game.s.time,45);assert.equal(events,2);
t.begin();t.game.s.spawn=999;t.game.s.objects=[{type:'flake',x:300,y:440,r:15,speed:0}];raf(0);raf(100);assert(vm.runInContext("particles.some(p=>p.kind==='gold')",sandbox));
t.game.s.objects=[{type:'ramp',x:300,y:440,r:35,speed:0}];raf(200);assert(vm.runInContext('rings.length>0',sandbox));assert(t.game.s.jump);t.game.s.jump.progress=t.game.s.jump.length;raf(300);assert.equal(t.game.s.jump,null);assert(vm.runInContext("particles.filter(p=>p.kind==='snow').length>=28",sandbox));
t.game.s.objects=[];listeners['canvas:pointerdown']({pointerId:1,clientX:500});raf(400);assert(t.game.s.x>300);listeners['canvas:pointercancel']({pointerId:1});const stopped=t.game.s.x;raf(500);assert.equal(t.game.s.x,stopped);
console.log('PASS: 10 FPS round timing, gold pickup sparkles, launch ring, landing puff, drag steering and pointer cancellation.');
