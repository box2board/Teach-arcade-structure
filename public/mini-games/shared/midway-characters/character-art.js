import * as T from '../../vendor/three.module.js';
import {createArtKit} from './approved-art.js';

// One articulated body contract; individual species keep their own silhouettes.
// All resources belong to this avatar so replacing a lineup cannot dispose another.
export function createCharacterArt(c){
 const a=createArtKit(),{mesh,cube,oval,rod}=a,g=new T.Group();g.name=c.name;
 const cream=0xffedcf,dark=0x243b4d,color=c.color,accent=c.accent;
 const cone=(p,cl,x,y,z,r,h)=>mesh(p,new T.ConeGeometry(r,h,12),cl,x,y,z);
 const head=new T.Group();head.position.y=2.18;g.add(head);
 const legs=[],arms=[],eyelids=[],wings=[],ears=[];
 function ear(side,{round=true,x=.49,y=.51,scale=1,inner=0xf0bdab}={}){
  const pivot=new T.Group();pivot.position.set(side*x,y,0);pivot.rotation.z=-side*.16;head.add(pivot);ears.push(pivot);
  if(round){oval(pivot,color,0,0,0,.24*scale,.27*scale,.15);oval(pivot,inner,0,0,.12,.15*scale,.18*scale,.055)}
  else{const shape=new T.Shape();shape.moveTo(-.22,0);shape.quadraticCurveTo(-.23,.24,0,.62*scale);shape.quadraticCurveTo(.23,.24,.22,0);shape.closePath();mesh(pivot,new T.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:true,bevelSegments:1,bevelThickness:.02,bevelSize:.02,steps:1,curveSegments:5}),color);const inside=mesh(pivot,new T.ShapeGeometry(shape),inner,0,.05,.13);inside.scale.set(.62,.74,1)}
 }
 function muzzle({cl=cream,y=-.16,z=.49,width=.34,nose=true}={}){oval(head,cl,0,y,z,width,.21,.2);if(nose)oval(head,dark,0,y+.055,z+.19,.1,.073,.065)}
 function eye(side,{x=.24,y=.24,z=.48,size=1}={}){const e=new T.Group();e.position.set(side*x,y,z);head.add(e);eyelids.push(e);oval(e,0x9b6945,0,0,-.025,.17*size,.205*size,.075);oval(e,0xfffcf2,0,0,.025,.145*size,.178*size,.065);oval(e,0x286c74,.012,-.012,.08,.085*size,.12*size,.04);oval(e,0x18323f,.015,-.012,.111,.052*size,.086*size,.024);oval(e,0xffffff,-.02,.045,.132,.025*size,.032*size,.012)}
 function tail(points,r=.16,colors=[color]){const pivot=new T.Group();pivot.position.set(0,1.03,-.35);g.add(pivot);const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const geo=new T.TubeGeometry(curve,24,r,10,false);let material=a.mat(colors[0]);if(colors.length>1){geo.clearGroups();for(let i=0;i<24;i++)geo.addGroup(i*60,60,Math.floor(i/3)%colors.length);material=colors.map(cl=>a.mat(cl))}const m=new T.Mesh(geo,material);m.castShadow=m.receiveShadow=true;pivot.add(m);g.userData.tail=pivot;return pivot}
 function smile(y=-.29,z=.65){const curve=new T.QuadraticBezierCurve3(new T.Vector3(-.15,y,z),new T.Vector3(0,y-.09,z+.025),new T.Vector3(.15,y,z));mesh(head,new T.TubeGeometry(curve,10,.012,5,false),0x734d40)}
 // Foot soles share a ground datum. Shoulder and hip pivots match Steve's rig.
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.26,.85,0);g.add(leg);legs.push(leg);oval(leg,c.id==='penguin'?0xffb638:0x2a506a,0,-.28,0,.175,.34,.19);oval(leg,c.id==='penguin'?0xffb638:0x785243,0,-.68,.12,.23,.17,.32);cube(leg,0xd9b67b,0,-.84,.12,.43,.055,.57,.025);
  const arm=new T.Group();arm.position.set(side*.49,1.64,0);g.add(arm);arms.push(arm);
  if(['penguin','owl'].includes(c.id)){const feather=oval(arm,color,side*.12,-.26,-.02,.23,.5,.15);wings.push(arm);for(let j=0;j<3;j++)oval(arm,c.id==='owl'?cream:color,side*(.16+j*.025),-.48-j*.07,.07,.11,.16,.055)}
  else{oval(arm,color,side*.09,-.25,0,.15,.34,.17);cube(arm,accent,side*.1,-.37,.01,.29,.12,.3,.04);oval(arm,color,side*.12,-.54,.08,.16,.17,.17)}
 }
 if(c.id==='robot'){
  cube(g,0x1c526d,0,1.31,0,1.04,.92,.74,.13);cube(g,color,0,1.4,.13,.9,.78,.77,.13);cube(g,0xffe6ab,0,1.48,.55,.57,.4,.09,.04);for(let i=0;i<3;i++)oval(g,[0x45d9b3,0xffc84c,0xf26583][i],-.17+i*.17,1.48,.62,.045,.045,.035);
  cube(head,0xe7f3e8,0,.14,0,1.24,1.04,.86,.15);cube(head,0x17485d,0,.14,.49,1.05,.69,.1,.1);
  for(const side of [-1,1]){const e=new T.Group();e.position.set(side*.25,.2,.57);head.add(e);eyelids.push(e);oval(e,0x69edd7,0,0,0,.105,.14,.035);oval(e,0xffffff,-.025,.04,.035,.026,.032,.012);oval(head,accent,side*.69,.12,0,.14,.23,.23);cube(head,0x69edd7,side*.7,.14,.22,.11,.2,.04,.015)}
  const mouth=new T.QuadraticBezierCurve3(new T.Vector3(-.18,-.1,.58),new T.Vector3(0,-.23,.58),new T.Vector3(.18,-.1,.58));mesh(head,new T.TubeGeometry(mouth,12,.025,6,false),0x69edd7);rod(head,0x527387,[0,.67,0],[0,.97,0],.045);oval(head,accent,0,1.05,0,.13,.13,.13);
  for(const leg of legs)oval(leg,0xaed8da,0,-.23,.19,.1,.1,.045);
 }else{
  mesh(g,new T.LatheGeometry([new T.Vector2(.27,0),new T.Vector2(.49,.1),new T.Vector2(.54,.4),new T.Vector2(.44,.79),new T.Vector2(.28,.94)],22),color,0,.91,0);
  mesh(g,new T.LatheGeometry([new T.Vector2(.55,0),new T.Vector2(.59,.15),new T.Vector2(.59,.4),new T.Vector2(.51,.65)],22),accent,0,.99,0);
  oval(g,cream,0,1.48,.53,.25,.36,.14);
  for(const side of [-1,1]){const lapel=cube(g,accent,side*.25,1.51,.59,.14,.49,.065,.035);lapel.rotation.z=-side*.18;for(let j=0;j<2;j++)oval(g,0xf9cc60,side*.22,1.2+j*.16,.65,.026,.026,.025)}
  mesh(g,new T.CylinderGeometry(.57,.57,.12,22),0x24536b,0,1.02,0);cube(g,0xffc446,0,1.04,.61,.19,.14,.065,.03);
  oval(head,color,0,.13,0,c.id==='frog'?.7:.62,c.id==='frog'?.47:.57,.48);
  const patch=(side,cl,x=.24,y=.23,z=.43,rx=.23,ry=.28)=>oval(head,cl,side*x,y,z,rx,ry,.1);
  switch(c.id){
   case 'frog':for(const side of [-1,1])oval(head,color,side*.38,.53,.12,.28,.3,.26);muzzle({cl:0xb7e77b,y:-.14,z:.34,width:.49,nose:false});smile(-.23,.55);break;
   case 'rabbit':for(const side of [-1,1]){const e=new T.Group();e.position.set(side*.28,.53,0);e.rotation.z=-side*.13;head.add(e);ears.push(e);oval(e,color,0,.38,0,.18,.62,.14);oval(e,0xf2b6ce,0,.4,.12,.095,.46,.045)}muzzle({width:.34});oval(head,0xe18ba5,0,-.12,.7,.075,.055,.045);tail([[0,0,0],[0,-.05,-.25]],.21,[cream]);break;
   case 'bear':for(const side of [-1,1])ear(side);muzzle({width:.39});break;
   case 'cat':for(const side of [-1,1])ear(side,{round:false,scale:.85});muzzle();for(let i=-1;i<=1;i++){const stripe=cube(head,0x9c672a,i*.16,.58,.25,.08,.22,.05,.025);stripe.rotation.z=i*.16}for(const side of [-1,1])for(let j=0;j<2;j++)rod(head,dark,[side*.19,-.16-j*.065,.68],[side*.5,-.12-j*.13,.61],.012);tail([[0,0,0],[.35,-.08,-.4],[.6,.3,-.65],[.48,.83,-.65]],.11);break;
   case 'dog':for(const side of [-1,1]){const e=new T.Group();e.position.set(side*.55,.29,0);head.add(e);ears.push(e);oval(e,0x784934,side*.04,-.18,0,.2,.53,.2)}patch(-1,0x845036,.25,.26,.42);muzzle();tail([[0,0,0],[.25,0,-.4],[.43,.38,-.65]],.13);break;
   case 'panda':for(const side of [-1,1]){ear(side,{inner:0x77777d});ears.at(-1).children[0].material=a.mat(dark);patch(side,dark,.25,.25,.43)}muzzle();break;
   case 'raccoon':for(const side of [-1,1])ear(side,{round:false,scale:.85,inner:dark});oval(head,dark,0,.23,.44,.53,.23,.1);muzzle();tail([[0,0,0],[.28,-.1,-.42],[.61,.28,-.8]],.22,[dark,color]);break;
   case 'squirrel':for(const side of [-1,1])ear(side,{round:false,scale:.8});muzzle();tail([[0,0,0],[.48,.07,-.5],[.67,.77,-.72],[.25,1.35,-.68],[.05,1.1,-.59]],.29);break;
   case 'otter':for(const side of [-1,1]){ear(side,{x:.55,y:.36,scale:.65});patch(side,cream,.17,-.12,.49,.22,.2)}muzzle({width:.32});tail([[0,0,0],[0,-.25,-.5],[.42,-.45,-.85]],.18);break;
   case 'penguin':oval(head,cream,0,.04,.35,.49,.48,.17);const beak=cone(head,0xffb638,0,-.09,.65,.16,.36);beak.rotation.x=Math.PI/2;break;
   case 'owl':for(const side of [-1,1]){patch(side,cream,.27,.2,.37,.34,.35);cone(head,color,side*.46,.67,-.03,.16,.41)}const bill=cone(head,0xf4b93b,0,-.15,.62,.12,.28);bill.rotation.z=Math.PI;break;
   case 'turtle':muzzle({cl:0x8bdb8c,y:-.12,z:.45,width:.4,nose:false});oval(g,0x245b46,0,1.44,-.38,.66,.74,.38);for(let i=0;i<7;i++){const t=i*Math.PI/3,x=i===6?0:.37*Math.cos(t),y=i===6?1.44:1.44+.43*Math.sin(t);const tile=mesh(g,new T.CylinderGeometry(.23,.23,.055,6),0x8dc45d,x,y,-.75);tile.rotation.x=Math.PI/2}break;
   case 'hedgehog':oval(head,cream,0,.06,.25,.52,.46,.29);for(let i=0;i<15;i++){const t=i*Math.PI*2/15;const spine=cone(head,0x694631,Math.cos(t)*.54,.13+Math.sin(t)*.54,-.14,.15,.42);spine.rotation.z=t-Math.PI/2}muzzle({z:.55});break;
   case 'dragon':for(const side of [-1,1]){ear(side,{round:false,x:.59,y:.35,scale:.65,inner:accent});cone(head,0xffd783,side*.3,.78,-.1,.11,.43)}muzzle({cl:0x98dfaf,z:.49,width:.4,nose:false});for(const side of [-1,1])oval(head,dark,side*.16,-.04,.71,.04,.027,.025);for(const side of [-1,1]){const w=new T.Group();w.position.set(side*.39,1.8,-.43);g.add(w);wings.push(w);const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(side*.62,.63);sh.lineTo(side*.77,-.04);sh.quadraticCurveTo(side*.35,.23,side*.05,-.32);sh.closePath();const wing=mesh(w,new T.ShapeGeometry(sh),accent);wing.material=wing.material.clone();wing.material.side=T.DoubleSide;rod(w,0x176f6a,[0,0,.01],[side*.62,.63,.01],.04)}tail([[0,0,0],[.2,-.12,-.5],[.55,.12,-.85]],.15);break;
   case 'axolotl':for(const side of [-1,1])for(let i=0;i<3;i++){const y=-.1+i*.26;rod(head,accent,[side*.48,y,0],[side*.86,y+.1,0],.07);for(let j=0;j<3;j++)oval(head,accent,side*(.7+j*.075),y+.11+j*.045,0,.08,.14,.06)}muzzle({cl:0xffcad9,y:-.19,z:.38,width:.37,nose:false});smile(-.28,.58);tail([[0,0,0],[.28,-.23,-.5],[.56,0,-.8]],.15);break;
   case 'koala':for(const side of [-1,1])ear(side,{x:.62,y:.32,scale:1.25,inner:cream});oval(head,0x3e3a49,0,.02,.52,.18,.25,.13);break;
   case 'red-panda':for(const side of [-1,1]){ear(side,{round:false,scale:.8});patch(side,cream,.43,-.1,.36,.24,.22);patch(side,cream,.26,.43,.38,.17,.12)}muzzle();tail([[0,0,0],[.36,-.1,-.48],[.65,.3,-.83]],.24,[0xf4b46a,0x8d3e2f]);break;
   case 'deer':for(const side of [-1,1]){ear(side,{x:.59,y:.33,scale:.68});rod(head,0x755137,[side*.28,.55,-.1],[side*.42,1.21,-.1],.055);rod(head,0x755137,[side*.36,.87,-.1],[side*.65,1.06,-.1],.045);rod(head,0x755137,[side*.39,1.05,-.1],[side*.24,1.24,-.1],.04);oval(head,cream,side*.39,-.12,.4,.055,.04,.025)}muzzle();break;
  }
  for(const side of [-1,1]){eye(side,c.id==='frog'?{x:.38,y:.55,z:.33}:c.id==='owl'?{x:.27,y:.21,z:.52,size:1.1}:c.id==='penguin'?{x:.24,y:.27,z:.49}:{});const brow=cube(head,c.id==='panda'?dark:color,side*.25,c.id==='frog'?.82:.49,c.id==='frog'?.34:.43,.21,.05,.065,.02);brow.rotation.z=-side*.15}
  // A small identity detail on the shared outfit, not a gameplay power-up.
  cube(g,0xffd16a,-.25,1.45,.7,.12,.14,.035,.025);
 }
 g.userData={...g.userData,characterId:c.id,visualRevision:3,legs,arms,head,eyelids,wings,ears};return g;
}
