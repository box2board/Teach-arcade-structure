import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
import {batchCharacter} from './theme.js';
// Game-specific art, deliberately kept out of the provisional shared system.
const capsule=new THREE.CapsuleGeometry(.5,1,4,10);
const hat=new THREE.LatheGeometry([[0,0],[.48,0],[.49,.2],[.43,.38],[.32,.56],[.12,.66],[0,.67]].map(p=>new THREE.Vector2(...p)),16);
const bucket=new THREE.CylinderGeometry(.47,.61,.65,12);
// Shared, opaque pieces are folded into the cached body mesh once per outfit.
const iceFacet=new THREE.OctahedronGeometry(1,0);
const capeShape=new THREE.Shape();capeShape.moveTo(-.54,1.45);capeShape.lineTo(.54,1.45);capeShape.lineTo(.93,.22);capeShape.lineTo(.46,.07);capeShape.lineTo(0,.19);capeShape.lineTo(-.46,.07);capeShape.lineTo(-.93,.22);capeShape.closePath();
const royalCape=new THREE.ExtrudeGeometry(capeShape,{depth:.07,bevelEnabled:false});

export function sculptDefender({mesh,sphere,box,shadow}){
 const g=new THREE.Group();shadow(g,.88);
 for(const side of [-1,1]){mesh(capsule,0x223b55,side*.24,.4,0,.34,.35,.35,g);mesh(sphere,0x203a53,side*.25,.18,-.08,.23,.18,.38,g);mesh(box,0xc3a57a,side*.25,.075,-.08,.43,.08,.57,g);}
 mesh(capsule,0x17617c,0,1.08,0,.98,.57,.74,g);
 mesh(sphere,0x267e94,0,.91,.1,.49,.43,.36,g);
 mesh(sphere,0x593f36,0,1.8,.015,.4,.42,.36,g);
 mesh(sphere,0xf3c29a,0,1.87,-.13,.37,.36,.32,g);
 // Navy backpack and orange scarf face the camera; faces aim upfield.
 mesh(capsule,0x203e58,0,1.08,.39,.62,.36,.22,g);mesh(box,0x688da0,0,1.05,.52,.4,.07,.03,g);
 mesh(sphere,0xf49c3d,0,1.54,0,.57,.13,.43,g);const scarf=mesh(capsule,0xdb6d32,.34,1.24,.35,.16,.28,.13,g);scarf.rotation.z=-.2;
 mesh(hat,0xeb7e27,0,2.03,0,.9,.8,.9,g);
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;mesh(capsule,i%2?0xf39935:0xcb5f23,Math.sin(a)*.445,2.1,Math.cos(a)*.445,.035,.09,.035,g);}
 mesh(sphere,0xfca53e,0,2.65,0,.17,.17,.17,g);
 for(const x of [-.14,.14]){mesh(sphere,0x243a50,x,1.93,-.41,.045,.065,.025,g);mesh(sphere,0xe8937d,x*1.5,1.79,-.36,.07,.04,.02,g);}
 const arms=[];
 for(const side of [-1,1]){const a=new THREE.Group();mesh(capsule,0x226e89,0,-.1,-.05,.3,.31,.3,a);mesh(sphere,0xcb702e,0,-.4,-.13,.22,.2,.22,a);mesh(sphere,0xffffff,0,-.38,-.36,.19,.19,.19,a);batchCharacter(a,'art-arm');const arm=a.children[0];a.remove(arm);arm.position.set(side*.57,1.43,-.08);arm.rotation.z=side*.2;g.add(arm);arms.push(arm);}
 g.userData.arms=arms;return batchCharacter(g,'art-defender',arms);
}
export function sculptCreature(type,{mesh,sphere,box,cone,cylinder,shadow}){
 const g=new THREE.Group(),boss=type==='boss',tank=type==='tank'||boss,runner=type==='runner';shadow(g,tank?1:.85);
 const snow=runner?0xc4efdf:0xf6fbff,accent=boss?0x315991:tank?0x7754b6:runner?0x279e9b:0xd95c3e;
 mesh(sphere,snow,0,.72,0,tank?.78:.65,.72,.59,g);mesh(sphere,0xffffff,0,1.65,0,.49,.49,.43,g);
 mesh(sphere,accent,0,1.24,0,.64,.12,.52,g);mesh(capsule,accent,.34,.94,.48,.17,.28,.12,g);
 for(const x of [-.18,.18]){mesh(sphere,0xffffff,x,1.76,.395,.16,.16,.055,g);mesh(sphere,0x20344d,x,1.75,.45,.073,.085,.025,g);const brow=mesh(capsule,0x243c56,x,1.97,.41,.19,.035,.04,g);brow.rotation.z=x<0?-.28:.28;mesh(sphere,0xf3b5ac,x*1.5,1.57,.36,.075,.05,.025,g);}
 mesh(cone,0xed8b32,0,1.59,.56,.13,.49,.13,g).rotation.x=Math.PI/2;
 for(const y of [.45,.72,.97])mesh(sphere,0x2b455b,0,y,.58,.065,.065,.035,g);
 for(const side of [-1,1]){const arm=mesh(capsule,tank?accent:snow,side*(tank?.9:.73),1.1,0,tank?.44:.25,.3,.3,g);arm.rotation.z=side*.7;mesh(sphere,tank?0x6650a0:snow,side*(tank?1.1:.86),.92,.15,tank?.28:.2,.24,.24,g);}
 if(tank&&!boss){const b=mesh(bucket,accent,0,2.26,0,1,1,1,g);b.rotation.z=-.07;mesh(cylinder,0xa787df,0,1.96,0,.63,.1,.63,g);for(const x of [-.24,.24])mesh(box,0x9674ce,x,2.3,.48,.045,.45,.025,g);}
 else if(runner){for(const side of [-1,1]){const ear=mesh(capsule,0x81c9b6,side*.31,2.36,0,.2,.43,.15,g);ear.rotation.z=-side*.4;mesh(sphere,0xd7f7df,side*.31,2.35,.09,.07,.25,.035,g);}}
 else if(!boss){mesh(hat,0x53769b,0,2.02,0,.83,.55,.83,g);mesh(sphere,0xffffff,0,2.4,0,.13,.13,.13,g);}
 // Large silhouette details remain legible farther upfield; no gameplay state.
 if(boss){
  mesh(royalCape,0x293c74,0,0,-.48,1,1,1,g);
  for(const side of [-1,1]){
   const fur=mesh(capsule,0xe4f5ff,side*.47,1.38,-.04,.25,.25,.55,g);fur.rotation.z=side*.55;
   mesh(iceFacet,0x8fd6ef,side*.82,1.35,.03,.42,.32,.44,g);
   mesh(iceFacet,0xe4fbff,side*.89,1.51,.09,.14,.3,.19,g);
  }
  mesh(iceFacet,0x568cb5,0,.79,.55,.57,.52,.13,g);
  mesh(iceFacet,0xc5f5ff,0,.88,.71,.17,.22,.07,g);
  mesh(cylinder,0xd5ac58,0,2.09,0,.59,.15,.52,g);
  mesh(cylinder,0x70beda,0,2.22,0,.53,.16,.47,g);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,x=Math.sin(a)*.44,z=Math.cos(a)*.39,h=i===0?.63:.44;
   mesh(iceFacet,0xbcefff,x,2.38+h*.25,z,.15,h,.14,g);
   mesh(sphere,0xf6ce72,x,2.16,z*1.25,.06,.07,.04,g);
  }
  for(const side of [-1,1])mesh(iceFacet,0xf4fbff,side*.13,1.35,.42,.18,.27,.09,g);
 }else if(tank){
  for(const side of [-1,1]){
   mesh(iceFacet,0x9b7acb,side*.87,1.33,.02,.42,.25,.39,g);
   mesh(sphere,0xc9b9e4,side*1.12,.95,.34,.09,.1,.035,g);
  }
  mesh(box,0x59417c,0,.82,.58,.66,.38,.08,g);
  for(const x of [-.23,.23])mesh(sphere,0xc9b9e4,x,.82,.64,.045,.045,.025,g);
 }else if(runner){
  for(const side of [-1,1]){const skate=mesh(capsule,0x267e82,side*.33,.15,.12,.26,.14,.4,g);skate.rotation.z=side*.13;mesh(box,0xcaedf0,side*.33,.055,.17,.2,.045,.62,g);}
  const tail=mesh(capsule,0x238f92,-.45,1.22,-.35,.15,.12,.55,g);tail.rotation.y=-.45;
 }else{
  for(const side of [-1,1]){mesh(sphere,0x2d5279,side*.46,1.88,0,.15,.2,.2,g);mesh(sphere,0x8aa5bf,side*.53,1.9,.04,.07,.13,.13,g);}
  mesh(cylinder,0x345878,0,2.06,0,.43,.11,.39,g);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(capsule,0x7797b6,Math.sin(a)*.39,2.07,Math.cos(a)*.39,.025,.065,.025,g);}
 }
 // Coal smile and eye highlights read as faces instead of blank white spheres.
 for(const x of [-.14,0,.14])mesh(sphere,0x31465d,x,1.4+Math.abs(x)*.3,.4,.026,.026,.02,g);
 for(const x of [-.18,.18])mesh(sphere,0xffffff,x-.02,1.78,.474,.025,.027,.009,g);
 g.userData.outfit=boss?'frost-royalty':tank?'bucket-armor':runner?'mint-skater':'earmuff-snowman';
 return batchCharacter(g,'art-creature-'+type);
}
export function snowSurface(){
 const size=64,data=new Uint8Array(size*size*4);let seed=871;
 for(let i=0;i<size*size;i++){seed=(seed*1664525+1013904223)>>>0;const v=210+(seed>>>24)%46;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);t.needsUpdate=true;return t;
}
