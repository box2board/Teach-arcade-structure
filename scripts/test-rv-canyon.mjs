// Unit-only state seeding avoids spending 4 km approaching each trajectory.
// The browser game exposes only its read-only QA snapshot.
import {harness} from './test-rv-routes.mjs';
import assert from 'node:assert/strict';
function attempt(strategy){const h=harness({search:'?level=gorge',instrument:true});h.hooks.seed();const initial=h.hooks.state().health;for(let i=0;i<1200&&!h.hooks.state().canyonDone;i++){strategy(h,i);h.hooks.tick(1/120);const r=h.hooks.state();assert(Number.isFinite(r.x)&&Number.isFinite(r.y));}const r=h.hooks.state(),d=h.debug();assert(r.canyonDone);assert.equal(r.health,initial);return {state:r,metrics:d.metrics};}
const plain=attempt(()=>{});assert.equal(plain.metrics.canyonRecoveries,1);assert.equal(plain.metrics.canyonClears,0);assert(plain.state.on&&plain.state.x>5950&&plain.state.vx>=360);
const single=[];for(let offset=-200;offset<=1150;offset+=50){let fired=false;const r=attempt(h=>{if(!fired&&h.hooks.state().x>=4700+offset){h.key(' ');fired=true;}});assert.equal(r.metrics.canyonClears,0,`single jump unexpectedly clears at ${offset}`);single.push(offset);}
let count=0;const double=attempt(h=>{const x=h.hooks.state().x;if(count===0&&x>=4900){h.key(' ');count++;}else if(count===1&&x>=5200){h.key(' ');count++;}});assert.equal(double.metrics.canyonClears,1);assert.equal(double.metrics.canyonRecoveries,0);assert.equal(double.metrics.doubleJumps,1);
let boosted=false;const nitro=attempt(h=>{if(!boosted&&h.hooks.state().x>=4500){h.key('Shift');boosted=true;}});assert.equal(nitro.metrics.canyonClears,1);assert.equal(nitro.metrics.jumps,0);
console.log(JSON.stringify({canyonPassed:true,singleJumpTimingsRejected:single.length,plain:plain.metrics,double:double.metrics,nitro:nitro.metrics},null,2));
