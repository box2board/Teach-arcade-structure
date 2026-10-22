import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { getPropBuilder } from './prop-registry.js';

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function seeded(seed = 23) {
  let n = seed >>> 0;
  return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function stoneTexture(seed = 13, floor = false) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);
  const base = ctx.createLinearGradient(0, 0, 1024, 1024);
  base.addColorStop(0, floor ? '#54483a' : '#625749');
  base.addColorStop(.55, floor ? '#40372e' : '#50483d');
  base.addColorStop(1, floor ? '#342e27' : '#39352f');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 1024);
  const rows = floor ? 9 : 12, h = 1024 / rows;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? -68 : 0, block = floor ? 220 : 290;
    for (let col = -1; col < 5; col++) {
      const x = col * block + offset + (rnd() - .5) * 10, y = row * h + 4;
      const w = block + (rnd() - .5) * 24, bh = h - 7;
      const shade = Math.round(58 + rnd() * 42);
      ctx.fillStyle = `rgba(${shade},${shade - 5},${shade - 12},.25)`;
      ctx.fillRect(x + 5, y + 5, w - 9, bh - 8);
      ctx.strokeStyle = 'rgba(20,16,13,.60)'; ctx.lineWidth = 7;
      ctx.strokeRect(x, y, w, bh);
      ctx.strokeStyle = 'rgba(203,185,155,.12)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 8, y + 5); ctx.lineTo(x + w - 9, y + 5); ctx.stroke();
    }
  }
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * 1024, y = rnd() * 1024, r = 1 + rnd() * 12;
    ctx.fillStyle = rnd() > .5 ? 'rgba(17,14,12,.08)' : 'rgba(225,207,178,.035)';
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r, rnd() * TAU, 0, TAU); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(floor ? 2 : 1, floor ? 2 : 1);
  tex.anisotropy = 4;
  return tex;
}

function parchmentTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const x = c.getContext('2d'); const rnd = seeded(1789);
  const wash = x.createLinearGradient(0, 0, 512, 512);
  wash.addColorStop(0, '#e1d2ad'); wash.addColorStop(1, '#bca77c');
  x.fillStyle = wash; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1800; i++) {
    const px = rnd() * 512, py = rnd() * 512;
    x.fillStyle = rnd() > .5 ? 'rgba(83,61,37,.08)' : 'rgba(255,246,214,.12)';
    x.fillRect(px, py, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  x.strokeStyle = 'rgba(76,47,31,.68)'; x.lineWidth = 3;
  for (let row = 0; row < 5; row++) {
    const y = 104 + row * 62;
    x.beginPath(); x.moveTo(46 + rnd() * 24, y);
    x.bezierCurveTo(150, y - 5, 300, y + 5, 454 - rnd() * 34, y + (rnd() - .5) * 5);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const x = c.getContext('2d'); const rnd = seeded(109);
  x.fillStyle = '#493426'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    x.strokeStyle = `rgba(${120 + rnd() * 55},${75 + rnd() * 38},${38 + rnd() * 20},.18)`;
    x.lineWidth = 1 + rnd() * 5; x.beginPath();
    const y = rnd() * 512; x.moveTo(0, y); x.bezierCurveTo(120, y - 12, 350, y + 13, 512, y); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function makeMaterial(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .88, metalness: opts.metalness ?? 0, map: opts.map || null, bumpMap: opts.bumpMap || null, bumpScale: opts.bumpScale ?? .03, side: opts.side || THREE.FrontSide });
}

function buildScene(container, room, callbacks, solvedIds) {
  const cfg = room.scene || {};
  const dims = cfg.dimensions || [10, 5.6, 10];
  const [w, h, d] = dims;
  const group = new THREE.Group();
  const world = new THREE.Scene();
  world.background = new THREE.Color(cfg.background || '#171714');
  world.fog = new THREE.Fog(cfg.fog || '#211f1a', 10, 24);

  const wallTex = stoneTexture(cfg.textureSeed || 13);
  const floorTex = stoneTexture((cfg.textureSeed || 13) + 1, true);
  const woodTex = woodTexture();
  const stone = makeMaterial('#b2a58e', {map:wallTex,bumpMap:wallTex,bumpScale:.04,roughness:.96});
  const floorMat = makeMaterial('#b0a38e', {map:floorTex,bumpMap:floorTex,bumpScale:.07,roughness:.98});
  const wood = makeMaterial('#98734e', {map:woodTex,bumpMap:woodTex,bumpScale:.025,roughness:.9});
  const darkWood = makeMaterial('#46372a', {map:woodTex,bumpMap:woodTex,bumpScale:.025,roughness:.93});
  const iron = makeMaterial('#282b2d', {metalness:.72,roughness:.46});
  const straw = makeMaterial('#b79a58');
  const parchment = makeMaterial('#ffffff', {map:parchmentTexture()});
  const plaster = makeMaterial('#ded0ae');
  const materials = { stone, floor: floorMat, wood, darkWood, iron, straw, paper: parchment, plaster, ink: makeMaterial('#66513a'), rough: makeMaterial('#5a4436') };

  const animatedProps=[]; const animatedLights=[];
  const lighting = cfg.lighting || {};
  const hemi = lighting.hemisphere || {};
  world.add(new THREE.HemisphereLight(hemi.sky || 0xa9bbd2, hemi.ground || 0x28221b, hemi.intensity ?? 1.1));
  const ambient = lighting.ambient || {};
  world.add(new THREE.AmbientLight(ambient.color || 0xffe4bf, ambient.intensity ?? .22));
  const key = lighting.key || {};
  const keyLight = new THREE.DirectionalLight(key.color || 0xd5e0ee, key.intensity ?? 1.3);
  keyLight.position.set(...(key.position || [-4, h - .25, -3])); keyLight.castShadow=key.castShadow !== false; if(keyLight.castShadow){keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-7;keyLight.shadow.camera.right=7;keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;keyLight.shadow.camera.near=.1;keyLight.shadow.camera.far=28;keyLight.shadow.bias=-.00015;keyLight.shadow.normalBias=.06;keyLight.shadow.radius=3;} world.add(keyLight);
  (lighting.points || []).forEach((light, index) => {
    const point = new THREE.PointLight(light.color || 0xffa34f, light.intensity ?? 12, light.distance ?? 9, light.decay ?? 2);
    point.position.set(...light.position); world.add(point);
    if(light.flicker !== false) animatedLights.push({light:point,base:point.intensity,phase:index*1.73});
  });

  function box(parent, material, pos, size, rot = [0,0,0], cast = true, receive = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
  }
  function cyl(parent, material, pos, radiusTop, radiusBottom, height, sides=10, rot=[0,0,0]) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,sides),material);
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow=true; parent.add(mesh); return mesh;
  }
  // A closed, connected stone shell. Openings are assembled from lintels and side piers.
  box(group, floorMat,[0,-.12,0],[w,.24,d],[0,0,0],false,true);
  box(group,stone,[0,h+.12,0],[w,.24,d]);
  box(group,stone,[-w/2,h/2,0],[.22,h,d]); box(group,stone,[w/2,h/2,0],[.22,h,d]);
  box(group,stone,[0,h/2,d/2],[w,h,.22]);
  const openings=(cfg.openings||[]).filter(o=>!o.wall||o.wall==='front').slice().sort((a,b)=>a.x-b.x);
  let doorGroup=null;
  if(!openings.length) box(group,stone,[0,h/2,-d/2],[w,h,.22]);
  else {
    let cursor=-w/2;
    for(const opening of openings){
      const x=opening.x,width=opening.width,height=opening.height;
      const minX=Math.max(-w/2,x-width/2),maxX=Math.min(w/2,x+width/2);
      const bottom=opening.kind.includes('door')?0:Math.max(0,(opening.y||height/2)-height/2);
      const top=Math.min(h,(opening.y||height/2)+height/2);
      if(minX>cursor)box(group,stone,[(cursor+minX)/2,h/2,-d/2],[minX-cursor,h,.22]);
      if(bottom>0)box(group,stone,[x,bottom/2,-d/2],[maxX-minX,bottom,.22]);
      if(top<h)box(group,stone,[x,(top+h)/2,-d/2],[maxX-minX,h-top,.22]);
      const feature=new THREE.Group();
      feature.position.set(x,opening.kind.includes('door')?bottom:(opening.y||height/2),-d/2+.10);
      group.add(feature);
      const frame=opening.kind.includes('door')?wood:wood;
      for(const fx of [-width/2,width/2])box(feature,frame,[fx,height/2,0],[.11,height,.14]);
      for(const fy of (opening.kind.includes('door')?[.12,height-.12]:[-height/2,height/2]))box(feature,frame,[0,fy,0],[width,.11,.14]);
      const barCount=Math.max(4,Math.floor(width/.24));
      for(let i=1;i<barCount;i++){
        const bx=-width/2+(width/barCount)*i;
        box(feature,iron,[bx,height/2,.09],[.045,height-.12,.055]);
      }
      if(opening.kind.includes('barred')||opening.kind.includes('door'))box(feature,iron,[0,height*.52,.12],[width-.12,.06,.06]);
      if(opening.kind.includes('door'))doorGroup=feature;
      cursor=maxX;
    }
    if(cursor<w/2)box(group,stone,[(cursor+w/2)/2,h/2,-d/2],[w/2-cursor,h,.22]);
  }
  // Brick seams are aligned in the same material texture across the shell.
  // Room content adds props and clue anchors as world-space scene objects.
  (cfg.props || []).forEach((prop) => {
    const builder = getPropBuilder(prop.kind);
    const env = { THREE, group, materials, box, cyl, makeMaterial, animatedProps, seeded };
    if (builder) builder(prop, env);
    else if (Array.isArray(prop.geometry)) {
      const p = new THREE.Group();
      p.position.set(...(prop.position || [0,0,0]));
      p.rotation.y = prop.rotation || 0;
      group.add(p);
      prop.geometry.forEach((item) => {
        const material = materials[item.material] || wood;
        const shape = item.shape || 'box';
        let mesh;
        if (shape === 'sphere') mesh = new THREE.Mesh(new THREE.SphereGeometry(item.radius || .25, 12, 10), material);
        else if (shape === 'cylinder') mesh = new THREE.Mesh(new THREE.CylinderGeometry(item.radiusTop ?? .2, item.radiusBottom ?? .2, item.height || .5, item.segments || 12), material);
        else mesh = new THREE.Mesh(new THREE.BoxGeometry(...(item.size || [.5,.5,.5])), material);
        mesh.position.set(...(item.position || [0,0,0]));
        mesh.rotation.set(...(item.rotation || [0,0,0]));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        p.add(mesh);
      });
    } else console.warn(`No prop builder registered for "${prop.kind}".`);
  });
  const objects = new Map();
  (cfg.interactables || []).forEach((item) => {
    const anchor=new THREE.Group();anchor.position.set(...item.position);group.add(anchor);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(item.radius||.3,.032,8,28),new THREE.MeshBasicMaterial({color:solvedIds.has(item.id)?0x9bc6a1:0xffc96f,transparent:true,opacity:.72}));
    ring.rotation.set(...(item.rotation||[-Math.PI/2,0,0]));ring.userData.marker=true;anchor.add(ring);
    const hit=new THREE.Mesh(new THREE.SphereGeometry(item.hitRadius||.56,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.userData.interactable=item.id;anchor.add(hit);objects.set(item.id,{anchor,ring,hit,label:item.label||item.id});
  });
  world.add(group);

  const camera=new THREE.PerspectiveCamera(68,1,.1,60);
  camera.position.set(0,1.64,1.75);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive three dimensional room. Drag or swipe to look around; tap a highlighted object to investigate.');
  container.replaceChildren(renderer.domElement);
  const focusPrompt=document.createElement('button');
  focusPrompt.type='button';focusPrompt.className='scene-focus-prompt';focusPrompt.hidden=true;
  focusPrompt.setAttribute('aria-live','polite');
  container.appendChild(focusPrompt);
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let yaw=0,pitch=0,targetYaw=0,targetPitch=0,drag=null,hoverId=null,aimId=null,raf=0,destroyed=false;
  const initialYaw=(cfg.startYaw||0)*Math.PI/180; targetYaw=yaw=initialYaw;
  function resize(){const rect=container.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(container);resize();
  let exitOpen=false;const exitDoorStartX=doorGroup?.position.x||0;
  function setLook(){const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(dir));}
  setLook();
  function interact(id){if(!id)return;focusPrompt.hidden=true;aimId=null;callbacks.onInteract?.(id);}
  function centerHit(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects([...objects.values()].map(x=>x.hit),false);return hits[0]?.object.userData.interactable||null;}
  function hitAt(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...objects.values()].map(x=>x.hit),false);return hits[0]?.object.userData.interactable||null;}
  focusPrompt.addEventListener('pointerdown',e=>e.stopPropagation());
  focusPrompt.addEventListener('click',e=>{e.stopPropagation();interact(aimId);});
  function down(e){if(e.button!==undefined&&e.button!==0)return;drag={x:e.clientX,y:e.clientY,moved:false,id:e.pointerId};renderer.domElement.setPointerCapture?.(e.pointerId);}
  function move(e){if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;targetYaw-=dx*.0046;targetPitch=clamp(targetPitch+dy*.0038,-.82,.82);drag.x=e.clientX;drag.y=e.clientY;}else{const id=hitAt(e);if(id!==hoverId){if(hoverId)callbacks.onFocus?.(hoverId,false);hoverId=id;if(id)callbacks.onFocus?.(id,true);renderer.domElement.style.cursor=id?'pointer':'grab';}}}
  function up(e){if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;if(!moved){const id=hitAt(e);if(id)interact(id);}}
  const keydown=e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const amt=.12;if(e.key==='ArrowLeft')targetYaw-=amt;if(e.key==='ArrowRight')targetYaw+=amt;if(e.key==='ArrowUp')targetPitch=clamp(targetPitch+amt,-.82,.82);if(e.key==='ArrowDown')targetPitch=clamp(targetPitch-amt,-.82,.82);}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects([...objects.values()].map(x=>x.hit),false);const id=hits[0]?.object.userData.interactable;if(id)interact(id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',()=>drag=null);renderer.domElement.addEventListener('keydown',keydown);renderer.domElement.tabIndex=0;requestAnimationFrame(()=>renderer.domElement.focus({preventScroll:true}));
  function tick(){if(destroyed)return;raf=requestAnimationFrame(tick);yaw+=(targetYaw-yaw)*.16;pitch+=(targetPitch-pitch)*.16;setLook();const t=performance.now()*.001;animatedProps.forEach((p,i)=>{p.scale.y=1+Math.sin(t*8+i)*.10;});animatedLights.forEach(({light,base,phase})=>{light.intensity=base*(.94+Math.sin(t*8+phase)*.045+Math.sin(t*13.2+phase)*.02);});if(exitOpen&&doorGroup){doorGroup.rotation.y+=(-.86-doorGroup.rotation.y)*.075;doorGroup.position.x+=(exitDoorStartX+.48-doorGroup.position.x)*.075;}
    const nextAim=centerHit();
    if(nextAim!==aimId){
      aimId=nextAim;
      focusPrompt.hidden=!aimId;
      if(aimId){const target=objects.get(aimId);const action=solvedIds.has(aimId)?'Review':'Investigate';focusPrompt.textContent=`${action} · ${target?.label||aimId}`;focusPrompt.setAttribute('aria-label',`${action} ${target?.label||aimId}`);}
    }
    for(const [id,o] of objects){if(o.ring){o.ring.material.opacity=solvedIds.has(id)?.26:(id===hoverId||id===aimId?.98:(.64+Math.sin(t*2.2)*.12));o.ring.scale.setScalar(1+(id===aimId?.09:.04)*Math.sin(t*2.2));}}
    renderer.render(world,camera);
  }tick();
  return {
    setSolved(id){solvedIds.add(id);const o=objects.get(id);if(o)o.ring.material.color.setHex(0x9bc6a1);},
    openExit(){exitOpen=true;},
    destroy(){destroyed=true;cancelAnimationFrame(raf);ro.disconnect();world.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});renderer.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('keydown',keydown);container.replaceChildren();}
  };
}

export { buildScene };
