// Avalanche-only challenge rules. Shared arcade-five games remain unchanged.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const stages=[
 {name:'WARM-UP',speed:185,interval:2.45,gap:210},
 {name:'SLALOM',speed:235,interval:1.95,gap:170},
 {name:'FINAL RUSH',speed:285,interval:1.5,gap:140}
];
const lanes=[135,245,355,465];
export function createGame(id='avalanche-escape',random=Math.random){
 if(id!=='avalanche-escape')throw Error('Unknown game');
 let s,serial=0;
 const pick=n=>Math.min(n-1,Math.floor(clamp(random(),0,.999999)*n));
 function start(){serial=0;s={phase:'playing',time:0,score:0,x:300,y:440,input:0,hold:false,hits:0,inv:0,energy:1,boosting:false,boostReady:true,speedFactor:1,distance:0,objects:[],rows:[],spawn:.75,stage:0,combo:0,multiplier:1,bestCombo:0,bonuses:0,gates:0,lastLane:1,message:'FIND THE OPENING'};return s;}
 function wave(){
  const config=stages[s.stage], options=lanes.map((_,i)=>i).filter(i=>i!==s.lastLane&&Math.abs(i-s.lastLane)<=(s.stage?2:1));
  const lane=options[pick(options.length)],gapX=lanes[lane],pattern=pick(3),waveId=++serial;
  s.lastLane=lane;
  const row={id:waveId,gapX,gap:config.gap,speed:config.speed,y:-45,checked:false,hit:false,pattern};s.rows.push(row);
  const xs=pattern===2?[65,gapX-config.gap/2-28,gapX+config.gap/2+28,545]:[65,145,225,305,385,465,545];
  for(const x of xs){
   if(x<45||x>555||Math.abs(x-gapX)<config.gap/2+25)continue;
   // Full gates, staggered islands, and paired pinch points have the same safe corridor.
   if(pattern===1&&x>65&&x<545&&Math.abs(x-gapX)>config.gap/2+140)continue;
   s.objects.push({x,y:-45,r:24,speed:config.speed,type:pick(2)?'snow':'rock',waveId,hit:false});
  }
  const risk=(pick(2)?1:-1)*Math.min(28,config.gap/5);
  for(const [offset,dx] of [[65,0],[-65,risk]])s.objects.push({x:gapX+dx,y:-45+offset,r:15,speed:config.speed,type:'flake',waveId,hit:false});
 }
 function reward(base,label){const points=base*s.multiplier;s.score+=points;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.bonuses++;s.multiplier=Math.min(4,1+Math.floor(s.combo/3));s.message=`${label} +${points}${s.multiplier>1?' · ×'+s.multiplier:''}`;}
 function update(dt){
  s.time+=dt;s.stage=Math.min(2,Math.floor(s.time/15));s.inv=Math.max(0,s.inv-dt);
  if(!s.hold&&s.energy>=.2)s.boostReady=true;
  const dash=s.hold&&s.boostReady&&s.energy>.02;s.boosting=dash;s.energy=clamp(s.energy+(dash?-.65:.25)*dt,0,1);if(s.energy<=.02)s.boostReady=false;
  s.speedFactor+=( (dash?1.65:1)-s.speedFactor)*(1-Math.exp(-dt*10));s.distance+=stages[s.stage].speed*s.speedFactor*dt;s.x=clamp(s.x+s.input*(dash?410:250)*dt,45,555);s.score+=dt*(dash?4:2);
  s.spawn-=dt*s.speedFactor;if(s.spawn<=0){wave();s.spawn+=stages[s.stage].interval;}
  for(const row of s.rows)row.y+=row.speed*dt*s.speedFactor;
  for(const o of s.objects)o.y+=o.speed*dt*s.speedFactor;
  // Resolve hazards first so a simultaneous pickup cannot retain a broken streak.
  for(const o of s.objects){if(o.hit||o.type==='flake'||Math.hypot(o.x-s.x,o.y-440)>=o.r+15)continue;o.hit=true;
   if(!s.inv){s.hits++;s.combo=0;s.multiplier=1;s.inv=1;s.score=Math.max(0,s.score-15);s.message='HIT −15 · STREAK RESET';const row=s.rows.find(r=>r.id===o.waveId);if(row)row.hit=true;}
  }
  for(const o of s.objects){if(!o.hit&&o.type==='flake'&&Math.hypot(o.x-s.x,o.y-440)<o.r+15){o.hit=true;reward(25,'SNOWFLAKE');}}
  for(const row of s.rows){if(row.checked||row.y<485)continue;row.checked=true;if(row.hit)continue;s.gates++;
   const hazards=s.objects.filter(o=>o.waveId===row.id&&o.type!=='flake');
   const clearance=Math.min(...hazards.map(o=>Math.abs(o.x-s.x)-o.r-15));
   if(clearance>0&&clearance<30)reward(10,'CLOSE CALL');
  }
  s.objects=s.objects.filter(o=>o.y<720);s.rows=s.rows.filter(r=>r.y<720);
 }
 function tick(dt){if(s?.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,45-s.time);while(left>1e-8){const step=Math.min(left,1/120);update(step);left-=step;}if(s.time>=45-1e-7){s.time=45;s.phase='finished';s.hold=false;s.boosting=false;s.input=0;s.score=Math.floor(s.score);}}
 return {id,get s(){return s;},start,tick,setInput(v){if(s?.phase==='playing')s.input=clamp(v,-1,1);},hold(v){if(s?.phase==='playing')s.hold=!!v;},pause(){if(s?.phase==='playing'){s.phase='paused';s.hold=false;s.boosting=false;s.input=0;}},resume(){if(s?.phase==='paused')s.phase='playing';}};
}
