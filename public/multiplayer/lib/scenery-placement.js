import * as T from '../../mini-games/vendor/three.module.js';
import {clearOfPaths} from './path-clearance.js';
// Reserve the animation envelope as well as the initial pose. Current cable cars
// move +/-1.5 local world units on x; fountain jets already contain their arcs.
export function sceneryBounds(group){const bounds=new T.Box3().setFromObject(group);group.traverse(o=>{if(o.userData.cable){const sweep=new T.Box3().setFromObject(o);sweep.min.x-=1.5;sweep.max.x+=1.5;bounds.union(sweep)}});return bounds}
export function placeScenery({scene,points,districts,scenery,build}){
 const before=scene.children.length;build();const children=scene.children.slice(before),group=new T.Group();children.forEach(o=>group.add(o));scene.add(group);scene.updateMatrixWorld(true);const bounds=sceneryBounds(group);
 for(let radius=0;radius<=12;radius+=.5)for(let j=0;j<(radius?48:1);j++){
  const angle=j/48*Math.PI*2,dx=radius*Math.cos(angle),dz=radius*Math.sin(angle);
  const footprint={minX:bounds.min.x+dx,maxX:bounds.max.x+dx,minZ:bounds.min.z+dz,maxZ:bounds.max.z+dz};
  const onLand=districts.some(d=>[footprint.minX,footprint.maxX].every(x=>[footprint.minZ,footprint.maxZ].every(z=>((x-d.x)/18.5)**2+((z-d.z)/14.2)**2<1)));
  const overlaps=scenery.some(g=>{const b=g.userData.footprint;return footprint.minX<b.maxX+.15&&footprint.maxX>b.minX-.15&&footprint.minZ<b.maxZ+.15&&footprint.maxZ>b.minZ-.15});
  if(onLand&&!overlaps&&clearOfPaths(bounds,points,dx,dz)){group.position.set(dx,0,dz);group.userData.footprint=footprint;scenery.push(group);return group}
 }
 scene.remove(group);return null;
}
