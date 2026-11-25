// Shared carnival magnet table. The server alone advances the ball and awards tickets.
export const id='magnet-mayhem';
export const durationMs=40000;
export const capacity=64;
const STEP=1/30, TAU=2*Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function nextGate(s){
  const angle=random(s)*TAU, distance=165+random(s)*65;
  s.gate={x:300+Math.cos(angle)*distance,y:325+Math.sin(angle)*distance,r:49,phase:random(s)*TAU};
}
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
  const b=s.ball;
  for(const m of s.magnets){
    m.x=clamp(m.x+m.input.x*220*STEP,34,566);
    m.y=clamp(m.y+m.input.y*220*STEP,74,586);
    const dx=m.x-b.x,dy=m.y-b.y,dist=Math.max(25,Math.hypot(dx,dy));
    const force=Math.min(650,90000/(dist+55))*(m.input.attract?1:-.78);
    b.vx+=dx/dist*force*STEP/Math.sqrt(s.magnets.length);
    b.vy+=dy/dist*force*STEP/Math.sqrt(s.magnets.length);
  }
  b.vx*=Math.exp(-STEP*2.5);b.vy*=Math.exp(-STEP*2.5);
  const speed=Math.hypot(b.vx,b.vy);
  if(speed>390){b.vx*=390/speed;b.vy*=390/speed;}
  b.x+=b.vx*STEP;b.y+=b.vy*STEP;
  for(const [axis,min,max] of [['x',34,566],['y',75,586]]){
    const v=axis==='x'?'vx':'vy';
    if(b[axis]<min){b[axis]=min;b[v]=Math.abs(b[v])*.7;}
    if(b[axis]>max){b[axis]=max;b[v]=-Math.abs(b[v])*.7;}
  }
  for(const m of s.magnets){
    const dx=b.x-m.x,dy=b.y-m.y,d=Math.hypot(dx,dy);
    if(d<37){const nx=d>.001?dx/d:0,ny=d>.001?dy/d:-1;
      b.x=m.x+nx*37;b.y=m.y+ny*37;
      const toward=b.vx*nx+b.vy*ny;
      if(toward<0){b.vx-=toward*1.2*nx;b.vy-=toward*1.2*ny;}
    }
  }
  // The moving carnival bumpers retain the original solo game's timing.
  const barriers=s.elapsed<8?[]:[{x:300+Math.sin(s.elapsed*.9)*110,y:250,r:23},{x:300+Math.cos(s.elapsed*.7)*105,y:440,r:23}];
  if(s.elapsed>25)barriers.push({x:300+Math.sin(s.elapsed*1.3)*100,y:345,r:19});
  for(const o of barriers){const dx=b.x-o.x,dy=b.y-o.y,d=Math.hypot(dx,dy);
    if(d<o.r+14){const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0;b.x=o.x+nx*(o.r+14);b.y=o.y+ny*(o.r+14);
      const toward=b.vx*nx+b.vy*ny;if(toward<0){b.vx-=toward*1.7*nx;b.vy-=toward*1.7*ny;}}
  }
  const g=s.gate;
  const gx=g.x+(s.elapsed>10?Math.sin(s.elapsed*.7+g.phase)*20:0);
  if(Math.hypot(b.x-gx,b.y-g.y)<g.r-7){
    const nearest=[...s.magnets].sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
    nearest.score+=25;s.gates++;
    s.effects.push({x:b.x,y:b.y,text:nearest.name+' +25',at:s.elapsed});
    nextGate(s);
  }
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
export function snapshot(s){return s?{phase:s.phase,elapsed:s.elapsed,ball:s.ball,gate:s.gate,gates:s.gates,
  magnets:s.magnets.map(({id,name,characterId,team,x,y,seq,score,input})=>({id,name,characterId,team,x,y,seq,score,input})),effects:s.effects}:null;}
export function finished(s){return s?.phase==='finished';}
export function results(s){return s.magnets.map(p=>({playerId:p.id,score:p.score}));}
