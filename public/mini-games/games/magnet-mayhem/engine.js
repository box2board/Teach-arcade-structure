export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createMagnet(random=Math.random){let s;const rand=(a,b)=>a+random()*(b-a);
function goal(){let best=null,bestD=-1;for(let i=0;i<20;i++){const g={baseX:rand(95,505),baseY:rand(120,520),r:Math.max(34,55-s.gates*2),phase:rand(0,6.28),inside:false};const d=Math.hypot(g.baseX-s.ball.x,g.baseY-s.ball.y);if(d>bestD){best=g;bestD=d;}if(d>220)break;}if(bestD<180){for(const [x,y] of [[95,120],[505,120],[95,520],[505,520]]){const d=Math.hypot(x-s.ball.x,y-s.ball.y);if(d>bestD){bestD=d;best.baseX=x;best.baseY=y;}}}best.x=best.baseX;best.y=best.baseY;s.goal=best;}
function start(){s={phase:'playing',time:0,score:0,gates:0,combo:0,bumps:0,attract:false,magnet:{x:300,y:490,tx:300,ty:490},ball:{x:300,y:320,vx:0,vy:0,r:14,spin:0},goal:null,barriers:[],effects:[],hit:0,bonuses:[{x:58,y:95,cool:0},{x:542,y:555,cool:0}],message:'MOVE THE MAGNET · HOLD TO PULL · RELEASE TO PUSH'};goal();return s;}
function aim(x,y){if(s?.phase==='playing'){s.magnet.tx=clamp(x,38,562);s.magnet.ty=clamp(y,66,594);}}
function hold(v){if(s?.phase==='playing')s.attract=!!v;}
function effect(x,y,text){s.effects.push({x,y,text,t:0});}
function step(dt){s.time=Math.min(40,s.time+dt);s.hit=Math.max(0,s.hit-dt);const b=s.ball,m=s.magnet;m.x+=(m.tx-m.x)*(1-Math.exp(-dt*24));m.y+=(m.ty-m.y)*(1-Math.exp(-dt*24));
let dx=m.x-b.x,dy=m.y-b.y,d=Math.hypot(dx,dy);if(d<.001){dx=1;dy=0;d=1;}const force=Math.min(650,90000/(d+55))*(s.attract?1:-.78)*(1+s.time/160);b.vx+=dx/d*force*dt;b.vy+=dy/d*force*dt;b.vx*=Math.exp(-dt*2.5);b.vy*=Math.exp(-dt*2.5);const speed=Math.hypot(b.vx,b.vy);if(speed>390){b.vx*=390/speed;b.vy*=390/speed;}b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=Math.hypot(b.vx,b.vy)*dt/14;
for(const [axis,min,max] of [['x',34,566],['y',75,586]]){const v=axis==='x'?'vx':'vy';if(b[axis]<min){b[axis]=min;b[v]=Math.abs(b[v])*.7;}if(b[axis]>max){b[axis]=max;b[v]=-Math.abs(b[v])*.7;}}
// Solid magnet nose prevents the steel ball sticking at the exact field center.
dx=b.x-m.x;dy=b.y-m.y;d=Math.hypot(dx,dy);if(d<37){const nx=d>.001?dx/d:0,ny=d>.001?dy/d:-1;b.x=m.x+nx*37;b.y=m.y+ny*37;const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=v*1.2*nx;b.vy-=v*1.2*ny;}}
const g=s.goal;g.x=g.baseX+(s.time>10?Math.sin(s.time*(.7+s.gates*.04)+g.phase)*Math.min(25,s.gates*4):0);g.y=g.baseY+(s.time>20?Math.cos(s.time*.7+g.phase)*15:0);
if(Math.hypot(b.x-g.x,b.y-g.y)<g.r-b.r*.45){s.gates++;s.combo++;const points=20+Math.min(5,s.combo)*5;s.score+=points;effect(g.x,g.y,'GATE +'+points);s.message=s.gates===2?'MOVING BUMPERS ONLINE · KEEP THE BALL CLEAR':'GATE '+s.gates+' · FOLLOW THE NEXT RING';goal();}
s.barriers=s.time<8?[]:[{x:300+Math.sin(s.time*.9)*110,y:250,r:23},{x:300+Math.cos(s.time*.7)*105,y:440,r:23}];if(s.time>25)s.barriers.push({x:300+Math.sin(s.time*1.3)*100,y:345,r:19});
for(const o of s.barriers){dx=b.x-o.x;dy=b.y-o.y;d=Math.hypot(dx,dy);if(d<o.r+b.r){const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0;b.x=o.x+nx*(o.r+b.r);b.y=o.y+ny*(o.r+b.r);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=v*1.7*nx;b.vy-=v*1.7*ny;}if(!s.hit){s.hit=.7;s.bumps++;s.combo=0;s.score=Math.max(0,s.score-5);effect(b.x,b.y,'BUMP −5');s.message='BUMPER HIT · USE PULL TO BRAKE';}}}
for(const p of s.bonuses){p.cool=Math.max(0,p.cool-dt);if(!p.cool&&Math.hypot(b.x-p.x,b.y-p.y)<26){p.cool=8;s.score+=15;effect(p.x,p.y,'BONUS +15');}}
for(const e of s.effects)e.t+=dt;s.effects=s.effects.filter(e=>e.t<1);
}
function tick(dt){if(s?.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,40-s.time);while(left>1e-8){const d=Math.min(left,1/120);step(d);left-=d;}if(s.time>=40-1e-6){s.time=40;s.phase='finished';s.attract=false;}}
return {get s(){return s;},start,aim,hold,tick,pause(){if(s?.phase==='playing'){s.phase='paused';s.attract=false;}},resume(){if(s?.phase==='paused')s.phase='playing';}};}
