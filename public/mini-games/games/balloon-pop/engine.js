export const ROUND=35,TAU=Math.PI*2;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
export function createGame(random=Math.random){
 let s,id=0;const rand=(a,b)=>a+random()*(b-a);
 function make(slot,initial=false){const q=random(),kind=initial?(slot===3||slot===8?'decoy':slot===5?'chain':slot===6?'star':'normal'):q<.17?'decoy':q<.31?'chain':q<.47?'star':'normal';return {id:++id,slot,kind,color:Math.floor(rand(0,5)),r:rand(31,35)-s.time/35*5,phase:rand(0,TAU),rate:rand(.8,1.4),amp:rand(12,22),born:initial?-1:s.time,expires:s.time+rand(6,9),shield:kind==='normal'&&(initial?slot===2:random()<.35),shieldPhase:rand(0,TAU)};}
 function start(){id=0;s={phase:'playing',time:0,score:0,combo:0,multiplier:1,best:0,pops:0,shots:0,misses:0,decoys:0,blocked:0,chainPops:0,ammo:6,reload:0,cooldown:0,aim:{x:300,y:310},balloons:[],darts:[],effects:[],respawns:[],goldAt:rand(10,25),goldSpawned:false,goldPopped:false,waves:[{at:rand(7,9),duration:5},{at:rand(19,21),duration:6}],finishAge:0,message:'TAP TO THROW · LEAD THE MOVING BALLOONS'};for(let i=0;i<12;i++)s.balloons.push(make(i,true));return s;}
 function wave(time=s.time){return s.waves.find(w=>time>=w.at&&time<w.at+w.duration);}
 function position(b,time=s.time){if(b.kind==='gold'){const age=time-b.born;return {x:80+440*clamp(age/6,0,1),y:260+Math.sin(age*2.7)*63};}const p=time*b.rate*(1+time/70)+b.phase,w=wave(time),blend=w?Math.sin(Math.PI*(time-w.at)/w.duration)**2:0;return {x:120+b.slot%4*120+Math.sin(p)*b.amp+blend*Math.sin(time*2+b.slot*.7)*43,y:205+Math.floor(b.slot/4)*112+Math.cos(p*.9)*13+blend*Math.cos(time*2+b.slot)*18};}
 function size(b){return b.r*Math.min(clamp((s.time-b.born)/.22,.05,1),clamp(((b.expires??Infinity)-s.time)/.3,.05,1));}
 function shieldAngle(b,time=s.time){return b.shieldPhase+time*2;}
 function shieldBlocks(b,point){if(!b.shield)return false;const p=position(b),angle=Math.atan2((point.y-p.y)/1.22,point.x-p.x);return Math.abs(wrap(angle-shieldAngle(b)))<Math.PI*.46;}
 function aim(x,y){if(s?.phase==='playing')s.aim={x:clamp(x,65,535),y:clamp(y,155,500)};}
 function reload(){if(s?.phase!=='playing'||s.reload>0||s.ammo===6)return false;s.reload=1.35;s.message='RELOADING · SIX MORE DARTS';return true;}
 function fire(){if(s?.phase!=='playing'||s.cooldown>0||s.reload>0||s.ammo<=0)return false;s.darts.push({to:{...s.aim},age:0,duration:.22+Math.hypot(s.aim.x-300,s.aim.y-605)/2400});s.shots++;s.ammo--;s.cooldown=.22;if(!s.ammo)reload();return true;}
 function miss(message,point,blocked=false){s.combo=0;s.multiplier=1;if(blocked)s.blocked++;else s.misses++;s.message=message;s.effects.push({...point,kind:blocked?'blocked':'miss',age:0,points:0,color:0});}
 function pop(b,blast=false,point=null){if(!s.balloons.includes(b))return null;const p=position(b);s.balloons.splice(s.balloons.indexOf(b),1);if(b.slot>=0)s.respawns.push({slot:b.slot,at:s.time+rand(.55,.9)});let points;
  if(b.kind==='decoy'){points=-25;s.score=Math.max(0,s.score-25);s.combo=0;s.multiplier=1;s.decoys++;s.message='DECOY! −25 · COMBO LOST';}
  else{s.pops++;if(blast)s.chainPops++;s.combo++;s.best=Math.max(s.best,s.combo);s.multiplier=1+Math.min(3,Math.floor(s.combo/5));const perfect=point&&Math.hypot((point.x-p.x)/b.r,(point.y-p.y)/(b.r*1.22))<.4;points=(b.kind==='gold'?100:b.kind==='star'?25:b.kind==='chain'?20:perfect?15:10)*s.multiplier*(s.time>=25?2:1);s.score+=points;if(b.kind==='gold')s.goldPopped=true;s.message=(b.kind==='gold'?'GOLDEN JACKPOT':b.kind==='chain'?'CHAIN POP':perfect?'BULLSEYE':'POP')+'! +'+points;}
  s.effects.push({...p,kind:b.kind,age:0,points,color:b.color});return b.kind==='chain'?p:null;
 }
 function impact(d){const ordered=[...s.balloons.filter(b=>b.kind!=='gold'),...s.balloons.filter(b=>b.kind==='gold')];let target=null;for(let i=ordered.length-1;i>=0;i--){const b=ordered[i],p=position(b),r=size(b);if(Math.hypot((d.to.x-p.x)/(r+4),(d.to.y-p.y)/(r*1.22+4))<=1){target=b;break;}}
  if(!target){miss('MISS · AIM AHEAD OF YOUR TARGET',d.to);return;}if(shieldBlocks(target,d.to)){miss('SHIELD BLOCKED · AIM AT THE EXPOSED SIDE',d.to,true);return;}
  const center=pop(target,false,d.to);if(center){const queue=[center],before=s.score;let count=1,decoys=0;while(queue.length){const c=queue.shift();s.effects.push({...c,kind:'blast',age:0,points:0,color:1});const nearby=s.balloons.filter(b=>Math.hypot(position(b).x-c.x,position(b).y-c.y)<=132);for(const b of nearby){if(b.kind==='decoy')decoys++;const next=pop(b,true);if(next)queue.push(next);count++;}}s.message='CHAIN ×'+count+'!'+(decoys?' · '+decoys+' DECOY HIT!':' · +'+(s.score-before)+' EXTRA');}
 }
 function update(dt){if(s.phase==='playing')s.time=Math.min(35,s.time+dt);s.cooldown=Math.max(0,s.cooldown-dt);if(s.reload>0){s.reload=Math.max(0,s.reload-dt);if(!s.reload)s.ammo=6;}for(const e of s.effects)e.age+=dt;s.effects=s.effects.filter(e=>e.age<1);
  if(!s.goldSpawned&&s.time>=s.goldAt){s.goldSpawned=true;s.balloons.push({id:++id,slot:-1,kind:'gold',color:3,r:26,born:s.time});s.message='GOLDEN BALLOON · ONE PER ROUND!';}
  for(const b of s.balloons)if(b.expires<=s.time)s.respawns.push({slot:b.slot,at:s.time+.2});s.balloons=s.balloons.filter(b=>!(b.expires<=s.time)&&(b.kind!=='gold'||s.time-b.born<6));
  if(s.phase==='playing')for(let i=s.respawns.length-1;i>=0;i--)if(s.time>=s.respawns[i].at){s.balloons.push(make(s.respawns[i].slot));s.respawns.splice(i,1);}
  const arrived=[];for(const d of s.darts){d.age+=dt;if(d.age>=d.duration)arrived.push(d);}s.darts=s.darts.filter(d=>d.age<d.duration);for(const d of arrived)impact(d);
  if(s.phase==='playing'&&s.time>=35){s.phase='finishing';s.finishAge=0;}else if(s.phase==='finishing'){s.finishAge+=dt;if(s.finishAge>=1&&!s.darts.length)s.phase='finished';}
 }
 function tick(dt){if(!s||!['playing','finishing'].includes(s.phase)||!Number.isFinite(dt)||dt<=0)return;for(let left=dt;left>1e-8&&s.phase!=='finished';){const d=Math.min(left,1/120);update(d);left-=d;}}
 return {get s(){return s;},start,position,size,wave,shieldAngle,shieldBlocks,aim,fire,reload,tick,pause(){if(s&&['playing','finishing'].includes(s.phase)){s.beforePause=s.phase;s.phase='paused';}},resume(){if(s?.phase==='paused')s.phase=s.beforePause;}};
}
