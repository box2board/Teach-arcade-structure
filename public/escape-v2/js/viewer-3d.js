import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

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
  return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .88, metalness: opts.metalness ?? 0, map: opts.map || null, side: opts.side || THREE.FrontSide });
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
  const stone = makeMaterial('#b2a58e', {map:wallTex});
  const floorMat = makeMaterial('#b0a38e', {map:floorTex});
  const wood = makeMaterial('#98734e', {map:woodTex});
  const darkWood = makeMaterial('#46372a', {map:woodTex});
  const iron = makeMaterial('#282b2d', {metalness:.72,roughness:.46});
  const straw = makeMaterial('#b79a58');
  const parchment = makeMaterial('#d5c59e');
  const plaster = makeMaterial('#ded0ae');
  const materials = { stone, floor: floorMat, wood, darkWood, iron, straw, paper: parchment, plaster, rough: makeMaterial('#5a4436') };

  const lighting = cfg.lighting || {};
  const hemi = lighting.hemisphere || {};
  world.add(new THREE.HemisphereLight(hemi.sky || 0xa9bbd2, hemi.ground || 0x28221b, hemi.intensity ?? 1.1));
  const ambient = lighting.ambient || {};
  world.add(new THREE.AmbientLight(ambient.color || 0xffe4bf, ambient.intensity ?? .22));
  const key = lighting.key || {};
  const keyLight = new THREE.DirectionalLight(key.color || 0xd5e0ee, key.intensity ?? 1.3);
  keyLight.position.set(...(key.position || [-4, h - .25, -3])); world.add(keyLight);
  (lighting.points || []).forEach((light) => {
    const point = new THREE.PointLight(light.color || 0xffa34f, light.intensity ?? 12, light.distance ?? 9, light.decay ?? 2);
    point.position.set(...light.position); world.add(point);
  });

  function box(parent, material, pos, size, rot = [0,0,0], cast = true, receive = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
  }
  function cyl(parent, material, pos, radiusTop, radiusBottom, height, sides=10, rot=[0,0,0]) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,sides),material);
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow=true; parent.add(mesh); return mesh;
  }
  const animatedProps=[];
  function addProp(prop) {
    const p = new THREE.Group(); p.position.set(...(prop.position || [0,0,0])); p.rotation.y = prop.rotation || 0; group.add(p);
    const mat = materials[prop.material] || wood;
    const putBox = (m, pos, size, rot) => box(p,m,pos,size,rot);
    switch (prop.kind) {
      case 'table':
        putBox(darkWood,[0,.82,0],[1.6,.13,.85]);
        for(const x of [-.68,.68]) for(const z of [-.33,.33]) putBox(wood,[x,.4,z],[.12,.8,.12],[.04,0,.04]);
        putBox(wood,[0,.38,0],[1.3,.12,.65]);
        break;
      case 'crate':
        putBox(wood,[0,.35,0],[.8,.7,.7]); for(let y=.08;y<.7;y+=.22) putBox(darkWood,[0,y,-.356],[.78,.025,.018]);
        break;
      case 'bed':
        putBox(darkWood,[0,.36,0],[2.65,.16,1.15]);
        for(const x of [-1.2,1.2]) for(const z of [-.48,.48]) putBox(wood,[x,.19,z],[.1,.38,.1]);
        putBox(straw,[0,.51,0],[2.35,.22,.97]);
        for(let i=0;i<48;i++){const q=seeded(i+77);const a=q(), b=q(), len=.15+a*.36; cyl(p, straw,[((a-.5)*2.15),.64,((b-.5)*.8)],.012,.009,len,5,[0,0,(q()-.5)*.3]);}
        putBox(parchment,[-.82,.68,-.16],[.45,.14,.32],[.04,0,-.12]);
        break;
      case 'papers':
        for(let i=0;i<4;i++) putBox(parchment,[(i%2)*.25-.1,.03,Math.floor(i/2)*.19-.08],[.36,.018,.24],[0,(i-1)*.18,0]);
        break;
      case 'writing': {
        const c=document.createElement('canvas');c.width=768;c.height=320;const x=c.getContext('2d');
        x.clearRect(0,0,c.width,c.height);const rand=seeded(1789);x.strokeStyle='rgba(37,23,19,.8)';x.fillStyle='rgba(37,23,19,.83)';x.lineWidth=3;
        x.font='italic bold 54px Georgia';x.fillText('LIBERTÉ',38,118);x.font='italic 40px Georgia';x.fillText('et droits du peuple',46,194);
        for(let i=0;i<18;i++){x.beginPath();x.moveTo(rand()*768,rand()*320);x.lineTo(rand()*768,rand()*320);x.stroke();}
        const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
        const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.8),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
        plane.position.set(0,0,0);p.add(plane);break;
      }
      case 'cup':
        cyl(p,makeMaterial('#76634e'),[0,.19,0],.18,.13,.33,12);
        cyl(p,makeMaterial('#4a3f34'),[0,.37,0],.16,.16,.025,12);
        break;
      case 'chain':
        for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,8,16),iron);t.position.set((i-1.5)*.25,.05,0);t.rotation.y=i%2?.8:0;p.add(t);}
        break;
      case 'torch': {
        putBox(darkWood,[0,-.12,0],[.12,.46,.11],[0,0,-.16]);
        const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.38,7),new THREE.MeshBasicMaterial({color:0xffa13a}));
        flame.position.set(0,.2,.04);p.add(flame);animatedProps.push(flame);
        const core=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:0xffe3a0}));
        core.position.set(0,.14,.03);p.add(core);animatedProps.push(core);
        break;
      }
      case 'door':
        putBox(darkWood,[0,1.25,0],[1.55,2.5,.17]);
        for(let x=-.6;x<=.61;x+=.3) putBox(wood,[x,1.25,.1],[.055,2.34,.025]);
        putBox(iron,[.56,1.18,.14],[.1,.1,.05]);
        break;
      case 'window':
        for(const x of [-.7,.7]) putBox(wood,[x,0,0],[.13,1.45,.15]);
        for(const y of [-.68,.68]) putBox(wood,[0,y,0],[1.48,.13,.15]);
        for(let x=-.42;x<=.43;x+=.28) putBox(iron,[x,0,.06],[.035,1.25,.035]);
        putBox(iron,[0,0,.06],[1.32,.04,.04]);
        break;
      default:
        if(prop.geometry) prop.geometry.forEach(g=>box(p,materials[g.material]||mat,g.position,g.size,g.rotation));
    }
    return p;
  }

  // A closed, connected stone shell. Openings are assembled from lintels and side piers.
  box(group, floorMat,[0,-.12,0],[w,.24,d],[0,0,0],false,true);
  box(group,stone,[0,h+.12,0],[w,.24,d]);
  box(group,stone,[-w/2,h/2,0],[.22,h,d]); box(group,stone,[w/2,h/2,0],[.22,h,d]);
  box(group,stone,[0,h/2,d/2],[w,h,.22]);
  const doorX = cfg.doorPosition?.[0] ?? 3.1, doorWidth = 1.8, doorHeight=2.8;
  const winX = cfg.windowPosition?.[0] ?? -2.6, winWidth=1.65, winHeight=1.55, winY=4.05;
  const intervals=[[-w/2,winX-winWidth/2],[winX+winWidth/2,doorX-doorWidth/2],[doorX+doorWidth/2,w/2]];
  intervals.filter(a=>a[1]>a[0]).forEach(([a,b])=>box(group,stone,[(a+b)/2,h/2,-d/2],[(b-a),h,.22]));
  box(group,stone,[winX,(winY+winHeight/2+h)/2,-d/2],[winWidth,h-(winY+winHeight/2),.22]);
  box(group,stone,[winX,(winY-winHeight/2)/2,-d/2],[winWidth,winY-winHeight/2,.22]);
  box(group,stone,[doorX,(doorHeight+h)/2,-d/2],[doorWidth,h-doorHeight,.22]);
  // Window reveal and iron bars.
  const windowGroup=new THREE.Group();windowGroup.position.set(winX,winY,-d/2+.12);group.add(windowGroup);
  for(const x of [-winWidth/2,winWidth/2]) box(windowGroup,wood,[x,0,0],[.12,winHeight+.18,.14]);
  for(const y of [-winHeight/2,winHeight/2]) box(windowGroup,wood,[0,y,0],[winWidth+.12,.12,.14]);
  for(let x=-.56;x<=.57;x+=.28) box(windowGroup,iron,[x,0,.1],[.045,winHeight,.045]);
  box(windowGroup,iron,[0,0,.1],[winWidth,.05,.05]);
  // Heavy wooden door set behind the bars of the cell opening.
  const doorGroup=new THREE.Group();doorGroup.position.set(doorX,0,-d/2+.02);group.add(doorGroup);
  for(const x of [-.82,.82]) box(doorGroup,wood,[x,doorHeight/2,.04],[.12,doorHeight,.18]);
  for(let x=-.67;x<=.68;x+=.22) box(doorGroup,iron,[x,doorHeight/2,.10],[.055,doorHeight-.16,.06]);
  for(const y of [.12,1.38,2.68]) box(doorGroup,iron,[0,y,.13],[doorWidth-.16,.075,.075]);
  // Brick seams are aligned in the same material texture across the shell.
  // Room content adds props and clue anchors as world-space scene objects.
  (cfg.props || []).forEach(addProp);
  const objects = new Map();
  (cfg.interactables || []).forEach((item) => {
    const anchor=new THREE.Group();anchor.position.set(...item.position);group.add(anchor);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(item.radius||.3,.022,8,28),new THREE.MeshBasicMaterial({color:solvedIds.has(item.id)?0x9bc6a1:0xffc96f,transparent:true,opacity:.7}));
    ring.rotation.set(...(item.rotation||[-Math.PI/2,0,0]));ring.userData.marker=true;anchor.add(ring);
    const hit=new THREE.Mesh(new THREE.SphereGeometry(item.hitRadius||.56,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.userData.interactable=item.id;anchor.add(hit);objects.set(item.id,{anchor,ring,hit});
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
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let yaw=0,pitch=0,targetYaw=0,targetPitch=0,drag=null,hoverId=null,raf=0,destroyed=false;
  const initialYaw=(cfg.startYaw||0)*Math.PI/180; targetYaw=yaw=initialYaw;
  function resize(){const rect=container.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(container);resize();
  function setLook(){const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(dir));}
  setLook();
  function hitAt(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...objects.values()].map(x=>x.hit),false);return hits[0]?.object.userData.interactable||null;}
  function down(e){if(e.button!==undefined&&e.button!==0)return;drag={x:e.clientX,y:e.clientY,moved:false,id:e.pointerId};renderer.domElement.setPointerCapture?.(e.pointerId);}
  function move(e){if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;targetYaw-=dx*.0046;targetPitch=clamp(targetPitch+dy*.0038,-.82,.82);drag.x=e.clientX;drag.y=e.clientY;}else{const id=hitAt(e);if(id!==hoverId){if(hoverId)callbacks.onFocus?.(hoverId,false);hoverId=id;if(id)callbacks.onFocus?.(id,true);renderer.domElement.style.cursor=id?'pointer':'grab';}}}
  function up(e){if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;if(!moved){const id=hitAt(e);if(id)callbacks.onInteract?.(id);}}
  const keydown=e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const amt=.12;if(e.key==='ArrowLeft')targetYaw-=amt;if(e.key==='ArrowRight')targetYaw+=amt;if(e.key==='ArrowUp')targetPitch=clamp(targetPitch+amt,-.82,.82);if(e.key==='ArrowDown')targetPitch=clamp(targetPitch-amt,-.82,.82);}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects([...objects.values()].map(x=>x.hit),false);const id=hits[0]?.object.userData.interactable;if(id)callbacks.onInteract?.(id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',()=>drag=null);renderer.domElement.addEventListener('keydown',keydown);renderer.domElement.tabIndex=0;requestAnimationFrame(()=>renderer.domElement.focus({preventScroll:true}));
  function tick(){if(destroyed)return;raf=requestAnimationFrame(tick);yaw+=(targetYaw-yaw)*.16;pitch+=(targetPitch-pitch)*.16;setLook();const t=performance.now()*.001;animatedProps.forEach((p,i)=>{p.scale.y=1+Math.sin(t*8+i)*.10;});
    for(const [id,o] of objects){if(o.ring){o.ring.material.opacity=solvedIds.has(id)?.24:(id===hoverId?.98:(.54+Math.sin(t*2.2)*.13));o.ring.scale.setScalar(1+Math.sin(t*2.2)*.04);}}
    renderer.render(world,camera);
  }tick();
  return {
    setSolved(id){solvedIds.add(id);const o=objects.get(id);if(o)o.ring.material.color.setHex(0x9bc6a1);},
    openExit(){doorGroup.rotation.y=-.85;doorGroup.position.x+=.45;},
    destroy(){destroyed=true;cancelAnimationFrame(raf);ro.disconnect();world.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});renderer.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('keydown',keydown);container.replaceChildren();}
  };
}

export { buildScene };
