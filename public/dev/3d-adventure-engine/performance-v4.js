import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// Teach Arcade 3D Adventure performance foundation.
// This module intentionally does not own gameplay. It observes the renderer,
// provides zone/decor registration hooks, and gracefully reduces visual cost
// only when sustained frame-rate data says the device needs help.

const nativeSetPixelRatio = THREE.WebGLRenderer.prototype.setPixelRatio;
const nativeRender = THREE.WebGLRenderer.prototype.render;

const QUALITY = {
  high: {
    dprCap: 1.5,
    particles: true,
    shadows: true,
    pointLights: 8,
    decorDistanceScale: 1,
  },
  medium: {
    dprCap: 1.15,
    particles: true,
    shadows: true,
    pointLights: 4,
    decorDistanceScale: 0.82,
  },
  low: {
    dprCap: 0.9,
    particles: false,
    shadows: false,
    pointLights: 2,
    decorDistanceScale: 0.62,
  },
};

const qualityOrder = ["low", "medium", "high"];
const deviceDpr = Math.max(1, window.devicePixelRatio || 1);
const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
const memory = navigator.deviceMemory || 0;
const cores = navigator.hardwareConcurrency || 0;

function chooseInitialQuality() {
  // Start conservatively on clearly constrained devices, then allow the FPS
  // sampler to promote quality after several healthy samples.
  if ((memory && memory <= 3) || (cores && cores <= 4)) return "medium";
  if (coarsePointer && deviceDpr >= 2.5) return "medium";
  return "high";
}

const state = {
  quality: chooseInitialQuality(),
  renderer: null,
  scene: null,
  camera: null,
  player: null,
  requestedDpr: Math.min(deviceDpr, 1.5),
  fps: 60,
  frameCount: 0,
  sampleStart: performance.now(),
  lowSamples: 0,
  highSamples: 0,
  lastCullAt: 0,
  lastLightAt: 0,
  lastSceneScanAt: 0,
  debug: new URLSearchParams(location.search).get("perf") === "1",
  debugNode: null,
  decor: new Set(),
  zones: new Map(),
  staticPrepared: new WeakSet(),
  pointLights: [],
  adaptiveEnabled: true,
};

function qualityConfig() {
  return QUALITY[state.quality];
}

function capDpr(value) {
  return Math.min(value || 1, qualityConfig().dprCap);
}

THREE.WebGLRenderer.prototype.setPixelRatio = function (value) {
  state.requestedDpr = value || 1;
  return nativeSetPixelRatio.call(this, capDpr(state.requestedDpr));
};

function stepQuality(direction) {
  const index = qualityOrder.indexOf(state.quality);
  const nextIndex = THREE.MathUtils.clamp(index + direction, 0, qualityOrder.length - 1);
  const next = qualityOrder[nextIndex];
  if (next === state.quality) return;
  state.quality = next;
  state.lowSamples = 0;
  state.highSamples = 0;
  applyQuality();
}

function applyQuality() {
  const cfg = qualityConfig();
  if (state.renderer) {
    nativeSetPixelRatio.call(state.renderer, capDpr(state.requestedDpr));
    state.renderer.shadowMap.enabled = cfg.shadows;
  }

  if (state.scene) {
    const particles = state.scene.getObjectByName("v3-ambient-particles");
    if (particles) particles.visible = cfg.particles;
  }

  updatePointLights(true);
  updateDecor(true);
  updateDebug();
}

function sampleFps(now) {
  state.frameCount += 1;
  const elapsed = now - state.sampleStart;
  if (elapsed < 1600) return;

  const measured = state.frameCount * 1000 / Math.max(elapsed, 1);
  // Smooth enough to ignore one-off hitches while still reacting within a few seconds.
  state.fps = state.fps * 0.45 + measured * 0.55;
  state.frameCount = 0;
  state.sampleStart = now;

  if (!state.adaptiveEnabled || document.hidden) {
    updateDebug();
    return;
  }

  if (state.fps < 42) {
    state.lowSamples += 1;
    state.highSamples = 0;
  } else if (state.fps > 56) {
    state.highSamples += 1;
    state.lowSamples = 0;
  } else {
    state.lowSamples = Math.max(0, state.lowSamples - 1);
    state.highSamples = Math.max(0, state.highSamples - 1);
  }

  // Require sustained evidence before changing quality so a loading hitch or
  // modal opening does not make the engine bounce between settings.
  if (state.lowSamples >= 3) stepQuality(-1);
  else if (state.highSamples >= 6) stepQuality(1);

  updateDebug();
}

function prepareStaticObject(object) {
  if (!object || state.staticPrepared.has(object)) return;
  state.staticPrepared.add(object);

  // Static decorative transforms do not need to be recomputed every frame.
  object.traverse?.((child) => {
    if (!child.isObject3D || child.isSkinnedMesh) return;
    child.updateMatrix();
    child.matrixAutoUpdate = false;
  });
}

function looksLikeSafeExistingDecor(object) {
  if (!object || object === state.player) return false;
  if (object.name === "v3-ambient-particles") return false;

  // Distant mountains in world-v3.
  if (object.isMesh && object.geometry?.type === "ConeGeometry") {
    const d = Math.hypot(object.position.x, object.position.z);
    if (d > 28) return { maxDistance: 72, minQuality: "low", static: true };
  }

  // Peripheral low-poly rocks. Base gameplay rocks closer to the courtyard are
  // deliberately excluded so this never changes collision/gameplay readability.
  if (object.isMesh && object.geometry?.type === "DodecahedronGeometry") {
    if (Math.abs(object.position.x) > 13 || Math.abs(object.position.z) > 13) {
      return { maxDistance: 34, minQuality: "low", static: true };
    }
  }

  // world-v3 grass tufts are groups made entirely from simple planes.
  if (object.isGroup && object.children?.length === 3 && object.children.every((c) => c.isMesh && c.geometry?.type === "PlaneGeometry")) {
    return { maxDistance: 26, minQuality: "medium", static: true };
  }

  return false;
}

function scanScene(now = performance.now()) {
  if (!state.scene || now - state.lastSceneScanAt < 1800) return;
  state.lastSceneScanAt = now;

  state.player ||= state.scene.getObjectByName("player-controller");
  state.pointLights = [];

  state.scene.traverse((object) => {
    if (object.isPointLight) state.pointLights.push(object);
    if (object.userData?.taPerfDecor && !state.decor.has(object)) {
      state.decor.add(object);
      if (object.userData.taPerfStatic !== false) prepareStaticObject(object);
      return;
    }

    const candidate = looksLikeSafeExistingDecor(object);
    if (!candidate || state.decor.has(object)) return;
    object.userData.taPerfDecor = true;
    object.userData.taPerfMaxDistance = candidate.maxDistance;
    object.userData.taPerfMinQuality = candidate.minQuality;
    object.userData.taPerfStatic = candidate.static;
    state.decor.add(object);
    if (candidate.static) prepareStaticObject(object);
  });
}

function qualityMeetsMinimum(minQuality = "low") {
  return qualityOrder.indexOf(state.quality) >= qualityOrder.indexOf(minQuality);
}

function updateDecor(force = false, now = performance.now()) {
  if (!state.player || (!force && now - state.lastCullAt < 300)) return;
  state.lastCullAt = now;
  const scale = qualityConfig().decorDistanceScale;

  for (const object of state.decor) {
    if (!object?.parent) {
      state.decor.delete(object);
      continue;
    }
    const maxDistance = (object.userData.taPerfMaxDistance || 36) * scale;
    const dx = object.position.x - state.player.position.x;
    const dz = object.position.z - state.player.position.z;
    const inRange = dx * dx + dz * dz <= maxDistance * maxDistance;
    const qualityOk = qualityMeetsMinimum(object.userData.taPerfMinQuality || "low");
    object.visible = inRange && qualityOk;
  }

  for (const zone of state.zones.values()) {
    const dx = zone.center.x - state.player.position.x;
    const dz = zone.center.z - state.player.position.z;
    const distanceSq = dx * dx + dz * dz;
    const activeDistance = zone.activeDistance * scale;
    const shouldBeActive = zone.alwaysActive || distanceSq <= activeDistance * activeDistance;
    if (zone.object) zone.object.visible = shouldBeActive;
    if (shouldBeActive !== zone.active) {
      zone.active = shouldBeActive;
      zone.onChange?.(shouldBeActive);
    }
  }
}

function updatePointLights(force = false, now = performance.now()) {
  if (!state.player || (!force && now - state.lastLightAt < 500)) return;
  state.lastLightAt = now;
  const limit = qualityConfig().pointLights;

  const ranked = state.pointLights.map((light) => {
    const dx = light.position.x - state.player.position.x;
    const dz = light.position.z - state.player.position.z;
    return { light, distanceSq: dx * dx + dz * dz };
  }).sort((a, b) => a.distanceSq - b.distanceSq);

  ranked.forEach(({ light }, index) => {
    // Important lights can opt out of the budget in future maps.
    light.visible = light.userData?.taPerfAlwaysOn || index < limit;
  });
}

function ensureDebugNode() {
  if (!state.debug || state.debugNode) return;
  const node = document.createElement("div");
  node.id = "ta3dPerfDebug";
  node.style.cssText = [
    "position:fixed",
    "right:10px",
    "bottom:10px",
    "z-index:99999",
    "padding:7px 9px",
    "border-radius:8px",
    "background:rgba(8,15,25,.78)",
    "color:#dff7ff",
    "font:600 11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace",
    "pointer-events:none",
    "backdrop-filter:blur(5px)",
  ].join(";");
  document.body.appendChild(node);
  state.debugNode = node;
}

function updateDebug() {
  if (!state.debug) return;
  ensureDebugNode();
  if (!state.debugNode) return;
  const info = state.renderer?.info?.render;
  const calls = info?.calls ?? 0;
  const tris = info?.triangles ?? 0;
  const visibleDecor = [...state.decor].filter((o) => o.visible).length;
  const activeZones = [...state.zones.values()].filter((z) => z.active).length;
  state.debugNode.textContent = `FPS ${state.fps.toFixed(0)}  ${state.quality.toUpperCase()}\nDraw ${calls}  Tri ${Math.round(tris / 1000)}k\nDecor ${visibleDecor}/${state.decor.size}  Zones ${activeZones}/${state.zones.size}`;
  state.debugNode.style.whiteSpace = "pre";
}

THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  const now = performance.now();
  state.renderer ||= this;
  state.scene = scene;
  state.camera = camera;

  scanScene(now);
  updateDecor(false, now);
  updatePointLights(false, now);
  sampleFps(now);

  return nativeRender.call(this, scene, camera);
};

window.TA3DPerformance = {
  get quality() { return state.quality; },
  get fps() { return state.fps; },
  get adaptiveEnabled() { return state.adaptiveEnabled; },
  set adaptiveEnabled(value) { state.adaptiveEnabled = Boolean(value); },

  registerDecor(object, options = {}) {
    if (!object) return object;
    object.userData.taPerfDecor = true;
    object.userData.taPerfMaxDistance = options.maxDistance ?? 36;
    object.userData.taPerfMinQuality = options.minQuality ?? "low";
    object.userData.taPerfStatic = options.static !== false;
    state.decor.add(object);
    if (object.userData.taPerfStatic) prepareStaticObject(object);
    return object;
  },

  registerZone({ id, object = null, x = 0, z = 0, activeDistance = 42, alwaysActive = false, onChange = null }) {
    if (!id) throw new Error("Performance zones require an id.");
    const zone = {
      id,
      object,
      center: new THREE.Vector2(x, z),
      activeDistance,
      alwaysActive,
      onChange,
      active: true,
    };
    state.zones.set(id, zone);
    return zone;
  },

  setQuality(value) {
    if (!QUALITY[value]) return;
    state.quality = value;
    applyQuality();
  },

  snapshot() {
    const render = state.renderer?.info?.render || {};
    return {
      fps: Math.round(state.fps),
      quality: state.quality,
      drawCalls: render.calls || 0,
      triangles: render.triangles || 0,
      decorTracked: state.decor.size,
      zones: state.zones.size,
    };
  },
};

document.addEventListener("visibilitychange", () => {
  state.frameCount = 0;
  state.sampleStart = performance.now();
  state.lowSamples = 0;
  state.highSamples = 0;
});
