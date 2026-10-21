import * as pc from 'playcanvas';

const canvas = document.getElementById('application');
const fpsEl = document.getElementById('fps');
const modeEl = document.getElementById('mode');
const objectsEl = document.getElementById('objects');
const statusEl = document.getElementById('status');

const app = new pc.Application(canvas, {
  keyboard: new pc.Keyboard(window),
  mouse: new pc.Mouse(canvas),
  touch: new pc.TouchDevice(canvas),
  graphicsDeviceOptions: { antialias: true, alpha: false }
});

app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
app.start();
window.addEventListener('resize', () => app.resizeCanvas());

app.scene.ambientLight = new pc.Color(0.35, 0.42, 0.48);
app.scene.exposure = 1.05;

function material(rgb, opts = {}) {
  const m = new pc.StandardMaterial();
  m.diffuse = new pc.Color(rgb[0], rgb[1], rgb[2]);
  m.metalness = opts.metalness || 0;
  m.gloss = opts.gloss ?? 0.45;
  if (opts.opacity !== undefined) {
    m.opacity = opts.opacity;
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = opts.opacity >= 1;
  }
  if (opts.emissive) {
    m.emissive = new pc.Color(...opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  m.update();
  return m;
}

const mats = {
  grass: material([0.20, 0.46, 0.25]),
  grass2: material([0.16, 0.38, 0.20]),
  path: material([0.49, 0.38, 0.26]),
  stone: material([0.47, 0.52, 0.56]),
  darkStone: material([0.28, 0.32, 0.35]),
  roof: material([0.40, 0.12, 0.08]),
  wood: material([0.46, 0.25, 0.12]),
  leaf: material([0.12, 0.36, 0.16]),
  water: material([0.08, 0.38, 0.62], { gloss: 0.8 }),
  buildPad: material([0.21, 0.25, 0.31]),
  player: material([0.95, 0.64, 0.18]),
  playerAccent: material([0.12, 0.27, 0.48]),
  remote: material([0.45, 0.72, 0.94]),
  remoteAccent: material([0.20, 0.40, 0.61]),
  build: material([0.77, 0.54, 0.25]),
  ghost: material([0.35, 0.90, 0.78], { opacity: 0.42, emissive: [0.08, 0.35, 0.28], emissiveIntensity: 0.6 }),
  portal: material([0.38, 0.18, 0.68], { emissive: [0.35, 0.10, 0.72], emissiveIntensity: 1.4 })
};

function primitive(name, type, position, scale, mat, parent = app.root) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type });
  e.setPosition(position[0], position[1], position[2]);
  e.setLocalScale(scale[0], scale[1], scale[2]);
  e.render.material = mat;
  parent.addChild(e);
  return e;
}

function addBox(name, x, y, z, sx, sy, sz, mat) {
  return primitive(name, 'box', [x, y, z], [sx, sy, sz], mat);
}

// Lighting
const sun = new pc.Entity('Sun');
sun.addComponent('light', {
  type: 'directional',
  color: new pc.Color(1, 0.92, 0.78),
  intensity: 1.65,
  castShadows: true,
  shadowBias: 0.18,
  shadowDistance: 65,
  shadowResolution: 1024
});
sun.setEulerAngles(46, -32, 0);
app.root.addChild(sun);

const fill = new pc.Entity('Fill');
fill.addComponent('light', { type: 'directional', color: new pc.Color(0.44, 0.60, 0.82), intensity: 0.28 });
fill.setEulerAngles(65, 145, 0);
app.root.addChild(fill);

// World floor and paths
addBox('Ground', 0, -0.55, 0, 82, 1, 82, mats.grass);
addBox('MainPath', 0, -0.02, 0, 7, 0.08, 70, mats.path);
addBox('CrossPath', 0, -0.01, 2, 54, 0.08, 6, mats.path);
addBox('Plaza', 0, 0, 2, 17, 0.12, 17, mats.stone);

// Build yard
addBox('BuildPad', 20, 0.01, -20, 18, 0.14, 18, mats.buildPad);
for (let i = -4; i <= 4; i++) {
  addBox(`grid-x-${i}`, 20 + i * 2, 0.09, -20, 0.035, 0.025, 18, mats.darkStone);
  addBox(`grid-z-${i}`, 20, 0.09, -20 + i * 2, 18, 0.025, 0.035, mats.darkStone);
}

// Lake
addBox('Lake', -23, -0.18, 15, 20, 0.18, 14, mats.water);
addBox('LakeBankA', -23, -0.31, 7.6, 22, 0.35, 1.2, mats.grass2);
addBox('LakeBankB', -23, -0.31, 22.4, 22, 0.35, 1.2, mats.grass2);

// Settlement buildings
function house(name, x, z, width, depth, height, rotation = 0) {
  const root = new pc.Entity(name);
  root.setPosition(x, 0, z);
  root.setEulerAngles(0, rotation, 0);
  app.root.addChild(root);
  primitive(`${name}-body`, 'box', [0, height / 2, 0], [width, height, depth], mats.stone, root);
  primitive(`${name}-roof`, 'box', [0, height + 0.65, 0], [width + 0.6, 1.1, depth + 0.7], mats.roof, root);
  primitive(`${name}-door`, 'box', [0, 1.2, depth / 2 + 0.05], [1.25, 2.4, 0.14], mats.wood, root);
}

house('Hall', 10, 10, 8, 7, 4.6, -8);
house('Workshop', 14, -3, 6, 6, 3.8, 8);
house('Lodge', -10, -9, 7, 6, 4.2, 6);
house('Storehouse', -13, 5, 6, 8, 3.7, -10);

// Central tower / quest landmark
addBox('TowerBase', 0, 2.8, 28, 8, 5.6, 8, mats.darkStone);
addBox('TowerMid', 0, 7.4, 28, 6.4, 4, 6.4, mats.stone);
addBox('TowerTop', 0, 10.3, 28, 8.4, 1.4, 8.4, mats.roof);
for (const x of [-2.7, 2.7]) {
  addBox('TowerLight', x, 7.5, 24.75, 0.55, 1.6, 0.25, mats.portal);
}

// Portal gate
addBox('PortalLeft', 0, 2.6, -31, 1.4, 5.2, 1.4, mats.darkStone);
addBox('PortalRight', 6, 2.6, -31, 1.4, 5.2, 1.4, mats.darkStone);
addBox('PortalTop', 3, 5.4, -31, 7.4, 1.4, 1.4, mats.darkStone);
addBox('PortalField', 3, 2.8, -31, 4.8, 4.4, 0.18, mats.portal);

// Trees: deterministic scatter so every load is comparable during profiling.
function hash(i) {
  const x = Math.sin(i * 91.345 + 17.13) * 43758.5453;
  return x - Math.floor(x);
}

function tree(i, x, z, s) {
  const root = new pc.Entity(`Tree-${i}`);
  root.setPosition(x, 0, z);
  app.root.addChild(root);
  primitive('trunk', 'cylinder', [0, 1.5 * s, 0], [0.55 * s, 3 * s, 0.55 * s], mats.wood, root);
  primitive('crownA', 'sphere', [0, 4.0 * s, 0], [2.25 * s, 2.1 * s, 2.25 * s], mats.leaf, root);
  primitive('crownB', 'sphere', [0.85 * s, 4.25 * s, 0.25 * s], [1.45 * s, 1.35 * s, 1.45 * s], mats.leaf, root);
}

for (let i = 0; i < 72; i++) {
  const angle = hash(i) * Math.PI * 2;
  const radius = 23 + hash(i + 100) * 16;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (Math.abs(x) < 5 || (x > 10 && z < -10) || (x < -13 && z > 7)) continue;
  tree(i, x, z, 0.72 + hash(i + 300) * 0.46);
}

// Scattered rocks for draw-call / environment-density pressure.
for (let i = 0; i < 26; i++) {
  const x = -34 + hash(i + 500) * 68;
  const z = -34 + hash(i + 600) * 68;
  const s = 0.6 + hash(i + 700) * 1.4;
  const rock = primitive(`Rock-${i}`, 'sphere', [x, 0.35 * s, z], [1.2 * s, 0.75 * s, 1.0 * s], mats.darkStone);
  rock.setEulerAngles(hash(i + 800) * 20, hash(i + 900) * 180, hash(i + 1000) * 16);
}

// Player avatar
const player = new pc.Entity('Player');
player.setPosition(0, 1.05, -5);
app.root.addChild(player);
primitive('Body', 'capsule', [0, 0, 0], [0.9, 1.45, 0.9], mats.player, player);
primitive('Head', 'sphere', [0, 1.05, 0], [0.72, 0.72, 0.72], mats.playerAccent, player);
primitive('Facing', 'box', [0, 0.22, 0.53], [0.24, 0.20, 0.16], mats.playerAccent, player);

// Remote-player dummies for the renderer/networking visual target.
const remotes = [];
for (let i = 0; i < 6; i++) {
  const root = new pc.Entity(`Remote-${i + 1}`);
  app.root.addChild(root);
  primitive('Body', 'capsule', [0, 0, 0], [0.82, 1.35, 0.82], mats.remote, root);
  primitive('Head', 'sphere', [0, 1.0, 0], [0.66, 0.66, 0.66], mats.remoteAccent, root);
  remotes.push({ entity: root, phase: i * 1.047, radius: 8 + (i % 3) * 2.4, speed: 0.18 + i * 0.018 });
}

// Camera
const camera = new pc.Entity('Camera');
camera.addComponent('camera', {
  clearColor: new pc.Color(0.56, 0.76, 0.90),
  nearClip: 0.1,
  farClip: 180,
  fov: 58
});
app.root.addChild(camera);

let cameraYaw = Math.PI;
let cameraPitch = -0.28;
let cameraDistance = 8.5;
let lookDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;

canvas.addEventListener('pointerdown', (e) => {
  lookDragging = true;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
});
window.addEventListener('pointerup', () => { lookDragging = false; });
window.addEventListener('pointercancel', () => { lookDragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!lookDragging) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
  cameraYaw -= dx * 0.006;
  cameraPitch = pc.math.clamp(cameraPitch - dy * 0.0045, -0.72, 0.28);
});
canvas.addEventListener('wheel', (e) => {
  cameraDistance = pc.math.clamp(cameraDistance + e.deltaY * 0.01, 5.8, 12.5);
}, { passive: true });

// Input state shared by keyboard and touch.
const touchState = { forward: false, back: false, left: false, right: false, sprint: false };
let jumpRequested = false;
let buildMode = false;
let buildRotation = 0;
const builds = [];

function toast(text) {
  statusEl.textContent = text;
  statusEl.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => statusEl.classList.remove('show'), 1100);
}

function keyPressed(key) {
  return app.keyboard.wasPressed(key);
}

function toggleBuild() {
  buildMode = !buildMode;
  ghost.enabled = buildMode;
  modeEl.textContent = `Mode: ${buildMode ? 'Build' : 'Explore'}`;
  toast(buildMode ? 'Build mode enabled' : 'Explore mode enabled');
}

function placeBuild() {
  if (!buildMode) return;
  const p = ghost.getPosition();
  const e = primitive(`Build-${builds.length + 1}`, 'box', [p.x, p.y, p.z], [2, 2, 2], mats.build);
  e.setEulerAngles(0, buildRotation, 0);
  builds.push(e);
  objectsEl.textContent = `Builds: ${builds.length}`;
  toast('Block placed — server validation will replace this local action later');
}

function removeLastBuild() {
  const e = builds.pop();
  if (!e) return;
  e.destroy();
  objectsEl.textContent = `Builds: ${builds.length}`;
  toast('Last block removed');
}

function rotateBuild() {
  if (!buildMode) return;
  buildRotation = (buildRotation + 90) % 360;
  toast(`Build rotation ${buildRotation}°`);
}

for (const button of document.querySelectorAll('[data-hold]')) {
  const key = button.dataset.hold;
  const start = (e) => { e.preventDefault(); touchState[key] = true; };
  const stop = (e) => { e.preventDefault(); touchState[key] = false; };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
}

for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const action = button.dataset.action;
    if (action === 'jump') jumpRequested = true;
    if (action === 'build') toggleBuild();
    if (action === 'place') placeBuild();
    if (action === 'rotate') rotateBuild();
  });
}

// Build-placement ghost.
const ghost = primitive('BuildGhost', 'box', [20, 1.05, -20], [2, 2, 2], mats.ghost);
ghost.enabled = false;

let verticalVelocity = 0;
let grounded = true;
const gravity = -24;
const jumpSpeed = 9.2;
const walkSpeed = 6.0;
const sprintSpeed = 10.0;
const minWorld = -38;
const maxWorld = 38;
let elapsed = 0;

function updatePlayer(dt) {
  const forwardInput = (app.keyboard.isPressed(pc.KEY_W) || touchState.forward ? 1 : 0) - (app.keyboard.isPressed(pc.KEY_S) || touchState.back ? 1 : 0);
  const sideInput = (app.keyboard.isPressed(pc.KEY_D) || touchState.right ? 1 : 0) - (app.keyboard.isPressed(pc.KEY_A) || touchState.left ? 1 : 0);
  const sprinting = app.keyboard.isPressed(pc.KEY_SHIFT) || touchState.sprint;

  const forwardX = -Math.sin(cameraYaw);
  const forwardZ = -Math.cos(cameraYaw);
  const rightX = Math.cos(cameraYaw);
  const rightZ = -Math.sin(cameraYaw);

  let moveX = forwardX * forwardInput + rightX * sideInput;
  let moveZ = forwardZ * forwardInput + rightZ * sideInput;
  const len = Math.hypot(moveX, moveZ);
  if (len > 0.001) {
    moveX /= len;
    moveZ /= len;
    const speed = sprinting ? sprintSpeed : walkSpeed;
    const p = player.getPosition();
    p.x = pc.math.clamp(p.x + moveX * speed * dt, minWorld, maxWorld);
    p.z = pc.math.clamp(p.z + moveZ * speed * dt, minWorld, maxWorld);
    player.setPosition(p);
    player.setEulerAngles(0, Math.atan2(moveX, moveZ) * pc.math.RAD_TO_DEG, 0);
  }

  if (keyPressed(pc.KEY_SPACE)) jumpRequested = true;
  if (jumpRequested && grounded) {
    verticalVelocity = jumpSpeed;
    grounded = false;
  }
  jumpRequested = false;

  if (!grounded) {
    verticalVelocity += gravity * dt;
    const p = player.getPosition();
    p.y += verticalVelocity * dt;
    if (p.y <= 1.05) {
      p.y = 1.05;
      verticalVelocity = 0;
      grounded = true;
    }
    player.setPosition(p);
  }
}

function updateCamera() {
  const target = player.getPosition().clone();
  target.y += 1.0;
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const offset = new pc.Vec3(
    Math.sin(cameraYaw) * horizontal,
    Math.sin(-cameraPitch) * cameraDistance + 1.8,
    Math.cos(cameraYaw) * horizontal
  );
  camera.setPosition(target.clone().add(offset));
  camera.lookAt(target);
}

function updateGhost() {
  if (!buildMode) return;
  const p = player.getPosition();
  const fx = -Math.sin(cameraYaw);
  const fz = -Math.cos(cameraYaw);
  const rawX = p.x + fx * 4.2;
  const rawZ = p.z + fz * 4.2;
  const snappedX = Math.round(rawX / 2) * 2;
  const snappedZ = Math.round(rawZ / 2) * 2;
  ghost.setPosition(snappedX, 1.05, snappedZ);
  ghost.setEulerAngles(0, buildRotation, 0);
}

function updateRemotes(dt) {
  elapsed += dt;
  for (const remote of remotes) {
    const a = elapsed * remote.speed + remote.phase;
    const x = Math.cos(a) * remote.radius;
    const z = 2 + Math.sin(a) * remote.radius;
    remote.entity.setPosition(x, 1.0, z);
    remote.entity.setEulerAngles(0, (-a * pc.math.RAD_TO_DEG) + 90, 0);
  }
}

let fpsAccum = 0;
let fpsFrames = 0;
app.on('update', (dt) => {
  if (keyPressed(pc.KEY_B)) toggleBuild();
  if (keyPressed(pc.KEY_E)) placeBuild();
  if (keyPressed(pc.KEY_R)) rotateBuild();
  if (keyPressed(pc.KEY_BACKSPACE)) removeLastBuild();

  updatePlayer(dt);
  updateCamera();
  updateGhost();
  updateRemotes(dt);

  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `FPS: ${Math.round(fpsFrames / fpsAccum)}`;
    fpsAccum = 0;
    fpsFrames = 0;
  }
});

updateCamera();
toast('Prototype systems spike loaded');
