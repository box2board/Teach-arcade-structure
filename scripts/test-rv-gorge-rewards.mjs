import {harness} from './test-rv-routes.mjs';
import assert from 'node:assert/strict';
const h=harness({search:'?level=gorge',instrument:true});h.hooks.seed();
// Pickups are removed; driving through their old positions adds no collectible reward.
h.hooks.place({x:900,y:h.hooks.road(900)-23,nitro:50});h.hooks.reward(0);assert.equal(h.debug().nitro,50);assert.equal(h.debug().gorgeRun.pickups,undefined);
// Speed section accelerates without nitro, but releasing gas and braking works.
h.key('ArrowRight');h.hooks.place({x:15700,y:h.hooks.road(15700)-23,vx:760,on:true,boost:0,canyonDone:true});for(let i=0;i<240;i++)h.hooks.tick(1/120);const fast=h.debug().speed;assert(fast>850);assert.equal(h.debug().gorgeRun.speedSeen.filter(x=>x===15000).length,1);assert(h.debug().gorgeRun.speedSeconds>0);h.key('ArrowRight',true);h.key('ArrowLeft');for(let i=0;i<30;i++)h.hooks.tick(1/120);assert(h.debug().speed<fast-150);
for(const [time,health,clear,expected]of [[60,60,true,'GOLD'],[60.01,60,true,'SILVER'],[60,59,true,'SILVER'],[59,100,false,'SILVER'],[75,30,false,'SILVER'],[75.01,100,true,'BRONZE'],[50,29,true,'BRONZE']])assert.equal(h.hooks.medal(time,health,clear),expected);
// Real finish path produces a medal, then replay resets all collectible state.
h.key('ArrowLeft',true);h.hooks.place({x:37999,y:h.hooks.road(37999)-23,vx:760,on:true,time:76,health:82});h.hooks.tick(1/120);assert.equal(h.debug().mode,'finished');assert.equal(h.debug().gorgeRun.medal,'BRONZE');assert.equal(h.ids.get('overlay').querySelector('h1').textContent,'BRONZE MEDAL!');h.click('start');assert.equal(h.debug().gorgeRun.recovery,0);assert.equal(h.debug().gorgeRun.medal,null);
// Switching to an existing level removes the entire feature state.
h.hooks.select(0);assert.equal(h.debug().gorgeRun.recovery,0);
console.log(JSON.stringify({gorgeRewardsPassed:true,pickupsRemoved:true,replay:true,speedWithoutNitro:fast,braking:true,medalBoundaries:true,otherLevelsDisabled:true}));
