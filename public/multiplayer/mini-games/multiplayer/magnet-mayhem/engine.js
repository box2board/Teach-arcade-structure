import {advanceBall,barriersAt,clamp,createGate,gateContains,resolveBarriers,updateGate} from '../../../../mini-games/games/magnet-mayhem/core.js';
// Shared carnival magnet table. The server alone advances the ball and awards tickets.
export const id='magnet-mayhem';
export const durationMs=40000;
export const capacity=64;
const STEP=1/30;
const TAU=Math.PI*2;
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
const nextGate=s=>createGate(()=>random(s),s.ball,s.gates);
export function create({players=[],now,seed=1}){
  if(!players.length||players.length>capacity||new Set(players.map(p=>p.id)).size!==players.length)throw new RangeError('Magnet Mayhem needs 1–64 distinct players.');
  const s={phase:'playing',elapsed:0,tickAt:now,seed:seed>>>0||1,gate:null,gates:0,
    ball:{x:300,y:325,vx:0,vy:0},magnets:players.map((p,i)=>({id:p.id,name:p.name,characterId:p.characterId,team:p.team,
      x:300+Math.cos(i*TAU/players.length)*Math.min(220,90+players.length*3),
      y:325+Math.sin(i*TAU/players.length)*Math.min(220,90+players.length*3),
      input:{x:0,y:0,attract:false},seq:-1,score:0})),effects:[]};
  nextGate(s);return s;
}
function step(s){
  s.elapsed+=STEP;
  for(const m of s.magnets){
    m.x=clamp(m.x+m.input.x*220*STEP,34,566);
    m.y=clamp(m.y+m.input.y*220*STEP,74,586);
  }
  const b=s.ball;
  advanceBall(b,s.magnets.map(m=>({x:m.x,y:m.y,attract:m.input.attract})),STEP,s.elapsed);
  const g=s.gate;
  updateGate(g,s.elapsed,s.gates);
  if(gateContains(b,g)){
    const nearest=[...s.magnets].sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
    nearest.score+=25;s.gates++;
    s.effects.push({x:b.x,y:b.y,text:nearest.name+' +25',at:s.elapsed});
    nextGate(s);
  }
  const barriers=barriersAt(s.elapsed);
  resolveBarriers(b,barriers);
  s.effects=s.effects.filter(e=>s.elapsed-e.at<1.3);
  if(s.elapsed>=40){s.elapsed=40;s.phase='finished';}
}
export function advance(saved,now,inPlace=false){
  const s=inPlace?saved:structuredClone(saved);
  while(s.phase==='playing'&&s.tickAt+1000/30<=now){s.tickAt+=1000/30;step(s);}
  return s;
}
export function input(saved,playerId,packet,now=saved.tickAt,inPlace=false){
  const s=inPlace?saved:structuredClone(saved),m=s.magnets.find(p=>p.id===playerId);
  if(s.phase!=='playing'||!m||!packet||!Number.isSafeInteger(packet.seq)||packet.seq<=m.seq||
    !Number.isFinite(packet.x)||!Number.isFinite(packet.y)||Math.abs(packet.x)>1||Math.abs(packet.y)>1||typeof packet.attract!=='boolean')return {accepted:false,state:s};
  m.seq=packet.seq;m.input={x:packet.x,y:packet.y,attract:packet.attract};return {accepted:true,state:s};
}
export function snapshot(s){return s?{phase:s.phase,elapsed:s.elapsed,ball:s.ball,gate:s.gate,barriers:barriersAt(s.elapsed),gates:s.gates,
  magnets:s.magnets.map(({id,name,characterId,team,x,y,seq,score,input})=>({id,name,characterId,team,x,y,seq,score,input})),effects:s.effects}:null;}
export function finished(s){return s?.phase==='finished';}
export function results(s){return s.magnets.map(p=>({playerId:p.id,score:p.score}));}
