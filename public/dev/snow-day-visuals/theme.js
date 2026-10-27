import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
import {detailLandscape} from './landscape.js';
// Snow-specific art composition. Shared modules never know about forts or snowmen.
export function buildVillage({scene,mesh,box,sphere,cone,cylinder,shadow,random}){
 scene.background=new THREE.Color(0xbadcee);scene.fog=new THREE.Fog(0xbadcee,72,158);
 mesh(box,0xc8e0ef,0,-.65,-45,180,1,220);
 detailLandscape({scene,mesh,sphere,box,cylinder,random});
 // Rounded, irregular snowbanks frame the playable corridor without changing its width.
 for(const side of [-1,1])for(let z=-105;z<25;z+=4.2){const x=side*(12.8+random()*.5);mesh(sphere,0x9dbfdc,x,-.05,z,2.8,.95,3.6);mesh(sphere,0xf3f9ff,x,.18,z,2.5,.9,3.3);}
 // Sparse packed snow marks: no dark lane stripes competing with enemies.
 for(let i=0;i<40;i++){const z=-95+random()*114,x=(random()-.5)*20;const m=mesh(sphere,i%3?0xe1edf7:0xcbdfee,x,.012,z,.13+random()*.3,.012,.3+random()*.55);m.rotation.y=random()*3;}
 function pine(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);shadow(g,2);mesh(cylinder,0x725c57,0,1,0,.22,2,.22,g);for(let j=0;j<3;j++){mesh(cone,j%2?0x327d86:0x246675,0,2.1+j*1.25,0,2.1-j*.44,2.9,2.1-j*.44,g);mesh(cone,0xf5faff,0,2.65+j*1.25,0,1.78-j*.38,2.1,1.78-j*.38,g);}}
 for(let i=0;i<36;i++)pine((i%2?1:-1)*(18+random()*13),-108+i*3.7,.8+random()*.65);
 // Faceted alpine ridges and cool foothills behind the village.
 for(let i=0;i<9;i++){const x=(i-4)*13,z=-116-random()*12,h=19+random()*17;mesh(cone,0x7fa6c4,x,h*.45-2,z,17,h,13);mesh(cone,0xe6f3ff,x,h*.72,z,8,h*.45,6);}
 function cabin(x,z,color,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);shadow(g,4.5);
 mesh(box,color,0,2.1,0,6.5,4.2,5.2,g);for(const y of [.4,1.2,2,2.8,3.6])mesh(box,0x956b60,0,y,2.63,6.5,.08,.06,g);
 // Two sloped snow-covered roof planes.
 for(const side of [-1,1]){const roof=mesh(box,0xfafcff,side*1.85,4.7,0,4.3,.38,6.2,g);roof.rotation.z=-side*.5;const edge=mesh(box,0x42657b,side*3.7,3.75,0,.2,.3,6.2,g);}
 mesh(box,0x725e62,1.6,5.5,-1,.8,2,.8,g);mesh(box,0xffffff,1.6,6.55,-1,1,.2,1,g);
 for(const a of [-2,2]){mesh(box,0x31566d,a,2.3,2.68,1.3,1.6,.12,g);mesh(box,0xffd38a,a,2.3,2.76,1.02,1.25,.04,g);mesh(box,0x97685b,a,2.3,2.81,.08,1.3,.03,g);mesh(box,0x97685b,a,2.3,2.81,1.1,.08,.03,g);mesh(box,0xffffff,a,1.47,2.82,1.6,.2,.45,g);}
 mesh(box,0x265f72,0,1.25,2.72,1.25,2.5,.1,g);mesh(sphere,0xffce76,.4,1.3,2.8,.075,.075,.05,g);mesh(box,0xe6f4ff,0,.08,3.2,2.3,.22,1.2,g);
 for(const side of [-1,1]){for(let j=0;j<7;j++)mesh(sphere,0xf5faff,side*3.55,3.95,-2.7+j*.9,.37,.19,.5,g);mesh(box,0x624734,side*3.08,2.15,2.75,.24,4.3,.24,g);}
 for(let j=0;j<4;j++){const log=mesh(cylinder,0x865b39,-2.5+j*.5,.3,3.65,.2,.8,.2,g);log.rotation.x=Math.PI/2;mesh(cylinder,0xc59963,-2.5+j*.5,.3,4.06,.16,.02,.16,g).rotation.x=Math.PI/2;}
 mesh(box,0x8c6342,0,.05,3.25,2.6,.25,1.25,g);mesh(box,0xd7e7f5,0,.2,3.2,2.7,.15,1.25,g);

 }
 for(const [x,z,c,s] of [[-22,-65,0xc18877,1.3],[23,-81,0xc1a2b1,1],[-21,-22,0xc08e71,1.2],[22,-39,0x79a8b6,1.3],[-27,9,0xa3bba7,1],[26,4,0xd2a28d,1]])cabin(x,z,c,s);
 // Timber fence, warm lanterns and short pennant lines create foreground depth.
 const flags=[];
 for(const side of [-1,1]){
 for(let z=-82;z<22;z+=5){mesh(box,0x8b6241,side*15,1.05,z,.22,2.1,.22);mesh(sphere,0xf7fcff,side*15,2.1,z,.28,.12,.28);for(const y of [.65,1.45])mesh(box,0xa47b53,side*15,y,z+2.4,.15,.16,4.9);}
 for(const z of [-65,-33,0,19]){mesh(cylinder,0x35536d,side*15.3,2.8,z,.14,5.6,.14);mesh(box,0x264c67,side*15.3,5.5,z,.9,1.2,.9);mesh(box,0xffdc91,side*15.3,5.5,z+.47,.57,.8,.04);mesh(cone,0xf5fbff,side*15.3,6.3,z,.8,.7,.8);}
 const g=new THREE.Group();scene.add(g);g.position.set(side*13.6,5.8,-8);mesh(box,0x537b91,0,.1,0,.07,.07,15,g);for(let i=0;i<9;i++){const f=mesh(cone,[0xef7d53,0xf7c75a,0x53aeb6][i%3],0,-.3,-6+i*1.5,.27,.7,.08,g);f.rotation.z=Math.PI;flags.push(f);}g.userData.dynamicVisual=true;
 }
 // Pond off the play plane: geometry only, no reflections or expensive pass.
 mesh(sphere,0x8ebdd7,-22,.025,-1,5,.04,7);mesh(sphere,0xb9ddea,-22,.04,-1,4,.025,6);
 return {update(time,reduced){if(!reduced)for(let i=0;i<flags.length;i++)flags[i].rotation.x=Math.sin(time*2+i*.5)*.14;}};
}
const blockShape=new THREE.Shape();blockShape.moveTo(-.38,-.38);blockShape.lineTo(.38,-.38);blockShape.lineTo(.38,.38);blockShape.lineTo(-.38,.38);blockShape.closePath();
const roundedBlock=new THREE.ExtrudeGeometry(blockShape,{depth:.76,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:3,steps:1});roundedBlock.translate(0,0,-.38);
export function buildFort({scene,mesh,box:flatBox,sphere,cone,cylinder}){
 const box=roundedBlock;
 const blocks=[];
 for(let i=0;i<10;i++){const g=new THREE.Group();scene.add(g);g.position.set((i-4.5)*2.2,0,21);for(let row=0;row<3;row++){mesh(box,row===0?0x9cc5de:0xc4dfef,0,.45+row*.65,0,2.12,.61,1.8,g);mesh(box,0xeff9ff,0,.76+row*.65,.04,2.12,.08,1.86,g);mesh(box,0xa9cfe4,(row%2?.55:-.55),.45+row*.65,.92,.035,.6,.02,g);}mesh(box,0xffffff,0,2.15,0,2.2,.27,1.95,g);if(i%2===0)mesh(box,0xe3f3ff,0,2.55,0,1.1,.65,1.7,g);for(let cap=0;cap<3;cap++)mesh(sphere,0xf5faff,-.7+cap*.7,2.28,0,.5,.16,.9,g);batchCharacter(g,'appearance-fort-'+i%2);blocks.push(g);}
 for(const side of [-1,1]){const x=side*11.8;mesh(cylinder,0xa5cce3,x,1.6,21,1.55,3.2,1.55);mesh(cylinder,0xeef9ff,x,3.2,21,1.7,.3,1.7);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;mesh(box,0xf5fbff,x+Math.cos(a)*1.3,3.65,21+Math.sin(a)*1.3,.7,.7,.7);}mesh(cylinder,0x4c768c,x,4.5,21,.06,3,.06);mesh(box,0xf28d55,x+side*.65,5.6,21,1.3,.8,.06);}
 return blocks;
}
export function dressDefender(g,{mesh,box,sphere}){
 // Accessories face the camera while the team aims up the field.
 mesh(box,0xe8f7ff,0,1.02,.32,.05,.65,.03,g);
 mesh(box,0x0d6388,0,1.78,.23,.64,.09,.14,g);
 for(const x of [-.12,.12]){mesh(sphere,0x203c55,x,1.56,.225,.047,.06,.04,g);mesh(sphere,0xffffff,x-.012,1.58,.253,.014,.018,.01,g);mesh(sphere,0xf69b85,x*1.5,1.42,.22,.065,.033,.025,g);}
 mesh(sphere,0xffd3ac,0,1.47,.27,.06,.05,.055,g);mesh(box,0x8b5d58,0,1.38,.22,.12,.025,.03,g);
 for(const x of [-.22,.22])mesh(box,0xeab86f,x,.12,.11,.32,.08,.42,g);
}
export function dressCreature(g,type,{mesh,box,sphere,cone}){
 const accent=type==='boss'?0x7799d9:type==='tank'?0x8b6cc4:type==='runner'?0x33a995:0xe47867;
 mesh(box,accent,.23,.84,.48,.18,.44,.1,g);
 for(const x of [-.15,.15]){mesh(sphere,0xffffff,x,1.47,.355,.115,.12,.035,g);mesh(sphere,0x24445d,x,1.46,.39,.054,.065,.025,g);mesh(sphere,0xffffff,x-.02,1.49,.41,.018,.02,.008,g);}
 for(const y of [.45,.65,.85])mesh(sphere,0x375e77,0,y,.5,.045,.045,.03,g);
 for(const x of [-.22,.22])mesh(sphere,0xf4b2ad,x,1.32,.32,.075,.04,.025,g);
 for(const x of [-.1,0,.1])mesh(sphere,0x375e77,x,1.18+Math.abs(x)*.3,.35,.025,.025,.02,g);
 if(type==='runner')for(const x of [-.2,.2])mesh(sphere,accent,x,2.05,0,.12,.35,.12,g);
 if(type==='boss'){for(const x of [-.36,0,.36])mesh(cone,0xb9eeff,x,2.55,0,.16,.65,.18,g);mesh(box,0x91d5ef,0,1.06,.45,1.05,.18,.1,g);}
}

// Cache one colored mesh per outfit/type. Accessories should not turn a crowd
// into thousands of draw calls. Arms and transparent blob shadows stay separate.
const characterGeometry=new Map();
const characterMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});
export function batchCharacter(root,key,movable=[]){
 const parts=root.children.filter(o=>o.isMesh&&o.material.isMeshStandardMaterial&&!movable.includes(o));
 let geometry=characterGeometry.get(key);
 if(!geometry){
  const positions=[],normals=[],colors=[];
  for(const part of parts){part.updateMatrix();const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();g.applyMatrix4(part.matrix);const p=g.attributes.position.array,n=g.attributes.normal.array,c=part.material.color;
   for(let i=0;i<p.length;i++)positions.push(p[i]);for(let i=0;i<n.length;i++)normals.push(n[i]);for(let i=0;i<p.length/3;i++)colors.push(c.r,c.g,c.b);g.dispose();}
  geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();characterGeometry.set(key,geometry);
 }
 for(const part of parts)root.remove(part);
 root.add(new THREE.Mesh(geometry,characterMaterial));
 return root;
}
