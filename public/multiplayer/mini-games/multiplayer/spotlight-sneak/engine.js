// Deterministic shared carnival attraction. Every prize and searchlight is common to the room.
export const id='spotlight-sneak';
export const durationMs=35000;
export const bounds=Object.freeze({left:22,right:578,top:92,bottom:632});
export const booths=Object.freeze([
 {x:110,y:180,w:100,h:64,name:'POPCORN',color:'#ca707c'},
 {x:390,y:180,w:100,h:64,name:'PRIZES',color:'#5baca5'},
 {x:245,y:310,w:110,h:68,name:'TICKETS',color:'#d5a14b'},
 {x:105,y:440,w:105,h:68,name:'SWEETS',color:'#8e83bb'},
 {x:390,y:440,w:105,h:68,name:'TOY BOX',color:'#5994af'}
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const createRandom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return [seed,seed/4294967296];};
function make(seed,players){
 const random=createRandom(seed);let rs=random;
 const ticket=()=>{let x,y,tries=0;do{rs=random();x=40+rs[1]*520;rs=random();y=120+rs[1]*470;tries++;}while(tries<100&&(!clear(x,y,24)||players.some(p=>Math.hypot(x-p.x,y-p.y)<40)));rs=random();return{x,y,gold:rs[1]<.18,id:ticketId++};};
 function clear(x,y,r=15){return !booths.some(b=>x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.h+r)}
 let ticketId=0;const lights=[{x:36,y:110,base:.9,rate:.65,phase:0},{x:564,y:110,base:2.2,rate:.8,phase:0},{x:300,y:625,base:-1.57,rate:.55,phase:0}];
 for(const l of lights){rs=random();l.phase=rs[1]*6.28;rs=random();l.on=rs[1]<.65;rs=random();l.switchAt=1.5+rs[1]*3.5;rs=random();l.rate=.45+rs[1]*.5;}
 if(!lights.some(l=>l.on))lights[Math.floor(random()[1]*lights.length)].on=true;
 const state={elapsed:0,phase:'playing',players,lights,tickets:[],nextTicketId:0};
 for(let i=0;i<8;i++){const t=ticket();t.id=state.nextTicketId++;state.tickets.push(t);}
 state.lightSeed=random()[0];
 return state;
}
export const beamRange=570;
export const beamHalfAngle=elapsed=>.24+elapsed/350;
export function lightAngle(lamp,elapsed){return lamp.base+Math.sin(elapsed*lamp.rate+lamp.phase)*1.05;}

export function visibleRayLength(lamp, angle, range=beamRange) {
 const dx=Math.cos(angle),dy=Math.sin(angle);
 let distance=range;
 for(const booth of booths){
  let entry=0,exit=distance;
  for(const [point,direction,min,max] of [[lamp.x,dx,booth.x,booth.x+booth.w],[lamp.y,dy,booth.y,booth.y+booth.h]]){
   if(Math.abs(direction)<1e-9){
    if(point<min||point>max)entry=Infinity;
   }else{
    const a=(min-point)/direction,b=(max-point)/direction;
    entry=Math.max(entry,Math.min(a,b));
    exit=Math.min(exit,Math.max(a,b));
   }
  }
  if(entry<=exit)distance=entry;
 }
 return distance;
}

export function isInLight(lamp,elapsed,x,y){
 if(!lamp.on)return false;
 const dx=x-lamp.x,dy=y-lamp.y;
 const angle=Math.atan2(dy,dx);
 const offset=angle-lightAngle(lamp,elapsed);
 if(Math.abs(Math.atan2(Math.sin(offset),Math.cos(offset)))>=beamHalfAngle(elapsed))return false;
 return Math.hypot(dx,dy)<visibleRayLength(lamp,angle);
}
function step(s,dt){
 const step=Math.min(.05,dt);s.elapsed=Math.min(durationMs/1000,s.elapsed+step);
 for(const l of s.lights){if(s.elapsed>=l.switchAt){s.lightSeed=(Math.imul(s.lightSeed,1664525)+1013904223)>>>0;const active=s.lights.reduce((n,light)=>n+Number(light.on),0);if(!l.on||active>1)l.on=!l.on;l.switchAt=s.elapsed+1.5+(s.lightSeed/4294967296)*4;}}
 for(const p of s.players){if(p.status!=='racing')continue;
  p.immune=Math.max(0,p.immune-step);p.stun=Math.max(0,p.stun-step);
  if(s.tickAt-(p.lastInputAt??s.tickAt)>450)p.input={x:0,y:0};
  let dx=p.input.x,dy=p.input.y,n=Math.hypot(dx,dy);if(n){dx/=n;dy/=n}
  if(p.stun)dx=dy=0;
  const oldX=p.x,oldY=p.y;p.vx+=(dx*205-p.vx)*Math.min(1,step*16);p.vy+=(dy*205-p.vy)*Math.min(1,step*16);
  const x=clamp(p.x+p.vx*step,37,563),y=clamp(p.y+p.vy*step,107,610);
  if(!booths.some(b=>x>b.x-15&&x<b.x+b.w+15&&p.y>b.y-15&&p.y<b.y+b.h+15))p.x=x;else p.vx=0;
  if(!booths.some(b=>p.x>b.x-15&&p.x<b.x+b.w+15&&y>b.y-15&&y<b.y+b.h+15))p.y=y;else p.vy=0;
  p.walk+=(Math.hypot(p.x-oldX,p.y-oldY)*Math.PI*2/96);
  const seen=s.lights.some(lamp=>isInLight(lamp,s.elapsed,p.x,p.y));p.seen=seen;p.exposure=clamp(p.exposure+step*(seen&&!p.immune?2.4:-3),0,1);
  if(p.exposure>=1){p.caught++;p.score=Math.max(0,p.score-25);p.immune=1.8;p.stun=.7;p.exposure=0;p.effects.push({x:p.x,y:p.y,text:'SPOTTED −25',age:0});}
  if(!p.stun)for(let i=0;i<s.tickets.length;i++){const t=s.tickets[i];if(Math.hypot(t.x-p.x,t.y-p.y)<25){p.score+=(t.gold?30:10)*(s.elapsed>=25?2:1);p.banked++;p.effects.push({x:t.x,y:t.y,text:'+'+(t.gold?30:10)*(s.elapsed>=25?2:1),age:0});let replacement;for(let j=0;j<50;j++){replacement=makeTicket(s);if(!s.players.some(q=>Math.hypot(q.x-replacement.x,q.y-replacement.y)<40))break;}replacement.id=s.nextTicketId++;s.tickets[i]=replacement;}}
  p.effects.forEach(e=>e.age+=step);p.effects=p.effects.filter(e=>e.age<.8);
 }
 if(s.elapsed>=durationMs/1000)s.phase='finished';
}
function makeTicket(s){s.randomSeed=(Math.imul(s.randomSeed??1234567,1664525)+1013904223)>>>0;const random=createRandom(s.randomSeed);let x,y,n=0;do{x=40+random()[1]*520;y=120+random()[1]*470;n++}while(n<100&&(booths.some(b=>x>b.x-24&&x<b.x+b.w+24&&y>b.y-24&&y<b.y+b.h+24)||s.players.some(p=>Math.hypot(x-p.x,y-p.y)<40)));s.randomSeed=random()[0];return{x,y,gold:random()[1]<.18};}
function publicState(s){return{elapsed:s.elapsed,phase:s.phase,lights:s.lights,tickets:s.tickets,players:s.players.map(({id,name,characterId,team,x,y,vx,vy,score,caught,exposure,immune,stun,walk,seen,banked,effects,input,seq,status})=>({id,name,characterId,team,x,y,vx,vy,score,caught,exposure,immune,stun,walk,seen,banked,effects,input,seq,status}))}}
function hydrate(saved){return structuredClone(saved)}
export function create({players=[],now,seed=1}){const roster=players.map((p,i)=>({id:p.id,name:p.name,characterId:p.characterId,team:p.team,x:75+(i%6)*90,y:545+(Math.floor(i/6)%4)*20,vx:0,vy:0,input:{x:0,y:0},seq:-1,score:0,caught:0,exposure:0,immune:0,stun:0,walk:0,seen:false,banked:0,effects:[],status:'racing'}));let s=make(seed,roster);s.startedAt=now;s.tickAt=now;return s}
export function advance(saved,now,inPlace=false){const s=inPlace?saved:hydrate(saved);let n=0;while(s.tickAt+1000/30<=now&&s.phase==='playing'&&n++<=Math.ceil(durationMs/1000*30)){s.tickAt+=1000/30;step(s,1/30)}return s}
export function input(saved,id,packet,now,inPlace=false){const s=inPlace?saved:hydrate(saved),p=s.players.find(x=>x.id===id);if(!p||s.phase!=='playing'||p.status!=='racing'||!packet||!Number.isSafeInteger(packet.seq)||packet.seq<=p.seq||!Number.isFinite(packet.x)||!Number.isFinite(packet.y)||Math.abs(packet.x)>1||Math.abs(packet.y)>1)return{accepted:false,state:s};p.seq=packet.seq;p.input={x:packet.x,y:packet.y};p.lastInputAt=now;return{accepted:true,state:s}}
export const snapshot=s=>s?publicState(s):null;
export const results=s=>s.players.map(p=>({playerId:p.id,score:p.score}));
export const finished=s=>s.phase==='finished';
