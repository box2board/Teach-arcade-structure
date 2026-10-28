import * as T from '../../assets/vendor/three-0.162.0/three.module.js';
import {validateRecipe,OPTIONS} from './recipe.js';
// Coordinate contract: +Y up, +Z forward, meters; left = character's left (+X).
// Profiles are authored cross-sections, not assembled primitive limbs.
function loft(rows,n=16){const p=[],uv=[],idx=[];rows.forEach((r,j)=>{for(let i=0;i<=n;i++){let a=i/n*Math.PI*2;let sx=Math.sin(a),sz=Math.cos(a);let exponent=r[5]||1; p.push((r[3]||0)+Math.sign(sx)*Math.pow(Math.abs(sx),exponent)*r[1],r[0],(r[4]||0)+Math.sign(sz)*Math.pow(Math.abs(sz),exponent)*r[2]);uv.push(i/n,j/(rows.length-1));if(j<rows.length-1&&i<n){let k=j*(n+1)+i;idx.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function tube(points,radius=.01){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,radius,5,false);}
export function createAvatar(input){
 const recipe=validateRecipe(input),root=new T.Group();root.name='TeachArcadeAvatar';const bones={},rest={},materials=new Map(),geometries=new Set(),skinned=[];const B=recipe.body,H=B.height,L=B.legLength;
 const hipY=.92*L;const joints={root:[0,0,0],hips:[0,hipY,0],spine:[0,hipY+.18,0],chest:[0,hipY+.40,0],neck:[0,hipY+.57,0],head:[0,hipY+.66,0]};
 function bone(name,parent,xyz){const b=new T.Bone();b.name=name;b.position.fromArray(xyz);if(parent){const p=joints[parent];b.position.sub(new T.Vector3(...p));bones[parent].add(b);}else root.add(b);bones[name]=b;return b;}
 bone('root',null,joints.root);for(const [name,parent]of [['hips','root'],['spine','hips'],['chest','spine'],['neck','chest'],['head','neck']])bone(name,parent,joints[name]);
 for(const side of ['L','R']){const s=side==='L'?1:-1,w=B.torsoWidth;const chain=[['shoulder','chest',[s*.24*w,hipY+.43,0]],['upperArm','shoulder',[s*.33*w,hipY+.4,0]],['forearm','upperArm',[s*.40*w,hipY+.16,.01]],['hand','forearm',[s*.43*w,hipY-.08,.035]],['thigh','hips',[s*.145,hipY-.02,0]],['shin','thigh',[s*.15,.49*L,.015]],['foot','shin',[s*.15,.12,.025]],['toe','foot',[s*.15,.065,.18]]];for(const [n,p,pos]of chain){joints[`${n}.${side}`]=pos;bone(`${n}.${side}`,['chest','hips'].includes(p)?p:`${p}.${side}`,pos);}}
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(Object.values(bones));skeleton.calculateInverses();const ids=Object.keys(bones);
 function mat(value){const key=typeof value==='object'?value.key:'literal:'+value,color=typeof value==='object'?value.color:value;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.8,metalness:0}));return materials.get(key);}
 function mesh(g,color,attach='root',pos=[0,0,0]){geometries.add(g);const m=new T.Mesh(g,mat(color));m.position.fromArray(pos);bones[attach].add(m);return m;}
 function skin(g,color,weight){geometries.add(g);const si=[],sw=[],p=g.attributes.position;for(let i=0;i<p.count;i++){let w=weight(new T.Vector3().fromBufferAttribute(p,i));si.push(ids.indexOf(w[0]),ids.indexOf(w[1]||w[0]),0,0);sw.push(1-(w[2]||0),w[2]||0,0,0);}g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));const m=new T.SkinnedMesh(g,mat(color));root.add(m);m.bind(skeleton);skinned.push(m);return m;}
 const clamp=T.MathUtils.clamp;const rigid=n=>()=>[n];const blend=(a,b,y0,y1)=>p=>[a,b,clamp((p.y-y0)/(y1-y0),0,1)];
 const channel=key=>({key,color:key.split('.').reduce((o,k)=>o[k],recipe)});const skinColor=channel('skin'),primary=channel('top.primary'),secondary=channel('top.secondary'),leg=channel('bottom.color');
 const torsoRows=[[hipY-.07,.20,.125],[hipY-.045,.235,.145],[hipY+.02,.24,.15],[hipY+.17,.245,.15],[hipY+.34,.28,.155],[hipY+.40,.275,.145],[hipY+.46,.215,.125],[hipY+.51,.10,.095],[hipY+.515,.085,.08]].map(r=>[r[0],r[1]*B.torsoWidth,r[2],0,0,.72]);
 skin(loft(torsoRows,24),primary,blend('hips','chest',hipY,hipY+.4));
 mesh(loft([[0,.065,.06],[.09,.068,.062],[.12,.06,.06]],16),skinColor,'neck',[0,-.02,0]);
 const headGroup=bones.head;headGroup.scale.setScalar(B.headScale);
 mesh(loft([[-.04,0,0],[0,.105,.105],[.055,.17,.135],[.12,.205,.16],[.23,.215,.175],[.34,.205,.16],[.41,.16,.13],[.445,.07,.065],[.45,0,0]],32),skinColor,'head');
 // Ears are contoured pinnae with inset centers, tucked into the cheek silhouette.
 for(const s of [-1,1]){mesh(loft([[0,0,0],[.015,.032,.02],[.055,.043,.03],[.09,.033,.026],[.105,0,0]],12),skinColor,'head',[s*.203,.14,0]);mesh(loft([[0,0,0],[.018,.017,.008],[.045,.02,.01],[.06,0,0]],10),'#b77562','head',[s*.225,.162,.023]);}
 // Small shaped nose, mouth and eyelids give the face a deliberate identity.
 mesh(loft([[0,0,0],[.013,.037,.027],[.035,.028,.041],[.068,.018,.024],[.078,0,0]],12),skinColor,'head',[0,.115,.159]);
 const eyeY=recipe.face==='Focused'?.242:.235,eyeH=recipe.face==='Easygoing'?.022:.032;
 for(const s of [-1,1]){let e=mesh(loft([[-eyeH,0,0],[-eyeH*.7,.027,.008],[0,.032,.013],[eyeH*.7,.027,.01],[eyeH,0,0]],16),'#fff9ed','head',[s*.083,eyeY,.158]);e.rotation.y=s*.2;
 mesh(loft([[-eyeH*.85,0,0],[0,.015,.009],[eyeH*.85,0,0]],12),channel('eyeColor'),'head',[s*.078,eyeY,.173]);mesh(loft([[-.015,0,0],[0,.007,.004],[.015,0,0]],10),'#182733','head',[s*.077,eyeY,.181]);mesh(loft([[-.004,0,0],[0,.004,.003],[.004,0,0]],8),'#ffffff','head',[s*.077-.004,eyeY+.009,.185]);
 const arch=recipe.brows==='Arched'?.014:.006,browY=eyeY+.057;mesh(tube([[s*.045,browY,.169],[s*.08,browY+arch,.17],[s*.12,browY+(recipe.face==='Focused'?.018:0),.154]],recipe.brows==='Bold'?.011:.007),channel('hair.color'),'head');}
 mesh(tube([[-.047,.09,.142],[0,.079,.153],[.047,.095,.142]],.006),'#6e3930','head');
 // One closed profile for each arm, weighted over elbow and wrist. No exposed joint balls.
 for(const side of ['L','R']){const s=side==='L'?1:-1,w=B.torsoWidth;const armRows=[[hipY-.12,.034,.035,s*.43*w,.035],[hipY-.07,.048,.047,s*.43*w,.03],[hipY+.06,.056,.054,s*.415*w,.02],[hipY+.16,.058,.056,s*.4*w,.01],[hipY+.29,.073,.067,s*.365*w,0],[hipY+.39,.092,.08,s*.325*w,0],[hipY+.445,.066,.063,s*.29*w,0],[hipY+.45,0,0,s*.28*w,0]];
 const armWeight=p=>p.y<hipY+.16?['hand.'+side,'forearm.'+side,clamp((p.y-(hipY-.06))/.16,0,1)]:['forearm.'+side,'upperArm.'+side,clamp((p.y-(hipY+.12))/.13,0,1)];skin(loft(armRows,16),skinColor,armWeight);
 const long=recipe.top.style!=='Tee';let sleeve=armRows.filter(r=>r[0]>hipY+(long?-.06:.24)).map(r=>[r[0],r[1]+.014,r[2]+.014,r[3],r[4],.83]);sleeve.unshift([hipY+(long?-.055:.235),long?.062:.09,long?.06:.08,s*(long?.43:.38)*w,.018,.83]);skin(loft(sleeve,16),recipe.top.style==='Varsity'?secondary:primary,armWeight);
 if(long)skin(loft([[hipY-.07,.061,.059,s*.43*w,.027],[hipY-.025,.065,.061,s*.425*w,.027]],16),secondary,armWeight);
 mesh(loft([[-.115,0,0],[-.10,.035,.025],[-.075,.055,.037],[-.025,.059,.04],[.015,.042,.034],[.025,.035,.029]],16),skinColor,'hand.'+side,[0,-.015,.005]);
 let thumb=mesh(loft([[-.05,0,0],[-.035,.024,.022],[.015,.025,.025],[.025,0,0]],12),skinColor,'hand.'+side,[-s*.049,-.028,.022]);thumb.rotation.z=-s*.45;
 const x=s*.15,short=recipe.bottom.style==='Shorts',jog=recipe.bottom.style==='Joggers';
 const legRows=[[.10,.062,.071,x,.015],[.17,.078,.08,x,0],[.35*L,.087,.085,x,0],[.49*L,.09,.092,x,.01],[.65*L,.105,.106,x,0],[hipY-.07,.124,.13,x,0],[hipY+.02,.125,.13,x,0]];
 const legWeight=p=>p.y>.49*L?['shin.'+side,'thigh.'+side,clamp((p.y-.43*L)/(.22*L),0,1)]:['foot.'+side,'shin.'+side,clamp((p.y-.1)/.13,0,1)];skin(loft(legRows,16),short?skinColor:leg,legWeight);
 if(short)skin(loft([[.53*L,.111,.113,x,.01],[.57*L,.116,.119,x,0],[hipY-.07,.137,.143,x,0],[hipY+.02,.13,.14,x,0]],16),leg,legWeight);
 if(jog)skin(loft([[.105,.064,.073,x,.015],[.18,.075,.078,x,0]],16),secondary,legWeight);
 // Shoe profile has a broad toe box, heel counter, sole lip and raised tongue.
 const high=recipe.shoes.style==='High-top',runner=recipe.shoes.style==='Runner';const shoe=bones['foot.'+side];
 mesh(loft([[-.095,0,0,0,.07],[-.09,.101,.182,0,.07,.62],[-.055,.11,.19,0,.07,.62],[-.028,.108,.185,0,.07,.65]],20),secondary,'foot.'+side);
 mesh(loft([[-.03,.106,.18,0,.07,.65],[.01,.104,.177,0,.07,.65],[.055,.087,.15,0,.043,.72],[.10,.072,.095,0,0],[high?.18:.11,.068,.075,0,-.005],[high?.19:.12,.056,.065,0,-.005]],20),channel('shoes.color'),'foot.'+side);
 for(let j=0;j<3;j++)mesh(tube([[-.05,.06+j*.013,.13-j*.029],[0,.075+j*.013,.14-j*.029],[.05,.06+j*.013,.13-j*.029]],.005),primary,'foot.'+side);
 if(runner)for(const sign of [-1,1])mesh(tube([[sign*.105,-.01,.17],[sign*.107,.025,.09],[sign*.08,.065,.01]],.012),primary,'foot.'+side);
 }
 // Waistband, collar and jacket tailoring follow the same skeleton.
 skin(loft([[hipY-.055,.238*B.torsoWidth,.15],[hipY-.018,.242*B.torsoWidth,.154]],24),secondary,rigid('hips'));
 mesh(loft([[0,.105,.096],[.025,.102,.093],[.035,.08,.075]],24),secondary,'neck',[0,-.065,0]);
 if(recipe.top.style==='Varsity'){mesh(tube([[0,-.36,.158],[0,-.19,.158],[0,-.02,.15]],.008),secondary,'chest');for(let i=0;i<4;i++)mesh(loft([[-.006,0,0],[0,.006,.006],[.006,0,0]],8),'#e5ac48','chest',[.027,-.06-i*.075,.159]);
 mesh(tube([[.115,-.05,.16],[.115,-.13,.16],[.162,-.13,.156]],.012),secondary,'chest');}
 if(recipe.top.style==='Hoodie'){mesh(loft([[-.12,.11,.06,0,-.11],[-.08,.16,.09,0,-.12],[0,.17,.10,0,-.10],[.09,.14,.08,0,-.08],[.12,.09,.04,0,-.08]],20),primary,'neck');for(const s of [-1,1])mesh(tube([[s*.065,.015,.105],[s*.07,-.09,.16],[s*.075,-.13,.16]],.006),secondary,'neck');mesh(tube([[-.12,-.24,.157],[-.10,-.31,.162],[.10,-.31,.162],[.12,-.24,.157]],.009),secondary,'chest');}
 const hair=channel('hair.color');
 // Scalp shell: an asymmetric hairline avoids a helmet-like spherical cap.
 const rows=[],N=32;const pos=[],index=[];for(let j=0;j<=8;j++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,front=Math.cos(a),base=front>.1?.305+.025*Math.sin(a*2):.18;const y=base+(.49-base)*j/8;const r=Math.sqrt(Math.max(0,1-Math.pow((y-.25)/.255,2)));pos.push(Math.sin(a)*.223*r,y,Math.cos(a)*.184*r);if(j<8&&i<N){const k=j*(N+1)+i;index.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1);}}const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(pos,3));cap.setIndex(index);cap.computeVertexNormals();mesh(cap,hair,'head');
 if(recipe.hair.style==='Sweep'){const m=mesh(loft([[0,0,0],[.025,.125,.055],[.075,.17,.07],[.12,.16,.075],[.16,.11,.05],[.18,0,0]],24),hair,'head',[-.025,.30,.13]);m.rotation.z=-.24;for(let i=0;i<3;i++)mesh(tube([[-.14+i*.04,.38,.18],[-.07+i*.04,.45,.17],[.07+i*.025,.46,.11]],.004),'#50403a','head');}
 if(recipe.hair.style==='Crop'){for(let i=0;i<5;i++){const m=mesh(loft([[0,.033,.035],[.04,.04,.042],[.075,.025,.028],[.09,0,0]],10),hair,'head',[(i-2)*.065,.42,.03]);m.rotation.z=-.25;}}
 if(recipe.hair.style==='Bob'){for(const s of [-1,1])mesh(loft([[0,.045,.11],[.03,.065,.135],[.16,.066,.14],[.28,.052,.12],[.33,0,0]],16),hair,'head',[s*.18,.065,-.025]);mesh(loft([[0,0,0],[.025,.17,.045],[.08,.19,.06],[.13,.16,.06],[.16,0,0]],24),hair,'head',[0,.28,.14]);}
 if(recipe.accessories.includes('Glasses')){for(const s of [-1,1]){let pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;pts.push([s*.084+Math.sin(a)*.053,.235+Math.cos(a)*.045,.19]);}mesh(tube(pts,.007),channel('accessoryColor'),'head');mesh(tube([[s*.135,.235,.19],[s*.20,.245,.08],[s*.21,.22,-.02]],.006),channel('accessoryColor'),'head');}mesh(tube([[-.03,.24,.19],[0,.25,.20],[.03,.24,.19]],.006),channel('accessoryColor'),'head');}
 if(recipe.accessories.includes('Backpack')){mesh(loft([[-.35,0,0],[-.33,.14,.07],[-.28,.17,.09],[-.07,.17,.09],[.02,.12,.07],[.035,0,0]],20),channel('accessoryColor'),'chest',[0,0,-.20]);for(const s of [-1,1])mesh(tube([[s*.14,-.33,-.16],[s*.21,-.19,.08],[s*.21,.025,.10],[s*.14,.035,-.22]],.018),secondary,'chest');}
 // Batch compatible meshes by attachment and material; retain bone-local transforms.
 function mergeGroup(list, isSkin=false){if(list.length<2)return;const names=isSkin?['position','normal','uv','skinIndex','skinWeight']:['position','normal','uv'];const arrays=Object.fromEntries(names.map(n=>[n,[]])),indices=[];let offset=0;
 for(const m of list){m.updateMatrix();const g=m.geometry.clone();if(!isSkin)g.applyMatrix4(m.matrix);for(const n of names)arrays[n].push(...(g.attributes[n]?.array||new Float32Array(g.attributes.position.count*2)));for(const i of g.index.array)indices.push(i+offset);offset+=g.attributes.position.count;g.dispose();}
 const g=new T.BufferGeometry();for(const n of names)g.setAttribute(n,n==='skinIndex'?new T.Uint16BufferAttribute(arrays[n],4):new T.Float32BufferAttribute(arrays[n],n==='uv'?2:n==='skinWeight'?4:3));g.setIndex(indices);geometries.add(g);let m;if(isSkin){m=new T.SkinnedMesh(g,list[0].material);root.add(m);m.bind(skeleton,list[0].bindMatrix);}else {m=new T.Mesh(g,list[0].material);list[0].parent.add(m);}for(const old of list){old.removeFromParent();old.geometry.dispose();geometries.delete(old.geometry);}}
 for(const b of Object.values(bones)){const groups=new Map();for(const m of [...b.children].filter(c=>c.isMesh)){if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(m);}groups.forEach(list=>mergeGroup(list));}
 const skinGroups=new Map();for(const m of skinned){if(!skinGroups.has(m.material))skinGroups.set(m.material,[]);skinGroups.get(m.material).push(m);}skinGroups.forEach(list=>mergeGroup(list,true));
 for(const [name,b]of Object.entries(bones))rest[name]={position:b.position.clone(),quaternion:b.quaternion.clone()};root.scale.setScalar(H);let time=0,state=recipe.animation;
 function play(name){if(!OPTIONS.animation.includes(name))throw Error('Unknown animation');state=name;time=0;}
 function update(dt){dt=Math.min(Math.max(dt,0),.05);time+=dt;const t=time,run=state==='Run',walk=state==='Walk'||run,f=run?10:6;const pose={};let rise=0;
 const rot=(n,x=0,y=0,z=0)=>pose[n]=new T.Quaternion().setFromEuler(new T.Euler(x,y,z));
 rot('chest',0,Math.sin(t*1.5)*.025,0);for(const side of ['L','R']){const s=side==='L'?1:-1,phase=t*f+(side==='L'?0:Math.PI),v=Math.sin(phase);rot('upperArm.'+side,walk?-v*(run?.85:.45):.015,0,s*(.06+Math.sin(t*2)*.015));rot('forearm.'+side,walk?-(run?1:.2)-Math.max(0,v)*.2:-.09);rot('thigh.'+side,walk?v*(run?.9:.48):0);rot('shin.'+side,walk?Math.max(0,-v)*(run?1.4:.65):0);rot('foot.'+side,walk?-Math.max(0,-v)*.3:0);}
 if(walk){rise=Math.abs(Math.sin(t*f))*(run?.055:.018);rot('chest',run?.10:.035);}
 if(state==='Wave'){rot('upperArm.R',-.2,0,-2.35);rot('forearm.R',0,.1,-.45+Math.sin(t*8)*.3);rot('hand.R',0,Math.sin(t*8)*.25,0);rot('head',0,0,-.07);}
 if(state==='Jump'){let p=(t%2.4)/2.4;rise=Math.sin(clamp((p-.18)/.60,0,1)*Math.PI)*.42;const crouch=p<.18?Math.sin(p/.18*Math.PI)*.27:0;rise-=crouch*.25;for(const side of ['L','R']){rot('thigh.'+side,-crouch);rot('shin.'+side,crouch*2);rot('upperArm.'+side,0,0,(side==='L'?1:-1)*(rise>0?1.5:.05));}}
 if(state==='Celebrate'){rise=Math.abs(Math.sin(t*5))*.07;for(const side of ['L','R']){rot('upperArm.'+side,0,0,(side==='L'?1:-1)*(2.4+Math.sin(t*5)*.15));rot('forearm.'+side,-.6); }rot('chest',0,Math.sin(t*5)*.12);}
 for(const [name,b]of Object.entries(bones))b.quaternion.slerp(pose[name]||rest[name].quaternion,1-Math.exp(-dt*16));bones.hips.position.y=T.MathUtils.lerp(bones.hips.position.y,rest.hips.position.y+rise+(state==='Idle'?Math.sin(t*2)*.006:0),1-Math.exp(-dt*18));
 }
 return {root,setColors(next){const validated=validateRecipe(next);for(const [key,m]of materials)if(!key.startsWith('literal:'))m.color.set(key.split('.').reduce((o,k)=>o[k],validated));Object.assign(recipe,validated);},rig:{version:'ta-humanoid-1',bones,skeleton},animations:{play,update,get state(){return state;}},recipe,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());skeleton.dispose();root.removeFromParent();},stats(){let triangles=0;root.traverse(m=>{if(m.isMesh)triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});return {triangles,materials:materials.size,bones:ids.length};}};
}
