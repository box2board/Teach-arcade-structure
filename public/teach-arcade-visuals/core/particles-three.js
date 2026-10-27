import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
let dotTexture;
function softDot(){
 if(dotTexture)return dotTexture;
 const size=16,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[k]=data[k+1]=data[k+2]=255;data[k+3]=Math.round(Math.max(0,Math.min(1,(1-r)*4))*255);}
 dotTexture=new THREE.DataTexture(data,size,size);dotTexture.needsUpdate=true;return dotTexture;
}
// One preallocated point cloud per pool: no per-impact geometry/material allocation.
export function createParticlePool(scene,random,capacity=280){
 const positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),life=new Float32Array(capacity),vel=new Float32Array(capacity*3);
 positions.fill(9999);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const material=new THREE.PointsMaterial({size:.26,map:softDot(),vertexColors:true,transparent:true,opacity:.88,depthWrite:false});
 const points=new THREE.Points(geo,material);points.frustumCulled=false;scene.add(points);let limit=160,cursor=0;
 function clear(){life.fill(0);positions.fill(9999);geo.attributes.position.needsUpdate=true;}
 return {points,setLimit(n){limit=Math.max(0,Math.min(capacity,Math.floor(n)));clear();},clear,
  burst(x,y,z,color=0xffffff,count=12){const c=new THREE.Color(color);for(let n=0;n<Math.min(count,limit);n++){const i=cursor++%limit,k=i*3;life[i]=.5+random()*.35;positions[k]=x;positions[k+1]=y;positions[k+2]=z;vel[k]=(random()-.5)*9;vel[k+1]=2+random()*6;vel[k+2]=(random()-.5)*8;colors[k]=c.r;colors[k+1]=c.g;colors[k+2]=c.b;}geo.attributes.color.needsUpdate=true;geo.attributes.position.needsUpdate=true;},
  update(dt){for(let i=0;i<limit;i++){if(life[i]<=0)continue;life[i]-=dt;const k=i*3;if(life[i]<=0){positions[k+1]=9999;continue;}vel[k+1]-=dt*15;for(let a=0;a<3;a++)positions[k+a]+=vel[k+a]*dt;}geo.attributes.position.needsUpdate=true;},
  active:()=>life.reduce((n,v)=>n+(v>0),0),dispose(){scene.remove(points);geo.dispose();material.dispose();}
 };
}
export function createWeather(scene,random){
 const layers=[];
 for(let l=0;l<3;l++){const p=new Float32Array(360*3);for(let i=0;i<360;i++){p[i*3]=(random()-.5)*70;p[i*3+1]=random()*28;p[i*3+2]=-80+random()*108;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));const material=new THREE.PointsMaterial({color:0xffffff,map:softDot(),size:[.10,.19,.3][l],transparent:true,opacity:[.6,.65,.42][l],depthWrite:false});const points=new THREE.Points(geo,material);points.frustumCulled=false;scene.add(points);layers.push({p,geo,points});}
 let count=180,visibleLayers=2;
 return {configure(n,l){count=Math.min(360,n);visibleLayers=l;layers.forEach((a,i)=>{a.points.visible=i<l;a.geo.setDrawRange(0,Math.ceil(count/Math.max(1,l)));});},
 update(dt,time,wind=1){for(let l=0;l<visibleLayers;l++){const a=layers[l];for(let i=0;i<Math.ceil(count/visibleLayers);i++){const k=i*3;a.p[k]+=dt*(.45+Math.sin(time*.45)*.65)*wind*(l+1);a.p[k+1]-=dt*(1.2+l*.7);if(a.p[k+1]<0)a.p[k+1]=28;if(a.p[k]>35)a.p[k]=-35;}a.geo.attributes.position.needsUpdate=true;}},
 dispose(){for(const a of layers){scene.remove(a.points);a.geo.dispose();a.points.material.dispose();}}
 };
}
