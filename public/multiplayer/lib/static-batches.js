import * as T from '../../mini-games/vendor/three.module.js';

// Consolidate opaque, stationary decorations only. Animation roots and their
// descendants retain their original objects, materials, and transforms.
export function batchStaticScene(scene,{exclude=[]}={}) {
 scene.updateMatrixWorld(true);
 const excluded=new Set(exclude.filter(Boolean)),groups=new Map(),materialJSON={textures:{},images:{}};let before=0;
 scene.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
  before++;
  for(let p=o;p;p=p.parent)if(!p.visible||excluded.has(p)||p.userData.ticket||p.userData.waterCurve||p.userData.beacon||p.userData.cable)return;
  const m=o.material,g=o.geometry;
  if(!m.isMeshStandardMaterial||m.transparent||m.opacity!==1||o.matrixWorld.determinant()<=0)return;
  const attributes=Object.keys(g.attributes).sort();
  if(attributes.join(',')!=='normal,position,uv'||attributes.some(k=>g.attributes[k].isInterleavedBufferAttribute||g.attributes[k].normalized))return;
  const json=m.toJSON(materialJSON);delete json.uuid;delete json.metadata;
  // Spatial cells retain useful culling in follow view.
  const pos=new T.Vector3().setFromMatrixPosition(o.matrixWorld);
  const key=JSON.stringify([json,o.castShadow,o.receiveShadow,o.renderOrder,Math.floor(pos.x/20),Math.floor(pos.z/20)]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 });
 let removed=0,batches=0;
 const retiredGeometry=new Set(),retiredMaterial=new Set();
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const geometry=new T.BufferGeometry(),transformed=meshes.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
  let vertexCount=0,indexCount=0;
  for(const g of transformed){vertexCount+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count}
  for(const name of ['position','normal','uv']){
   const size=transformed[0].attributes[name].itemSize,values=new Float32Array(vertexCount*size);let offset=0;
   for(const g of transformed){values.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length}
   geometry.setAttribute(name,new T.BufferAttribute(values,size));
  }
  const indices=new (vertexCount>65535?Uint32Array:Uint16Array)(indexCount);let offset=0,base=0;
  for(const g of transformed){const count=g.index?g.index.count:g.attributes.position.count;for(let i=0;i<count;i++)indices[offset++]=base+(g.index?g.index.getX(i):i);base+=g.attributes.position.count;g.dispose()}
  geometry.setIndex(new T.BufferAttribute(indices,1));geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const first=meshes[0],batch=new T.Mesh(geometry,first.material);batch.name='Static carnival batch';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;scene.add(batch);
  for(const o of meshes){o.removeFromParent();retiredGeometry.add(o.geometry);retiredMaterial.add(o.material)}
  removed+=meshes.length;batches++;
 }
 // Dispose only resources no longer referenced anywhere in the scene.
 scene.traverse(o=>{if(o.isMesh){retiredGeometry.delete(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])retiredMaterial.delete(m)}});
 retiredGeometry.forEach(g=>g.dispose());retiredMaterial.forEach(m=>m.dispose());
 return {before,after:before-removed+batches,batchedMeshes:removed,batches};
}
