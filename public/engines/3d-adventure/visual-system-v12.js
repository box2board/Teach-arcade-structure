import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v1.2 reusable visual-quality layer.
// Adventure packages provide art direction; this runtime adds atmosphere,
// landmarks, VFX, prop dressing, character accents and HUD treatment without
// changing movement, mission, checkpoint or progression systems.

const config = window.TA3DAdventure?.config || window.TA3DAdventureConfig || {};
const visual = config.visual || {};
let engine = null;
let root = null;
const animated = [];
const effects = [];

const mat = (spec = {}) => new THREE.MeshStandardMaterial({
  color: spec.color ?? 0xffffff,
  roughness: spec.roughness ?? .7,
  metalness: spec.metalness ?? .05,
  emissive: spec.emissive ?? 0x000000,
  emissiveIntensity: spec.emissiveIntensity ?? 0,
  transparent: Boolean(spec.transparent),
  opacity: spec.opacity ?? 1,
  depthWrite: spec.depthWrite ?? true,
});

function add(parent, geometry, material, position = [0,0,0], rotation = null, scale = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildSky(scene) {
  const sky = visual.sky;
  if (!sky) return;
  const geometry = new THREE.SphereGeometry(sky.radius ?? 110, 28, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(sky.top ?? 0x11152f) },
      horizonColor: { value: new THREE.Color(sky.horizon ?? 0x593b55) },
      bottomColor: { value: new THREE.Color(sky.bottom ?? 0x271d29) },
      offset: { value: sky.offset ?? .05 },
      exponent: { value: sky.exponent ?? .8 },
    },
    vertexShader: `varying vec3 vWorldPosition; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition).y+offset; float upper=pow(max(h,0.0),exponent); float lower=pow(max(-h,0.0),exponent); vec3 c=mix(horizonColor,topColor,upper); c=mix(c,bottomColor,lower); gl_FragColor=vec4(c,1.0); }`,
  });
  const dome = new THREE.Mesh(geometry, material);
  dome.frustumCulled = false;
  dome.renderOrder = -100;
  scene.add(dome);
}

function buildCelestial(parent) {
  const c = visual.celestial;
  if (!c) return;
  const moonMat = new THREE.MeshBasicMaterial({ color: c.color ?? 0xf5e7c8 });
  const moon = add(parent, new THREE.SphereGeometry(c.radius ?? 4.2, 20, 14), moonMat, c.position || [35,28,-55]);
  moon.castShadow = false;
  moon.receiveShadow = false;
  const haloMat = new THREE.MeshBasicMaterial({ color: c.halo ?? 0x9fc7ff, transparent: true, opacity: c.haloOpacity ?? .1, depthWrite: false, side: THREE.DoubleSide });
  const halo = add(parent, new THREE.RingGeometry((c.radius ?? 4.2) * 1.15, (c.radius ?? 4.2) * 1.75, 40), haloMat, c.position || [35,28,-55]);
  halo.lookAt(engine.camera.position);
  animated.push({ type: "billboard", mesh: halo });
}

function buildTerrainScatter(parent) {
  const s = visual.terrainScatter;
  if (!s?.count) return;
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const material = mat({ color: s.color ?? 0x74563d, roughness: .98 });
  const mesh = new THREE.InstancedMesh(geometry, material, s.count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let seed = s.seed ?? 17;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const minR = s.minRadius ?? 15;
  const maxR = s.maxRadius ?? 34;
  for (let i = 0; i < s.count; i += 1) {
    const a = rand() * Math.PI * 2;
    const r = minR + rand() * (maxR - minR);
    const scale = (s.minScale ?? .25) + rand() * ((s.maxScale ?? 1.2) - (s.minScale ?? .25));
    dummy.position.set(Math.cos(a)*r + (s.x ?? 0), (s.y ?? -.25), Math.sin(a)*r + (s.z ?? 0));
    dummy.rotation.set(rand()*.5, rand()*Math.PI, rand()*.35);
    dummy.scale.set(scale*(.8+rand()*.8), scale*(.45+rand()*.45), scale*(.8+rand()*.9));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

function buildDust(parent) {
  const d = visual.dust;
  if (!d?.count) return;
  const positions = new Float32Array(d.count * 3);
  let seed = d.seed ?? 91;
  const rand = () => { seed=(seed*1103515245+12345)>>>0; return seed/4294967296; };
  for (let i=0;i<d.count;i++) {
    positions[i*3] = (rand()-.5)*(d.width ?? 48) + (d.x ?? 0);
    positions[i*3+1] = .4 + rand()*(d.height ?? 5.2);
    positions[i*3+2] = (rand()-.5)*(d.depth ?? 48) + (d.z ?? 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions,3));
  const material = new THREE.PointsMaterial({ color:d.color ?? 0xe9c18b, size:d.size ?? .055, transparent:true, opacity:d.opacity ?? .32, depthWrite:false });
  const points = new THREE.Points(geometry,material);
  points.frustumCulled = false;
  parent.add(points);
  animated.push({ type:"dust", mesh:points, speed:d.speed ?? .06, base:d.z ?? 1, depth:d.depth ?? 48 });
}

function buildObservatoryArchitecture(parent) {
  const a = visual.architecture;
  if (!a) return;
  const stone = mat({ color:a.stone ?? 0x8f6f55, roughness:.86, metalness:.04 });
  const trim = mat({ color:a.trim ?? 0xc19555, roughness:.38, metalness:.48 });
  const dark = mat({ color:a.dark ?? 0x2c2a34, roughness:.58, metalness:.22 });
  const glow = mat({ color:a.glow ?? 0x76dfff, roughness:.2, metalness:.15, emissive:a.glow ?? 0x76dfff, emissiveIntensity:1.4 });

  for (const x of [-7.7,7.7]) {
    add(parent,new THREE.BoxGeometry(1.15,5.2,1.3),stone,[x,2.6,-7.2]);
    add(parent,new THREE.BoxGeometry(1.45,.32,1.55),trim,[x,5.2,-7.2]);
    const fin = add(parent,new THREE.ConeGeometry(.58,1.4,4),trim,[x,6.03,-7.2],[0,Math.PI/4,0]);
    fin.castShadow = false;
  }
  add(parent,new THREE.BoxGeometry(14.4,.55,1.0),stone,[0,5.45,-7.35]);
  add(parent,new THREE.BoxGeometry(10.6,.16,.28),glow,[0,4.95,-6.82]);

  const domePositions = a.domes || [[-5.1,7.0,-13.5,2.9],[5.1,7.0,-13.5,2.9]];
  for (const def of domePositions) {
    const [x,y,z,r] = def;
    const dome = add(parent,new THREE.SphereGeometry(r,20,10,0,Math.PI*2,0,Math.PI/2),dark,[x,y,z],[Math.PI,0,0],[1,.58,1]);
    dome.material.metalness=.35;
    add(parent,new THREE.TorusGeometry(r*.78,.08,8,30),trim,[x,y-.15,z],[Math.PI/2,0,0]);
    const cap=add(parent,new THREE.CylinderGeometry(.16,.22,1.5,8),trim,[x,y+1.55,z]);
    cap.castShadow=false;
  }

  const center = a.centerDome || [0,7.25,-15.8,3.35];
  const [cx,cy,cz,cr]=center;
  add(parent,new THREE.SphereGeometry(cr,22,12,0,Math.PI*2,0,Math.PI/2),dark,[cx,cy,cz],[Math.PI,0,0],[1,.62,1]);
  const ring=add(parent,new THREE.TorusGeometry(cr*.83,.12,10,34),glow,[cx,cy-.15,cz],[Math.PI/2,0,0]);
  animated.push({type:"spin",mesh:ring,speed:.08,axis:"z"});

  // Central armillary landmark.
  const arm = new THREE.Group();
  arm.position.set(a.armillary?.x ?? 0, a.armillary?.y ?? .2, a.armillary?.z ?? 7.2);
  parent.add(arm);
  add(arm,new THREE.CylinderGeometry(.9,1.2,.55,12),stone,[0,.28,0]);
  const orb=add(arm,new THREE.SphereGeometry(.38,14,10),glow,[0,2.05,0]);
  orb.castShadow=false;
  [0,Math.PI/3,-Math.PI/3].forEach((rot,index)=>{
    const r=add(arm,new THREE.TorusGeometry(1.65+index*.12,.055,8,32),trim,[0,2.05,0],[Math.PI/2,rot,0]);
    animated.push({type:"spin",mesh:r,speed:.12+(index*.035),axis:index%2?"y":"z"});
  });
  const pole=add(arm,new THREE.CylinderGeometry(.08,.1,3.2,8),trim,[0,1.45,0]);
  pole.castShadow=false;
}

function buildPathLights(parent) {
  const p = visual.pathLights;
  if (!p?.positions) return;
  const metal = mat({color:p.metal ?? 0x5b4939,roughness:.42,metalness:.5});
  const glow = mat({color:p.color ?? 0x80dfff,roughness:.18,emissive:p.color ?? 0x80dfff,emissiveIntensity:2.0});
  p.positions.forEach(([x,z],index)=>{
    add(parent,new THREE.CylinderGeometry(.09,.12,.55,8),metal,[x,.28,z]);
    const cap=add(parent,new THREE.SphereGeometry(.13,8,6),glow,[x,.62,z]);
    cap.castShadow=false;
    if (index % (p.lightEvery ?? 3) === 0) {
      const light=new THREE.PointLight(p.color ?? 0x80dfff,p.intensity ?? .42,p.distance ?? 4.2,2);
      light.position.set(x,.7,z);
      parent.add(light);
    }
  });
}

function upgradePrism(parent) {
  const p = visual.prism;
  if (!p) return;
  const pos=config.exterior?.energyCell;
  if (!pos) return;
  const group=new THREE.Group();
  group.position.set(pos.x,0,pos.z);
  parent.add(group);
  const glow=mat({color:p.color ?? 0x80dfff,roughness:.18,metalness:.15,emissive:p.color ?? 0x80dfff,emissiveIntensity:1.5,transparent:true,opacity:.85,depthWrite:false});
  for (let i=0;i<3;i++) {
    const ring=add(group,new THREE.TorusGeometry(1.05+i*.17,.035,7,30),glow,[0,.9,0],[Math.PI/2+i*.42,i*.7,0]);
    ring.castShadow=false;
    animated.push({type:"spin",mesh:ring,speed:.28+i*.11,axis:i===1?"y":"z"});
  }
  const light=new THREE.PointLight(p.color ?? 0x80dfff,p.lightIntensity ?? 1.2,p.lightDistance ?? 6,2);
  light.position.set(0,1.1,0);
  group.add(light);
  animated.push({type:"pulseLight",light,base:p.lightIntensity ?? 1.2,amount:.32,speed:2.8});
}

function upgradeTerminal(parent) {
  const t = visual.terminal;
  const pos=config.exterior?.terminal;
  if (!t || !pos) return;
  const frame=mat({color:t.frame ?? 0xb98a50,roughness:.38,metalness:.52});
  const glow=mat({color:t.glow ?? 0x80dfff,roughness:.15,emissive:t.glow ?? 0x80dfff,emissiveIntensity:1.35,transparent:true,opacity:.8});
  add(parent,new THREE.BoxGeometry(2.2,.12,1.55),frame,[pos.x,1.55,pos.z]);
  for (const x of [-.92,.92]) add(parent,new THREE.CylinderGeometry(.06,.08,1.05,7),frame,[pos.x+x,.98,pos.z]);
  const holo=add(parent,new THREE.PlaneGeometry(1.45,.72),glow,[pos.x,1.82,pos.z+.25],[0,0,0]);
  holo.castShadow=false;
  animated.push({type:"holo",mesh:holo,baseY:1.82});
}

function upgradeGate(parent) {
  const g=visual.gate;
  if (!g) return;
  const glow=mat({color:g.glow ?? 0xb18cff,roughness:.18,emissive:g.glow ?? 0xb18cff,emissiveIntensity:1.8});
  const trim=mat({color:g.trim ?? 0xc19555,roughness:.38,metalness:.52});
  for (const x of [-2.72,2.72]) {
    add(parent,new THREE.BoxGeometry(.22,4.35,.3),trim,[x,2.35,-7.48]);
    for (let y=.8;y<4.5;y+=.72) add(parent,new THREE.BoxGeometry(.12,.18,.08),glow,[x, y,-7.29]);
  }
  add(parent,new THREE.BoxGeometry(5.7,.22,.32),trim,[0,4.62,-7.48]);
}

function dressPlayer() {
  const p=visual.player;
  if (!p || !engine?.player) return;
  const player=engine.player;
  const dark=mat({color:p.dark ?? 0x1a2430,roughness:.46,metalness:.24});
  const brass=mat({color:p.trim ?? 0xb98a50,roughness:.4,metalness:.52});
  const glow=mat({color:p.glow ?? 0x80dfff,roughness:.12,emissive:p.glow ?? 0x80dfff,emissiveIntensity:1.6});
  const pack=new THREE.Group();
  pack.position.set(0,1.3,.44);
  player.add(pack);
  add(pack,new THREE.BoxGeometry(.58,.72,.22),dark,[0,0,0]);
  add(pack,new THREE.BoxGeometry(.42,.08,.25),brass,[0,.32,.02]);
  const light=add(pack,new THREE.BoxGeometry(.25,.08,.04),glow,[0,.08,.14]);
  light.castShadow=false;
}

function injectHudSkin() {
  const h=visual.hud;
  if (!h) return;
  const style=document.createElement("style");
  style.textContent=`
    #hud{gap:10px!important;padding:12px!important}
    .hud-card{background:linear-gradient(145deg,rgba(12,18,32,.88),rgba(29,24,42,.76))!important;border:1px solid rgba(135,214,255,.22)!important;box-shadow:0 12px 32px rgba(0,0,0,.26),inset 0 1px rgba(255,255,255,.05)!important;backdrop-filter:blur(9px)!important}
    .brand-card strong{letter-spacing:.02em;text-shadow:0 0 18px rgba(128,223,255,.18)}
    .objective-card{border-left:3px solid ${h.accent || "#80dfff"}!important}
    .status-card span{background:rgba(255,255,255,.035);border-radius:7px;padding:3px 6px}
    .eyebrow{color:${h.accent || "#80dfff"}!important;letter-spacing:.13em!important}
    .interaction-prompt,#ta3dMissionPrompt{box-shadow:0 10px 34px rgba(0,0,0,.38),0 0 24px rgba(128,223,255,.11)!important}
    #crosshair{opacity:.5!important;text-shadow:0 0 10px ${h.accent || "#80dfff"}}
    .game-dialog{background:linear-gradient(145deg,#121827,#241f31)!important;border:1px solid rgba(128,223,255,.3)!important;box-shadow:0 28px 80px rgba(0,0,0,.55)!important}
  `;
  document.head.appendChild(style);
}

function burst(position,color=0x80dfff) {
  if (!root || !position) return;
  const geometry=new THREE.RingGeometry(.25,.32,28);
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(position.x,.08,position.z);
  root.add(mesh);
  effects.push({mesh,age:0,duration:.75});
}

function onProgress(event) {
  const stage=event.detail?.stage;
  const point=stage==="cell"?config.exterior?.energyCell:stage==="entrance"?config.exterior?.gateCheckpoint:null;
  if (point) burst(point,visual.hud?.accentHex ?? 0x80dfff);
}

function update(dt,time) {
  for (const a of animated) {
    if (a.type==="billboard") a.mesh.lookAt(engine.camera.position);
    else if (a.type==="spin") a.mesh.rotation[a.axis || "z"] += dt*a.speed;
    else if (a.type==="dust") {
      a.mesh.position.z += dt*a.speed;
      if (a.mesh.position.z>a.depth*.03) a.mesh.position.z=-a.depth*.03;
    } else if (a.type==="pulseLight") a.light.intensity=a.base+Math.sin(time*a.speed)*a.amount;
    else if (a.type==="holo") {
      a.mesh.position.y=a.baseY+Math.sin(time*2.0)*.045;
      a.mesh.material.opacity=.66+Math.sin(time*3.0)*.12;
    }
  }
  for (let i=effects.length-1;i>=0;i--) {
    const e=effects[i]; e.age+=dt; const t=Math.min(1,e.age/e.duration);
    e.mesh.scale.setScalar(1+t*5); e.mesh.material.opacity=.85*(1-t);
    if (t>=1) { e.mesh.parent?.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.material.dispose(); effects.splice(i,1); }
  }
}

function apply(api) {
  if (!api || engine || visual.enabled===false) return;
  engine=api;
  root=new THREE.Group();
  root.name=`visual-${config.id || "adventure"}`;
  api.scene.add(root);
  buildSky(api.scene);
  buildCelestial(root);
  buildTerrainScatter(root);
  buildDust(root);
  buildObservatoryArchitecture(root);
  buildPathLights(root);
  upgradePrism(root);
  upgradeTerminal(root);
  upgradeGate(root);
  dressPlayer();
  injectHudSkin();
  api.onUpdate(update);
  window.addEventListener("ta3d:progress",onProgress);
  window.TA3DVisuals=Object.freeze({ id:config.id, version:"1.2", root });
}

window.addEventListener("ta3d:engine-ready",(event)=>apply(event.detail),{once:true});
if (window.TA3DEngine) apply(window.TA3DEngine);
