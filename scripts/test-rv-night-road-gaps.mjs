import {harness} from './test-rv-routes.mjs';
import assert from 'node:assert/strict';
for(const [n,start] of [4200,19500,31000].entries())for(const strategy of ['miss','jump','nitro']){
 const h=harness({instrument:true});h.hooks.select(4);h.click('start');h.hooks.gap(n);const x=start-150;h.hooks.place({x,y:h.hooks.road(x)-23,vx:760,nitro:100});h.key('ArrowRight');let fired=false;
 for(let i=0;i<1000;i++){const r=h.hooks.state();if(!fired&&r.x>=start-130){if(strategy==='jump')h.key(' ');if(strategy==='nitro')h.key('Shift');fired=true;}h.hooks.tick(1/120);if(h.debug().metrics.canyonClears+h.debug().metrics.canyonRecoveries)break;}
 const d=h.debug();assert.equal(d.metrics.canyonClears,strategy==='jump'?1:0,`${start}/${strategy}`);assert.equal(d.metrics.canyonRecoveries,strategy==='jump'?0:1);if(strategy!=='jump'){assert.equal(d.speed,0);assert.equal(h.hooks.state().gorgeRun.recovery,2);}console.log({start,strategy,clear:d.metrics.canyonClears,miss:d.metrics.canyonRecoveries});
}
