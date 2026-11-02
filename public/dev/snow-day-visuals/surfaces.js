import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';
export function groundHeight(x,z){const edge=Math.max(0,Math.abs(x)-11.5);return edge>0?.12+Math.sin(x*.31+z*.12)*.24+Math.cos(z*.27)*.19+Math.min(2,edge*.065):-.004;}
// A one-time soft directional shade texture for fixed scenery. No runtime shadow
// pass, readbacks, postprocessing or scene RNG consumption.
export function bakeGroundShade(scene,grain){
 const ground=scene.children.find(o=>o.userData.appearanceTerrain);if(!ground)return null;
 const casters=[];scene.traverse(o=>{const footprint=o.userData.sceneryShadow;if(!footprint&&!o.userData.snowTree)return;const scale=o.scale.x;casters.push({x:o.position.x,z:o.position.z,r:footprint?footprint.radius*scale:1.8*scale,length:(footprint?footprint.height:6)*scale*1.45});});
 const width=256,height=512,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const wx=(x+.5)/width*90-45,wz=29.5-(y+.5)/height*145;
 let shade=0;
 for(const c of casters){const dx=wx-c.x,dz=wz-c.z;if(Math.abs(dx)>c.length+c.r*2||Math.abs(dz)>c.length+c.r*2)continue;
 const along=dx*.79-dz*.613,across=dx*.613+dz*.79;
 const t=Math.max(0,Math.min(1,along/c.length)),radius=c.r*(1-t*.65),end=along<0?-along:along>c.length?along-c.length:0;
 const distance=(across*across+end*end)/(radius*radius);if(distance>7)continue;shade=Math.max(shade,Math.exp(-distance*1.3)*.57*(1-t*.25));
 }
 const grainValue=(Math.sin(wx*3.7+wz*2.1)*Math.cos(wz*4.1-wx)*.014),drift=(Math.sin(wx*.27+wz*.11)+Math.cos(wz*.17-wx*.2))*.018;
 const k=(y*width+x)*4;data[k]=Math.round(255*Math.max(0,Math.min(1,.98-shade*.79+grainValue+drift)));data[k+1]=Math.round(255*Math.max(0,Math.min(1,.99-shade*.65+grainValue+drift)));data[k+2]=Math.round(255*Math.max(0,Math.min(1,1-shade*.39+grainValue)));
 data[k+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 ground.material.map=texture;ground.material.bumpMap=grain;ground.material.bumpScale=.065;ground.material.needsUpdate=true;
 return {texture,casterCount:casters.length};
}
