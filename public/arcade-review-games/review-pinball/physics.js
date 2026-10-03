import {TABLE} from './tables.js';
export {TABLE} from './tables.js';
export const BALL_PACE=.85;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class PinballPhysics {
 constructor({table=TABLE,assist=false,onHit=()=>{},onDrain=()=>{}}={}){this.table=table;this.orbitArmed=false;this.assist=assist;this.onHit=onHit;this.onDrain=onDrain;this.time=0;this.ball=null;this.flippers=this.table.flippers.map(f=>({...f,angle:f.side===1?.35:Math.PI-.35,omega:0}));this.cooldown={};this.keys={left:false,right:false};}
 launch(){this.ball={x:460,y:748,vx:-25*BALL_PACE,vy:-1080*BALL_PACE,r:10};}
 hit(id,value){if(this.time-(this.cooldown[id]??-99)>.15){this.cooldown[id]=this.time;this.onHit(id,value);}}
 segment(x1,y1,x2,y2,r=4,restitution=.78,surface={x:0,y:0},kick=0){
 const b=this.ball,dx=x2-x1,dy=y2-y1,t=clamp(((b.x-x1)*dx+(b.y-y1)*dy)/(dx*dx+dy*dy),0,1),px=x1+t*dx,py=y1+t*dy;
 let nx=b.x-px,ny=b.y-py,d=Math.hypot(nx,ny); if(d>=b.r+r)return false;
 if(d<.001){nx=-dy;ny=dx;d=Math.hypot(nx,ny);} nx/=d;ny/=d;
 b.x=px+nx*(b.r+r+.05);b.y=py+ny*(b.r+r+.05);
 const relative=(b.vx-surface.x)*nx+(b.vy-surface.y)*ny;
 // Resolve overlap even when separating, but only apply force on an incoming hit.
 // A grazing contact receives a small kick, never a full-strength sideways launch.
 if(relative<-.5){const impulse=-(1+restitution)*relative+Math.min(kick,-relative*.3);b.vx+=impulse*nx;b.vy+=impulse*ny;return true;}return false;
 }
 step(dt){this.time+=dt;
 for(const f of this.flippers){const held=this.keys[f.side===1?'left':'right'],goal=f.side===1?(held?-.52:.35):(held?Math.PI+.52:Math.PI-.35),old=f.angle;f.angle+=clamp(goal-f.angle,-15*dt,15*dt);f.omega=(f.angle-old)/dt;}
 // Scale ball forces consistently so slower play keeps comparable shot heights.
 // Flipper animation and session timers still use real time.
 if(!this.ball)return;const b=this.ball;b.vy+=540*BALL_PACE**2*dt;b.vx*=Math.exp(-.055*BALL_PACE*dt);b.vy*=Math.exp(-.055*BALL_PACE*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
 for(const rail of this.table.rails)this.segment(...rail);
 for(const [i,p] of this.table.bumpers.entries()){
  let nx=b.x-p.x,ny=b.y-p.y,d=Math.hypot(nx,ny);
  if(d>=b.r+p.r)continue;
  if(d<.001){const speed=Math.hypot(b.vx,b.vy);nx=speed?-b.vx/speed:0;ny=speed?-b.vy/speed:-1;}else{nx/=d;ny/=d;}
  b.x=p.x+nx*(b.r+p.r+.05);b.y=p.y+ny*(b.r+p.r+.05);
  const incoming=b.vx*nx+b.vy*ny;
  if(incoming<-.5){
   // Keep tangent momentum intact. Powered rebound is bounded and scales with impact.
   const impulse=-1.88*incoming+Math.min(75*BALL_PACE,-incoming*.3);
   b.vx+=nx*impulse;b.vy+=ny*impulse;
   this.hit('bumper'+i,100);
  }
 }
 for(const [i,t] of this.table.targets.entries())if(this.segment(t.x-7,t.y-12,t.x+7,t.y+12,5,1.05))this.hit('target'+i,250);
 // Rubber slingshots above the flippers.
 for(const [i,s] of [[93,620,147,690],[418,620,365,690]].entries())if(this.segment(...s,5,.88,{x:0,y:0},90*BALL_PACE))this.hit('sling'+i,50);
 for(const f of this.flippers){const length=f.length+(this.assist?8:0),ex=f.x+Math.cos(f.angle)*length,ey=f.y+Math.sin(f.angle)*length,dx=b.x-f.x,dy=b.y-f.y;
 this.segment(f.x,f.y,ex,ey,8,.68,{x:-f.omega*dy*BALL_PACE,y:f.omega*dx*BALL_PACE});}
 if(b.y<135 && b.x>300 && b.x<438)this.orbitArmed=true;
 if(this.orbitArmed && b.y<150 && b.x<150){this.hit('orbit',500);this.orbitArmed=false;}
 if(b.y<210 && b.x>438){b.vx=Math.min(b.vx,-135*BALL_PACE);} // Feed the launched ball into the main table.
 const speed=Math.hypot(b.vx,b.vy),limit=1350*BALL_PACE;if(speed>limit){b.vx*=limit/speed;b.vy*=limit/speed;}
 if(b.y>850){this.ball=null;this.onDrain();}
 }
}
