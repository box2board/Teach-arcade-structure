// Authoritative ticket-race engine. The parent mode owns team rewards.
import {ARENA_R,CENTER_R,DURATION_MS} from './constants.js';
export const id='bumper-boats';
export const durationMs=DURATION_MS;
export const capacity=64;
const TAU=Math.PI*2,STEP=1/30,BOAT_R=21;
const SPILL_R=82;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const length=(x,y)=>Math.hypot(x,y);
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
function ticket(s,x=null,y=null,value=10,gold=false){
 if(x===null){const a=random(s)*TAU,r=110+random(s)*142;x=300+Math.cos(a)*r;y=315+Math.sin(a)*r;}
 return{id:s.nextTicketId++,x,y,value,gold,lock:.35};
}
function spawnPoints(count,s){
 const points=[];
 for(let row=-5;row<=5;row++)for(let col=-5;col<=5;col++){
  const x=300+col*46,y=315+row*46,d=length(x-300,y-315);
  if(d>=CENTER_R+BOAT_R+8&&d<=ARENA_R-BOAT_R-7)points.push({x,y});
 }
 for(let i=points.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[points[i],points[j]]=[points[j],points[i]];}
 return points.slice(0,count);
}
function createState(players,now,seed){
 if(!Array.isArray(players)||players.length<1||players.length>capacity)throw new RangeError('Bumper Boats supports 1–64 players.');
 const ids=new Set();for(const p of players){if(!p?.id||ids.has(p.id))throw new TypeError('Players need unique public IDs.');ids.add(p.id);}
 const s={phase:'playing',elapsed:0,tickAt:now,rng:(seed>>>0)||1,nextTicketId:0,spawnAt:.8,goldAt:0,goldSpawned:false,boats:[],tickets:[],effects:[]};
 s.goldAt=12+random(s)*16;
 const slots=spawnPoints(players.length,s);
 s.boats=players.map((p,i)=>({id:p.id,name:p.name,characterId:p.characterId,team:p.team,x:slots[i].x,y:slots[i].y,vx:0,vy:0,angle:(Math.atan2(315-slots[i].y,300-slots[i].x)),score:0,input:{x:0,y:0},seq:-1,boost:0,cool:0,marked:0,hitCool:0,status:'playing'}));
 for(let i=0;i<18;i++)s.tickets.push(ticket(s));
 return s;
}
function effect(s,x,y,text){s.effects.push({x,y,text,age:0});}
function spill(s,b){
 if(!b.marked)return;
 const spilled=Math.min(10,b.score);b.score-=spilled;b.marked=0;b.boost=0;
 for(let i=0;i<spilled&&s.tickets.length<70;i++){const a=random(s)*TAU,r=88+random(s)*18;s.tickets.push(ticket(s,300+Math.cos(a)*r,315+Math.sin(a)*r,1));}
 effect(s,b.x,b.y,spilled?'TICKETS SPILLED −'+spilled:'CENTER BUMP!');
}
function step(s){
 const dt=STEP;s.elapsed=Math.min(durationMs/1000,s.elapsed+dt);
 s.spawnAt-=dt;
 const ticketCap=Math.min(54,18+Math.ceil(s.boats.length*.55));
 if(s.spawnAt<=0){if(s.tickets.length<ticketCap)s.tickets.push(ticket(s));s.spawnAt=.7;}
 if(!s.goldSpawned&&s.elapsed>=s.goldAt){s.tickets.push(ticket(s,null,null,20,true));s.goldSpawned=true;effect(s,300,315,'GOLDEN TICKET!');}
 for(const b of s.boats){
  b.cool=Math.max(0,b.cool-dt);b.hitCool=Math.max(0,b.hitCool-dt);b.marked=Math.max(0,b.marked-dt);b.boost=Math.max(0,b.boost-dt);
  if(s.tickAt-(b.lastInputAt??s.tickAt)>450)b.input={x:0,y:0};
  let dx=b.input.x,dy=b.input.y,n=length(dx,dy);
  if(n>1){dx/=n;dy/=n;}
  if(length(dx,dy)>.01){b.angle+=Math.atan2(Math.sin(Math.atan2(dy,dx)-b.angle),Math.cos(Math.atan2(dy,dx)-b.angle))*(1-Math.exp(-dt*9));const speed=b.boost>0?350:178;b.vx+=(dx*speed-b.vx)*(1-Math.exp(-dt*4.8));b.vy+=(dy*speed-b.vy)*(1-Math.exp(-dt*4.8));}
  else{b.vx*=Math.exp(-dt*2.7);b.vy*=Math.exp(-dt*2.7);}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  let dx0=b.x-300,dy0=b.y-315,r=length(dx0,dy0);
  if(r>ARENA_R-BOAT_R){const nx=dx0/r,ny=dy0/r;b.x=300+nx*(ARENA_R-BOAT_R);b.y=315+ny*(ARENA_R-BOAT_R);const out=b.vx*nx+b.vy*ny;if(out>0){b.vx-=out*1.65*nx;b.vy-=out*1.65*ny;}b.boost=0;effect(s,b.x,b.y,'RAIL BOUNCE');}
  dx0=b.x-300;dy0=b.y-315;r=length(dx0,dy0);
  if(r<CENTER_R+BOAT_R){const nx=r>.001?dx0/r:1,ny=r>.001?dy0/r:0;b.x=300+nx*(CENTER_R+BOAT_R);b.y=315+ny*(CENTER_R+BOAT_R);const inward=b.vx*nx+b.vy*ny;if(inward<0){b.vx-=inward*1.45*nx;b.vy-=inward*1.45*ny;}spill(s,b);}
 }
 // Resolve each unordered pair once. Boosting a rival marks them for a ticket spill at the center.
 for(let i=0;i<s.boats.length;i++)for(let j=i+1;j<s.boats.length;j++){
  const a=s.boats[i],b=s.boats[j],dx=b.x-a.x,dy=b.y-a.y,d=length(dx,dy);if(d>=BOAT_R*2||d<.001)continue;
  const nx=dx/d,ny=dy/d,over=BOAT_R*2-d;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;
  const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(closing<0){const impulse=-closing*.92;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}
  if(a.boost>0&&!a.hitCool){b.vx+=nx*360;b.vy+=ny*360;b.marked=1.6;a.hitCool=.65;effect(s,b.x,b.y,'BOOST BUMP');}
  else if(b.boost>0&&!b.hitCool){a.vx-=nx*360;a.vy-=ny*360;a.marked=1.6;b.hitCool=.65;effect(s,a.x,a.y,'BOOST BUMP');}
 }
 for(const t of s.tickets){t.lock=Math.max(0,t.lock-dt);if(t.lock)continue;const b=s.boats.find(p=>length(p.x-t.x,p.y-t.y)<BOAT_R+8);if(b){b.score+=t.value;t.gone=true;effect(s,t.x,t.y,'+'+t.value+' TICKETS');}}
 s.tickets=s.tickets.filter(t=>!t.gone);
 for(const e of s.effects)e.age+=dt;s.effects=s.effects.filter(e=>e.age<1);
 if(s.elapsed>=durationMs/1000)s.phase='finished';
}
function clean(s){return{phase:s.phase,elapsed:s.elapsed,boats:s.boats.map(({id,name,characterId,team,x,y,vx,vy,angle,score,seq,boost,cool,marked,status})=>({id,name,characterId,team,x,y,vx,vy,angle,score,seq,boost,cool,marked,status})),tickets:s.tickets.map(({id,x,y,value,gold})=>({id,x,y,value,gold})),effects:s.effects};}
export function create({players=[],now,seed=1}){return createState(players,now,seed);}
export function advance(saved,now,inPlace=false){const s=inPlace?saved:structuredClone(saved);let ticks=0;while(s.tickAt+1000/30<=now&&s.phase==='playing'&&ticks++<Math.ceil(durationMs/1000/STEP)){s.tickAt+=1000/30;step(s);}return s;}
export function input(saved,id,packet,now=saved.tickAt,inPlace=false){const s=inPlace?saved:structuredClone(saved),b=s.boats.find(p=>p.id===id);if(!b||s.phase!=='playing'||b.status!=='playing'||!packet||!Number.isSafeInteger(packet.seq)||packet.seq<=b.seq||!Number.isFinite(packet.x)||!Number.isFinite(packet.y)||Math.abs(packet.x)>1||Math.abs(packet.y)>1||packet.boost!==undefined&&typeof packet.boost!=='boolean')return{accepted:false,state:s};
 b.seq=packet.seq;b.lastInputAt=now;b.input={x:packet.x,y:packet.y};if(packet.boost&&!b.cool){b.boost=.48;b.cool=2.6;b.vx+=Math.cos(b.angle)*155;b.vy+=Math.sin(b.angle)*155;}return{accepted:true,state:s};}
export function snapshot(state){return state?clean(state):null;}
export function finished(state){return state?.phase==='finished';}
export function results(state){return state.boats.map(b=>({playerId:b.id,score:b.score}));}
