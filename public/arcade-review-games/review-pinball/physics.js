import {TABLE} from './tables.js';
export {TABLE} from './tables.js';
export const BALL_PHYSICS={launchSpeed:1080,gravity:620,drag:.10,maxSpeed:1800,powerScale:.85};
export const PLUNGER={minSpeed:950,maxSpeed:1250,chargeSeconds:1.4};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pointSegmentDistance=(p,a,z)=>{const dx=z.x-a.x,dy=z.y-a.y,length=dx*dx+dy*dy,t=length?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/length,0,1):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
export class PinballPhysics {
 constructor({table=TABLE,assist=false,onHit=()=>{},onDrain=()=>{}}={}){this.table=table;this.orbitArmed=false;this.assist=assist;this.onHit=onHit;this.onDrain=onDrain;this.time=0;this.ball=null;this.flippers=this.table.flippers.map(f=>({...f,angle:f.side===1?.35:Math.PI-.35,omega:0}));this.cooldown={};this.keys={left:false,right:false};}
 prepareBall(){this.ride=null;this.orbitEntry=null;this.spinnerContact=false;this.launchGateClosed=false;this.ball={x:460,y:748,vx:0,vy:0,r:10};}
 launch(strength=(BALL_PHYSICS.launchSpeed-PLUNGER.minSpeed)/(PLUNGER.maxSpeed-PLUNGER.minSpeed)){
  this.prepareBall();const speed=PLUNGER.minSpeed+(PLUNGER.maxSpeed-PLUNGER.minSpeed)*clamp(strength,0,1);this.ball.vx=-25;this.ball.vy=-speed;
 }
 rampPoint(ramp,distance){
  let total=0;
  for(let i=1;i<ramp.path.length;i++){const a=ramp.path[i-1],z=ramp.path[i],dx=z[0]-a[0],dy=z[1]-a[1],length=Math.hypot(dx,dy);
   if(distance<=total+length||i===ramp.path.length-1){const t=clamp((distance-total)/length,0,1);return {x:a[0]+dx*t,y:a[1]+dy*t,tx:dx/length,ty:dy/length};}total+=length;
  }
 }
 rampLength(ramp){return ramp.path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-ramp.path[i][0],p[1]-ramp.path[i][1]),0);}
 advanceRamp(dt){
  const ride=this.ride,b=this.ball,point=this.rampPoint(ride.ramp,ride.distance);
  // Gravity along the channel slows the climb, can reverse a weak shot, and speeds the return.
  ride.speed=(ride.speed+BALL_PHYSICS.gravity*point.ty*dt)*Math.exp(-BALL_PHYSICS.drag*dt);
  ride.distance+=ride.speed*dt;
  const length=this.rampLength(ride.ramp),next=this.rampPoint(ride.ramp,ride.distance);
  b.x=next.x;b.y=next.y;b.vx=next.tx*ride.speed;b.vy=next.ty*ride.speed;
  if(ride.distance<=0||ride.distance>=length){this.ride=null;if(ride.distance>=length)this.hit(ride.ramp.id,ride.ramp.value);}
 }
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
 this.spinnerAngle=((this.spinnerAngle??0)+(this.spinnerSpeed??0)*dt)%(Math.PI*2);
 this.spinnerSpeed=(this.spinnerSpeed??0)*Math.exp(-1.4*dt);
 for(const f of this.flippers){const held=this.keys[f.side===1?'left':'right'],goal=f.side===1?(held?-.52:.35):(held?Math.PI+.52:Math.PI-.35),old=f.angle;f.angle+=clamp(goal-f.angle,-15*dt,15*dt);f.omega=(f.angle-old)/dt;}
 if(this.ball && this.ride){this.advanceRamp(dt);return;}
 // Gravity changes momentum continuously; drag and passive impacts dissipate energy.
 // There is no target travel speed or blanket slowdown of launch and gravity.
 if(!this.ball)return;const b=this.ball,previous={x:b.x,y:b.y};b.vy+=BALL_PHYSICS.gravity*dt;b.vx*=Math.exp(-BALL_PHYSICS.drag*dt);b.vy*=Math.exp(-BALL_PHYSICS.drag*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
 for(const ramp of this.table.ramps??[]){const m=ramp.mouth;
  if(previous.y>=m.y && b.y<m.y && Math.abs(b.x-m.x)<m.width/2 && b.vy< -250){
   const p=this.rampPoint(ramp,0),speed=b.vx*p.tx+b.vy*p.ty;
   if(speed>250){this.ride={ramp,distance:Math.max(0,(m.y-b.y)/-p.ty),speed};const entry=this.rampPoint(ramp,this.ride.distance);b.x=entry.x;b.y=entry.y;return;}
  }
 }
 // Swept circle against the turbine's circular face includes the ball's full radius.
 // Contact latching prevents overlap from scoring each tick. No ball impulse is added.
 const spinner=this.table.spinner;
 if(spinner){
  const distance=pointSegmentDistance(spinner,previous,b);
  const touching=distance<=b.r+spinner.width/2;
  if(touching&&!this.spinnerContact){this.spinnerSpeed=(b.vy<0?-1:1)*clamp(Math.hypot(b.vx,b.vy)*.05,12,40);this.hit('spinner',spinner.value);}
  this.spinnerContact=touching;
 }
 for(const rail of this.table.rails)this.segment(...rail);
 const gate=this.table.launchGate;
 if(gate){
  // Close only when the whole launched ball clears the mouth; never block its ascent.
  if(!this.launchGateClosed && b.y+b.r+4<gate.y)this.launchGateClosed=true;
  if(this.launchGateClosed)this.segment(gate.x1,gate.y,gate.x2,gate.y,4,.78);
 }
 for(const [i,p] of this.table.bumpers.entries()){
  let nx=b.x-p.x,ny=b.y-p.y,d=Math.hypot(nx,ny);
  if(d>=b.r+p.r)continue;
  if(d<.001){const speed=Math.hypot(b.vx,b.vy);nx=speed?-b.vx/speed:0;ny=speed?-b.vy/speed:-1;}else{nx/=d;ny/=d;}
  b.x=p.x+nx*(b.r+p.r+.05);b.y=p.y+ny*(b.r+p.r+.05);
  const incoming=b.vx*nx+b.vy*ny;
  if(incoming<-.5){
   // Keep tangent momentum intact. Powered rebound is bounded and scales with impact.
   const impulse=-1.88*incoming+Math.min(75*BALL_PHYSICS.powerScale,-incoming*.3);
   b.vx+=nx*impulse;b.vy+=ny*impulse;
   this.hit('bumper'+i,100);
  }
 }
 for(const [i,t] of this.table.targets.entries())if(this.segment(t.x-7,t.y-12,t.x+7,t.y+12,5,.72))this.hit('target'+i,250);
 // Rubber slingshots above the flippers.
 for(const [i,s] of [[93,620,147,690],[418,620,365,690]].entries())if(this.segment(...s,5,.88,{x:0,y:0},90*BALL_PHYSICS.powerScale))this.hit('sling'+i,50);
 for(const f of this.flippers){const length=f.length+(this.assist?8:0),ex=f.x+Math.cos(f.angle)*length,ey=f.y+Math.sin(f.angle)*length,dx=b.x-f.x,dy=b.y-f.y;
 this.segment(f.x,f.y,ex,ey,8,.68,{x:-f.omega*dy*BALL_PHYSICS.powerScale,y:f.omega*dx*BALL_PHYSICS.powerScale});}
 const orbit=this.table.orbit;
 if(orbit){
  if(this.orbitEntry && this.time-this.orbitEntry.time>orbit.window)this.orbitEntry=null;
  if(previous.y>=orbit.left.y && b.y<orbit.left.y && b.vy<0){
   if(b.x<120)this.orbitEntry={side:'left',time:this.time,top:false};
   else if(b.x>385 && b.x<438)this.orbitEntry={side:'right',time:this.time,top:false};
  }
  if(this.orbitEntry){if(b.y<orbit.top)this.orbitEntry.top=true;
   const exit=this.orbitEntry.side==='left'?orbit.right:orbit.left;
   if(this.orbitEntry.top && previous.y<exit.y && b.y>=exit.y && b.vy>0 && Math.abs(b.x-exit.x)<45){this.hit('orbit',orbit.value);this.orbitEntry=null;}
  }
 }
 // The curved outer rail redirects the launch naturally; don't overwrite its velocity.
 // This high ceiling is only a runaway safety guard, not the normal playing speed.
 const speed=Math.hypot(b.vx,b.vy),limit=BALL_PHYSICS.maxSpeed;if(speed>limit){b.vx*=limit/speed;b.vy*=limit/speed;}
 if(b.y>850){this.ball=null;this.onDrain();}
 }
}
