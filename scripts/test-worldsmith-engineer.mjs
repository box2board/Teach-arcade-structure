import assert from 'node:assert/strict';
import {initialState} from '../public/brain-arcade/apprentice-restorer/js/flow-model.js';
import {adventureState} from '../public/brain-arcade/apprentice-restorer/js/adventure.js';
import {engineerState,systemReadings,stepEngineer,engineerHint} from '../public/brain-arcade/apprentice-restorer/js/engineer.js';
const state=()=>({...initialState(),...adventureState(),...engineerState(),mode:'engineer',pump:1,vane:1,elbow:3,troughY:330,bridge:1,crossed:true,cog:true,repair:1,gate:2,garden:[.65,.65],pond:.45});
const run=(s,seconds)=>{const events=[];for(let i=0;i<seconds*60;i++)events.push(...stepEngineer(s,1/60));return events;};
for(const valve of [.1,.4,.65,.9,1])for(const share of [.1,.4,.9])for(const gate of [0,.5,1]){
  const s={...state(),valve,gardenShare:share,sluice:gate,logX:470,diverter:2};const r=systemReadings(s);
  assert(Math.abs(r.garden+r.pond+r.wheel+r.spill-r.source)<1e-9,'Water is conserved across the network');
}
const maximum={...state(),valve:1,gardenShare:.5,sluice:1,logX:470,diverter:2};run(maximum,60);assert(!maximum.trialComplete,'Opening everything fails');assert(maximum.garden[0]<.65,'Overwatering damages beds');assert.match(engineerHint(maximum),/spilling/);
const blocked={...state(),valve:.65,gardenShare:.4,sluice:.7,diverter:2};run(blocked,60);assert(!blocked.trialComplete);assert.equal(systemReadings(blocked).pond,0);assert.match(engineerHint(blocked),/not reaching/);
const dry={...state(),valve:.65,gardenShare:.4,sluice:0,logX:470,diverter:2};run(dry,30);assert(dry.pond<.45,'Pond loses water without continued inflow');assert(!dry.trialComplete);
for(const [valve,share,sluice] of [[.65,.4,.7],[.62,.45,.8],[.7,.4,.6]]){
  const s={...state(),valve,gardenShare:share,sluice,logX:470,diverter:2};assert(run(s,60).includes('engineered'),'Different arrangements can succeed');assert(s.trialComplete);assert.equal(s.stability,12);
  const restored=engineerState(JSON.parse(JSON.stringify(s)));assert(restored.trialComplete);assert(restored.pondRestored);
}
const interrupted={...state(),valve:.65,gardenShare:.4,sluice:.7,logX:470,diverter:2,garden:[1,1],pond:.8};run(interrupted,5);assert(interrupted.stability>4.9);interrupted.gate=1;run(interrupted,1);assert.equal(interrupted.stability,0,'A fault resets continuous stability');assert(!interrupted.trialComplete);
assert.equal(engineerState({gardenShare:NaN,stability:Infinity,trialComplete:true}).trialComplete,false);
console.log('PASS: conservation, maximum-flow failure, blocked routes, pond losses, continuous stability, multiple solutions, saved Engineer completion.');
