import {meadowState,meadowInteractables,stepMeadow,meadowObjective} from './meadow.js';
export const sparks=[{x:95,y:250},{x:385,y:95},{x:655,y:490},{x:890,y:80},{x:900,y:550},{x:280,y:820},{x:1160,y:840},{x:1650,y:170},{x:1800,y:960}];
export const extras={vane:{x:890,y:160},mill:{x:890,y:285},gate:{x:555,y:245},cog:{x:890,y:510}};
export const mirrors=[{x:1150,y:330,target:0},{x:1440,y:330,target:2},{x:1440,y:680,target:0}];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function adventureState(old={}){
  return {...meadowState(old),crossed:old.crossed===true,vane:Number.isInteger(old.vane)?clamp(old.vane,0,3):0,
    cog:old.cog===true,repair:Number.isFinite(old.repair)?clamp(old.repair,0,1):0,
    pump:Number.isFinite(old.pump)?clamp(old.pump,0,1):0,windAngle:0,
    gate:Number.isInteger(old.gate)?clamp(old.gate,0,3):0,
    garden:Array.from({length:2},(_,i)=>Number.isFinite(old.garden?.[i])?clamp(old.garden[i],0,1):0),
    sparks:Array.isArray(old.sparks)?[...new Set(old.sparks.filter(n=>Number.isInteger(n)&&n>=0&&n<sparks.length))]:[],
    elapsed:0,gardenRestored:Array.isArray(old.garden)&&old.garden.length===2&&old.garden.every(n=>n===1)&&old.pump===1,
    mirrors:mirrors.map((m,i)=>Number.isInteger(old.mirrors?.[i])?clamp(old.mirrors[i],0,3):[1,0,3][i]),
    beacon:Number.isFinite(old.beacon)?clamp(old.beacon,0,1):0,
    finished:old.finished===true&&old.beacon===1&&old.pond===1};
}
export function interactables(s){
  return [...(s.crossed?[{id:'vane',...extras.vane},{id:'mill',...extras.mill}]:[]),
    ...(s.pump===1?[{id:'gate',...extras.gate}]:[]),...mirrors.map((m,i)=>({...m,id:`mirror${i}`})),...meadowInteractables(s)];
}
export function stepAdventure(s,dt){
  const events=[];s.elapsed+=dt;
  if(s.bridge===1&&s.player.x>860&&!s.crossed){s.crossed=true;events.push('crossing');}
  if(s.crossed&&!s.cog&&Math.hypot(s.player.x-extras.cog.x,s.player.y-extras.cog.y)<28){s.cog=true;events.push('cog');}
  for(let i=0;i<sparks.length;i++)if(!s.sparks.includes(i)&&Math.hypot(s.player.x-sparks[i].x,s.player.y-sparks[i].y)<25){s.sparks.push(i);events.push('spark');}
  const wind=s.vane===1?0.8+Math.sin(s.elapsed*.7)*.15:0;
  s.windAngle+=wind*dt*3;
  if(s.crossed&&s.repair===1&&wind>0&&s.pump<1){s.pump=Math.min(1,s.pump+wind*dt/5);if(s.pump===1)events.push('pump');}
  if(s.pump===1&&wind>0&&s.elbow===3&&Math.abs(s.troughY-330)<4){
    const healthy=s.valve>=.3&&s.valve<=.65;
    for(let i=0;i<2;i++){
      const fed=s.gate===2||s.gate===(i===0?1:3);
      if(fed&&healthy&&s.garden[i]<1){s.garden[i]=Math.min(1,s.garden[i]+dt/7);if(s.garden[i]===1)events.push('bloom');}
    }
  }
  if(s.garden.every(n=>n===1)&&!s.gardenRestored){s.gardenRestored=true;events.push('garden');}
  if(s.gardenRestored&&mirrors.every((m,i)=>s.mirrors[i]===m.target)&&s.beacon<1){s.beacon=Math.min(1,s.beacon+dt/5);}
  events.push(...stepMeadow(s,dt));
  if(s.beacon===1&&s.pond===1&&!s.finished){s.finished=true;s.won=true;events.push('finish');}
  return events;
}
export function objective(s){
  if(s.finished)return 'Valley restored · Find the remaining light seeds.';
  if(s.gardenRestored&&s.pond<1)return meadowObjective(s);
  if(s.gardenRestored)return mirrors.every((m,i)=>s.mirrors[i]===m.target)?'The sun beacon is charging…':'Follow the east trail. Reflect sunlight into the ridge beacon.';
  if(!s.crossed)return s.bridge===1?'Cross the bridge.':s.elbow!==3?'Redirect the stream.':Math.abs(s.troughY-330)>=4?'Reconnect the loose channel.':'Power the bridge with moving water.';
  if(!s.cog)return 'Explore the far bank. Find the missing gear.';
  if(s.repair<1)return 'Take the gear to the wind pump. Hold E to fit it.';
  if(s.vane!==1)return 'Turn the wind vane toward the breeze →.';
  if(s.pump<1)return 'The wind pump is charging…';
  if(s.gate!==2)return 'Open both garden channels with the splitter.';
  if(s.valve<.3)return 'The garden needs more water. Open the valve.';
  if(s.valve>.65)return 'Too much water! At the valve, hold E to balance or Q to lower.';
  return 'Watch the garden bloom. Both beds need water.';
}
