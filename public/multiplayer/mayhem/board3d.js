import {boardPoint, boardMoving} from './board-motion.js';
import {createRewardArt,createLandingEffect} from '../lib/reward-art.js';
import {poseCharacter} from '../lib/character-pose.js';
import {placeScenery} from '../lib/scenery-placement.js';
import {buildDistrictArt,createPavingTexture,districtArtManifests,districtPavingStyles} from '../lib/festival-art.js';
import {batchStaticScene} from '../lib/static-batches.js';
import * as T from '../../mini-games/vendor/three.module.js';import{mesh,box,sphere,tree,fox,ferris,tent}from '../lib/three-assets.js';
import {ticketToken,balloons,bunting,flowerPlanter} from '../lib/midway-art.js';
import {texture,label} from '../lib/three-polish.js';
import {islandGeometry,bench} from '../lib/carnival-art.js';
import {boards,characters,dice} from '../lib/catalog.js';
import {avatar,disposeAvatar} from '../lib/avatar-models.js';
export function mount(canvas,getState,serverNow){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));
 renderer.setClearColor(0x73c9f4);
 const scene=new T.Scene();
 const camera=new T.PerspectiveCamera(42,1,.1,250);
 scene.add(new T.HemisphereLight(0xe4faff,0x67815c,2.05));
 const sun=new T.DirectionalLight(0xffeccb,3);
 sun.position.set(-14,28,18);
 scene.add(sun);
const water=mesh(scene,new T.PlaneGeometry(150,150),0x009ed0,0,-.7,0);water.rotation.x=-Math.PI/2;water.receiveShadow=false;
const board=boards[0];const nodes=board.create();const points=nodes.map(n=>({...n,x:(n.x-1200)/30,z:(n.y-900)/30}));
const districts=board.districts.map(d=>({x:(d.x-1200)/30,z:(d.y-900)/30}));
const scenery=[];
function decorate(build){return placeScenery({scene,points,districts,scenery,build})}
const grassTexture=texture('grass'),pathTexture=texture('path'),districtPaving=districtPavingStyles.map(style=>createPavingTexture(style));
const rewardArt=createRewardArt();
const palettes=[0x3bc535,0x64cc24,0x13b67e,0x87cf21];
for(let k=0;k<4;k++){const d=districts[k];if(k>=0){mesh(scene,islandGeometry(18,3.5),0xb5906e,d.x,-1.35,d.z);mesh(scene,islandGeometry(18.3,.35),0xf1d49a,d.x,.25,d.z);const top=mesh(scene,islandGeometry(17.6,.3),palettes[k],d.x,.5,d.z);top.material.map=grassTexture;const trim=mesh(scene,islandGeometry(17.85,.12),[0xf1d49a,0xe2be82,0xd5eee0,0xb1ce87][k],d.x,.39,d.z);}else{mesh(scene,new T.CylinderGeometry(17.5,16,3.5,12),0xbc9670,d.x,-1.35,d.z).scale.z=.77;mesh(scene,new T.CylinderGeometry(17.5,17.5,.35,12),palettes[k],d.x,.48,d.z).scale.z=.77;}for(let j=0;j<9;j++){const a=j/9*Math.PI*2;decorate(()=>tree(scene,d.x+15.5*Math.cos(a),d.z+11.6*Math.sin(a)))}for(let j=0;j<7;j++){const a=j*.9;decorate(()=>{const rock=mesh(scene,new T.DodecahedronGeometry(.7),0xb8b3a0,d.x+17*Math.cos(a),-.1,d.z+13*Math.sin(a));rock.scale.y=1.4})}}
for(const p of points){for(const id of p.next){const b=points[id],dx=b.x-p.x,dz=b.z-p.z,length=Math.hypot(dx,dz);const bridge=p.bridge||id>=64;const path=box(scene,bridge?0xb7804b:0xf0daab,(p.x+b.x)/2,.72,(p.z+b.z)/2,length+.15,.22,1.65);path.rotation.y=-Math.atan2(dz,dx);if(!bridge&&p.district===b.district){path.material.map=districtPaving[p.district];path.material.roughness=.7;for(const side of [-1,1]){const curb=box(scene,0xf6dfa9,(p.x+b.x)/2-dz/length*side*.88,.81,(p.z+b.z)/2+dx/length*side*.88,length+.13,.1,.12);curb.rotation.y=path.rotation.y}}if(bridge){for(let t=0;t<length;t+=.55){const x=p.x+dx*t/length,z=p.z+dz*t/length;const plank=box(scene,0xd4a36c,x,.89,z,.45,.1,1.8);plank.rotation.y=-Math.atan2(dz,dx)}for(const side of [-1,1]){const rail=box(scene,0xaa7849,(p.x+b.x)/2-dz/length*side,.72+1,(p.z+b.z)/2+dx/length*side,length,.14,.14);rail.rotation.y=-Math.atan2(dz,dx)}}}rewardArt.space(scene,p);if(p.type==='ticket')ticketToken(scene,p.x,1.65,p.z);if(p.next.length>1){decorate(()=>{box(scene,0x946b44,p.x,1.7,p.z+1.2,.13,1.7,.13);box(scene,0xffd25d,p.x,2.4,p.z+1.2,1.5,.42,.15)})}}
let wheel;decorate(()=>{const carnival=districts[0];wheel=ferris(scene);wheel.parent.position.x=carnival.x+8;wheel.parent.position.z=carnival.z+5;});buildDistrictArt({scene,center:districts[0],decorate});decorate(()=>bench(scene,districts[0].x-5,districts[0].z-4));decorate(()=>bench(scene,districts[0].x+5,districts[0].z-4));
for(const manifest of districtArtManifests.slice(1))buildDistrictArt({scene,center:districts[manifest.district],decorate,manifest});
for(const d of districts){for(let j=0;j<5;j++){const x=d.x-6+j*3,z=d.z+6;decorate(()=>{box(scene,0x996d4b,x,1.2,z,.1,1.5,.1);mesh(scene,new T.ConeGeometry(.4,.8,4),j%2?0xf75c82:0xffce42,x,2.2,z);for(let n=0;n<3;n++)sphere(scene,[0xf568aa,0xffda5a,0x9976df][n],x+.25*n,.9,z+.6,.16)})}}
for(let i=0;i<districts.length;i++){const d=districts[i];decorate(()=>balloons(scene,d.x-7,d.z+1,[0xff3574,0x8053ff,0x00c7d8,0xf72da4][i]));decorate(()=>bunting(scene,d.x,d.z-5));}
scene.traverse(m=>{if(!m.isMesh)return;if(m.geometry.type==='CylinderGeometry'&&m.geometry.parameters.radiusTop===17.5&&m.geometry.parameters.height===.35){m.material.map=grassTexture;m.material.needsUpdate=true}if(m.geometry.type==='BoxGeometry'&&m.material.color.getHex()===0xf0daab&&!m.material.map){m.material.map=pathTexture;m.material.needsUpdate=true}});
const districtLabels=[];for(let i=0;i<districts.length;i++){const d=districts[i],name=label(board.districts[i].name);name.position.set(d.x,10.5,d.z);scene.add(name);districtLabels.push(name)}
const ripples=[];for(let i=0;i<18;i++){const r=new T.Mesh(new T.RingGeometry(1.4,1.45,40),new T.MeshBasicMaterial({color:0xc5f8f1,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false}));r.rotation.x=-Math.PI/2;r.position.set(-43+(i*17)%86,-.67,-33+(i*29)%66);scene.add(r);ripples.push(r)}
const animatedDetails=[];scene.traverse(o=>{if(o.userData.waterCurve||o.userData.beacon||o.userData.cable)animatedDetails.push(o)});
const staticBatchStats=batchStaticScene(scene,{exclude:[wheel]});

 const models=[];
 let lastTeamState='', lastAt=0, cameraReady=false;
 const cameraFocus=new T.Vector3(),cameraGoal=new T.Vector3(),cameraTarget=new T.Vector3();
 canvas.hidden=false;
 function render(now){
  requestAnimationFrame(render);
  if(canvas.hidden||!canvas.clientWidth||document.hidden)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const state=getState(),teams=state?.teams??[];
  const key=teams.map(t=>t.character+':'+t.position).join('|');
  if(key!==lastTeamState){
   lastTeamState=key;
   teams.forEach((t,i)=>{
    if(!models[i]){models[i]=avatar(t.character);scene.add(models[i]);}
    const p=points[t.position],overlap=teams.slice(0,i).filter(o=>o.position===t.position).length;
    models[i].userData.goal=new T.Vector3(p.x+overlap*1.6,1.1,p.z);
    if(!models[i].userData.placed){models[i].position.copy(models[i].userData.goal);models[i].userData.placed=true;}
   });
  }
  const dt=Math.min(.05,(now-lastAt)/1000);lastAt=now;
  const time=serverNow();
  for(const [i,model] of models.entries()){
   const team=teams[i];
   const walking=boardMoving(team.movement,time);
   const point=boardPoint(nodes,team.position,team.movement,time);
   const offset=walking?0:model.userData.goal.x-points[team.position].x;
   const x=(point.x-1200)/30+offset, z=(point.y-900)/30;
   if(walking&&Math.hypot(x-model.position.x,z-model.position.z)>.01)model.rotation.y=Math.atan2(x-model.position.x,z-model.position.z);
   if(team.movement)model.position.set(x,1.1,z);
   else model.position.lerp(model.userData.goal,Math.min(1,dt*5));
   poseCharacter(model,{time:now/1000,walking});
  }
  const focusIndex=state?.turn>=0?state.turn:state?.player?.team;
  const activePoint=models[focusIndex]?.position;
  const focused=Boolean(activePoint);
  cameraTarget.set(activePoint?.x??0,0,activePoint?.z??0);
  if(!cameraReady){cameraFocus.copy(cameraTarget);camera.position.set(cameraFocus.x,cameraFocus.y+(focused?22:60),cameraFocus.z+(focused?16:46));cameraReady=true;}
  cameraFocus.lerp(cameraTarget,Math.min(1,dt*3.2));
  cameraGoal.set(cameraFocus.x,cameraFocus.y+(focused?22:60),cameraFocus.z+(focused?16:46));
  camera.position.lerp(cameraGoal,Math.min(1,dt*2.5));
  camera.lookAt(cameraFocus);
  renderer.render(scene,camera);
 }
 requestAnimationFrame(render);
 return true;
}
