import {doorOpen,exitReady} from './model.js';
export function matches(map,state,when={}){
  for(const field of ['tools','items','keys','usedKeys','opened','activated','discovered','solved','collected']){
    if(when[field]&&!when[field].every(id=>state[field].includes(id)))return false;
  }
  if(when.doorOpen){const door=map.doors.find(d=>d.id===when.doorOpen);if(!door||!doorOpen(map,state,door))return false;}
  if(when.exitReady){const exit=map.objects.find(o=>o.id===when.exitReady);if(!exit||!exitReady(map,state,exit))return false;}
  if(when.all&&!when.all.every(rule=>matches(map,state,rule)))return false;
  if(when.any&&!when.any.some(rule=>matches(map,state,rule)))return false;
  if(when.not&&matches(map,state,when.not))return false;
  return true;
}
export function roomAt(map,x,y){return map.rooms.find(r=>x>=r.min&&x<=r.max&&y>=(r.minY??0)&&y<=(r.maxY??map.tiles.length-1));}
export function objectiveFor(map,state,room){return (room.objectiveRules||[]).find(rule=>matches(map,state,rule.when))?.text||room.objective||'Explore the room.';}
export function progressFor(map,state){
  const milestones=map.milestones||[];
  return {label:map.progressLabel||'Progress',completed:milestones.filter(m=>matches(map,state,m.when)).length,total:milestones.length};
}
export function rewardFor(map,chest){
  const reward=chest.reward||{type:'key',value:chest.key};
  const item=(map.inventory||[]).find(i=>i.type===reward.type&&i.value===reward.value);
  return {...reward,label:reward.label||item?.label||'Reward'};
}
