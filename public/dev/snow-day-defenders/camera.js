import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';

// Frame the actual play area, preserving both lane edges and distant spawns.
// A portrait screen needs more distance; wide screens can move closer.
export function fitSnowCamera(camera,width,height){
 const aspect=Math.max(1,width)/Math.max(1,height);
 camera.aspect=aspect;camera.fov=43;
 const target=new THREE.Vector3(0,0,0);
 const forward=new THREE.Vector3(0,-Math.sin(Math.PI*25/180),-Math.cos(Math.PI*25/180)).normalize();
 const right=new THREE.Vector3(1,0,0),up=new THREE.Vector3().crossVectors(right,forward);
 const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanX=tanY*aspect;
 let distance=0;
 for(const z of [-33,10])for(const x of [-7,7])for(const y of [0,3.8]){
  const offset=new THREE.Vector3(x,y,z).sub(target),depth=offset.dot(forward);
  distance=Math.max(distance,Math.abs(offset.dot(right))/(tanX*.9)-depth,Math.abs(offset.dot(up))/(tanY*.9)-depth);
 }
 camera.position.copy(target).addScaledVector(forward,-distance);
 camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
