import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v0.5 interaction / traversal layer.
// Movement remains owned by main-v2.js. This module adds optional world systems
// around that controller: local collision obstacles, alternate access, physical
// interaction animation, secrets, and better pickup feedback.

let scene = null;
let player = null;
let enhanced = false;
let lastFrameTime = performance.now();
let lastSafePosition = null;
let nearestInteraction = null;
let transitioning = false;
let secretsFound = 0;
let previousCellStatus = "Not found";
let previousShardStatus = "0 / 3";

const blockers = [];
const interactions = [];
const effects = [];
const animatedParts = [];

const ui = {
  prompt: document.getElementById("interactionPrompt"),
  promptText: document.getElementById("interactionText"),
  objectiveSubtext: document.getElementById("objectiveSubtext"),
  cellStatus: document.getElementById("cellStatus"),
  gateStatus: document.getElementById("gateStatus"),
};

const darkMat = () => new THREE.MeshStandardMaterial({ color: 0x253341, roughness: .62, metalness: .24 });
const steelMat = () => new THREE.MeshStandardMaterial({ color: 0x647687, roughness: .56, metalness: .28 });
const warningMat = () => new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: .68, metalness: .06 });
const cyanMat = () => new THREE.MeshStandardMaterial({
  color: 0x67e8f9,
  roughness: .28,
  metalness: .16,
  emissive: 0x0891b2,
  emissiveIntensity: 1.4,
});
const greenMat = () => new THREE.MeshStandardMaterial({
  color: 0x4ade80,
  roughness: .3,
  metalness: .12,
  emissive: 0x15803d,
  emissiveIntensity: 1.35,
});

function addMesh(parent, geometry, material, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ensureUi() {
  const status = document.querySelector(".status-card");
  if (status && !document.getElementById("secretStatus")) {
    const line = document.createElement("span");
    line.innerHTML = '<b>Secrets</b> <span id="secretStatus">0 / 2</span>';
    status.appendChild(line);
  }

  if (!document.getElementById("ta3dToast")) {
    const toast = document.createElement("div");
    toast.id = "ta3dToast";
    toast.style.cssText = [
      "position:fixed",
      "left:50%",
      "top:18%",
      "transform:translate(-50%,-8px)",
      "z-index:9000",
      "padding:10px 14px",
      "border:1px solid rgba(125,211,252,.55)",
      "border-radius:12px",
      "background:rgba(8,20,32,.88)",
      "color:#e8f8ff",
      "font:700 13px/1.25 system-ui,sans-serif",
      "letter-spacing:.02em",
      "opacity:0",
      "transition:opacity .18s ease, transform .18s ease",
      "pointer-events:none",
      "box-shadow:0 8px 28px rgba(0,0,0,.28)",
    ].join(";");
    document.body.appendChild(toast);
  }

  if (!document.getElementById("ta3dTransition")) {
    const fade = document.createElement("div");
    fade.id = "ta3dTransition";
    fade.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:8500",
      "background:#07111b",
      "opacity:0",
      "transition:opacity .18s ease",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(fade);
  }
}

let toastTimer = null;
function toast(message) {
  const node = document.getElementById("ta3dToast");
  if (!node) return;
  node.textContent = message;
  node.style.opacity = "1";
  node.style.transform = "translate(-50%,0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translate(-50%,-8px)";
  }, 1900);
}

function pulseObjective(message) {
  if (!ui.objectiveSubtext) return;
  ui.objectiveSubtext.textContent = message;
  ui.objectiveSubtext.animate?.([
    { opacity: .4, transform: "translateY(2px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 260, easing: "ease-out" });
}

function registerBlocker({ x, z, width, depth, height = 10, active = true }) {
  const blocker = {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
    height,
    active,
  };
  blockers.push(blocker);
  return blocker;
}

function registerInteraction({ id, x, z, radius = 1.65, label, enabled = () => true, interact }) {
  const entry = { id, position: new THREE.Vector2(x, z), radius, label, enabled, interact };
  interactions.push(entry);
  return entry;
}

function buildVent(parent, x, z, inside = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);

  const frameMat = darkMat();
  const panelMat = steelMat();
  const glowMat = cyanMat();

  addMesh(group, new THREE.BoxGeometry(.22, 1.7, 2.25), frameMat, 0, .86, 0);
  addMesh(group, new THREE.BoxGeometry(.25, .12, 2.0), glowMat, inside ? .14 : -.14, 1.68, 0, false);

  const hinge = new THREE.Group();
  hinge.position.set(inside ? .16 : -.16, .86, -1.0);
  group.add(hinge);
  const hatch = addMesh(hinge, new THREE.BoxGeometry(.13, 1.42, 1.86), panelMat, 0, 0, .93);
  for (let i = -1; i <= 1; i += 1) {
    addMesh(hatch, new THREE.BoxGeometry(.035, .92, .13), frameMat, inside ? .08 : -.08, 0, i * .45, false);
  }

  const indicator = addMesh(group, new THREE.BoxGeometry(.08, .22, .36), glowMat, inside ? .16 : -.16, 1.38, .72, false);
  indicator.material.emissiveIntensity = 1.8;

  const state = { group, hinge, target: 0, inside };
  animatedParts.push({ type: "vent", state });
  return state;
}

function buildGateEnhancement(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const steel = steelMat();
  const dark = darkMat();
  const red = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: .35,
    emissive: 0x7f1d1d,
    emissiveIntensity: 1.25,
  });

  const rods = [];
  const lamps = [];
  [-2.5, 2.5].forEach((x) => {
    addMesh(group, new THREE.BoxGeometry(.52, 4.7, .44), dark, x, 2.5, -7.46);
    const rod = addMesh(group, new THREE.CylinderGeometry(.12, .12, 2.8, 10), steel, x, 2.55, -7.15);
    rods.push(rod);
    const lamp = addMesh(group, new THREE.SphereGeometry(.16, 10, 8), red.clone(), x, 4.92, -7.18, false);
    lamps.push(lamp);
  });

  const state = { group, rods, lamps, open: false };
  animatedParts.push({ type: "gate", state });
  return state;
}

function buildSwitchLever(parent) {
  const group = new THREE.Group();
  group.position.set(2.8, 1.12, -5.82);
  parent.add(group);

  const base = addMesh(group, new THREE.BoxGeometry(.58, .78, .24), darkMat(), 0, 0, 0);
  base.rotation.x = -.05;

  const pivot = new THREE.Group();
  pivot.position.set(0, .12, -.16);
  group.add(pivot);
  const handle = addMesh(pivot, new THREE.CylinderGeometry(.07, .07, .58, 10), warningMat(), 0, .28, 0);
  handle.rotation.z = 0;
  addMesh(pivot, new THREE.SphereGeometry(.11, 10, 8), warningMat(), 0, .58, 0, false);

  const state = { group, pivot, target: -.55, activated: false };
  pivot.rotation.x = -.55;
  animatedParts.push({ type: "lever", state });
  return state;
}

function buildServiceYard(parent) {
  const group = new THREE.Group();
  group.name = "v5-service-yard";
  parent.add(group);

  const steel = steelMat();
  const warning = warningMat();
  const dark = darkMat();

  // A low service barrier: jump it for the direct route or simply walk around it.
  addMesh(group, new THREE.BoxGeometry(.44, .72, 5.1), dark, 14.15, .36, 9.2);
  for (let z = 7.25; z <= 11.15; z += .78) {
    addMesh(group, new THREE.BoxGeometry(.47, .12, .42), warning, 13.91, .52, z, false);
  }
  addMesh(group, new THREE.BoxGeometry(.32, 1.65, .32), steel, 14.15, .82, 6.6);
  addMesh(group, new THREE.BoxGeometry(.32, 1.65, .32), steel, 14.15, .82, 11.8);

  // A visual landing strip behind the barrier gives the player a reason to investigate.
  const strip = addMesh(group, new THREE.PlaneGeometry(5.2, 4.4), new THREE.MeshStandardMaterial({ color: 0x465760, roughness: .96 }), 16.7, .035, 9.2, false);
  strip.rotation.x = -Math.PI / 2;

  const blocker = registerBlocker({ x: 14.15, z: 9.2, width: .72, depth: 5.45, height: .72 });

  const cache = new THREE.Group();
  cache.position.set(16.45, 0, 9.2);
  group.add(cache);
  const cacheBase = addMesh(cache, new THREE.BoxGeometry(1.35, .72, 1.05), dark, 0, .36, 0);
  cacheBase.material.metalness = .2;
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, .72, .5);
  cache.add(lidPivot);
  addMesh(lidPivot, new THREE.BoxGeometry(1.4, .16, 1.08), steel, 0, 0, -.5);
  const cacheLight = addMesh(cache, new THREE.BoxGeometry(.54, .09, .05), cyanMat(), 0, .45, -.55, false);

  const cacheState = { cache, lidPivot, cacheLight, opened: false, target: 0 };
  animatedParts.push({ type: "cache", state: cacheState });

  registerInteraction({
    id: "service-cache",
    x: 16.45,
    z: 9.2,
    radius: 1.65,
    label: () => cacheState.opened ? "Maintenance cache opened" : "Open maintenance cache",
    enabled: () => !cacheState.opened,
    interact: () => openSecretCache(cacheState, "Service-yard cache found"),
  });

  window.TA3DPerformance?.registerZone({
    id: "v5-service-yard",
    object: group,
    x: 15.2,
    z: 9.2,
    activeDistance: 31,
    onChange: (active) => { blocker.active = active; },
  });
}

function buildMaintenanceBay(parent) {
  const group = new THREE.Group();
  group.name = "v5-maintenance-bay";
  parent.add(group);

  const exteriorVent = buildVent(group, -8.63, -12.1, false);
  const interiorVent = buildVent(group, -6.55, -12.1, true);

  // Inside utility details make the bypass destination feel intentional.
  const steel = steelMat();
  const dark = darkMat();
  [-5.95, -5.45].forEach((x, i) => {
    const pipe = addMesh(group, new THREE.CylinderGeometry(.11, .11, 3.0, 8), steel, x, 1.55, -12.9 - i * .45);
    pipe.rotation.z = 0;
  });
  addMesh(group, new THREE.BoxGeometry(2.0, .1, 2.8), new THREE.MeshStandardMaterial({ color: 0x53626b, roughness: .92 }), -5.55, .52, -13.5, false);

  // Hidden locker inside the maintenance bay.
  const locker = new THREE.Group();
  locker.position.set(-5.25, .5, -14.15);
  group.add(locker);
  addMesh(locker, new THREE.BoxGeometry(1.1, 1.7, .7), dark, 0, .85, 0);
  const lockerDoorPivot = new THREE.Group();
  lockerDoorPivot.position.set(-.5, .85, -.37);
  locker.add(lockerDoorPivot);
  addMesh(lockerDoorPivot, new THREE.BoxGeometry(1.0, 1.55, .09), steel, .5, 0, 0);
  const lockerLight = addMesh(locker, new THREE.BoxGeometry(.35, .08, .05), cyanMat(), .1, 1.45, -.4, false);

  const lockerState = { opened: false, target: 0, lidPivot: lockerDoorPivot, cacheLight: lockerLight };
  animatedParts.push({ type: "locker", state: lockerState });

  registerInteraction({
    id: "vent-outside",
    x: -8.63,
    z: -12.1,
    radius: 1.55,
    label: () => "Enter maintenance vent",
    enabled: () => !transitioning,
    interact: () => useVent(exteriorVent, new THREE.Vector3(-6.55, 0, -12.1), true),
  });

  registerInteraction({
    id: "vent-inside",
    x: -6.55,
    z: -12.1,
    radius: 1.45,
    label: () => "Exit maintenance vent",
    enabled: () => !transitioning,
    interact: () => useVent(interiorVent, new THREE.Vector3(-8.63, 0, -12.1), false),
  });

  registerInteraction({
    id: "maintenance-locker",
    x: -5.25,
    z: -14.15,
    radius: 1.5,
    label: () => lockerState.opened ? "Locker searched" : "Search maintenance locker",
    enabled: () => !lockerState.opened,
    interact: () => openSecretCache(lockerState, "Maintenance-bay locker found"),
  });

  window.TA3DPerformance?.registerZone({
    id: "v5-maintenance-bay",
    object: group,
    x: -7.0,
    z: -13.0,
    activeDistance: 29,
  });
}

function openSecretCache(cacheState, message) {
  if (cacheState.opened) return;
  cacheState.opened = true;
  cacheState.target = -1.15;
  secretsFound = Math.min(2, secretsFound + 1);
  const status = document.getElementById("secretStatus");
  if (status) status.textContent = `${secretsFound} / 2`;
  toast(`SECRET ${secretsFound}/2 · ${message}`);
  pulseObjective(secretsFound === 2 ? "Both hidden maintenance caches discovered." : "You found an optional maintenance cache.");
  spawnPlayerPulse(0x67e8f9);
}

function useVent(ventState, destination, entering) {
  if (transitioning) return;
  transitioning = true;
  ventState.target = ventState.inside ? 1.35 : -1.35;
  toast(entering ? "Maintenance bypass discovered" : "Returning to exterior grounds");

  const fade = document.getElementById("ta3dTransition");
  setTimeout(() => {
    if (fade) fade.style.opacity = "1";
  }, 180);

  setTimeout(() => {
    player.position.copy(destination);
    player.rotation.y = entering ? Math.PI / 2 : -Math.PI / 2;
    lastSafePosition = destination.clone();
    if (fade) fade.style.opacity = "0";
    pulseObjective(entering ? "You slipped into the facility through a maintenance bypass." : "You returned through the maintenance bypass.");
  }, 390);

  setTimeout(() => {
    ventState.target = 0;
    transitioning = false;
  }, 720);
}

function spawnPickupTrail() {
  if (!scene || !player) return;
  const start = new THREE.Vector3(-6.3, .95, 5.2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: .95 });
  for (let i = 0; i < 12; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.055 + (i % 3) * .018, 6, 5), mat.clone());
    spark.position.copy(start).add(new THREE.Vector3(
      (Math.random() - .5) * .5,
      (Math.random() - .5) * .4,
      (Math.random() - .5) * .5,
    ));
    scene.add(spark);
    effects.push({ type: "pickup", mesh: spark, age: -i * .025, duration: .7 + i * .018, start: spark.position.clone() });
  }
  toast("Energy cell secured");
}

function spawnPlayerPulse(color = 0x67e8f9) {
  if (!scene || !player) return;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.45, .53, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(player.position.x, .06, player.position.z);
  scene.add(ring);
  effects.push({ type: "pulse", mesh: ring, age: 0, duration: .75 });
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];
    effect.age += dt;
    if (effect.age < 0) continue;
    const t = THREE.MathUtils.clamp(effect.age / effect.duration, 0, 1);

    if (effect.type === "pickup") {
      const target = new THREE.Vector3(player.position.x, player.position.y + 1.25, player.position.z);
      const arc = Math.sin(t * Math.PI) * .8;
      effect.mesh.position.lerpVectors(effect.start, target, t);
      effect.mesh.position.y += arc;
      effect.mesh.material.opacity = 1 - t;
      effect.mesh.scale.setScalar(1 - t * .55);
    } else if (effect.type === "pulse") {
      effect.mesh.position.x = player.position.x;
      effect.mesh.position.z = player.position.z;
      effect.mesh.scale.setScalar(1 + t * 3.2);
      effect.mesh.material.opacity = .85 * (1 - t);
    }

    if (t >= 1) {
      effect.mesh.parent?.remove(effect.mesh);
      effect.mesh.geometry?.dispose?.();
      effect.mesh.material?.dispose?.();
      effects.splice(i, 1);
    }
  }
}

function updateAnimatedParts(dt) {
  const gateOpen = ui.gateStatus?.textContent === "Open";

  for (const item of animatedParts) {
    const s = item.state;
    if (item.type === "vent") {
      s.hinge.rotation.y = THREE.MathUtils.damp(s.hinge.rotation.y, s.target, 12, dt);
    } else if (item.type === "lever") {
      if (gateOpen && !s.activated) {
        s.activated = true;
        s.target = .75;
      }
      s.pivot.rotation.x = THREE.MathUtils.damp(s.pivot.rotation.x, s.target, 12, dt);
    } else if (item.type === "gate") {
      if (gateOpen) s.open = true;
      const targetY = s.open ? 3.72 : 2.55;
      s.rods.forEach((rod) => {
        rod.position.y = THREE.MathUtils.damp(rod.position.y, targetY, 5.5, dt);
      });
      s.lamps.forEach((lamp) => {
        if (s.open && lamp.material.color.getHex() !== 0x4ade80) {
          lamp.material.color.setHex(0x4ade80);
          lamp.material.emissive.setHex(0x15803d);
          lamp.material.emissiveIntensity = 1.7;
        }
      });
    } else if (item.type === "cache") {
      s.lidPivot.rotation.x = THREE.MathUtils.damp(s.lidPivot.rotation.x, s.target, 10, dt);
      if (s.opened) s.cacheLight.material.emissiveIntensity = 2.2 + Math.sin(performance.now() * .01) * .2;
    } else if (item.type === "locker") {
      s.lidPivot.rotation.y = THREE.MathUtils.damp(s.lidPivot.rotation.y, s.target, 10, dt);
      if (s.opened) s.cacheLight.material.emissiveIntensity = 2.2;
    }
  }
}

function resolveV5Collisions() {
  if (!player) return;
  if (!lastSafePosition) lastSafePosition = player.position.clone();

  let blocked = false;
  for (const b of blockers) {
    if (!b.active || player.position.y >= b.height) continue;
    if (
      player.position.x > b.minX && player.position.x < b.maxX &&
      player.position.z > b.minZ && player.position.z < b.maxZ
    ) {
      blocked = true;
      break;
    }
  }

  if (blocked) {
    player.position.x = lastSafePosition.x;
    player.position.z = lastSafePosition.z;
  } else {
    lastSafePosition.copy(player.position);
  }
}

function updateInteractionPrompt() {
  if (!player || transitioning) {
    nearestInteraction = null;
    return;
  }

  let nearest = null;
  let nearestDistance = Infinity;
  for (const item of interactions) {
    if (!item.enabled()) continue;
    const dx = player.position.x - item.position.x;
    const dz = player.position.z - item.position.y;
    const distance = Math.hypot(dx, dz);
    if (distance <= item.radius && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  nearestInteraction = nearest;
  if (!nearest || !ui.prompt || !ui.promptText) return;
  ui.prompt.hidden = false;
  ui.promptText.textContent = nearest.label();
}

function watchBaseGameFeedback() {
  const cellNow = ui.cellStatus?.textContent || previousCellStatus;
  if (previousCellStatus !== "Collected" && cellNow === "Collected") {
    spawnPickupTrail();
  }
  previousCellStatus = cellNow;

  const shardNode = document.getElementById("shardStatus");
  if (shardNode) {
    const shardNow = shardNode.textContent;
    if (shardNow !== previousShardStatus) {
      const before = Number.parseInt(previousShardStatus, 10) || 0;
      const after = Number.parseInt(shardNow, 10) || 0;
      if (after > before) {
        spawnPlayerPulse(0xa78bfa);
        toast(`Data shard ${after}/3 recovered`);
      }
      previousShardStatus = shardNow;
    }
  }
}

function setupV5(targetScene) {
  if (enhanced) return;
  enhanced = true;
  scene = targetScene;
  ensureUi();

  const interactionRoot = new THREE.Group();
  interactionRoot.name = "v5-interaction-world";
  scene.add(interactionRoot);

  buildGateEnhancement(interactionRoot);
  buildSwitchLever(interactionRoot);
  buildServiceYard(interactionRoot);
  buildMaintenanceBay(interactionRoot);

  window.TA3DPerformance?.registerZone({
    id: "v5-gate-machinery",
    object: interactionRoot,
    x: 1,
    z: -6,
    activeDistance: 60,
    alwaysActive: true,
  });
}

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") {
      player = object;
      scene = this;
      setupV5(this);
    }
  }
  return result;
};

// Capture E / ACTION before the base game only when a v0.5 interaction owns it.
window.addEventListener("keydown", (event) => {
  if (event.code !== "KeyE" || event.repeat || !nearestInteraction || transitioning) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  nearestInteraction.interact();
}, true);

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (renderScene, camera) {
  const now = performance.now();
  const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 1 / 240), .05);
  lastFrameTime = now;

  if (player) {
    resolveV5Collisions();
    updateAnimatedParts(dt);
    updateEffects(dt);
    updateInteractionPrompt();
    watchBaseGameFeedback();
  }

  return previousRender.call(this, renderScene, camera);
};
