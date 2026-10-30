// Deterministic route smoke test. This runs real game code with mocked drawing/DOM;
// it verifies logic, not browser rendering, player feel or device performance.
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../public/brain-arcade/rv-road-trip-mayhem/alpine-run.js',import.meta.url),'utf8');
function harness(){
 const ids=new Map(),events=new Map();let nextFrame,now=0;
 const gradient={addColorStop(){}};
 const canvas=new Proxy({}, {get:(o,k)=>o[k]??(k==='createLinearGradient'?()=>gradient:()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){if(!ids.has(id))ids.set(id,{id,style:{},dataset:{},classList:{add(){},remove(){}},value:'0',textContent:'',innerHTML:'',hidden:false,width:1000,height:560,children:new Map(),listeners:new Map(),addEventListener(k,fn){this.listeners.set(k,fn)},querySelector(k){if(!this.children.has(k))this.children.set(k,element(id+':'+k));return this.children.get(k)},getContext:()=>canvas});return ids.get(id)}
 const document={getElementById:element,createElement:()=>element('atlas'+ids.size),querySelectorAll:()=>[],addEventListener:(k,fn)=>events.set(k,fn)};
 const sandbox={document,console,URLSearchParams,location:{search:''},Image:class{complete=true;naturalWidth=600;naturalHeight=300},performance:{now:()=>now},requestAnimationFrame:fn=>nextFrame=fn,addEventListener:(k,fn)=>events.set(k,fn)};sandbox.window=sandbox;
 vm.runInNewContext(source,sandbox);
 const key=(key,up=false)=>events.get(up?'keyup':'keydown')?.({key,repeat:false,preventDefault(){}});
 const step=(n=1)=>{for(let i=0;i<n;i++){now+=1000/60;nextFrame(now)}};
 return {ids,debug:()=>sandbox.rvGameDebug,key,step,click:id=>element(id).onclick()};
}
const h=harness();h.click('start');h.key('ArrowRight');h.step(30);h.key(' ');h.step(6);h.key(' ');h.step(6);assert.equal(h.debug().jumpsUsed,2);assert.equal(h.debug().metrics.doubleJumps,1);h.step(120);assert(h.debug().metrics.landings>0);
// Pause freezes route progress and clears held gas; resume needs a fresh input.
h.click('pause');const parked=h.debug().x;h.step(90);assert.equal(h.debug().x,parked);h.click('pause');h.key('ArrowRight');
const results=[];
for(let level=0;level<3;level++){
 const zones=new Set();for(let frame=0;frame<12000&&h.debug().mode!=='finished';frame++){
  if(frame%55===0)h.key(' ');if(frame%55===7)h.key(' ');if(frame%480===0)h.key('Shift');h.step();const s=h.debug();zones.add(s.zone);assert(Number.isFinite(s.x)&&Number.isFinite(s.y));assert(s.health>0&&s.health<=100);assert(s.particles<=150);
 }
 const end=h.debug();assert.equal(end.mode,'finished');assert(end.x>=38000);assert.equal(zones.size,5);assert(end.metrics.jumps>0&&end.metrics.doubleJumps>0&&end.metrics.landings>0);results.push({level:level+1,time:end.time,zones:[...zones],cleared:end.cleared,health:end.health,metrics:end.metrics});
 h.click('start');assert.equal(h.debug().mode,'running');if(level<2)assert.equal(h.ids.get('levelSelect').value,String(level+1));else assert.equal(h.ids.get('levelSelect').value,'2');h.key('ArrowRight');
}
h.click('restart');assert.equal(h.debug().x,120);assert.equal(h.debug().health,100);
console.log(JSON.stringify({passed:true,kind:'logic simulation; not a browser playthrough',results},null,2));
