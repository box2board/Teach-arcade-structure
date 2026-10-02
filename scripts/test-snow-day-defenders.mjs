import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../public/assets/vendor/three-0.162.0/three.module.js';
import {segmentSphereHit} from '../public/dev/snow-day-defenders/collision.js';
import {UPGRADE_RULES,freshUpgrades,grantTokens,canBuy,buyUpgrade} from '../public/dev/snow-day-defenders/upgrades.js';
import {DIFFICULTIES,WAVE_PATTERNS,buildWave} from '../public/dev/snow-day-defenders/waves.js';

// Run actual gameplay against real Three.js scene objects. Only WebGL rendering
// and DOM elements are stubbed; this does not verify pixels or device performance.
class Element {
 constructor(){this.handlers={};this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';}
 addEventListener(k,f){(this.handlers[k]||=[]).push(f);}
 fire(k,e={}){for(const f of this.handlers[k]||[])f(e);}
 querySelector(){return this.child||=new Element();}
 focus(){if(this.ownerDocument)this.ownerDocument.activeElement=this;}
 setAttribute(name,value){(this.attributes||={})[name]=value;}
 click(){if(!this.disabled)this.fire('click');}
 setPointerCapture(){}
 getBoundingClientRect(){return {left:0,top:0,width:1100,height:620};}
}
function harness(){
 const window=new Element(),document=new Element();document.activeElement=null;
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,Object.assign(new Element(),{ownerDocument:document}));return elements.get(id);};
 Object.assign(get('stage'),{clientWidth:1100,clientHeight:620});
 document.getElementById=get;document.hidden=false;
 const inputs=['easy','medium','hard'].map(value=>Object.assign(new Element(),{value,checked:value==='easy'}));document.querySelectorAll=()=>inputs;
 let callback,scene,clock=0,seed=42;
 const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 class Renderer {constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(s){scene=s;}}
 const ctx={THREE:{...THREE,WebGLRenderer:Renderer},UPGRADE_RULES,freshUpgrades,grantTokens,canBuy,buyUpgrade,DIFFICULTIES,WAVE_PATTERNS,buildWave:(d,w)=>buildWave(d,w,math.random),segmentSphereHit,window,document,Math:math,devicePixelRatio:1,ResizeObserver:class{observe(){}},performance:{now:()=>0},requestAnimationFrame:f=>callback=f,console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../public/dev/snow-day-defenders/game.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,''),ctx);
 const step=(n=1)=>{for(let i=0;i<n;i++){clock+=50;callback(clock);}};
 const state=()=>window.snowDayState();
 const key=(key,type='keydown',options={})=>window.fire(type,{key,preventDefault(){},...options});
 const select=value=>{for(const i of inputs)i.checked=i.value===value;inputs.find(i=>i.value===value).fire('change');};
 const click=id=>get(id).fire('click');
 const aim=()=>{const creatures=scene.children.filter(g=>g.userData.snowCreature&&g.scale.x>.6&&g.position.z<7.9).sort((a,b)=>b.position.z-a.position.z);key('ArrowLeft','keyup');key('ArrowRight','keyup');if(creatures[0]){const delta=creatures[0].position.x-state().playerX;if(Math.abs(delta)>.18)key(delta>0?'ArrowRight':'ArrowLeft');}};
 return {get,step,state,key,select,click,aim,focused:()=>[...elements].find(([,e])=>e===document.activeElement)?.[0],fixture:source=>vm.runInContext(source,ctx)};
}
for(const level of Object.keys(DIFFICULTIES))for(let wave=0;wave<3;wave++){
 const plan=buildWave(level,wave,()=>.5);
 assert.equal(plan.events.length,DIFFICULTIES[level].counts[wave]);
 assert(plan.events.every((e,i)=>e.x>=-5.1&&e.x<=5.1&&e.type>=0&&e.type<=2&&(!i||e.at>=plan.events[i-1].at)));
 if(wave===1)assert(plan.events.some((e,i,a)=>i&&e.at===a[i-1].at&&e.x*a[i-1].x<0),'split rush must arrive on both sides simultaneously');
}
const start={x:0,y:2,z:3},end={x:0,y:2,z:-3};
assert.equal(segmentSphereHit(start,end,{x:0,y:0,z:0},.7),null);
assert.notEqual(segmentSphereHit({...start,y:0},{...end,y:0},{x:0,y:0,z:0},.7),null);
let economy=freshUpgrades();assert(!canBuy(economy,'double',100));grantTokens(economy,3);assert(!canBuy(economy,'repair',100));assert.equal(buyUpgrade(economy,'repair',90).fort,100);assert(buyUpgrade(economy,'double',100).purchased);assert(!buyUpgrade(economy,'double',100).purchased);

for(const level of Object.keys(DIFFICULTIES)){
 const h=harness();h.select(level);h.click('start');assert.equal(h.state().difficulty,level);
 h.key('ArrowRight');h.step(10);h.key('ArrowRight','keyup');assert(h.state().playerX>3);
 h.click('pause');const paused=JSON.stringify(h.state());h.step(20);assert.equal(JSON.stringify(h.state()),paused);h.click('start');h.click('restart');
 let frames=0,breaks=0;
 while(!['won','lost'].includes(h.state().mode)&&frames++<15000){
  if(h.state().mode==='between'){
   const before=h.state();assert(!h.get('shop').hidden);h.step(20);assert.equal(h.state().spawned,before.spawned);assert.equal(h.state().upgrades.tokens,before.upgrades.tokens);
   assert.equal(before.burstCharges,3,'wave breaks replenish charges up to the cap');
   const id=breaks++===0?'double':'powder';h.click(`upgrade-${id}`);assert(h.state().upgrades[id]);assert.equal(h.state().upgrades.tokens,before.upgrades.tokens-2);
   h.click(`upgrade-${id}`);assert.equal(h.state().upgrades.tokens,before.upgrades.tokens-2);
   h.select(level==='hard'?'easy':'hard');h.click('start');assert.equal(h.state().difficulty,level,'cannot change difficulty mid-run');continue;
  }
  h.aim();h.step();
 }
 assert.equal(h.state().mode,'won',`${level} should be beatable with upgrades`);assert.equal(h.state().wave,3);assert(h.state().defeatedByType.every(n=>n>0));assert.equal(breaks,2);assert(h.state().splashHits>0,'powder burst must hit neighboring creatures');
 h.click('restart');assert.equal(h.state().upgrades.tokens,0);assert(!h.state().upgrades.double&&!h.state().upgrades.powder);assert.equal(h.state().wave,1);assert.equal(h.state().burstCharges,2);assert.equal(h.state().burstUses,0);
 console.log(`PASS: ${level} full run, upgrade breaks, collisions, all creature types, pause, difficulty lock, restart`);
}
const loss=harness();loss.select('hard');loss.click('start');loss.key('ArrowRight');loss.step(20);loss.key('ArrowRight','keyup');
for(let i=0;i<10000&&loss.state().mode!=='lost';i++){if(loss.state().mode==='between')loss.click('start');loss.step();}
assert.equal(loss.state().mode,'lost');assert.equal(loss.state().fort,0);
console.log('PASS: wave schedules, split rush, 3D collision, upgrade economy, fort loss');

const abilities=harness();
abilities.click('dash-right');abilities.key(' ');assert.equal(abilities.state().playerX,0);assert.equal(abilities.state().burstUses,0);
abilities.click('start');abilities.key(' ');assert.equal(abilities.state().burstCharges,2,'empty burst must preserve charge');
abilities.key('e');abilities.step();assert(abilities.state().playerX>1);assert(abilities.state().dashCooldown>2);
abilities.click('pause');const frozen=JSON.stringify(abilities.state());abilities.step(40);assert.equal(JSON.stringify(abilities.state()),frozen,'pause freezes active dash and cooldown');
abilities.key('q');abilities.click('snow-burst');assert.equal(JSON.stringify(abilities.state()),frozen,'paused abilities must be inert');
abilities.click('start');abilities.step(3);assert(Math.abs(abilities.state().playerX-3.52)<.001,'dash has a fixed distance');
abilities.key('q');abilities.step();assert(Math.abs(abilities.state().playerX-3.52)<.001,'dash cooldown blocks reuse');
abilities.step(60);abilities.key('q','keydown',{repeat:true});assert.equal(abilities.state().dashCooldown,0,'held key must not auto-trigger dash');
abilities.click('dash-left');abilities.step(4);assert(Math.abs(abilities.state().playerX)<.001,'touch dash uses same movement');
abilities.step(60);abilities.key('ArrowRight');abilities.step(30);abilities.key('ArrowRight','keyup');abilities.key('e');abilities.step(4);assert.equal(abilities.state().playerX,5.7);assert.equal(abilities.state().dashCooldown,0,'edge dash preserves cooldown');
abilities.click('restart');assert.equal(abilities.state().dashCooldown,0);
// Controlled crowd fixture checks actual area damage and exclusion at the boundary.
abilities.fixture("enemies.forEach(disposeEntity);enemies=[creature(0,0,0),creature(1,1,0),creature(2,-1,0),creature(0,0,-20)];");
abilities.key(' ');assert.equal(abilities.state().burstCharges,1);assert.equal(abilities.state().burstHits,5);assert.equal(abilities.state().cleared,2);assert.equal(abilities.state().enemies,2);
assert.equal(abilities.fixture('enemies[0].hp'),3,'giant takes two hits');assert.equal(abilities.fixture('enemies[1].hp'),2,'distant creature is untouched');
assert(abilities.fixture('enemies[0].z')<-2,'survivors are pushed away from the fort');
abilities.click('snow-burst');assert.equal(abilities.state().burstCharges,1,'burst cooldown prevents double spend');
abilities.step(25);abilities.fixture('enemies[0].z=0;enemies[0].root.position.z=0;');abilities.key('b');assert.equal(abilities.state().burstCharges,0);assert.equal(abilities.state().burstUses,2);
abilities.step(25);const spent=abilities.state().burstHits;abilities.click('snow-burst');assert.equal(abilities.state().burstHits,spent,'empty charges block burst');
abilities.click('restart');assert.equal(abilities.state().burstCharges,2);assert.equal(abilities.state().burstHits,0);assert.equal(abilities.state().burstCooldown,0);
abilities.fixture("mode='between';");const between=JSON.stringify(abilities.state());abilities.click('dash-left');abilities.click('snow-burst');assert.equal(JSON.stringify(abilities.state()),between,'upgrade breaks block abilities');
abilities.fixture("mode='playing';burstCharges=0;spawned=wavePlan.events.length;enemies.forEach(disposeEntity);enemies=[];");abilities.step();assert.equal(abilities.state().mode,'between');assert.equal(abilities.state().burstCharges,1,'wave break replenishes a spent charge');
console.log('PASS: keyboard/touch dash, fixed distance, edge limits, cooldowns, repeat guard, pause, burst area damage, charge limits, restart');

const menu=harness();menu.click('start');
menu.fixture("spawned=wavePlan.events.length;enemies.forEach(disposeEntity);enemies=[];fort=90;");menu.step();
assert.equal(menu.state().mode,'between');assert.equal(menu.focused(),'upgrade-double','upgrade screen receives keyboard focus');
assert.equal(menu.get('overlay').dataset.mode,'between');assert.equal(menu.get('overlay').attributes['aria-modal'],'true');
menu.key('ArrowRight');assert.equal(menu.focused(),'upgrade-sticky');menu.key('ArrowDown');assert.equal(menu.focused(),'upgrade-repair');
menu.key('Enter');assert.equal(menu.state().fort,100);assert.equal(menu.state().upgrades.tokens,2);assert.equal(menu.focused(),'upgrade-double','disabled repair loses selection after purchase');
menu.key('ArrowDown');assert.equal(menu.focused(),'upgrade-powder');menu.key('Enter','keydown',{repeat:true});assert(!menu.state().upgrades.powder,'held Enter cannot purchase');
menu.key('Enter');assert(menu.state().upgrades.powder);assert.equal(menu.state().upgrades.tokens,0);assert.equal(menu.focused(),'start','next-wave button receives focus when upgrades are unavailable');
for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab']){menu.key(key);assert.equal(menu.focused(),'start','navigation skips disabled upgrades');}
menu.key('Enter');assert.equal(menu.state().wave,2);assert.equal(menu.state().mode,'playing');assert(menu.get('overlay').hidden);assert.equal(menu.focused(),'scene','starting next wave restores game controls');
menu.fixture("spawned=wavePlan.events.length;enemies.forEach(disposeEntity);enemies=[];");menu.step();
assert.equal(menu.focused(),'upgrade-double');menu.key('Tab','keydown',{shiftKey:true});assert.equal(menu.focused(),'start','Shift-Tab wraps within the menu');
menu.key('ArrowUp');assert.equal(menu.focused(),'upgrade-double','up skips equipped and unavailable bottom-row upgrades');
menu.key('ArrowRight');assert.equal(menu.focused(),'upgrade-sticky');menu.key(' ');assert(menu.state().upgrades.sticky);assert.equal(menu.focused(),'start');
console.log('PASS: upgrade arrow navigation, keyboard purchases, repeat guard, disabled options, focus containment, keyboard next wave');
