import * as pc from 'playcanvas';

const canvas = document.getElementById('application');
const fpsEl = document.getElementById('fps');
const qualityEl = document.getElementById('quality');
const playersEl = document.getElementById('players');
const modeEl = document.getElementById('mode');
const objectsEl = document.getElementById('objects');
const statusEl = document.getElementById('status');
const buildPanel = document.getElementById('buildPanel');
const buildLevelEl = document.getElementById('buildLevel');

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

app.scene.ambientLight = new pc.Color(0.34, 0.41, 0.48);
app.scene.exposure = 1.05;

function material(rgb, opts = {}) {
  const m = new pc.StandardMaterial();
  m.diffuse = new pc.Color(rgb[0], rgb[1], rgb[2]);
  m.metalness = opts.metalness || 0;
  m.gloss = opts.gloss ?? 0.42;
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
  grass2: material([0.15, 0.36, 0.19]),
  path: material([0.49, 0.38, 0.26]),
  stone: material([0.47, 0.52, 0.56]),
  darkStone: material([0.27, 0.31, 0.35]),
  roof: material([0.40, 0.12, 0.08]),
  wood: material([0.46, 0.25, 0.12]),
  leaf: material([0.12, 0.36, 0.16]),
  water: material([0.08, 0.38, 0.62], { gloss: 0.82 }),
  buildPad: material([0.21, 0.25, 0.31]),
  player: material([0.95, 0.64, 0.18]),
  playerAccent: material([0.12, 0.27, 0.48]),
  remote: material([0.45, 0.72, 0.94]),
  remoteAccent: material([0.20, 0.40, 0.61]),
  wall: material([0.72, 0.48, 0.24]),
  floor: material([0.51, 0.31, 0.14]),
  pillar: material([0.60, 0.63, 0.66]),
  crate: material([0.58, 0.34, 0.16]),
  beam: material([0.38, 0.20, 0.09]),
  ghostValid: material([0.32, 0.93, 0.70], { opacity: 0.43, emissive: [0.06, 0.38, 0.24], emissiveIntensity: 0.65 }),
  ghostInvalid: material([0.95, 0.24, 0.20], { opacity: 0.45, emissive: [0.48, 0.05, 0.03], emissiveIntensity: 0.6 }),
  portal: material([0.38, 0.18, 0.68], { emissive: [0.35, 0.10, 0.72], emissiveIntensity: 1.4 })
};

function primitive(name, type, position, scale, mat, parent = app.root) {
  const e = new pc.Entity(name);
  parent.addChild(e);
  e.addComponent('render', { type });
  e.setLocalPosition(position[0], position[1], position[2]);
  e.setLocalScale(scale[0], scale[1], scale[2]);
  e.render.material = mat;
  return e;
}

function addBox(name, x, y, z, sx, sy, sz, mat) {
  return primitive(name, 'box', [x, y, z], [sx, sy, sz], mat);
}

function toast(text, duration = 1250) {
  statusEl.textContent = text;
  statusEl.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => statusEl.classList.remove('show'), duration);
}

// -----------------------------------------------------------------------------
// Lighting and authored prototype district
// -----------------------------------------------------------------------------
const sun = new pc.Entity('Sun');
sun.addComponent('light', {
  type: 'directional',
  color: new pc.Color(1, 0.92, 0.78),
  intensity: 1.65,
  castShadows: true,
  shadowBias: 0.18,
  shadowDistance: 64,
  shadowResolution: 1024
});
sun.setEulerAngles(46, -32, 0);
app.root.addChild(sun);

const fill = new pc.Entity('Fill');
fill.addComponent('light', { type: 'directional', color: new pc.Color(0.44, 0.60, 0.82), intensity: 0.28 });
fill.setEulerAngles(65, 145, 0);
app.root.addChild(fill);

addBox('Ground', 0, -0.55, 0, 82, 1, 82, mats.grass);
addBox('MainPath', 0, -0.02, 0, 7, 0.08, 70, mats.path);
addBox('CrossPath', 0, -0.01, 2, 54, 0.08, 6, mats.path);
addBox('Plaza', 0, 0, 2, 17, 0.12, 17, mats.stone);

const BUILD_BOUNDS = { minX: 11, maxX: 29, minZ: -29, maxZ: -11 };
addBox('BuildPad', 20, 0.01, -20, 18, 0.14, 18, mats.buildPad);
for (let i = -4; i <= 4; i++) {
  addBox(`grid-x-${i}`, 20 + i * 2, 0.09, -20, 0.035, 0.025, 18, mats.darkStone);
  addBox(`grid-z-${i}`, 20, 0.09, -20 + i * 2, 18, 0.025, 0.035, mats.darkStone);
}

addBox('Lake', -23, -0.18, 15, 20, 0.18, 14, mats.water);
addBox('LakeBankA', -23, -0.31, 7.6, 22, 0.35, 1.2, mats.grass2);
addBox('LakeBankB', -23, -0.31, 22.4, 22, 0.35, 1.2, mats.grass2);

const staticColliders = [];
function addCollider(x, z, width, depth, padding = 0.2) {
  staticColliders.push({
    minX: x - width / 2 - padding,
    maxX: x + width / 2 + padding,
    minZ: z - depth / 2 - padding,
    maxZ: z + depth / 2 + padding
  });
}

function house(name, x, z, width, depth, height, rotation = 0) {
  const root = new pc.Entity(name);
  root.setPosition(x, 0, z);
  root.setEulerAngles(0, rotation, 0);
  app.root.addChild(root);
  primitive(`${name}-body`, 'box', [0, height / 2, 0], [width, height, depth], mats.stone, root);
  primitive(`${name}-roof`, 'box', [0, height + 0.65, 0], [width + 0.6, 1.1, depth + 0.7], mats.roof, root);
  primitive(`${name}-door`, 'box', [0, 1.2, depth / 2 + 0.05], [1.25, 2.4, 0.14], mats.wood, root);
  // Conservative AABB collision for this systems prototype.
  const radius = Math.max(width, depth) * 0.53;
  addCollider(x, z, radius * 2, radius * 2);
}

house('Hall', 10, 10, 8, 7, 4.6, -8);
house('Workshop', 14, -3, 6, 6, 3.8, 8);
house('Lodge', -10, -9, 7, 6, 4.2, 6);
house('Storehouse', -13, 5, 6, 8, 3.7, -10);

addBox('TowerBase', 0, 2.8, 28, 8, 5.6, 8, mats.darkStone);
addBox('TowerMid', 0, 7.4, 28, 6.4, 4, 6.4, mats.stone);
addBox('TowerTop', 0, 10.3, 28, 8.4, 1.4, 8.4, mats.roof);
addCollider(0, 28, 8.5, 8.5);
for (const x of [-2.7, 2.7]) addBox('TowerLight', x, 7.5, 24.75, 0.55, 1.6, 0.25, mats.portal);

addBox('PortalLeft', 0, 2.6, -31, 1.4, 5.2, 1.4, mats.darkStone);
addBox('PortalRight', 6, 2.6, -31, 1.4, 5.2, 1.4, mats.darkStone);
addBox('PortalTop', 3, 5.4, -31, 7.4, 1.4, 1.4, mats.darkStone);
addBox('PortalField', 3, 2.8, -31, 4.8, 4.4, 0.18, mats.portal);
addCollider(0, -31, 1.7, 1.7);
addCollider(6, -31, 1.7, 1.7);

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

for (let i = 0; i < 26; i++) {
  const x = -34 + hash(i + 500) * 68;
  const z = -34 + hash(i + 600) * 68;
  const s = 0.6 + hash(i + 700) * 1.4;
  const rock = primitive(`Rock-${i}`, 'sphere', [x, 0.35 * s, z], [1.2 * s, 0.75 * s, 1.0 * s], mats.darkStone);
  rock.setEulerAngles(hash(i + 800) * 20, hash(i + 900) * 180, hash(i + 1000) * 16);
}

// -----------------------------------------------------------------------------
// Player and rendering-pressure remote avatars
// -----------------------------------------------------------------------------
const player = new pc.Entity('Player');
player.setPosition(0, 1.05, -5);
app.root.addChild(player);
primitive('Body', 'capsule', [0, 0, 0], [0.9, 1.45, 0.9], mats.player, player);
primitive('Head', 'sphere', [0, 1.05, 0], [0.72, 0.72, 0.72], mats.playerAccent, player);
primitive('Facing', 'box', [0, 0.22, 0.53], [0.24, 0.20, 0.16], mats.playerAccent, player);

const REMOTE_COUNT = 24;
const remotes = [];
for (let i = 0; i < REMOTE_COUNT; i++) {
  const root = new pc.Entity(`Remote-${i + 1}`);
  app.root.addChild(root);
  const body = primitive('Body', 'capsule', [0, 0, 0], [0.80, 1.32, 0.80], mats.remote, root);
  const head = primitive('Head', 'sphere', [0, 0.98, 0], [0.64, 0.64, 0.64], mats.remoteAccent, root);
  remotes.push({
    root,
    body,
    head,
    phase: i * 0.618,
    radius: 7 + (i % 6) * 4.4,
    speed: 0.13 + (i % 7) * 0.014,
    centerX: ((i % 4) - 1.5) * 2.2,
    centerZ: 2 + ((i % 3) - 1) * 3.0
  });
}

// -----------------------------------------------------------------------------
// Camera: smoothing + simple obstruction avoidance
// -----------------------------------------------------------------------------
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
  cameraYaw -= dx * 0.0055;
  cameraPitch = pc.math.clamp(cameraPitch - dy * 0.0042, -0.74, 0.24);
});
canvas.addEventListener('wheel', (e) => {
  cameraDistance = pc.math.clamp(cameraDistance + e.deltaY * 0.009, 5.7, 12.2);
}, { passive: true });

const cameraSmoothed = new pc.Vec3(0, 6, 2);

// -----------------------------------------------------------------------------
// Building: local stand-in for future server-authoritative object records
// -----------------------------------------------------------------------------
const BUILD_STORAGE_KEY = 'teach-arcade-flagship-build-v2';
const GRID = 2;
const LEVEL_HEIGHT = 2.5;
const OWNER = { ownerId: 'student-local', groupId: 'blue-group', classId: 'prototype-class' };
const pieceDefs = {
  wall:   { label: 'Wall',   scale: [4, 2.5, 0.35], mat: mats.wall,   layer: 'structure' },
  floor:  { label: 'Floor',  scale: [4, 0.28, 4],   mat: mats.floor,  layer: 'surface' },
  pillar: { label: 'Pillar', scale: [0.75, 2.5, 0.75], mat: mats.pillar, layer: 'structure' },
  crate:  { label: 'Crate',  scale: [1.6, 1.6, 1.6], mat: mats.crate, layer: 'structure' },
  beam:   { label: 'Beam',   scale: [4, 0.55, 0.55], mat: mats.beam, layer: 'structure' }
};

let buildMode = false;
let buildRotation = 0;
let buildLevel = 0;
let selectedPiece = 'wall';
let ghostValid = false;
const buildRecords = [];
const buildEntities = new Map();

const ghost = primitive('BuildGhost', 'box', [20, 1.25, -20], pieceDefs.wall.scale, mats.ghostValid);
ghost.enabled = false;

function pieceFootprint(def, rotation) {
  const swap = Math.abs(rotation % 180) === 90;
  return { width: swap ? def.scale[2] : def.scale[0], depth: swap ? def.scale[0] : def.scale[2] };
}

function pieceY(def, level) {
  return level * LEVEL_HEIGHT + Math.max(def.scale[1] / 2, 0.14);
}

function isInsideBuildPad(x, z, def, rotation) {
  const fp = pieceFootprint(def, rotation);
  return x - fp.width / 2 >= BUILD_BOUNDS.minX && x + fp.width / 2 <= BUILD_BOUNDS.maxX &&
         z - fp.depth / 2 >= BUILD_BOUNDS.minZ && z + fp.depth / 2 <= BUILD_BOUNDS.maxZ;
}

function rectanglesOverlap(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 - 0.05 &&
         Math.abs(a.z - b.z) < (a.depth + b.depth) / 2 - 0.05;
}

function placementValid(x, z, piece, level, rotation, ignoreId = null) {
  const def = pieceDefs[piece];
  if (!isInsideBuildPad(x, z, def, rotation)) return false;
  const fp = pieceFootprint(def, rotation);
  const candidate = { x, z, width: fp.width, depth: fp.depth };
  return !buildRecords.some((r) => {
    if (r.id === ignoreId || r.level !== level) return false;
    if (pieceDefs[r.piece].layer !== def.layer) return false;
    const otherFp = pieceFootprint(pieceDefs[r.piece], r.rotation);
    return rectanglesOverlap(candidate, { x: r.x, z: r.z, width: otherFp.width, depth: otherFp.depth });
  });
}

function createBuildEntity(record) {
  const def = pieceDefs[record.piece];
  const e = primitive(`Build-${record.id}`, 'box', [record.x, pieceY(def, record.level), record.z], def.scale, def.mat);
  e.setEulerAngles(0, record.rotation, 0);
  e.buildId = record.id;
  buildEntities.set(record.id, e);
  return e;
}

function saveBuilds() {
  try {
    localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(buildRecords));
  } catch (error) {
    console.warn('Build persistence unavailable', error);
  }
}

function loadBuilds() {
  try {
    const stored = JSON.parse(localStorage.getItem(BUILD_STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return;
    for (const raw of stored.slice(0, 250)) {
      if (!pieceDefs[raw.piece]) continue;
      const record = {
        id: String(raw.id || `local-${Date.now()}-${buildRecords.length}`),
        piece: raw.piece,
        x: Number(raw.x),
        z: Number(raw.z),
        level: pc.math.clamp(Number(raw.level) || 0, 0, 4),
        rotation: ((Number(raw.rotation) || 0) % 360 + 360) % 360,
        ownerId: raw.ownerId || OWNER.ownerId,
        groupId: raw.groupId || OWNER.groupId,
        classId: raw.classId || OWNER.classId,
        missionId: raw.missionId || null,
        createdAt: raw.createdAt || new Date().toISOString()
      };
      if (Number.isFinite(record.x) && Number.isFinite(record.z) && isInsideBuildPad(record.x, record.z, pieceDefs[record.piece], record.rotation)) {
        buildRecords.push(record);
        createBuildEntity(record);
      }
    }
  } catch (error) {
    console.warn('Ignoring invalid saved build data', error);
  }
  objectsEl.textContent = `Builds: ${buildRecords.length}`;
}

function setSelectedPiece(piece) {
  if (!pieceDefs[piece]) return;
  selectedPiece = piece;
  document.querySelectorAll('[data-piece]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.piece === piece);
  });
  toast(`${pieceDefs[piece].label} selected`);
}

function setBuildLevel(next) {
  buildLevel = pc.math.clamp(next, 0, 4);
  buildLevelEl.textContent = `Level ${buildLevel}`;
  toast(`Build level ${buildLevel}`);
}

function toggleBuild() {
  buildMode = !buildMode;
  ghost.enabled = buildMode;
  buildPanel.classList.toggle('active', buildMode);
  modeEl.textContent = `Mode: ${buildMode ? 'Build' : 'Explore'}`;
  toast(buildMode ? 'Build mode: construction pad is active' : 'Explore mode');
}

function placeBuild() {
  if (!buildMode) return;
  if (!ghostValid) {
    toast('Placement blocked — stay inside the build pad and avoid occupied cells');
    return;
  }
  const p = ghost.getPosition();
  const record = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    piece: selectedPiece,
    x: p.x,
    z: p.z,
    level: buildLevel,
    rotation: buildRotation,
    ownerId: OWNER.ownerId,
    groupId: OWNER.groupId,
    classId: OWNER.classId,
    missionId: null,
    createdAt: new Date().toISOString()
  };
  buildRecords.push(record);
  createBuildEntity(record);
  saveBuilds();
  objectsEl.textContent = `Builds: ${buildRecords.length}`;
  toast(`${pieceDefs[selectedPiece].label} placed · owned by Blue Group`);
}

function removeAimedBuild() {
  if (!buildRecords.length) return;
  const p = player.getPosition();
  const fx = -Math.sin(cameraYaw);
  const fz = -Math.cos(cameraYaw);
  let best = null;
  let bestScore = Infinity;
  for (const record of buildRecords) {
    if (record.ownerId !== OWNER.ownerId && record.groupId !== OWNER.groupId) continue;
    const dx = record.x - p.x;
    const dz = record.z - p.z;
    const forward = dx * fx + dz * fz;
    if (forward < 0.4 || forward > 8) continue;
    const side = Math.abs(dx * (-fz) + dz * fx);
    const verticalPenalty = Math.abs(record.level - buildLevel) * 1.5;
    const score = side + verticalPenalty + forward * 0.05;
    if (side < 2.3 && score < bestScore) {
      best = record;
      bestScore = score;
    }
  }
  if (!best) {
    toast('Aim toward one of your nearby build pieces to delete it');
    return;
  }
  const index = buildRecords.findIndex((r) => r.id === best.id);
  buildRecords.splice(index, 1);
  buildEntities.get(best.id)?.destroy();
  buildEntities.delete(best.id);
  saveBuilds();
  objectsEl.textContent = `Builds: ${buildRecords.length}`;
  toast(`${pieceDefs[best.piece].label} removed`);
}

function rotateBuild() {
  if (!buildMode) return;
  buildRotation = (buildRotation + 90) % 360;
  toast(`Rotation ${buildRotation}°`);
}

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------
const touchState = { forward: false, back: false, left: false, right: false, sprint: false };
let jumpBuffer = 0;

for (const button of document.querySelectorAll('[data-hold]')) {
  const key = button.dataset.hold;
  const start = (e) => { e.preventDefault(); e.stopPropagation(); touchState[key] = true; };
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); touchState[key] = false; };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
}

for (const button of document.querySelectorAll('[data-piece]')) {
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPiece(button.dataset.piece);
  });
}

function performAction(action) {
  if (action === 'jump') jumpBuffer = 0.14;
  if (action === 'build') toggleBuild();
  if (action === 'place') placeBuild();
  if (action === 'rotate') rotateBuild();
  if (action === 'delete') removeAimedBuild();
  if (action === 'level-up') setBuildLevel(buildLevel + 1);
  if (action === 'level-down') setBuildLevel(buildLevel - 1);
}

for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    performAction(button.dataset.action);
  });
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space') performAction('jump');
  if (e.code === 'KeyB') performAction('build');
  if (e.code === 'KeyE') performAction('place');
  if (e.code === 'KeyR') performAction('rotate');
  if (e.code === 'KeyQ') performAction('level-down');
  if (e.code === 'KeyF') performAction('level-up');
  if (e.code === 'Delete' || e.code === 'Backspace') performAction('delete');
  const digit = Number(e.key);
  const pieces = ['wall', 'floor', 'pillar', 'crate', 'beam'];
  if (digit >= 1 && digit <= pieces.length) setSelectedPiece(pieces[digit - 1]);
});

// -----------------------------------------------------------------------------
// Movement controller: acceleration, deceleration, buffered jump, coyote time
// -----------------------------------------------------------------------------
const horizontalVelocity = new pc.Vec3();
let verticalVelocity = 0;
let grounded = true;
let coyoteTime = 0.12;
let playerYaw = 0;
const PLAYER_RADIUS = 0.52;
const WORLD_MIN = -39;
const WORLD_MAX = 39;
const WALK_SPEED = 6.2;
const SPRINT_SPEED = 10.2;
const GROUND_ACCEL = 34;
const GROUND_DECEL = 28;
const AIR_ACCEL = 10;
const GRAVITY = -25;
const JUMP_SPEED = 9.3;

function approach(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  return Math.max(current - amount, target);
}

function buildBlocksPlayer(x, z) {
  for (const r of buildRecords) {
    if (r.level !== 0 || r.piece === 'floor' || r.piece === 'beam') continue;
    const fp = pieceFootprint(pieceDefs[r.piece], r.rotation);
    if (x > r.x - fp.width / 2 - PLAYER_RADIUS && x < r.x + fp.width / 2 + PLAYER_RADIUS &&
        z > r.z - fp.depth / 2 - PLAYER_RADIUS && z < r.z + fp.depth / 2 + PLAYER_RADIUS) return true;
  }
  return false;
}

function collidesAt(x, z, radius = PLAYER_RADIUS) {
  for (const c of staticColliders) {
    if (x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ) return true;
  }
  return buildBlocksPlayer(x, z);
}

function moveWithCollision(p, dx, dz) {
  const nextX = pc.math.clamp(p.x + dx, WORLD_MIN, WORLD_MAX);
  if (!collidesAt(nextX, p.z)) p.x = nextX;
  else horizontalVelocity.x = 0;

  const nextZ = pc.math.clamp(p.z + dz, WORLD_MIN, WORLD_MAX);
  if (!collidesAt(p.x, nextZ)) p.z = nextZ;
  else horizontalVelocity.z = 0;
}

function shortestAngleDelta(fromDeg, toDeg) {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

function updatePlayer(dt) {
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  coyoteTime = grounded ? 0.12 : Math.max(0, coyoteTime - dt);

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
  const hasInput = len > 0.001;
  if (hasInput) {
    moveX /= len;
    moveZ /= len;
  }

  const targetSpeed = hasInput ? (sprinting ? SPRINT_SPEED : WALK_SPEED) : 0;
  const accel = grounded ? (hasInput ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL;
  horizontalVelocity.x = approach(horizontalVelocity.x, moveX * targetSpeed, accel * dt);
  horizontalVelocity.z = approach(horizontalVelocity.z, moveZ * targetSpeed, accel * dt);

  const p = player.getPosition().clone();
  moveWithCollision(p, horizontalVelocity.x * dt, horizontalVelocity.z * dt);

  if (jumpBuffer > 0 && coyoteTime > 0) {
    verticalVelocity = JUMP_SPEED;
    grounded = false;
    coyoteTime = 0;
    jumpBuffer = 0;
  }

  if (!grounded) verticalVelocity += GRAVITY * dt;
  p.y += verticalVelocity * dt;
  if (p.y <= 1.05) {
    p.y = 1.05;
    if (!grounded && verticalVelocity < -3) toast('Landing', 450);
    verticalVelocity = 0;
    grounded = true;
  } else {
    grounded = false;
  }

  player.setPosition(p);

  if (hasInput) {
    const targetYaw = Math.atan2(moveX, moveZ) * pc.math.RAD_TO_DEG;
    playerYaw += shortestAngleDelta(playerYaw, targetYaw) * (1 - Math.exp(-dt * 13));
    player.setEulerAngles(0, playerYaw, 0);
  }
}

function pointBlockedForCamera(x, z) {
  for (const c of staticColliders) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
  }
  for (const r of buildRecords) {
    if (r.piece === 'floor') continue;
    const fp = pieceFootprint(pieceDefs[r.piece], r.rotation);
    if (x > r.x - fp.width / 2 && x < r.x + fp.width / 2 && z > r.z - fp.depth / 2 && z < r.z + fp.depth / 2) return true;
  }
  return false;
}

function safeCameraPosition(target, desired) {
  const safe = desired.clone();
  const steps = 18;
  let lastT = 0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = pc.math.lerp(target.x, desired.x, t);
    const z = pc.math.lerp(target.z, desired.z, t);
    if (pointBlockedForCamera(x, z)) {
      const retreatT = Math.max(0.12, lastT - 0.04);
      safe.set(
        pc.math.lerp(target.x, desired.x, retreatT),
        pc.math.lerp(target.y, desired.y, retreatT),
        pc.math.lerp(target.z, desired.z, retreatT)
      );
      return safe;
    }
    lastT = t;
  }
  return safe;
}

function updateCamera(dt) {
  const target = player.getPosition().clone();
  target.y += 1.0;
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const desired = new pc.Vec3(
    target.x + Math.sin(cameraYaw) * horizontal,
    target.y + Math.sin(-cameraPitch) * cameraDistance + 1.8,
    target.z + Math.cos(cameraYaw) * horizontal
  );
  const safe = safeCameraPosition(target, desired);
  const alpha = 1 - Math.exp(-dt * 12);
  cameraSmoothed.set(
    pc.math.lerp(cameraSmoothed.x, safe.x, alpha),
    pc.math.lerp(cameraSmoothed.y, safe.y, alpha),
    pc.math.lerp(cameraSmoothed.z, safe.z, alpha)
  );
  camera.setPosition(cameraSmoothed);
  camera.lookAt(target);
}

function updateGhost() {
  if (!buildMode) return;
  const def = pieceDefs[selectedPiece];
  const p = player.getPosition();
  const fx = -Math.sin(cameraYaw);
  const fz = -Math.cos(cameraYaw);
  const rawX = p.x + fx * 5.2;
  const rawZ = p.z + fz * 5.2;
  const snappedX = Math.round(rawX / GRID) * GRID;
  const snappedZ = Math.round(rawZ / GRID) * GRID;
  ghost.setPosition(snappedX, pieceY(def, buildLevel), snappedZ);
  ghost.setLocalScale(def.scale[0], def.scale[1], def.scale[2]);
  ghost.setEulerAngles(0, buildRotation, 0);
  ghostValid = placementValid(snappedX, snappedZ, selectedPiece, buildLevel, buildRotation);
  ghost.render.material = ghostValid ? mats.ghostValid : mats.ghostInvalid;
}

let elapsed = 0;
function updateRemotes(dt) {
  elapsed += dt;
  const local = player.getPosition();
  let visible = 0;
  for (const remote of remotes) {
    const a = elapsed * remote.speed + remote.phase;
    const x = remote.centerX + Math.cos(a) * remote.radius;
    const z = remote.centerZ + Math.sin(a) * remote.radius;
    remote.root.setPosition(x, 1.0, z);
    remote.root.setEulerAngles(0, (-a * pc.math.RAD_TO_DEG) + 90, 0);
    const distance = Math.hypot(x - local.x, z - local.z);
    const active = distance < 43;
    remote.root.enabled = active;
    if (active) {
      visible += 1;
      const near = distance < 24;
      remote.head.enabled = near;
      remote.root.setLocalScale(near ? 1 : 0.82, near ? 1 : 0.82, near ? 1 : 0.82);
    }
  }
  playersEl.textContent = `Visible: ${visible} / ${REMOTE_COUNT} simulated`;
}

// -----------------------------------------------------------------------------
// Lightweight adaptive quality guardrail
// -----------------------------------------------------------------------------
let fpsAccum = 0;
let fpsFrames = 0;
let fpsWindows = 0;
let lowFpsWindows = 0;
function updatePerformance(dt) {
  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum < 0.6) return;
  const fps = fpsFrames / fpsAccum;
  fpsEl.textContent = `FPS: ${Math.round(fps)}`;
  fpsAccum = 0;
  fpsFrames = 0;
  fpsWindows += 1;
  if (fps < 38) lowFpsWindows += 1;
  else lowFpsWindows = Math.max(0, lowFpsWindows - 1);

  if (fpsWindows > 5 && lowFpsWindows >= 3 && app.graphicsDevice.maxPixelRatio > 1.01) {
    app.graphicsDevice.maxPixelRatio = 1;
    qualityEl.textContent = 'Quality: Performance';
    toast('Performance mode enabled automatically');
    lowFpsWindows = 0;
  }
}

loadBuilds();
setSelectedPiece('wall');
setBuildLevel(0);

app.on('update', (dt) => {
  const safeDt = Math.min(dt, 0.05);
  updatePlayer(safeDt);
  updateCamera(safeDt);
  updateGhost();
  updateRemotes(safeDt);
  updatePerformance(safeDt);
});

updateCamera(1 / 60);
toast('Foundation v2 loaded · movement + owned construction');