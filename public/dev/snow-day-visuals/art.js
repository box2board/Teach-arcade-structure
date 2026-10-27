import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
import {batchCharacter} from './theme.js';
// Game-specific art, deliberately kept out of the provisional shared system.
const capsule=new THREE.CapsuleGeometry(.5,1,4,10);
const hat=new THREE.LatheGeometry([[0,0],[.48,0],[.49,.2],[.43,.38],[.32,.56],[.12,.66],[0,.67]].map(p=>new THREE.Vector2(...p)),16);
const bucket=new THREE.CylinderGeometry(.47,.61,.65,12);
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
 const g=new THREE.Group(),tank=type==='tank'||type==='boss',runner=type==='runner';shadow(g,tank?1:.85);
 const snow=runner?0xc4efdf:0xf6fbff,accent=tank?0x7754b6:runner?0x279e9b:0xd95c3e;
 mesh(sphere,snow,0,.72,0,tank?.78:.65,.72,.59,g);mesh(sphere,0xffffff,0,1.65,0,.49,.49,.43,g);
 mesh(sphere,accent,0,1.24,0,.64,.12,.52,g);mesh(capsule,accent,.34,.94,.48,.17,.28,.12,g);
 for(const x of [-.18,.18]){mesh(sphere,0xffffff,x,1.76,.395,.16,.16,.055,g);mesh(sphere,0x20344d,x,1.75,.45,.073,.085,.025,g);const brow=mesh(capsule,0x243c56,x,1.97,.41,.19,.035,.04,g);brow.rotation.z=x<0?-.28:.28;mesh(sphere,0xf3b5ac,x*1.5,1.57,.36,.075,.05,.025,g);}
 mesh(cone,0xed8b32,0,1.59,.56,.13,.49,.13,g).rotation.x=Math.PI/2;
 for(const y of [.45,.72,.97])mesh(sphere,0x2b455b,0,y,.58,.065,.065,.035,g);
 for(const side of [-1,1]){const arm=mesh(capsule,tank?accent:snow,side*(tank?.9:.73),1.1,0,tank?.44:.25,.3,.3,g);arm.rotation.z=side*.7;mesh(sphere,tank?0x6650a0:snow,side*(tank?1.1:.86),.92,.15,tank?.28:.2,.24,.24,g);}
 if(tank){const b=mesh(bucket,accent,0,2.26,0,1,1,1,g);b.rotation.z=-.07;mesh(cylinder,0xa787df,0,1.96,0,.63,.1,.63,g);for(const x of [-.24,.24])mesh(box,0x9674ce,x,2.3,.48,.045,.45,.025,g);}
 else if(runner){for(const side of [-1,1]){const ear=mesh(capsule,0x81c9b6,side*.31,2.36,0,.2,.43,.15,g);ear.rotation.z=-side*.4;mesh(sphere,0xd7f7df,side*.31,2.35,.09,.07,.25,.035,g);}}
 else{mesh(hat,0x53769b,0,2.02,0,.83,.55,.83,g);mesh(sphere,0xffffff,0,2.4,0,.13,.13,.13,g);}
 if(type==='boss')for(const x of [-.35,0,.35])mesh(cone,0xc7f5ff,x,2.8,0,.19,.6,.18,g);
 return batchCharacter(g,'art-creature-'+type);
}
export function snowSurface(){
 const size=64,data=new Uint8Array(size*size*4);let seed=871;
 for(let i=0;i<size*size;i++){seed=(seed*1664525+1013904223)>>>0;const v=210+(seed>>>24)%46;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);t.needsUpdate=true;return t;
}
