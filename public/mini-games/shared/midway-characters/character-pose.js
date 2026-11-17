// Presentation-only animation. Never changes match positions, scoring or timing.
export function poseCharacter(model,{time=0,walking=false,celebrating=false}={}){
 const d=model.userData,beat=Math.sin(time*14);
 d.legs?.forEach((l,i)=>l.rotation.x=walking?beat*.35*(i?1:-1):0);
 d.arms?.forEach((a,i)=>{a.rotation.x=walking?beat*-.28*(i?1:-1):0;a.rotation.z=celebrating?(i?-.85:.85)+Math.sin(time*7)*.08:0});
 if(d.head)d.head.rotation.z=Math.sin(time*(celebrating?5:1.3))*(celebrating?.08:.025);
 d.eyelids?.forEach(e=>e.scale.y=time%4.7>4.52?.06:1);
 if(d.tail){d.tail.rotation.y=Math.sin(time*3)*.12;d.tail.rotation.z=0}
 d.ears?.forEach((e,i)=>{e.userData.restZ??=e.rotation.z;e.rotation.z=e.userData.restZ+Math.sin(time*1.7+i)*.025});
 d.wings?.forEach((w,i)=>{if(!d.arms?.includes(w))w.rotation.z=Math.sin(time*(walking?7:2))*(walking?.14:.04)*(i?1:-1)});
}
