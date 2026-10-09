import {lightPaths} from './model.js';
import {matches,roomAt,objectiveFor} from './presentation.js';

export function hintFor(map,state){
  const room=roomAt(map,state.player.x,state.player.y)||map.rooms[0];
  const powered=lightPaths(map,state).powered;
  const rule=(map.hintRules||[]).find(rule=>rule.room===room.name&&matches(map,state,rule.when)&&(!rule.receiver||powered.includes(rule.receiver)===rule.powered));
  if(rule)return rule;
  const objective=objectiveFor(map,state,room);
  return {id:'room:'+room.name+':'+objective,title:room.name,steps:[objective,'Read accessible signs and check Bag & clues for earned tools and discovered clues. Face an object and use E or Space to interact.','If a movable object is trapped, try Undo. Reset puzzle returns movable objects to their starting positions and you to the entrance, while keeping earned rewards, clues and opened paths.']};
}
export function revealHint(state,hint,{more=false}={}){
  state.hints??={};
  const previous=state.hints[hint.id]||0;
  const level=Math.min(hint.steps.length,previous?(more?previous+1:previous):1);
  state.hints[hint.id]=level;
  return {level,text:hint.steps[level-1],hasMore:level<hint.steps.length};
}
export function validHintUsage(value){
  return value===undefined||Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).length<=256&&Object.entries(value).every(([id,level])=>id.length>0&&id.length<=500&&Number.isInteger(level)&&level>=1&&level<=3));
}
export function hintSummary(state){
  const levels=Object.values(state.hints||{});
  return {revealed:levels.reduce((sum,level)=>sum+level,0),puzzles:levels.length};
}
