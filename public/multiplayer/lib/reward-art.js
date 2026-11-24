import * as T from '../../mini-games/vendor/three.module.js';
// Presentation definitions are independent of board rules and reward amounts.
export const spaceStyles={ticket:{color:0xffbe28,ink:'#65391e',symbol:'ticket',label:'TICKETS'},item:{color:0x0db7d4,ink:'#fff8df',symbol:'gift',label:'DICE GIFT'},surprise:{color:0xa34bef,ink:'#fff8df',symbol:'?',label:'SURPRISE'},scenic:{color:0x27bb7e,ink:'#fff8df',symbol:'leaf',label:'SCENIC'}};
export function drawSpaceIcon(ctx,kind,color,x=64,y=64,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap=ctx.lineJoin='round';
 if(kind==='ticket'){ctx.beginPath();ctx.moveTo(-33,-20);ctx.lineTo(33,-20);ctx.lineTo(33,-7);ctx.quadraticCurveTo(20,0,33,7);ctx.lineTo(33,20);ctx.lineTo(-33,20);ctx.lineTo(-33,7);ctx.quadraticCurveTo(-20,0,-33,-7);ctx.closePath();ctx.stroke();for(const a of [-13,0,13]){ctx.beginPath();ctx.moveTo(a,-9);ctx.lineTo(a,9);ctx.stroke()}}
 else if(kind==='gift'){ctx.strokeRect(-29,-8,58,36);ctx.strokeRect(-34,-18,68,12);ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,28);ctx.moveTo(0,-18);ctx.bezierCurveTo(-42,-51,-44,-6,0,-18);ctx.bezierCurveTo(42,-51,44,-6,0,-18);ctx.stroke()}
 else if(kind==='leaf'){ctx.beginPath();ctx.moveTo(-22,22);ctx.quadraticCurveTo(-39,-25,29,-29);ctx.quadraticCurveTo(35,27,-22,22);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-26,28);ctx.lineTo(18,-17);ctx.stroke()}
 else{ctx.font='900 88px Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(kind,0,5)}ctx.restore();
}
export function createRewardArt(){
 const materials=new Map(),geometry={base:new T.CylinderGeometry(.72,.8,.19,28),top:new T.CylinderGeometry(.675,.69,.075,28),rim:new T.TorusGeometry(.695,.04,6,32),disc:new T.PlaneGeometry(.85,.85)};
 const mat=(color,metalness=0)=>{const key=[color,metalness].join(':');if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.48,metalness}));return materials.get(key)};
 const symbols=new Map();
 function space(parent,node){const style=spaceStyles[node.type],g=new T.Group();g.position.set(node.x,1,node.z);g.userData.boardSpace=node.id;parent.add(g);
  const base=new T.Mesh(geometry.base,mat(0x23485a,.15));base.castShadow=base.receiveShadow=true;g.add(base);
  const top=new T.Mesh(geometry.top,mat(style.color,.08));top.position.y=.09;top.receiveShadow=true;g.add(top);
  const rim=new T.Mesh(geometry.rim,mat(0xffe5a4,.3));rim.position.y=.1;rim.rotation.x=-Math.PI/2;g.add(rim);
  if(!symbols.has(node.type)){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;drawSpaceIcon(canvas.getContext('2d'),style.symbol,style.ink);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;symbols.set(node.type,new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}))}
  const icon=new T.Mesh(geometry.disc,symbols.get(node.type));icon.rotation.x=-Math.PI/2;icon.position.y=.132;g.add(icon);return g;
 }
 return {space};
}
// One short-lived visual effect pool. It cannot call rules, award rewards, or
// retain an animation per landing. Reduced motion shows a stationary halo.
export function createLandingEffect({scene,reducedMotion=false}){
 const root=new T.Group();root.visible=false;scene.add(root);let started=null,duration=900;
 const halo=new T.Mesh(new T.TorusGeometry(.95,.045,6,40),new T.MeshBasicMaterial({color:0xffd467,transparent:true,opacity:.9,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.15;root.add(halo);
 const particles=[];const geometry=new T.BoxGeometry(.1,.16,.035);for(let i=0;i<12;i++){const m=new T.Mesh(geometry,new T.MeshBasicMaterial({color:[0xffd467,0xff7d9e,0x51d5d8][i%3],transparent:true,depthWrite:false}));root.add(m);particles.push(m)}
 return{play({position,type,now=performance.now()}){root.position.set(position.x,1.1,position.z);root.visible=true;started=now;halo.material.color.setHex(spaceStyles[type]?.color??0xffd467);particles.forEach(p=>p.visible=!reducedMotion&&type!=='scenic')},update(now){if(started===null)return;const t=Math.min(1,Math.max(0,(now-started)/duration));if(t>=1){root.visible=false;started=null;return}halo.scale.setScalar(reducedMotion?1:1+t*.65);halo.material.opacity=(1-t)*.9;particles.forEach((p,i)=>{const a=i/particles.length*Math.PI*2;p.position.set(Math.cos(a)*(.6+t),.35+Math.sin(t*Math.PI)*1.2,Math.sin(a)*(.6+t));p.rotation.set(t*5+i,t*4,0);p.material.opacity=1-t})},get active(){return started!==null}};
}
let ticketResources;
export function createTicketToken(parent,x,y,z){
 if(!ticketResources){const s=new T.Shape();s.moveTo(-.43,-.25);s.lineTo(.43,-.25);s.lineTo(.43,-.09);s.quadraticCurveTo(.28,0,.43,.09);s.lineTo(.43,.25);s.lineTo(-.43,.25);s.lineTo(-.43,.09);s.quadraticCurveTo(-.28,0,-.43,-.09);s.closePath();const geometry=new T.ExtrudeGeometry(s,{depth:.06,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2,steps:1});geometry.center();
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.strokeStyle=ctx.fillStyle='#754319';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(51,35,410,186,20);ctx.stroke();ctx.font='900 60px Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TICKET',256,117);ctx.lineWidth=3;for(let i=0;i<15;i++){ctx.beginPath();ctx.moveTo(119+i*19,173);ctx.lineTo(119+i*19,191);ctx.stroke()}ctx.font='900 20px Trebuchet MS, sans-serif';ctx.fillText('MIDWAY MASHUP',256,54);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  ticketResources={geometry,material:new T.MeshStandardMaterial({color:0xffcc42,metalness:.28,roughness:.35}),face:new T.PlaneGeometry(.8,.46),ink:new T.MeshBasicMaterial({map,transparent:true,depthWrite:false})};
 }
 const r=ticketResources,g=new T.Group();g.position.set(x,y,z);g.rotation.z=.18;g.userData.ticket=true;parent.add(g);const body=new T.Mesh(r.geometry,r.material);body.castShadow=body.receiveShadow=true;g.add(body);for(const side of [-1,1]){const face=new T.Mesh(r.face,r.ink);face.position.z=side*.058;face.rotation.y=side<0?Math.PI:0;g.add(face)}return g;
}
