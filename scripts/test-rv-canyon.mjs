// Unit-only state seeding avoids spending 4 km approaching each trajectory.
// The browser game exposes only its read-only QA snapshot.
import {harness} from './test-rv-routes.mjs';
import assert from 'node:assert/strict';
function attempt(strategy){const h=harness({search:'?level=gorge',instrument:true});h.hooks.seed();const initial=h.hooks.state().health;for(let i=0;i<1200&&!h.hooks.state().canyonDone;i++){strategy(h,i);h.hooks.tick(1/120);const r=h.hooks.state();assert(Number.isFinite(r.x)&&Number.isFinite(r.y));}const r=h.hooks.state(),d=h.debug();assert(r.canyonDone);assert.equal(r.health,initial);return {state:r,metrics:d.metrics};}
const plain=attempt(()=>{});assert.equal(plain.metrics.canyonRecoveries,1);assert.equal(plain.metrics.canyonClears,0);assert(plain.state.on&&plain.state.x>5950&&plain.state.vx===0);
const single=[];for(let offset=-200;offset<=1150;offset+=50){let fired=false;const r=attempt(h=>{if(!fired&&h.hooks.state().x>=4700+offset){h.key(' ');fired=true;}});assert.equal(r.metrics.canyonClears,0,`single jump unexpectedly clears at ${offset}`);single.push(offset);}
let count=0;const double=attempt(h=>{const x=h.hooks.state().x;if(count===0&&x>=4900){h.key(' ');count++;}else if(count===1&&x>=5200){h.key(' ');count++;}});assert.equal(double.metrics.canyonClears,1);assert.equal(double.metrics.canyonRecoveries,0);assert.equal(double.metrics.doubleJumps,1);
// Broad timing window for the canyon-specific second-jump forward correction.
for(const [first,second] of [[4800,5000],[4900,5100],[4900,5300],[5000,5200]]){let n=0;const r=attempt(h=>{const x=h.hooks.state().x;if(n===0&&x>=first){h.key(' ');n++;}else if(n===1&&x>=second){h.key(' ');n++;}});assert.equal(r.metrics.canyonClears,1,`double jump ${first}/${second}`);}
let boosted=false;const nitro=attempt(h=>{if(!boosted&&h.hooks.state().x>=4500){h.key('Shift');boosted=true;}});assert.equal(nitro.metrics.canyonClears,1);assert.equal(nitro.metrics.jumps,0);
console.log(JSON.stringify({canyonPassed:true,singleJumpTimingsRejected:single.length,plain:plain.metrics,double:double.metrics,nitro:nitro.metrics},null,2));

for(const approachSpeed of [500,650,720]){const h=harness({search:'?level=gorge',instrument:true});h.hooks.seed();h.hooks.place({x:4475,y:h.hooks.road(4475)-23,vx:approachSpeed});h.key('Shift');for(let i=0;i<600&&!h.hooks.state().canyonDone;i++)h.hooks.tick(1/120);assert.equal(h.debug().metrics.canyonClears,1,`nitro approach ${approachSpeed}`);}

// Misses must stop for a full two seconds, with time counted and controls ignored.
const recovery=harness({search:'?level=gorge',instrument:true});recovery.hooks.seed();
for(let i=0;i<1200&&!recovery.hooks.state().canyonDone;i++)recovery.hooks.tick(1/120);
let r=recovery.hooks.state();assert.equal(r.gorgeRun.recovery,2);const stoppedX=r.x,startedAt=r.time,nitroBefore=r.nitro;
recovery.key(' ');recovery.key('Shift');
for(let i=0;i<120;i++)recovery.hooks.tick(1/120);
r=recovery.hooks.state();assert.equal(r.x,stoppedX);assert.equal(r.vx,0);assert.equal(r.buffer,0);assert.equal(r.nitro,nitroBefore);assert(Math.abs(r.gorgeRun.recovery-1)<1e-6);
recovery.click('pause');recovery.hooks.tick(1);assert.equal(recovery.hooks.state().time,r.time);assert.equal(recovery.hooks.state().gorgeRun.recovery,r.gorgeRun.recovery);recovery.click('pause');
for(let i=0;i<121;i++)recovery.hooks.tick(1/120);
r=recovery.hooks.state();assert(r.time-startedAt>=2);assert.equal(r.gorgeRun.recovery,0);assert.equal(recovery.debug().metrics.canyonClears,0);assert.equal(recovery.debug().metrics.canyonRecoveries,1);
recovery.key('ArrowRight');for(let i=0;i<60;i++)recovery.hooks.tick(1/120);assert(recovery.hooks.state().x>stoppedX);assert.equal(recovery.hooks.state().gorgeRun.recovery,0);
console.log('Two-second canyon penalty, blocked input, pause and resume passed.');
