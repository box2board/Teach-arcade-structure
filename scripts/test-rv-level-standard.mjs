import {harness} from './test-rv-routes.mjs';
import assert from 'node:assert/strict';
const routes=[[],[5650],[6440,21960],[4700],[4200,19500,31000],[3000,6240,19000,22440]];
for(let level=0;level<6;level++)for(const start of (level===4?[]:level===5?[6240,22440]:routes[level]))for(const strategy of ['miss','nitro','double']){
 const h=harness({instrument:true});h.hooks.select(level);h.click('start');h.hooks.gap(routes[level].indexOf(start));const x=start-350;h.hooks.place({x,y:h.hooks.road(x)-23,vx:760});h.key('ArrowRight');let n=0;
 for(let i=0;i<1400;i++){const r=h.hooks.state();if(strategy==='nitro'&&n===0&&r.x>=start-200){h.key('Shift');n++;}if(strategy==='double'){if(n===0&&r.x>=start+200){h.key(' ');n++;}else if(n===1&&r.x>=start+500){h.key(' ');n++;}}h.hooks.tick(1/120);if(h.debug().metrics.canyonClears+h.debug().metrics.canyonRecoveries)break;}
 const d=h.debug();assert.equal(d.metrics.canyonClears,strategy==='miss'?0:1,`${level}/${start}/${strategy}`);assert.equal(d.metrics.canyonRecoveries,strategy==='miss'?1:0);
}
console.log('New route gap strategies passed');
for(let level=0;level<6;level++){
 const h=harness({instrument:true});h.hooks.select(level);h.click('start');h.key('ArrowRight');
 for(let i=0;i<14000&&h.debug().mode!=='finished';i++)h.hooks.tick(1/120);
 const d=h.debug();assert.equal(d.mode,'finished');assert.equal(d.metrics.canyonRecoveries,routes[level].length);assert.equal(d.metrics.canyonClears,0);assert(d.gorgeRun.medal);console.log({level:level+1,time:d.time,recoveries:d.metrics.canyonRecoveries,medal:d.gorgeRun.medal});
}
