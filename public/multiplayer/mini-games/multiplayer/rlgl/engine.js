import {Race,STEP_MS} from './rules.js';
export const RLGL='red-light-green-light';
function hydrate(saved){
  const race=new Race();
  Object.assign(race,saved);
  race.players=new Map(saved.players.map(p=>[p.id,p]));
  race.random=()=>{race.randomSeed=(Math.imul(race.randomSeed,1664525)+1013904223)>>>0;return race.randomSeed/4294967296;};
  return race;
}
function save(race){return {...race,players:[...race.players.values()],random:undefined};}
export function startRace(roster,now,seed){
  const race=new Race();
  // Public race identities are never the room's authentication tokens.
  roster.forEach((p,index)=>race.join(p.lobbyId??'racer-'+index,{name:p.name,characterId:p.characterId}));
  race.start(now,{durationMs:55000});
  race.randomSeed=seed;race.tickAt=now;
  return save(race);
}
export function tickRace(saved,now){
  const race=hydrate(saved);
  while(race.tickAt+STEP_MS<=now&&race.phase!=='results'){
    race.tickAt+=STEP_MS;race.step(race.tickAt);
  }
  return save(race);
}
export function inputRace(saved,id,packet,now){
  const race=hydrate(saved);
  const accepted=race.command(id,packet,now);
  return {accepted,state:save(race)};
}
export function raceView(saved,now){return saved?hydrate(saved).snapshot(now):null;}

export const engine={
  id:RLGL,durationMs:58000,
  create:({players,now,seed})=>startRace(players.map(p=>({lobbyId:p.id,name:p.name,characterId:p.characterId})),now,seed),
  advance:tickRace,
  input:inputRace,
  snapshot:raceView,
  finished:state=>state.phase==='results',
  results:(state,now)=>raceView(state,now).players.map(p=>({playerId:p.id,score:p.points}))
};
