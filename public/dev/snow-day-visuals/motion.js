// Cosmetic poses only: never write collision coordinates, timers or feature state.
export function poseDefender(g,{time,index,kick,steering,frozen,reduced}){
 const motion=reduced||frozen?0:1;
 const recoil=Math.sin(Math.min(1,kick)*Math.PI/2)*motion;
 g.position.y=motion*(Math.sin(time*7+index)*.035+recoil*.06);
 g.rotation.z=motion*Math.max(-.12,Math.min(.12,steering*-.04));
 g.rotation.x=recoil*.09;
 g.userData.arms.forEach((arm,i)=>{arm.rotation.x=-recoil*(i===0?1.25:.65);arm.rotation.z=(i===0?-1:1)*(.2+recoil*.15);});
}
export function poseEnemy(e,time,dt,reduced){
 e.visualHit=Math.max(0,(e.visualHit||0)-dt);
 const size=e.g.userData.visualScale||e.g.scale.x;e.g.userData.visualScale=size;
 const phase=time*(e.type==='runner'?10:e.type==='boss'?3:5)+(e.phase||0);
 const hit=reduced?0:Math.sin(Math.min(1,e.visualHit/.18)*Math.PI);
 const stride=reduced?0:Math.sin(phase);
 const bounce=e.type==='runner'?.19:e.type==='boss'?.045:.09;
 e.g.position.y=Math.abs(stride)*bounce;
 e.g.rotation.z=stride*(e.type==='runner'?.11:e.type==='boss'?.025:.055);
 e.g.rotation.x=-hit*.13;
 e.g.scale.set(size*(1+hit*.12),size*(1-hit*.12),size*(1+hit*.12));
}
export function poseFort(g,amount,reduced){
 g.visible=amount>.015;
 const settle=reduced?0:Math.sin(amount*Math.PI);
 g.scale.y=.12+amount*.88;
 g.position.y=settle*.4;
 g.rotation.z=settle*.035;
}
