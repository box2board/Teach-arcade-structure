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
