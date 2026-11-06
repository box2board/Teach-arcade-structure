import * as T from '../../vendor/three.module.js';

export function createCabinet(host, holes) {
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}); }
  catch { renderer=createSoftwareRenderer(document.createElement('canvas')); }
  const displayCanvas=renderer.domElement;
  displayCanvas.className='cabinet-world'; displayCanvas.setAttribute('aria-hidden','true');
  displayCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  host.prepend(displayCanvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.24;
  renderer.setClearColor(0x211038);
  const scene=new T.Scene();scene.fog=new T.Fog(0x211038,25,60);
  const camera=new T.PerspectiveCamera(39,1,.1,100);
  const floor=s=>Math.max(0,(s-4.8)*.65), tilt=Math.atan(.65), cups=new Map();
  const mat=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.42,metalness:.18,...options});
  const purple=mat(0x402275),blue=mat(0x2255ac),gold=mat(0xe9ba58,{metalness:.6,roughness:.27}),dark=mat(0x0c1428),ivory=mat(0xffedc0),neon=mat(0x84e6ff,{emissive:0x329dff,emissiveIntensity:1.1});
  scene.add(new T.HemisphereLight(0xd9e9ff,0x39204f,2.3));
  const sun=new T.DirectionalLight(0xffefcf,3.7);sun.position.set(-5,11,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:10,bottom:-10,near:.5,far:30});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.radius=4;sun.target.position.set(0,0,-4);scene.add(sun,sun.target);
  const fill=new T.DirectionalLight(0x8ab4ff,2);fill.position.set(6,4,-8);scene.add(fill);
  function mesh(geo,material,parent=scene){const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,material,x,y,z,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;}
  function beam(a,b,width,material,parent=scene){const p=new T.Vector3(...a),q=new T.Vector3(...b),delta=q.clone().sub(p);const m=mesh(new T.CylinderGeometry(width,width,delta.length(),10),material,parent);m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
  function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}
  const wood=texture(512,1024,(c,w,h)=>{c.fillStyle='#e7bd78';c.fillRect(0,0,w,h);for(let i=0;i<600;i++){const x=(i*79.17)%w,y=(i*127.43)%h;c.strokeStyle=i%3?'#b7823a18':'#fff1bb38';c.lineWidth=.5+i%3;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+4,y+20,x-3,y+50,x+1,y+90);c.stroke();}for(let x=0;x<w;x+=64){c.fillStyle='#a6773230';c.fillRect(x,0,1,h);c.fillStyle='#fff5c64a';c.fillRect(x+1,0,2,h);}});
  const laneMaterial=mat(0xffe4a9,{map:wood,roughness:.38,metalness:0});
  // The cabinet fills the play area; a distant floor adds distracting side shadows.
  box(4.65,.58,9.7,purple,0,-.42,-4.2);
  box(4.35,.16,4.9,laneMaterial,0,-.08,-2.35);
  const slopeLen=4.22*Math.sqrt(1+.65*.65);
  const bank=mesh(new T.PlaneGeometry(4.35,slopeLen),mat(0x254fa6,{roughness:.56,metalness:.18}));bank.rotation.x=-Math.PI/2+tilt;bank.position.set(0,floor(9.02)/2,-6.91);bank.castShadow=false;
  // Solid side panels make the target bank visibly rise above the lane.
  for(const side of [-1,1]){
    const shape=new T.Shape();shape.moveTo(4.8,-.15);shape.lineTo(9.1,-.15);shape.lineTo(9.1,floor(9.1));shape.lineTo(4.8,0);shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false});const panel=mesh(geometry,blue);panel.rotation.y=Math.PI/2;panel.position.x=side<0?-2.30:2.12;
    box(.18,.28,4.9,blue,side*2.22,.06,-2.35);
    beam([side*2.24,.23,.07],[side*2.24,.23,-4.8],.055,gold);
    beam([side*2.24,.23,-4.8],[side*2.24,floor(9.02)+.23,-9.02],.055,gold);
    beam([side*2.29,.05,.06],[side*2.29,.05,-4.8],.023,neon);
    beam([side*2.29,.05,-4.8],[side*2.29,floor(9.02)+.08,-9.02],.023,neon);
    for(let s=.1;s<9;s+=.48){const lamp=mesh(new T.SphereGeometry(.035,8,6),gold);lamp.position.set(side*2.24,floor(s)+.23,-s);lamp.castShadow=false;}
  }
  // A real curved launch ramp, with a thin brass edge.
  const rampPoints=[];for(let i=0;i<=16;i++){const t=i/16;rampPoints.push(new T.Vector3(0,.11*t*t,-4.1-t*.4));}
  const rampShape=new T.Shape();rampShape.moveTo(-2.12,0);rampShape.lineTo(2.12,0);rampShape.lineTo(2.12,.025);rampShape.lineTo(-2.12,.025);rampShape.closePath();
  const ramp=mesh(new T.ExtrudeGeometry(rampShape,{steps:24,bevelEnabled:false,extrudePath:new T.CatmullRomCurve3(rampPoints)}),laneMaterial);ramp.castShadow=false;
  beam([-2.12,.12,-4.49],[2.12,.12,-4.49],.025,gold);
  box(4.65,.72,.24,purple,0,floor(9.02)+.25,-9.19);
  box(4.55,.055,.27,gold,0,floor(9.02)+.62,-9.16);
  const logo=texture(1024,160,(c,w,h)=>{c.fillStyle='#271546';c.fillRect(0,0,w,h);c.strokeStyle='#d8b264';c.lineWidth=5;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#fff0b0';c.font='900 60px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ULTIMATE  NEON ROLL',w/2,h/2);});
  const sign=mesh(new T.PlaneGeometry(4.2,.65),new T.MeshBasicMaterial({map:logo}));sign.position.set(0,floor(9.02)+.26,-9.045);sign.rotation.x=-.1;sign.castShadow=false;
  box(4.65,.38,.68,blue,0,-.05,.45);box(4.7,.045,.72,gold,0,.16,.45);
  const badge=texture(512,100,(c,w,h)=>{c.fillStyle='#1b387b';c.fillRect(0,0,w,h);c.fillStyle='#f6dc91';c.font='900 34px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('AIM  •  CHARGE  •  ROLL',w/2,h/2);});
  const plate=mesh(new T.PlaneGeometry(3.2,.5),new T.MeshBasicMaterial({map:badge}));plate.position.set(0,.2,.48);plate.rotation.x=-Math.PI/2;plate.castShadow=false;
  const spareMaterial=mat(0xe9c88e,{roughness:.8,metalness:0});
  for(let i=0;i<8;i++){const ball=mesh(new T.SphereGeometry(.075,12,8),spareMaterial);ball.position.set(-1.5+i*.2,.25,.65);ball.castShadow=false;}
  const labelMaterials=new Map();
  function label(number){if(labelMaterials.has(number))return labelMaterials.get(number);const t=texture(256,128,(c,w,h)=>{c.fillStyle='#111a36';c.fillRect(0,0,w,h);c.strokeStyle='#c5ad69';c.lineWidth=5;c.strokeRect(4,4,w-8,h-8);c.fillStyle='#fff1bf';c.font='900 76px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(number,w/2,h/2);});const m=new T.SpriteMaterial({map:t,depthTest:true});labelMaterials.set(number,m);return m;}
  for(const h of holes){
    const group=new T.Group();group.userData.dynamic=true;scene.add(group);group.rotation.x=tilt;
    const rx=h.rx*1.8,rz=h.r;
    const bodyMaterial=mat(h.color,{roughness:.3,metalness:.35});
    const points=[[0,.025],[.76,.025],[.87,.055],[.94,.18],[1.01,.23],[1.09,.235],[1.12,.19],[1.08,.035],[.98,0],[0,0]].map(p=>new T.Vector2(...p));
    const bowl=mesh(new T.LatheGeometry(points,40),bodyMaterial,group);bowl.scale.set(rx,1,rz);
    const rim=mesh(new T.TorusGeometry(1.04,.035,8,48),gold,group);rim.rotation.x=Math.PI/2;rim.scale.set(rx,rz,1);rim.position.y=.235;rim.castShadow=false;
    const well=texture(128,128,(c,w,h)=>{const g=c.createRadialGradient(w*.5,h*.63,2,w*.5,h*.5,w*.6);g.addColorStop(0,'#020611');g.addColorStop(.65,'#060f24');g.addColorStop(1,'#233856');c.fillStyle=g;c.fillRect(0,0,w,h);});
    const bottom=mesh(new T.CircleGeometry(.90,40),new T.MeshBasicMaterial({map:well}),group);bottom.rotation.x=-Math.PI/2;bottom.scale.set(rx,rz,1);bottom.position.y=.065;bottom.castShadow=false;bottom.receiveShadow=false;
    const ring=mesh(new T.TorusGeometry(1.11,.014,6,48),new T.MeshBasicMaterial({color:h.color}),group);ring.rotation.x=Math.PI/2;ring.scale.set(rx,rz,1);ring.position.y=.15;ring.castShadow=false;
    const score=new T.Sprite(label(h.n));score.userData.dynamic=true;score.scale.set(h.n===1000?.52:.56,.28,1);scene.add(score);
    const shutter=box(rx*1.9,.035,rz*1.7,mat(0xa8bddb,{metalness:.65,roughness:.35}),0,.20,0,group);shutter.visible=h.motion==='gate';
    for(let i=-2;i<=2;i++)box(.016,.012,rz*1.6,dark,i*rx*.3,.026,0,shutter);
    const gateLight=mesh(new T.SphereGeometry(.04,10,8),mat(0x68ffa6,{emissive:0x24e86c,emissiveIntensity:1}),group);gateLight.position.set(0,.24,-rz*1.3);gateLight.visible=h.motion==='gate';gateLight.castShadow=false;
    cups.set(h.id,{group,bodyMaterial,ring,score,shutter,gateLight});
    if(h.motion==='slide')beam([(h.baseX-h.ax)*1.8,floor(h.baseS)+.02,-h.baseS],[(h.baseX+h.ax)*1.8,floor(h.baseS)+.02,-h.baseS],.015,mat(0xadcaf5,{metalness:.5}));
  }
  const cork=texture(256,128,(c,w,h)=>{c.fillStyle='#d8ae6f';c.fillRect(0,0,w,h);for(let i=0;i<1700;i++){c.fillStyle=i%3?'#89582740':'#ffefba80';const x=(i*53.241)%w,y=(i*79.771)%h;c.fillRect(x,y,.7+i%3,.7+i%2);}});
  const ballMesh=mesh(new T.SphereGeometry(.28,32,24),mat(0xffe0a3,{map:cork,roughness:.66,metalness:0}));
  ballMesh.userData.dynamic=true;
  const aimDots=[];for(let i=0;i<10;i++){const dot=mesh(new T.CircleGeometry(.022,10),new T.MeshBasicMaterial({color:0xa17b38,transparent:true,opacity:.45}));dot.userData.dynamic=true;dot.rotation.x=-Math.PI/2;dot.castShadow=false;aimDots.push(dot);}
  const burst=[];for(let i=0;i<22;i++){const m=mesh(new T.OctahedronGeometry(.035),new T.MeshBasicMaterial({color:i%2?0xffdf82:0x88dfff,transparent:true}));m.userData.dynamic=true;m.visible=false;m.castShadow=false;burst.push(m);}
  const bounds=[];for(const x of [-2.4,2.4]){bounds.push(new T.Vector3(x,.25,.82),new T.Vector3(x,-.4,.82),new T.Vector3(x,3.5,-9.4));}
  let width=0,height=0;const target=new T.Vector3(0,1,-4.25),direction=new T.Vector3(0,1.35,1).normalize();
  function resize(){
    const r=host.getBoundingClientRect();if(width===r.width&&height===r.height)return;
    width=Math.max(1,r.width);height=Math.max(1,r.height);renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.clearViewOffset();
    // Always play straight up the lane. Fit its projected extents, rather than
    // backing away from an off-center object until it looks like a small model.
    scene.scale.x=Math.min(2.7,Math.max(1,camera.aspect*1.8));
    camera.updateProjectionMatrix();let extents;
    for(let distance=7;distance<55;distance+=.08){
      camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld();
      const projected=bounds.map(p=>p.clone().multiply(new T.Vector3(scene.scale.x,1,1)).project(camera));
      extents={left:Math.min(...projected.map(p=>p.x)),right:Math.max(...projected.map(p=>p.x)),top:Math.max(...projected.map(p=>p.y)),bottom:Math.min(...projected.map(p=>p.y))};
      if(extents.right-extents.left<1.9&&extents.top-extents.bottom<1.9)break;
    }
    camera.setViewOffset(width,height,(extents.left+extents.right)*width/4,-(extents.top+extents.bottom)*height/4,width,height);
    for(const h of holes)cups.get(h.id).score.scale.x=(h.n===1000?.52:.56)/scene.scale.x;
  }
  function screen(x,s,y=floor(s)){const p=new T.Vector3(x*1.8*scene.scale.x,y+.205,-s).project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};}
  function render(state){resize();const {ball,ready,aim,holes,flash}=state;
    for(const h of holes){const cup=cups.get(h.id);cup.group.position.set(h.x*1.8,floor(h.s)+.015,-h.s);cup.score.position.set(h.x*1.8,floor(h.s)+.43,-h.s-.02);const hit=flash?.h===h&&flash.t<1.2;cup.bodyMaterial.emissive.set(hit?h.color:0x000000);cup.bodyMaterial.emissiveIntensity=hit?Math.max(0,.6-flash.t*.5):0;cup.shutter.visible=h.motion==='gate'&&!h.open;cup.gateLight.material.color.set(h.open?0x6affb2:0xffd36c);cup.gateLight.material.emissive.set(h.open?0x28e898:0xa05b06);}
    ballMesh.visible=!!ball||ready;
    if(ball||ready){const b=ball||{x:0,s:.13,y:.075,spin:0,phase:'ready'};ballMesh.position.set(b.x*1.8,b.y+.205,-b.s);ballMesh.rotation.x=-(b.spin||0);ballMesh.rotation.z=0;ballMesh.scale.setScalar(b.phase==='sink'?Math.max(.02,1-Math.max(0,b.age-.22)*1.7):1);ballMesh.scale.x/=scene.scale.x;}
    aimDots.forEach((dot,i)=>{dot.visible=ready;const s=.4+i*.36;dot.position.set(Math.sin(aim*Math.PI/180)*s*1.8,.012,-s);});
    burst.forEach((m,i)=>{const t=flash?.t||0;m.visible=!!flash&&t<.8;if(!m.visible)return;const angle=i*2.39996,speed=.5+(i%5)*.14;m.position.set(flash.h.x*1.8+Math.cos(angle)*speed*t,floor(flash.h.s)+.3+1.9*t-2.8*t*t,-flash.h.s+Math.sin(angle)*speed*t);m.rotation.set(t*4+i,t*3,0);m.material.opacity=Math.max(0,1-t/.8);});
    renderer.render(scene,camera);if(renderer.isSoftwareRenderer)renderer.drawDynamics({camera,holes,ball,ready,aim,flash,scaleX:scene.scale.x,floor});
  }
  return{render,screen,dispose(){renderer.dispose();displayCanvas.remove();}};
}

// Geometry-based compatibility renderer for browsers without WebGL.
// Shares the same camera, moving objects, and cup geometry with the GPU renderer.
function createSoftwareRenderer(canvas){
  const ctx=canvas.getContext('2d'),light=new T.Vector3(-.35,.8,.45).normalize();
  let width=1,height=1,background='#211038',ratio=1,staticCache=null;
  const colorCache=new Map(),vectors=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
  function paintColor(material,normal){const shade=Math.round((.48+.7*Math.max(0,normal.dot(light)))*24)/24;const key=material.uuid+':'+shade;let c=colorCache.get(key);if(!c){const color=material.color?.clone()||new T.Color(0xffffff);if(!material.isMeshBasicMaterial)color.multiplyScalar(shade);if(material.emissive)color.add(material.emissive.clone().multiplyScalar(material.emissiveIntensity||0));c=color.getStyle();if(colorCache.size<600)colorCache.set(key,c);}return c;}
  return {
    isSoftwareRenderer:true,domElement:canvas,shadowMap:{},capabilities:{getMaxAnisotropy:()=>1},
    setPixelRatio(r){ratio=Math.min(r,1.1);},setClearColor(c){background=new T.Color(c).getStyle();},
    setSize(w,h){width=w;height=h;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);staticCache=null;},dispose(){},

    drawDynamics({camera,holes,ball,ready,aim,flash,scaleX,floor}){
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const point=(x,y,z)=>{const v=new T.Vector3(x*scaleX,y,z).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2};};
      const cup=(h,mult=1,y=.23)=>{ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,z=Math.sin(a)*h.r*mult,p=point((h.x+Math.cos(a)*h.rx*mult)*1.8,floor(h.s)+.015+y*Math.cos(Math.atan(.65))-z*Math.sin(Math.atan(.65)),-h.s+y*Math.sin(Math.atan(.65))+z*Math.cos(Math.atan(.65)));if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();};
      if(ready){ctx.fillStyle='#9b773d';for(let i=0;i<10;i++){const s=.4+i*.36,p=point(Math.sin(aim*Math.PI/180)*s*1.8,.02,-s);ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,7);ctx.fill();}}
      for(const h of [...holes].sort((a,b)=>b.s-a.s)){
        const p=point(h.x*1.8,floor(h.s)+.22,-h.s),side=point((h.x+h.rx)*1.8,floor(h.s)+.22,-h.s),radius=Math.max(5,Math.hypot(p.x-side.x,p.y-side.y));
        if(h.motion==='slide'){const a=point((h.baseX-h.ax)*1.8,floor(h.baseS)+.02,-h.baseS),b=point((h.baseX+h.ax)*1.8,floor(h.baseS)+.02,-h.baseS);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#a8c9e877';ctx.lineWidth=1.5;ctx.stroke();}
        ctx.save();ctx.shadowColor='#09091e99';ctx.shadowBlur=7;ctx.shadowOffsetY=5;cup(h,1.14,.08);ctx.fillStyle='#14233d';ctx.fill();ctx.restore();
        cup(h,1.12,.23);const bevel=ctx.createLinearGradient(p.x-radius,p.y-12,p.x+radius,p.y+12);bevel.addColorStop(0,'#fff0bb');bevel.addColorStop(.24,h.color);bevel.addColorStop(.78,h.color);bevel.addColorStop(1,'#7858a0');ctx.fillStyle=bevel;ctx.fill();ctx.strokeStyle='#e6ca7d';ctx.lineWidth=1.7;ctx.stroke();
        cup(h,.89,.225);ctx.fillStyle='#070d23';ctx.fill();ctx.strokeStyle=h.color;ctx.lineWidth=2;ctx.stroke();
        if(!h.open){ctx.save();cup(h,.89,.23);ctx.clip();ctx.fillStyle='#a0b1c8';ctx.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);ctx.strokeStyle='#445374';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(p.x+i*5,p.y-radius);ctx.lineTo(p.x+i*5,p.y+radius);ctx.stroke();}ctx.restore();}
        const label=point(h.x*1.8,floor(h.s)+.47,-h.s-.02);ctx.font='800 '+Math.max(12,Math.min(18,radius*.55))+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const value=h.open?String(h.n):'CLOSED',tw=ctx.measureText(value).width;ctx.fillStyle='#131827';ctx.fillRect(label.x-tw/2-5,label.y-10,tw+10,20);ctx.strokeStyle='#b99b5b';ctx.lineWidth=.7;ctx.strokeRect(label.x-tw/2-5,label.y-10,tw+10,20);ctx.fillStyle='#fff0bd';ctx.fillText(value,label.x,label.y);
        if(flash?.h===h&&flash.t<.8){ctx.globalAlpha=1-flash.t/.8;cup(h,1.15+flash.t*.3,.24);ctx.strokeStyle='#fff0ad';ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;}
      }
      const b=ball||(ready?{x:0,y:.075,s:.13,phase:'ready',spin:0}:null);
      if(b){const p=point(b.x*1.8,b.y+.205,-b.s),view=new T.Vector3(b.x*1.8*scaleX,b.y+.205,-b.s).applyMatrix4(camera.matrixWorldInverse),r0=.28*height/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.abs(view.z)),r=r0*(b.phase==='sink'?Math.max(.02,1-Math.max(0,b.age-.22)*1.7):1),sh=point(b.x*1.8,floor(b.s)+.01,-b.s);
        ctx.fillStyle='#34213744';ctx.beginPath();ctx.ellipse(sh.x,sh.y+2,r0*1.1,r0*.3,0,0,7);ctx.fill();ctx.save();if(b.phase==='sink'&&b.age>.15&&b.targetHole){cup(b.targetHole,.89,.23);ctx.clip();}
        const g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.4,1,p.x,p.y,r);g.addColorStop(0,'#fff5d7');g.addColorStop(.4,'#f4cf89');g.addColorStop(1,'#95602d');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.strokeStyle='#9d713a66';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(p.x,p.y,r*.4,r*.95,b.spin||0,0,7);ctx.stroke();ctx.restore();
      }
    },
    render(scene,camera){
      if(staticCache){ctx.setTransform(1,0,0,1,0,0);ctx.putImageData(staticCache,0,0);return;}scene.updateMatrixWorld(true);camera.updateMatrixWorld();const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];
      scene.traverseVisible(object=>{
        let parent=object;while(parent){if(parent.userData.dynamic)return;parent=parent.parent;}
        if(object.isSprite){const p=new T.Vector3().setFromMatrixPosition(object.matrixWorld),distance=p.clone().applyMatrix4(camera.matrixWorldInverse).z;p.project(camera);faces.push({sprite:object,x:(p.x+1)*width/2,y:(1-p.y)*height/2,z:distance});return;}
        if(!object.isMesh||!object.geometry?.attributes.position||object.userData.skipSoftware)return;
        const g=object.geometry,pos=g.attributes.position,index=g.index,count=index?index.count:pos.count;
        const modelView=new T.Matrix4().multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld),mvp=new T.Matrix4().multiplyMatrices(vp,object.matrixWorld);
        for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);for(let k=0;k<3;k++)vectors[k].fromBufferAttribute(pos,ids[k]);const center=vectors[0].clone().add(vectors[1]).add(vectors[2]).multiplyScalar(1/3).applyMatrix4(modelView);if(center.z>=-.1)continue;
          const world=vectors.map(v=>v.clone().applyMatrix4(object.matrixWorld));const normal=new T.Vector3().subVectors(world[1],world[0]).cross(new T.Vector3().subVectors(world[2],world[0])).normalize();const view=camera.position.clone().sub(world[0]);let material=object.material;if(Array.isArray(material)){const group=g.groups.find(group=>i>=group.start&&i<group.start+group.count);material=material[group?.materialIndex||0];}if(!material||material.visible===false||material.opacity<=.01)continue;if(material.side!==T.DoubleSide&&normal.dot(view)<=0)continue;
          const points=vectors.map(v=>{const depth=-v.clone().applyMatrix4(modelView).z,p=v.clone().applyMatrix4(mvp);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2,z:p.z,iw:1/depth};});
          if(points.every(p=>p.x<0)||points.every(p=>p.x>width)||points.every(p=>p.y<0)||points.every(p=>p.y>height))continue;
          faces.push({points,textureShade:material.isMeshBasicMaterial?1:.48+.7*Math.max(0,normal.dot(light)),z:center.z,color:paintColor(material,normal),alpha:material.transparent?material.opacity:1,material,uv:g.attributes.uv?ids.map(j=>({u:g.attributes.uv.getX(j),v:g.attributes.uv.getY(j)})):null});
        }
      });

      const rw=canvas.width,rh=canvas.height,frame=ctx.createImageData(rw,rh),pixels=frame.data,depths=new Float32Array(rw*rh);depths.fill(Infinity);
      const baseColor=new T.Color(background).getHex();for(let i=0;i<pixels.length;i+=4){pixels[i]=baseColor>>16;pixels[i+1]=(baseColor>>8)&255;pixels[i+2]=baseColor&255;pixels[i+3]=255;}
      const textureCache=new Map();
      for(const f of faces){
        if(f.sprite||f.alpha<.1)continue;
        const p=f.points.map(p=>({...p,x:p.x*ratio,y:p.y*ratio})),[a,b,c]=p,area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<.01)continue;
        const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(rw-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(rh-1,Math.ceil(Math.max(a.y,b.y,c.y)));
        const rgb=new T.Color(f.color).getHex();let data=null;const img=f.material.map?.image;
        if(img&&f.uv){data=textureCache.get(img);if(!data){try{data={pixels:img.getContext('2d').getImageData(0,0,img.width,img.height).data,w:img.width,h:img.height};textureCache.set(img,data);}catch{}}}
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
          const px=x+.5,py=y+.5,w1=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area,w2=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area,w3=1-w1-w2;if(w1<0||w2<0||w3<0)continue;
          const z=w1*a.z+w2*b.z+w3*c.z,index=y*rw+x;if(z>=depths[index])continue;
          let red=rgb>>16,green=(rgb>>8)&255,blue=rgb&255;
          if(data){const denom=w1*a.iw+w2*b.iw+w3*c.iw,u=(w1*f.uv[0].u*a.iw+w2*f.uv[1].u*b.iw+w3*f.uv[2].u*c.iw)/denom,v=(w1*f.uv[0].v*a.iw+w2*f.uv[1].v*b.iw+w3*f.uv[2].v*c.iw)/denom,tx=Math.max(0,Math.min(data.w-1,Math.floor(u*data.w))),ty=Math.max(0,Math.min(data.h-1,Math.floor((1-v)*data.h))),ti=(ty*data.w+tx)*4;red=Math.min(255,data.pixels[ti]*f.textureShade);green=Math.min(255,data.pixels[ti+1]*f.textureShade);blue=Math.min(255,data.pixels[ti+2]*f.textureShade);}
          const i=index*4,alpha=f.alpha;pixels[i]=red*alpha+pixels[i]*(1-alpha);pixels[i+1]=green*alpha+pixels[i+1]*(1-alpha);pixels[i+2]=blue*alpha+pixels[i+2]*(1-alpha);if(alpha>.7)depths[index]=z;
        }
      }
      ctx.setTransform(1,0,0,1,0,0);staticCache=frame;ctx.putImageData(frame,0,0);ctx.setTransform(ratio,0,0,ratio,0,0);
      for(const f of faces.filter(f=>f.sprite).sort((a,b)=>a.z-b.z)){const p=f.sprite.position.clone().applyMatrix4(camera.matrixWorldInverse),scale=height/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.abs(p.z)),w=f.sprite.scale.x*scene.scale.x*scale,h=f.sprite.scale.y*scale,img=f.sprite.material.map?.image;if(img)ctx.drawImage(img,f.x-w/2,f.y-h/2,w,h);}
      ctx.globalAlpha=1;
    }
  };
}
