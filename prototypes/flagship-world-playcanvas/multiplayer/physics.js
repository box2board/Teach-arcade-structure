export const STEP = 1 / 30;
export const pieces = {wall:[4,2.5,.35,'structure'],floor:[4,.28,4,'surface'],pillar:[.75,2.5,.75,'structure'],crate:[1.6,1.6,1.6,'structure'],beam:[4,.55,.55,'structure']};
export function footprint(r) {const d=pieces[r.piece]; return r.rotation%180 ? [d[2],d[0]] : [d[0],d[2]];}
const boxes = [[10,10,8.48,8.48],[14,-3,6.36,6.36],[-10,-9,7.42,7.42],[-13,5,8.48,8.48],[0,28,8.5,8.5],[0,-31,1.7,1.7],[6,-31,1.7,1.7]];
export function blocked(x,z,builds) {
 if(boxes.some(([a,b,w,d])=>Math.abs(x-a)<w/2+.72&&Math.abs(z-b)<d/2+.72))return true;
 return [...builds].some(r=>{if(r.level||r.piece==='floor'||r.piece==='beam')return false;const [w,d]=footprint(r);return Math.abs(x-r.x)<w/2+.52&&Math.abs(z-r.z)<d/2+.52;});
}
export function initialPlayer(){return {x:0,y:1.05,z:-5,vx:0,vz:0,vy:0,rotation:0,grounded:true,movement:'idle',animation:'idle',seq:0};}
const approach=(a,b,n)=>a<b?Math.min(a+n,b):Math.max(a-n,b);
export function step(p,i,builds){
 let x=i.x,z=i.z;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
 const moving=len>.01,speed=i.sprint?10.2:6.2,acc=p.grounded?(moving?34:28):10;
 p.vx=approach(p.vx,x*speed,acc*STEP);p.vz=approach(p.vz,z*speed,acc*STEP);
 const nx=Math.max(-39,Math.min(39,p.x+p.vx*STEP));if(!blocked(nx,p.z,builds))p.x=nx;else p.vx=0;
 const nz=Math.max(-39,Math.min(39,p.z+p.vz*STEP));if(!blocked(p.x,nz,builds))p.z=nz;else p.vz=0;
 if(i.jump&&p.grounded){p.vy=9.3;p.grounded=false;}
 if(!p.grounded)p.vy-=25*STEP;p.y+=p.vy*STEP;
 if(p.y<=1.05){p.y=1.05;p.vy=0;p.grounded=true;}
 if(moving)p.rotation=Math.atan2(x,z)*180/Math.PI;
 p.movement=moving?(i.sprint?'sprint':'walk'):'idle';p.animation=p.grounded?p.movement:(p.vy>0?'jump':'fall');p.seq=i.seq;
 return p;
}
export function validBuild(r,builds,p){
 if(!r||!Object.hasOwn(pieces,r.piece)||![r.x,r.z,r.rotation,r.level].every(Number.isFinite))return false;
 if(!Number.isInteger(r.level)||r.level<0||r.level>4||![0,90,180,270].includes(r.rotation)||r.x%2||r.z%2)return false;
 const [w,d]=footprint(r);if(r.x-w/2<11||r.x+w/2>29||r.z-d/2< -29||r.z+d/2> -11||Math.hypot(r.x-p.x,r.z-p.z)>8)return false;
 return ![...builds].some(b=>{if(b.level!==r.level||pieces[b.piece][3]!==pieces[r.piece][3])return false;const [bw,bd]=footprint(b);return Math.abs(b.x-r.x)<(w+bw)/2-.05&&Math.abs(b.z-r.z)<(d+bd)/2-.05;});
}
