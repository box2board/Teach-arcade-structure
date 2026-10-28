import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
import {snowTree} from './details.js';
// Static Snow-specific scenery. All meshes are consumed by the existing instancer.
const rock=new THREE.IcosahedronGeometry(1,1);
export function detailLandscape({scene,mesh,sphere,box,cylinder,random,shadow}){
 // A single gently sculpted surface: the play plane remains flat and unobstructed.
 const geo=new THREE.PlaneGeometry(90,145,44,68);geo.rotateX(-Math.PI/2);geo.translate(0,0,-43);
 const p=geo.attributes.position,colors=[];const tint=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),edge=Math.max(0,Math.abs(x)-11.5),height=edge>0?.12+Math.sin(x*.31+z*.12)*.24+Math.cos(z*.27)*.19+Math.min(2,edge*.065):-.004;
 p.setY(i,height);const variation=(Math.sin(x*.7+z*.21)+Math.cos(x*.33-z*.49))*.012;tint.setRGB(.83+variation,.89+variation,.98+variation);colors.push(tint.r,tint.g,tint.b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1}));ground.userData.appearanceTerrain=true;scene.add(ground);
 for(const side of [-1,1])for(let i=0;i<16;i++){
 const z=-77+i*6.2,x=side*(14.6+random()*4),s=.8+random()*1.1;
 const b=mesh(rock,[0x7b8fa9,0x93a3b7,0x8b8b9f][i%3],x,s*.5,z,s,s*.9,s*.85);b.rotation.y=random()*6;
 mesh(sphere,0xf5faff,x,s*1.17,z,s*.94,s*.28,s*.8);
 // Small scallops break the snow/rock boundary rather than a floating flat lid.
 for(const a of [-.65,.1,.7])mesh(sphere,0xeef6ff,x+a*s,s*.95,z+s*.35,s*.35,s*.22,s*.35);
 }
 // The same snow-loaded spruce art is used in foreground and background.
 for(const side of [-1,1])for(let i=0;i<4;i++)snowTree({scene,mesh,sphere,cylinder,shadow,random},side*(19+i*.6),8+i*4,1.05+i*.06);
 // Cabin door approaches: shallow packed snow footprints off the battlefield.
 for(const side of [-1,1])for(let i=0;i<12;i++){const x=side*(16.5+i*.35),z=-18+i*.48;
 mesh(sphere,0xb2c9e1,x,.018,z,.16,.015,.3);mesh(sphere,0xb2c9e1,x+side*.4,.018,z+.45,.16,.015,.3);}
}
export function softContactTexture(){
 const n=32,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=(y*n+x)*4,r=Math.hypot((x+.5-n/2)/(n/2),(y+.5-n/2)/(n/2));data[k]=data[k+1]=data[k+2]=255;data[k+3]=Math.round(Math.pow(Math.max(0,1-r),1.6)*255);}
 const t=new THREE.DataTexture(data,n,n);t.needsUpdate=true;return t;
}
export function dressSupply(root,{mesh,box,sphere}){
 mesh(box,0x183652,0,2.65,1.25,2.35,.24,.12,root);
 const fill=mesh(box,0xffc36b,0,2.65,1.33,2.1,.11,.04,root);root.userData.targetBar=fill;
 for(const side of [-1,1])for(let i=0;i<4;i++)mesh(box,i%2?0xc58a4e:0xaa6b39,side*1.26,1, -.82+i*.55,.05,1.8,.48,root);
 for(let i=0;i<4;i++)mesh(box,i%2?0xd49a59:0xbd8045,-.93+i*.62,1,1.15,.57,1.8,.06,root);
 for(const side of [-1,1]){mesh(box,0x75472e,side*1.04,1,1.22,.18,2,.12,root);mesh(sphere,0x526477,side*1.04,1.68,1.3,.055,.055,.035,root);mesh(sphere,0x526477,side*1.04,.35,1.3,.055,.055,.035,root);}
 const brace=mesh(box,0xf2be77,0,1,1.24,2.2,.18,.1,root);brace.rotation.z=.56;
 for(let i=0;i<5;i++)mesh(sphere,0xf5faff,-1+i*.5,2.25+(i%2)*.06,0,.4,.18,.85,root);
}

export function updateSupplyStyle(crate){
 const fill=crate.g.userData.targetBar;if(!fill)return;
 const ratio=Math.max(0,Math.min(1,crate.hp/crate.max));fill.scale.x=2.1*Math.max(.001,ratio);fill.position.x=-1.05+1.05*ratio;
}
