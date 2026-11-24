import * as T from '../../mini-games/vendor/three.module.js';
import {createArtKit} from './approved-art.js';

// All dimensions are world units, with y=0 on the district's grass surface.
// Returned animation roots keep the renderer's existing beacon/cable/water hooks.
export function createDistrictProp(parent,asset){
 const g=new T.Group();parent.add(g);const a=createArtKit(g),color=asset.color??0x087c9d;
 const {mesh,cube,oval,rod,sign}=a;
 const ring=(r,t,c,y=0)=>{const m=mesh(g,new T.TorusGeometry(r,t,8,40),c,0,y,0);m.rotation.x=-Math.PI/2;return m};
 const cylinder=(top,bottom,h,c,y,segments=24)=>mesh(g,new T.CylinderGeometry(top,bottom,h,segments),c,0,y,0);
 const window=(x,y,z,w=.5,h=.8)=>{cube(g,0xf9d890,x,y,z,w+.16,h+.16,.11,.04);cube(g,0x144961,x,y,z+.07,w,h,.045,.025);cube(g,0x9ee0e4,x-.09,y+.12,z+.1,w*.12,h*.6,.02,.005)};
 if(asset.kind==='skyline-tower'){
  cube(g,0x24546a,0,.15,0,4.5,.3,4.5,.1);cube(g,0xf3d8ad,0,2.25,0,3.7,4.3,3.6,.13);
  for(const side of [-1,1]){cube(g,0xc38d58,side*1.76,2.2,1.84,.23,4.2,.17,.04);for(const y of [1.4,2.9])window(side*.77,y,1.85,.62,.9)}
  cube(g,0x146d8a,0,.48,0,3.92,.32,3.8,.06);cube(g,0x146d8a,0,4.55,0,4.35,.4,4.1,.08);
  for(const x of [-1.8,1.8])for(const z of [-1.65,1.65]){rod(g,0x23516a,[x,4.7,z],[x,6.05,z],.075);oval(g,0xffd67b,x,6.06,z,.13,.13,.13)}
  for(const z of [-1.65,1.65]){rod(g,0xffd67b,[-1.8,5.4,z],[1.8,5.4,z],.05);for(let i=-3;i<=3;i++)rod(g,0x23516a,[i*.48,4.75,z],[i*.48,5.4,z],.035)}
  cube(g,0xffd27b,0,6.12,0,4.65,.27,4.4,.09);const roof=mesh(g,new T.ConeGeometry(3.45,1.8,4),0xf07827,0,7.13,0);roof.rotation.y=Math.PI/4;
  rod(g,0x23516a,[0,7.9,0],[0,8.5,0],.04);const flag=cube(g,0xf04b72,.36,8.4,0,.7,.31,.06,.025);
  const clock=mesh(g,new T.CylinderGeometry(.55,.55,.08,32),0xfff3ca,0,4.25,2.12);clock.rotation.x=Math.PI/2;const rim=mesh(g,new T.TorusGeometry(.56,.055,8,32),0xffc746,0,4.25,2.18);
  rod(g,0x1c4254,[0,4.25,2.2],[0,4.58,2.2],.035);rod(g,0x1c4254,[0,4.25,2.2],[.22,4.1,2.2],.035);
  sign(g,'SKYLINE EXPRESS',0,3.8,2.02,2.8,.34);
  const cable=new T.Group();cable.position.set(4,4.6,0);g.add(cable);const ca=createArtKit(cable);ca.cube(cable,0x138cd0,0,0,0,1.65,1.3,1.35,.12);ca.cube(cable,0xffcf66,0,.73,0,1.85,.15,1.55,.05);ca.cube(cable,0x174657,0,.12,.7,1.25,.6,.04,.02);ca.cube(cable,0xb9edf0,-.38,.18,.73,.1,.35,.02,.005);ca.rod(cable,0x24546a,[0,.8,0],[0,1.6,0],.06);cable.userData.cable=true;
  rod(g,0x426274,[1.9,6.2,0],[5.5,6.2,0],.035);
 }else if(asset.kind==='harbor-lighthouse'){
  cylinder(2.3,2.5,.3,0xd7c59c,.15);ring(2.18,.11,0xf8e7bc,.34);
  cylinder(.91,1.36,5.4,0xfff0ce,3.02,32);
  for(const y of [1.7,3.25,4.8]){const radius=1.36-(y-.32)*.45/5.4;cylinder(radius-.025,radius+.025,.52,0xef4860,y,32)}
  cube(g,0x174a61,0,.9,1.35,.7,1.25,.12,.12);cube(g,0xf1cc75,.2,.85,1.43,.055,.055,.045,.015);
  for(const y of [2.55,4.15])window(0,y,1.14,.42,.65);
  cylinder(1.6,1.6,.24,0x145773,5.85);ring(1.53,.06,0xffd67d,6.25);
  for(let i=0;i<12;i++){const t=i/12*Math.PI*2;rod(g,0x145773,[Math.cos(t)*1.5,5.95,Math.sin(t)*1.5],[Math.cos(t)*1.5,6.25,Math.sin(t)*1.5],.035)}
  cylinder(.96,.96,1.14,0xb3e9e0,6.52,16);for(let i=0;i<8;i++){const t=i*Math.PI/4;rod(g,0x145773,[Math.cos(t),5.95,Math.sin(t)],[Math.cos(t),7.12,Math.sin(t)],.06)}
  mesh(g,new T.ConeGeometry(1.57,1.1,24),0xf37825,0,7.64,0);oval(g,0xffd67d,0,8.24,0,.14,.16,.14);
  const beacon=new T.Group();beacon.position.y=6.55;g.add(beacon);const glow=mesh(beacon,new T.SphereGeometry(.23,12,8),0xffda72);glow.material=glow.material.clone();glow.material.emissive.setHex(0xffbd58);glow.material.emissiveIntensity=.6;beacon.userData.beacon=true;cube(beacon,0x206073,0,0,-.34,.52,.75,.06,.025);
  sign(g,'SPLASH HARBOR',0,.37,2.42,2.4,.32,'#12617b');
  const life=mesh(g,new T.TorusGeometry(.4,.11,8,24),0xfff1c9,1.25,1,1.95);for(let i=0;i<4;i++){const t=i*Math.PI/2;cube(g,0xef4860,1.25+Math.cos(t)*.4,1+Math.sin(t)*.4,2.03,.16,.16,.08,.025)}
 }else if(asset.kind==='garden-fountain'){
  cylinder(2.9,3.05,.27,0x346b64,.14);cylinder(2.65,2.65,.12,0x14b6ce,.36);ring(2.83,.15,0xffdda5,.4);
  cylinder(.52,.72,.48,0xeac78d,.57);cylinder(.28,.4,1.5,0xffe5b0,1.5);cylinder(1.1,.83,.25,0xe8bb7b,2.32);ring(1.08,.09,0xffe6b1,2.48);cylinder(.96,.96,.055,0x21b9d2,2.47);
  oval(g,0xffcf67,0,2.8,0,.16,.34,.16);
  for(let i=0;i<8;i++){const t=i*Math.PI/4;const curve=new T.QuadraticBezierCurve3(new T.Vector3(.4*Math.cos(t),2.52,.4*Math.sin(t)),new T.Vector3(1.5*Math.cos(t),3.25,1.5*Math.sin(t)),new T.Vector3(2.15*Math.cos(t),.47,2.15*Math.sin(t)));const jet=mesh(g,new T.TubeGeometry(curve,14,.03,5,false),0xa4f3ed);jet.material=jet.material.clone();jet.material.transparent=true;jet.material.opacity=.75;const drop=oval(g,0xd7ffff,0,0,0,.065,.065,.065);drop.userData.waterCurve=curve;drop.userData.phase=i/8;drop.position.copy(curve.getPoint(i/8))}
  for(let i=0;i<12;i++){const t=i*Math.PI/6;oval(g,0xffd67c,Math.cos(t)*2.85,.46,Math.sin(t)*2.85,.09,.08,.09)}
 }else if(asset.kind==='pergola'){
  for(const x of [-1.3,1.3])for(const z of [-.65,.65]){cube(g,0xf1d2a1,x,1.3,z,.17,2.6,.17,.04);cube(g,0xc79560,x,.15,z,.3,.3,.3,.04)}
  for(let i=-3;i<=3;i++)cube(g,0xe9ba7c,i*.47,2.72,0,.14,.18,2.1,.04);
  for(const z of [-.75,.75])cube(g,0x34685e,0,2.55,z,3.35,.22,.16,.04);
  for(let i=0;i<9;i++){const x=-1.3+i*.32;oval(g,0x208451,x,2.85,0,.3,.15,.5);if(i%2===0)oval(g,[0xec5891,0xffd26c][i%3?0:1],x,3.02,0,.11,.08,.11)}
  for(const x of [-.8,0,.8]){rod(g,0x34685e,[x,2.55,0],[x,2.05,0],.02);oval(g,0xffd37e,x,1.9,0,.16,.24,.16);cube(g,0xe58b44,x,2.14,0,.23,.07,.23,.025)}
  cube(g,0x34685e,0,.61,0,2.1,.18,.7,.05);for(const x of [-.75,.75])cube(g,0xe9ba7c,x,.29,0,.12,.55,.52,.03);
 }else if(asset.kind==='harbor-dock'){
  cube(g,0x945a3e,0,.17,0,2.9,.25,1.7,.04);for(let i=0;i<8;i++)cube(g,i%2?0xd9ac70:0xe6bc80,-1.25+i*.36,.34,0,.33,.1,1.75,.025);
  for(const x of [-1.3,1.3]){for(const z of [-.7,.7]){rod(g,0x8c593e,[x,0,z],[x,1.05,z],.095);oval(g,0xf3d39b,x,1.08,z,.12,.08,.12)}const rope=new T.QuadraticBezierCurve3(new T.Vector3(x,.93,-.7),new T.Vector3(x,.64,0),new T.Vector3(x,.93,.7));mesh(g,new T.TubeGeometry(rope,12,.035,6,false),0xf2dcad)}
  const float=mesh(g,new T.TorusGeometry(.32,.09,8,24),0xee506b,0,.94,.91);rod(g,0x8c593e,[-.6,.42,.7],[-.6,1.8,.7],.04);sign(g,'AHOY!',-.6,1.6,.75,1,.35,'#12617b');
 }else if(asset.kind==='flowerbed'){
  cube(g,0x34685e,0,.22,0,2.5,.44,1,.075);cube(g,0x284e40,0,.46,0,2.28,.06,.85,.025);for(let i=0;i<9;i++){const x=-1+i*.25,z=i%2?.2:-.2;rod(g,0x27844d,[x,.49,z],[x,.86,z],.02);for(let j=0;j<5;j++)oval(g,[0xf65d8b,0xffd15b,0xa98ae8][i%3],x+Math.cos(j*1.26)*.11,.9,z+Math.sin(j*1.26)*.11,.09,.055,.09);oval(g,0xffdf74,x,.93,z,.05,.035,.05)}
 }else if(asset.kind==='district-sign'){
  for(const x of [-1.1,1.1])rod(g,0xc79560,[x,0,0],[x,2.1,0],.065);cube(g,color,0,1.65,0,2.7,.9,.15,.12);sign(g,asset.title,0,1.65,.09,2.45,.64);for(const x of [-1.12,1.12])oval(g,0xffd16a,x,2.2,0,.09,.09,.09);
 }else throw Error('Unknown district prop: '+asset.kind);
 return g;
}
