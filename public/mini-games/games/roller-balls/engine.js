export const ARENA_RADIUS=8, BALL_RADIUS=.62, ROUND_TIME=60;
export function createRoller(onEvent=()=>{},random=Math.random){
  let s,input={x:0,z:0},dashQueued=false;
  const length=(x,z)=>Math.hypot(x,z);
  function reset(){s={phase:'intro',countdown:3,time:0,balls:Array.from({length:4},(_,id)=>({id,x:Math.cos(id*Math.PI/2+Math.PI/4)*4,z:Math.sin(id*Math.PI/2+Math.PI/4)*4,vx:0,vz:0,h:0,fallVy:0,out:0,guard:.7,dash:0,cooldown:0,score:0,sparks:0,knockouts:0,falls:0,lastHit:null,hitAt:-10})),sparks:Array.from({length:8},(_,id)=>({id,x:0,z:0,wait:0})),result:null};input={x:0,z:0};dashQueued=false;for(const orb of s.sparks)placeSpark(orb);}
  function placeSpark(orb){for(let n=0;n<40;n++){const a=random()*Math.PI*2,r=1+Math.sqrt(random())*5.7;orb.x=Math.cos(a)*r;orb.z=Math.sin(a)*r;if(s.balls.every(b=>b.out>0||length(b.x-orb.x,b.z-orb.z)>1.25))break;}orb.wait=0;}
  function setInput(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return;const m=Math.max(1,length(x,z));input={x:x/m,z:z/m};}
  function dash(){if(s.phase==='playing')dashQueued=true;}
  function burst(b,x,z){if(b.out>0||b.cooldown>0)return;const m=length(x,z);if(m<.15)return;const forward=Math.max(0,(b.vx*x+b.vz*z)/m),speed=Math.min(15,Math.max(10.8,forward+4));b.vx=x/m*speed;b.vz=z/m*speed;b.dash=.22;b.cooldown=2.6;onEvent({type:'dash',id:b.id});}
  function start(){reset();s.phase='countdown';onEvent({type:'countdown'});}
  function pause(){if(['countdown','playing'].includes(s.phase)){s.previousPhase=s.phase;s.phase='paused';setInput(0,0);dashQueued=false;}}
  function resume(){if(s.phase==='paused')s.phase=s.previousPhase;}
  function respawn(b){let best=null,bestDistance=-1;for(let k=0;k<12;k++){const a=k*Math.PI/6,p={x:Math.cos(a)*3.8,z:Math.sin(a)*3.8};const distance=Math.min(...s.balls.filter(other=>other.id!==b.id&&other.out===0).map(other=>length(p.x-other.x,p.z-other.z)),20);if(distance>bestDistance){bestDistance=distance;best=p;}}Object.assign(b,{...best,vx:0,vz:0,h:0,fallVy:0,out:0,guard:1.5,dash:0,lastHit:null,hitAt:-10});onEvent({type:'respawn',id:b.id});}
  function fall(b){b.out=1.35;b.fallVy=1;b.falls++;b.score=Math.max(0,b.score-15);const attacker=b.lastHit===null?null:s.balls[b.lastHit];const credited=attacker&&s.time-b.hitAt<3;if(credited){attacker.knockouts++;attacker.score+=30;}onEvent({type:'fall',id:b.id,by:credited?attacker.id:null});}
  function finish(){if(s.phase==='finished')return;s.phase='finished';s.time=ROUND_TIME;const p=s.balls[0];s.result={gameId:'roller-balls',rulesVersion:1,time:ROUND_TIME,score:p.score,sparks:p.sparks,knockouts:p.knockouts,falls:p.falls,place:1+s.balls.filter(b=>b.score>p.score).length,rankings:s.balls.map(b=>({id:b.id,score:b.score,sparks:b.sparks,knockouts:b.knockouts,falls:b.falls})).sort((a,b)=>b.score-a.score||a.id-b.id)};setInput(0,0);dashQueued=false;onEvent({type:'finish',result:s.result});}
  function ai(b){const radius=length(b.x,b.z);if(radius>6.25)return {x:-b.x,z:-b.z,attack:false};let target=null,best=Infinity;for(const orb of s.sparks){if(orb.wait>0)continue;const d=length(orb.x-b.x,orb.z-b.z);if(d<best){best=d;target=orb;}}const rival=s.balls.filter(o=>o.id!==b.id&&o.out===0&&o.guard===0).sort((a,c)=>length(a.x-b.x,a.z-b.z)-length(c.x-b.x,c.z-b.z))[0];if(rival&&length(rival.x-b.x,rival.z-b.z)<3&&length(rival.x,rival.z)>4.5){const m=length(rival.x,rival.z);return {x:rival.x+rival.x/m*.5-b.x,z:rival.z+rival.z/m*.5-b.z,attack:true};}return {x:(target?.x??0)-b.x,z:(target?.z??0)-b.z,attack:false};}
  function step(dt){s.time+=dt;
    for(const b of s.balls){b.cooldown=Math.max(0,b.cooldown-dt);b.guard=Math.max(0,b.guard-dt);b.dash=Math.max(0,b.dash-dt);if(b.out>0){b.out=Math.max(0,b.out-dt);b.x+=b.vx*dt;b.z+=b.vz*dt;b.h+=b.fallVy*dt;b.fallVy-=18*dt;if(b.out===0)respawn(b);continue;}
      const action=b.id===0?{...input,attack:dashQueued}:ai(b);if(b.id===0&&dashQueued){burst(b,length(input.x,input.z)>.1?input.x:b.vx,length(input.x,input.z)>.1?input.z:(length(b.vx,b.vz)>.1?b.vz:-1));dashQueued=false;}else if(b.id!==0&&action.attack&&b.cooldown===0)burst(b,action.x,action.z);
      // Aligned steering keeps rolling resistance low, allowing a real run-up.
      // Turning/braking spends momentum; releasing the controls preserves
      // enough collision velocity for a strong hit to push an opponent away.
      const m=length(action.x,action.z),oldSpeed=length(b.vx,b.vz);
      const alignment=m>.04&&oldSpeed>.1?(action.x*b.vx+action.z*b.vz)/(m*oldSpeed):1;
      const turning=alignment<.65, strength=turning?18:10;
      if(m>.04){const divisor=b.id===0?Math.max(1,m):m;b.vx+=action.x/divisor*strength*dt;b.vz+=action.z/divisor*strength*dt;}
      const resistance=b.dash>0?.3:m<=.04?1.4:turning?2.8:.7;
      const drag=Math.exp(-resistance*dt);b.vx*=drag;b.vz*=drag;
      const speed=length(b.vx,b.vz),cap=b.dash>0?15:11.5;
      if(speed>cap){b.vx*=cap/speed;b.vz*=cap/speed;}b.x+=b.vx*dt;b.z+=b.vz*dt;
    }
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=s.balls[i],b=s.balls[j];if(a.out>0||b.out>0||a.guard>0||b.guard>0)continue;const dx=b.x-a.x,dz=b.z-a.z,d=length(dx,dz);if(d>=BALL_RADIUS*2)continue;const nx=d>.0001?dx/d:1,nz=d>.0001?dz/d:0,overlap=BALL_RADIUS*2-d;a.x-=nx*overlap/2;a.z-=nz*overlap/2;b.x+=nx*overlap/2;b.z+=nz*overlap/2;const closing=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;if(closing<0){const impulse=-closing*.98;a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;if(impulse>1){a.lastHit=b.id;a.hitAt=s.time;b.lastHit=a.id;b.hitAt=s.time;onEvent({type:'collision',x:(a.x+b.x)/2,z:(a.z+b.z)/2,power:impulse});}}}
    for(const b of s.balls){if(b.out>0)continue;const radius=length(b.x,b.z);if(radius>ARENA_RADIUS+.12){if(b.guard>0){b.x*=7.3/radius;b.z*=7.3/radius;b.vx*=-.4;b.vz*=-.4;}else{fall(b);continue;}}for(const orb of s.sparks){if(orb.wait===0&&length(b.x-orb.x,b.z-orb.z)<.95){orb.wait=2.1;b.sparks++;b.score+=10;onEvent({type:'spark',id:b.id,x:orb.x,z:orb.z});}}}
    for(const orb of s.sparks)if(orb.wait>0){orb.wait=Math.max(0,orb.wait-dt);if(orb.wait===0)placeSpark(orb);}
    if(s.time>=ROUND_TIME-1e-8)finish();
  }
  function tick(dt){if(!Number.isFinite(dt)||dt<=0)return;if(s.phase==='countdown'){const used=Math.min(dt,s.countdown);s.countdown-=used;dt-=used;if(s.countdown<=0){s.phase='playing';onEvent({type:'go'});}else return;}if(s.phase!=='playing')return;let remaining=Math.min(dt,ROUND_TIME-s.time);while(remaining>1e-9&&s.phase==='playing'){const stepTime=Math.min(1/120,remaining);step(stepTime);remaining-=stepTime;}}
  reset();return {get state(){return s;},start,setInput,dash,pause,resume,tick};
}
