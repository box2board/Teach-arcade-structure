import * as T from '../../vendor/three.module.js';

// Approved visual benchmark assets; gameplay and board layout stay outside this module.
export function createArtKit(root=new T.Group()){
 const materials=new Map(),geometries=new Map();
 const mat=(color,roughness=.7,metalness=0)=>{const key=[color,roughness,metalness].join(':');if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key)};
 function mesh(parent,geometry,color,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
 function cube(p,c,x,y,z,w,h,d,r=.05){
  const key=JSON.stringify(['box',w,h,d,r]);let geometry=geometries.get(key);
  if(!geometry){if(!r)geometry=new T.BoxGeometry(w,h,d);else{const a=w/2,b=h/2,q=Math.min(r,a*.8,b*.8),shape=new T.Shape();shape.moveTo(-a+q,-b);shape.lineTo(a-q,-b);shape.quadraticCurveTo(a,-b,a,-b+q);shape.lineTo(a,b-q);shape.quadraticCurveTo(a,b,a-q,b);shape.lineTo(-a+q,b);shape.quadraticCurveTo(-a,b,-a,b-q);shape.lineTo(-a,-b+q);shape.quadraticCurveTo(-a,-b,-a+q,-b);const bevel=Math.min(q*.35,d*.15);geometry=new T.ExtrudeGeometry(shape,{depth:d-bevel*2,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,steps:1,curveSegments:3});geometry.center()}geometries.set(key,geometry)}
  return mesh(p,geometry,c,x,y,z);
 }
 function oval(p,c,x,y,z,a,b,d){const small=Math.max(a,b,d)<.2,key=small?'small-sphere':'sphere';if(!geometries.has(key))geometries.set(key,new T.SphereGeometry(1,small?10:18,small?8:12));const m=mesh(p,geometries.get(key),c,x,y,z);m.scale.set(a,b,d);return m}
 function rod(p,c,a,b,r=.04){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const m=mesh(p,new T.CylinderGeometry(r,r,delta.length(),10),c,...start.add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m}
 function sign(p,message,x,y,z,w=3.5,h=.65,bg='#153958',ink='#fff2bc'){
  const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,160);ctx.strokeStyle='#ffd46a';ctx.lineWidth=7;ctx.strokeRect(9,9,750,142);ctx.fillStyle=ink;ctx.font='900 67px Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(message,384,84,710);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}));m.position.set(x,y,z);p.add(m);return m;
 }
 function deluxeBooth(x,z,color,title){
  const g=new T.Group();g.position.set(x,.23,z);root.add(g);
  cube(g,0x173d52,0,.15,0,4.4,.3,3.5,.1);cube(g,0xf5deaf,0,1.4,0,4,2.7,2.9,.12);
  for(const side of [-1,1]){cube(g,color,side*1.91,1.5,1.48,.2,2.8,.18,.055);cube(g,0xeac588,side*1.7,1,1.48,.07,1.9,.07,.02)}
  // Recessed interior, shelves and game prizes instead of a flat painted window.
  cube(g,0x16394c,0,1.95,1.49,3.45,1.6,.08,.06);cube(g,0x234b5b,0,1.85,1.54,3.25,1.3,.04,.01);
  for(const y of [1.45,2.02])cube(g,0xb47c49,0,y,1.8,3.3,.1,.5,.025);
  for(const row of [0,1])for(let i=0;i<5;i++){
   const a=-1.25+i*.63,y=1.54+row*.58;
   if(title==='PRIZE PARADE'){oval(g,[0xffcc44,0xe76f9a,0x5dcfd7,0xa38dec,0x97d24d][i],a,y+.16,1.68,.16,.2,.13);for(const side of [-1,1])oval(g,0xffdda1,a+side*.12,y+.34,1.68,.07,.07,.055)}
   else{const cup=mesh(g,new T.CylinderGeometry(.12,.09,.26,12),i%2?0xffc731:color,a,y+.12,1.69);cube(g,0xfff3ce,a,y+.27,1.69,.28,.07,.28,.02)}
  }
  cube(g,color,0,.76,1.56,3.5,1.04,.18,.08);
  for(let i=-3;i<=3;i++)cube(g,0xffe6b9,i*.46,.77,1.67,.1,.87,.025,.015);
  cube(g,0x7d4937,0,1.28,1.75,4.45,.17,.85,.065);cube(g,0xffdd8b,0,1.38,1.77,4.5,.09,.9,.04);
  // Curved canvas awning, with independent stripes and a scalloped valance.
  for(let stripe=0;stripe<12;stripe++){
   const geo=new T.BufferGeometry(),v=[],uv=[],idx=[];for(let j=0;j<=12;j++){const t=j/12;for(let side=0;side<2;side++){v.push(-2.25+(stripe+side)*.375,3.32-.5*t*t,1.35+t*1.28);uv.push(side,t)}}
   for(let j=0;j<12;j++){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const awning=mesh(g,geo,stripe%2?0xfff1cb:color);awning.material=mat(stripe%2?0xfff1cb:color);awning.material.side=T.DoubleSide;
   cube(g,stripe%2?0xfff1cb:color,-2.0625+stripe*.375,2.78,2.64,.372,.26,.08,.07);
  }
  cube(g,color,0,3.48,.3,4.6,.7,2.8,.13);cube(g,0xffd477,0,3.84,.3,4.73,.13,2.9,.04);
  for(const side of [-1,1])rod(g,0xc4a16c,[side*2.05,1.4,2.25],[side*2.05,3.2,1.5],.055);
  cube(g,0x143752,0,4.22,1.5,3.8,.85,.18,.13);sign(g,title,0,4.22,1.61,3.55,.63);
  for(let i=0;i<13;i++)oval(g,0xffe5a0,-1.8+i*.3,4.71,1.58,.065,.065,.065);
  sign(g,title==='PRIZE PARADE'?'WIN SOMETHING WONDERFUL':'FRESH • SWEET • HAPPY',0,.76,1.78,2.8,.32,color===0xe84062?'#a41e41':'#065e82');
  return g;
 }
 const kit={root,mesh,cube,oval,rod,mat,sign,booth:deluxeBooth};kit.steve=()=>createSteve(kit);return kit;
}
function createSteve({mesh,cube,oval,rod,mat}){
 const g=new T.Group();g.name='Steve — visual benchmark';const orange=0xf58b2b,light=0xffedce,dark=0x263c49;
 // An articulated silhouette with a pear-shaped torso and actual shoulder/hip pivots.
 const torso=mesh(g,new T.LatheGeometry([new T.Vector2(.26,0),new T.Vector2(.48,.1),new T.Vector2(.54,.4),new T.Vector2(.44,.79),new T.Vector2(.28,.94)],24),orange,0,.91,0);
 oval(g,light,0,1.35,.36,.37,.43,.16);
 const vest=mesh(g,new T.LatheGeometry([new T.Vector2(.55,0),new T.Vector2(.59,.15),new T.Vector2(.59,.4),new T.Vector2(.51,.65)],24),0x038c9e,0,.99,0);
 // Cream shirt front, open vest lapels, little brass buttons and a stitched belt.
 oval(g,light,0,1.48,.53,.25,.36,.14);
 for(const side of [-1,1]){const lapel=cube(g,0x027387,side*.25,1.51,.59,.14,.49,.065,.035);lapel.rotation.z=-side*.18;for(let i=0;i<3;i++)oval(g,0xf9cc60,side*.22,1.18+i*.12,.65,.026,.026,.025)}
 mesh(g,new T.CylinderGeometry(.57,.57,.12,24),0x07566e,0,1.02,0);cube(g,0xffc446,0,1.04,.61,.2,.15,.065,.035);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.26,.85,0);g.add(leg);legs.push(leg);oval(leg,0x244c68,0,-.28,0,.18,.34,.19);oval(leg,0x6e4236,0,-.68,.12,.24,.17,.34);cube(leg,0xe0b572,0,-.84,.12,.43,.055,.59,.025);oval(leg,0xb17b4e,0,-.59,.32,.13,.04,.035);
  const arm=new T.Group();arm.position.set(side*.48,1.66,0);g.add(arm);arms.push(arm);oval(arm,orange,side*.09,-.25,0,.15,.35,.17);oval(arm,dark,side*.12,-.55,.04,.16,.18,.17);oval(arm,orange,side*.12,-.54,.16,.13,.12,.12);
 }
 const head=new T.Group();head.position.set(0,2.12,0);g.add(head);oval(head,orange,0,.13,0,.68,.59,.49);
 // Wide cheek ruffs and tapered muzzle make the fox read clearly from a distance.
 for(const side of [-1,1]){
  oval(head,light,side*.34,-.08,.33,.34,.27,.22);
  const ruff=mesh(head,new T.ConeGeometry(.2,.44,4),light,side*.58,-.08,.13);ruff.rotation.z=-side*1.05;ruff.rotation.x=.2;
  const shape=new T.Shape();shape.moveTo(-.25,0);shape.quadraticCurveTo(-.27,.38,-.08,.8);shape.quadraticCurveTo(.09,.72,.25,0);shape.closePath();const ear=mesh(head,new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,bevelThickness:.035,bevelSize:.025,steps:1,curveSegments:8}),orange,side*.39,.46,-.06);ear.rotation.z=-side*.24;
  const inner=mesh(ear,new T.ShapeGeometry(shape),0xe9a6a0,0,.055,.165);inner.scale.set(.62,.72,1);
 }
 const muzzle=oval(head,light,0,-.11,.5,.36,.23,.29);oval(head,dark,0,-.025,.76,.12,.085,.085);
 const smile=new T.CatmullRomCurve3([new T.Vector3(-.16,-.19,.7),new T.Vector3(0,-.225,.74),new T.Vector3(.16,-.19,.7)]);mesh(head,new T.TubeGeometry(smile,12,.014,6,false),0x6d483b);
 const eyelids=[];
 for(const side of [-1,1]){oval(head,0x9e481d,side*.26,.2,.4,.18,.22,.13);const eye=new T.Group();eye.position.set(side*.26,.21,.43);head.add(eye);eyelids.push(eye);oval(eye,0xfffcf0,0,0,0,.14,.18,.09);oval(eye,0x1d6061,0,-.012,.072,.083,.12,.045);oval(eye,0x172d39,.008,-.01,.103,.05,.085,.026);oval(eye,0xffffff,-.027,.045,.123,.026,.035,.014);const brow=cube(head,0x8d431e,side*.27,.47,.4,.22,.06,.08,.027);brow.rotation.z=-side*.15;oval(head,0xf9ac55,side*.43,-.05,.49,.11,.065,.045)}
 const tuft=mesh(head,new T.ConeGeometry(.19,.39,5),orange,.04,.71,-.06);tuft.rotation.z=-.35;
 // Swept, tapered tail, including a separate cream tip along the same curve.
 const tail=new T.Group();tail.position.set(0,1.04,-.35);g.add(tail);const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.25,-.17,-.37),new T.Vector3(.48,.02,-.88),new T.Vector3(.53,.51,-1.1)]);
 function tailSection(from,to,color){const geometry=new T.TubeGeometry(curve,28,.25,12,false),position=geometry.attributes.position;
  for(let i=0;i<=28;i++){const t=i/28,center=curve.getPointAt(t),radius=Math.sin(Math.PI*(.12+t*.87))*.94+.08;for(let j=0;j<=12;j++){const k=i*13+j,v=new T.Vector3().fromBufferAttribute(position,k);v.sub(center).multiplyScalar(radius).add(center);position.setXYZ(k,v.x,v.y,v.z)}}
  geometry.clearGroups();geometry.setDrawRange(Math.round(from*28)*72,Math.round((to-from)*28)*72);geometry.computeVertexNormals();return mesh(tail,geometry,color)}
 tailSection(0,.75,orange);tailSection(.75,1,light);
 const band=cube(g,0xef4163,0,1.9,.12,.75,.16,.61,.06);const scarf=cube(g,0xef4163,-.35,1.69,.45,.14,.42,.075,.04);scarf.rotation.z=-.3;
 g.userData={legs,arms,tail,head,eyelids};return g;
}
