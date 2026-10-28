import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
// Reusable geometry within this Snow art theme, not a new framework API.
function boughGeometry(){
 const positions=[],indices=[],n=16,radii=[1,.92,.51,.025],heights=[0,.14,.48,.85];
 for(let ring=0;ring<4;ring++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=radii[ring]*(i%2?.78:1);positions.push(Math.cos(a)*r,heights[ring]-(ring===0&&i%2===0?.16:0),Math.sin(a)*r);}
 for(let ring=0;ring<3;ring++)for(let i=0;i<n;i++){const a=ring*n+i,b=ring*n+(i+1)%n;indices.push(a,a+n,b,b,a+n,b+n);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const bough=boughGeometry(),twig=new THREE.CylinderGeometry(.025,.04,1,5);
export function snowTree({scene,mesh,sphere,cylinder,shadow,random},x,z,scale){
 const root=new THREE.Group();root.position.set(x,0,z);root.scale.setScalar(scale);scene.add(root);shadow(root,2.3);
 mesh(cylinder,0x74523b,0,1.25,0,.23,2.5,.23,root);
 for(let tier=0;tier<4;tier++){
 const width=2.25-tier*.43,y=1.1+tier*1.1,turn=tier*.71+random()*.18;
 const leaf=mesh(bough,tier%2?0x28777a:0x1c5966,0,y,0,width,1.65,width,root);leaf.rotation.y=turn;
 // Smaller raised caps expose irregular drooping evergreen tips underneath.
 const cap=mesh(bough,tier%2?0xf5faff:0xe5f1ff,.04,y+.43,-.04,width*.86,1.28,width*.86,root);cap.rotation.y=turn+.04;
 for(let i=0;i<3;i++){const a=turn+i/3*Math.PI*2,r=width*.62;const clump=mesh(sphere,0xf5faff,Math.cos(a)*r,y+.55,Math.sin(a)*r,width*.28,.17,width*.34,root);clump.rotation.y=-a;}
 }
 for(const side of [-1,1]){const branch=mesh(twig,0x74523b,side*.35,.9,0,1,.9,1,root);branch.rotation.z=side*.8;}
 root.userData.snowTree=true;return root;
}
const shape=new THREE.Shape();shape.moveTo(-.58,.6);shape.lineTo(0,.79);shape.lineTo(.58,.6);shape.lineTo(.53,-.3);shape.lineTo(0,-.78);shape.lineTo(-.53,-.3);shape.closePath();
const ice=new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1});
const outline=new THREE.BufferGeometry().setFromPoints(shape.getPoints().map(v=>new THREE.Vector3(v.x,v.y,.13)));
const glass=new THREE.MeshStandardMaterial({color:0x9ce5f5,roughness:.26,metalness:.08,transparent:true,opacity:.68,depthWrite:false,emissive:0x246b88,emissiveIntensity:.2});
const rim=new THREE.LineBasicMaterial({color:0xe3fcff,transparent:true,opacity:.95});
function lines(coords){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords.flatMap(([x,y])=>[x,y,.15]),3));return g;}
const glint=lines([[-.4,.34],[-.33,.51],[-.32,.33],[-.25,.5],[.35,-.05],[.29,-.27]]);
const crackA=lines([[.2,.58],[.03,.21],[.03,.21],[.21,.05],[.03,.21],[-.13,.02],[-.13,.02],[-.02,-.23]]);
const crackB=lines([[-.48,.14],[-.12,-.06],[-.12,-.06],[.2,-.21],[.2,-.21],[.36,-.4],[-.12,-.06],[-.23,-.45],[-.23,-.45],[-.08,-.65]]);
export function dressIceShield(enemy){
 const shield=enemy.shieldVisual;if(!shield||shield.userData.iceArt)return;
 // Retain the same object referenced/removed by the gameplay feature.
 shield.geometry=ice;shield.material=glass;shield.scale.set(1.12,1.12,1);shield.position.set(0,1.1,.7);
 shield.add(new THREE.LineLoop(outline,rim));shield.add(new THREE.LineSegments(glint,rim));
 const cracks=[new THREE.LineSegments(crackA,rim),new THREE.LineSegments(crackB,rim)];
 for(const crack of cracks){crack.visible=false;shield.add(crack);}shield.userData.iceArt=true;shield.userData.cracks=cracks;updateIceShield(enemy);
}
export function updateIceShield(enemy){
 const cracks=enemy.shieldVisual?.userData.cracks;if(!cracks)return;
 cracks[0].visible=enemy.shield>0&&enemy.shield<=3;cracks[1].visible=enemy.shield>0&&enemy.shield<=1;
}

const warningRing=new THREE.TorusGeometry(1,.085,5,28);warningRing.rotateX(-Math.PI/2);
const orange=new THREE.MeshBasicMaterial({color:0xffa43c});
const shotMaterial=new THREE.MeshStandardMaterial({color:0xf17b3d,emissive:0x9a3213,emissiveIntensity:.25,roughness:.6});
const frostWhite=new THREE.MeshBasicMaterial({color:0xeaffff});
const coreGeo=new THREE.SphereGeometry(.5,8,5), badgeGeo=new THREE.CylinderGeometry(.55,.55,.14,12);badgeGeo.rotateX(Math.PI/2);
const iconGeometries=new Map(),badgeMaterials=new Map();
function iconGeometry(color){
 if(iconGeometries.has(color))return iconGeometries.get(color);
 const s=new THREE.Shape();
 const paths={
  0x44b98c:[[-.34,.16],[-.22,.3],[0,.17],[.22,.3],[.34,.16],[.28,-.05],[0,-.32],[-.28,-.05]],
  0xffbd3f:[[.08,.36],[-.27,-.04],[-.04,-.04],[-.12,-.37],[.28,.1],[.05,.1]],
  0xae75da:[[-.32,.25],[-.04,.08],[-.32,-.15],[-.22,-.25],[.09,.03],[.26,-.25],[.35,-.15],[.08,.25]],
  0xd689d7:[[0,.35],[.3,0],[0,-.35],[-.3,0]]
 };
 const points=paths[color];s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();
 const g=new THREE.ShapeGeometry(s);g.translate(0,0,.09);iconGeometries.set(color,g);return g;
}
export function dressFeatureObject(object,color,isMarker=false){
 if(color===0xeab049){object.geometry=warningRing;object.material=orange;object.position.y=.055;object.userData.artKind='attack-warning';
 const dot=new THREE.Mesh(coreGeo,orange);dot.scale.set(.19,1,.19);object.add(dot);
 }else if(color===0xf09161){object.material=shotMaterial;const core=new THREE.Mesh(coreGeo,frostWhite);core.position.set(-.2,.2,.38);object.add(core);object.userData.artKind='enemy-snowball';
 }else if(isMarker&&[0x44b98c,0xffbd3f,0xae75da,0xd689d7].includes(color)){
 if(!badgeMaterials.has(color))badgeMaterials.set(color,new THREE.MeshStandardMaterial({color,roughness:.65}));
 object.geometry=badgeGeo;object.material=badgeMaterials.get(color);object.scale.set(.85,.85,.85);object.position.y=3.15;
 object.add(new THREE.Mesh(iconGeometry(color),frostWhite));object.userData.artKind='feature-badge';
 }
 return object;
}
