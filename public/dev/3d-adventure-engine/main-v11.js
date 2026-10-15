import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";
import { createWorldCollider } from "./world-collision.js";

// v1.1 engine controller.
// Owns renderer, player, movement, camera and collision registries.
// World geometry/layout is delegated to TA3DWorldBuilder.

const config = window.TA3DAdventure?.config || window.TA3DAdventureConfig || {};
const worldConfig = config.world || {};
const mount = document.getElementById("gameMount");
const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");
const fallback = document.getElementById("fallback");
const questionDialog = document.getElementById("questionDialog");
const closeQuestion = document.getElementById("closeQuestion");
const completeDialog = document.getElementById("completeDialog");
const restartGame = document.getElementById("restartGame");
const hideControls = document.getElementById("hideControls");

const keys = new Set();
const clock = new THREE.Clock();
const colliders = [];
const dynamicBlockers = [];
const cameraObstacles = [];
const animated = [];
const updateHooks = [];

let renderer;
let scene;
let camera;
let player;
let cameraYaw = worldConfig.camera?.yaw ?? 0;
let cameraPitch = worldConfig.camera?.pitch ?? .28;
let cameraDistance = worldConfig.camera?.distance ?? 7.5;
let verticalVelocity = 0;
let grounded = true;
let draggingCamera = false;
let dragPointer = null;
let lastPointerX = 0;
let lastPointerY = 0;
let firstFrame = true;
let visualYaw = 0;
let stridePhase = 0;
const rig = {};

const PLAYER_RADIUS = config.player?.radius ?? .52;
const PLAYER_GROUND_Y = config.player?.groundY ?? 0;
const WALK_SPEED = config.player?.walkSpeed ?? 5.2;
const RUN_SPEED = config.player?.runSpeed ?? 8.1;
const GRAVITY = config.player?.gravity ?? 22;
const JUMP_SPEED = config.player?.jumpSpeed ?? 8.1;
const TURN_SPEED = config.player?.turnSpeed ?? 24;

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch { return false; }
}

function fail(message) {
  console.error(message);
  if (loadingScreen) loadingScreen.hidden = true;
  if (fallback) {
    fallback.hidden = false;
    const p = fallback.querySelector("p");
    if (p) p.textContent = message;
  }
}

function material(color, roughness = .75, metalness = .05, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function part(parent, geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildPlayer() {
  player = new THREE.Group();
  player.name = "player-controller";
  const body = new THREE.Group();
  player.add(body);
  rig.body = body;

  const suit = material(0xe8a92e, .68);
  const suitLight = material(0xf4c653, .64);
  const dark = material(0x172033, .5, .1);
  const skin = material(0xe9b98c, .8);
  const blue = material(0x38bdf8, .3, .18, { emissive: 0x075985, emissiveIntensity: .7 });

  part(body, new THREE.BoxGeometry(.68, .25, .42), dark, 0, .92, .02);
  rig.torso = new THREE.Group();
  rig.torso.position.y = .98;
  body.add(rig.torso);
  part(rig.torso, new THREE.BoxGeometry(.78, .7, .44), suit, 0, .34, 0);
  part(rig.torso, new THREE.BoxGeometry(.54, .3, .07), suitLight, 0, .35, -.25);
  part(rig.torso, new THREE.BoxGeometry(.25, .08, .04), blue, 0, .43, -.31);
  part(rig.torso, new THREE.BoxGeometry(.56, .62, .28), dark, 0, .34, .34);
  part(rig.torso, new THREE.CylinderGeometry(.13, .13, .14, 8), skin, 0, .78, 0);
  part(rig.torso, new THREE.BoxGeometry(.5, .48, .46), skin, 0, 1.04, 0);
  part(rig.torso, new THREE.BoxGeometry(.36, .16, .055), dark, 0, 1.08, -.255);
  part(rig.torso, new THREE.BoxGeometry(.1, .04, .025), blue, 0, 1.08, -.292);

  const createArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * .5, .63, 0);
    rig.torso.add(shoulder);
    part(shoulder, new THREE.BoxGeometry(.22, .44, .24), suit, 0, -.22, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -.43;
    shoulder.add(elbow);
    part(elbow, new THREE.BoxGeometry(.2, .4, .22), suit, 0, -.2, 0);
    part(elbow, new THREE.SphereGeometry(.13, 8, 6), dark, 0, -.44, -.01);
    return { shoulder, elbow };
  };
  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  rig.leftShoulder = leftArm.shoulder;
  rig.rightShoulder = rightArm.shoulder;
  rig.leftElbow = leftArm.elbow;
  rig.rightElbow = rightArm.elbow;

  const createLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * .22, .89, 0);
    body.add(hip);
    part(hip, new THREE.BoxGeometry(.28, .46, .3), suit, 0, -.23, 0);
    const knee = new THREE.Group();
    knee.position.y = -.45;
    hip.add(knee);
    part(knee, new THREE.BoxGeometry(.25, .42, .27), suit, 0, -.21, 0);
    const foot = part(knee, new THREE.BoxGeometry(.3, .18, .48), dark, 0, -.47, -.09);
    return { hip, knee, foot };
  };
  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);
  rig.leftHip = leftLeg.hip;
  rig.rightHip = rightLeg.hip;
  rig.leftKnee = leftLeg.knee;
  rig.rightKnee = rightLeg.knee;
  rig.leftFoot = leftLeg.foot;
  rig.rightFoot = rightLeg.foot;

  scene.add(player);
  resetPlayer();
}

function resetPlayer() {
  if (!player) return;
  const start = config.player?.start || { x: 0, y: PLAYER_GROUND_Y, z: 12.5, yaw: 0 };
  player.position.set(start.x ?? 0, start.y ?? PLAYER_GROUND_Y, start.z ?? 12.5);
  visualYaw = start.yaw ?? 0;
  player.rotation.set(0, visualYaw, 0);
  verticalVelocity = 0;
  grounded = true;
}

function addCollider(object) {
  colliders.push(createWorldCollider(object));
}

function registerAnimation(item) {
  if (item?.mesh) animated.push(item);
}

function createWorld() {
  scene = new THREE.Scene();
  const cameraDef = worldConfig.camera || {};
  camera = new THREE.PerspectiveCamera(cameraDef.fov ?? 58, mount.clientWidth / Math.max(1, mount.clientHeight), cameraDef.near ?? .1, cameraDef.far ?? 120);
  renderer = new THREE.WebGLRenderer({ antialias: cameraDef.antialias !== false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, worldConfig.renderer?.dprCap ?? 1.5));
  renderer.setSize(mount.clientWidth, mount.clientHeight, false);
  renderer.shadowMap.enabled = worldConfig.renderer?.shadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const builder = window.TA3DWorldBuilder;
  if (!builder?.build) throw new Error("3D world builder is unavailable.");
  builder.build({
    scene,
    registerCollider: addCollider,
    addCameraObstacle(object) { if (object && !cameraObstacles.includes(object)) cameraObstacles.push(object); },
    registerAnimation,
  });

  buildPlayer();
  setupInput();
  updateCamera(true);
  publishEngine();
}

function setupInput() {
  window.addEventListener("keydown", (event) => {
    if (questionDialog?.open || completeDialog?.open) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "Space" && !event.repeat && grounded) {
      verticalVelocity = JUMP_SPEED;
      grounded = false;
    }
  }, { passive: false });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (questionDialog?.open || completeDialog?.open) return;
    draggingCamera = true;
    dragPointer = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    renderer.domElement.setPointerCapture?.(event.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!draggingCamera || event.pointerId !== dragPointer) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    cameraYaw -= dx * .0065;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy * .0045, .08, .72);
  });
  const stopDrag = (event) => {
    if (event.pointerId !== dragPointer) return;
    draggingCamera = false;
    dragPointer = null;
  };
  renderer.domElement.addEventListener("pointerup", stopDrag);
  renderer.domElement.addEventListener("pointercancel", stopDrag);
  renderer.domElement.addEventListener("wheel", (event) => {
    event.preventDefault();
    cameraDistance = THREE.MathUtils.clamp(cameraDistance + Math.sign(event.deltaY) * .6, cameraDefMinDistance(), cameraDefMaxDistance());
  }, { passive: false });

  hideControls?.addEventListener("click", () => hideControls.parentElement?.remove());
  closeQuestion?.addEventListener("click", () => questionDialog?.close());
  restartGame?.addEventListener("click", () => window.location.reload());
}

const cameraDefMinDistance = () => worldConfig.camera?.minDistance ?? 4.5;
const cameraDefMaxDistance = () => worldConfig.camera?.maxDistance ?? 10.5;

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function faceActualTravel(dx, dz, dt) {
  if (dx * dx + dz * dz < .0000001) return 0;
  const targetYaw = Math.atan2(-dx, -dz);
  const delta = wrapAngle(targetYaw - visualYaw);
  const response = 1 - Math.exp(-TURN_SPEED * dt);
  visualYaw = wrapAngle(visualYaw + delta * response);
  player.rotation.y = visualYaw;
  return delta;
}

function animatePlayer(speed, turningDelta, dt) {
  const airborne = !grounded || player.position.y > .04;
  const moving = speed > .1;
  const running = speed > 6.2;
  if (airborne) {
    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, .28, 12, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, -.18, 12, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, -.55, 12, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, -.42, 12, dt);
    rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, -.42, 12, dt);
    rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, -.42, 12, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, -.05, 10, dt);
    return;
  }
  if (moving) {
    stridePhase += speed * dt * (running ? 4.2 : 3.7);
    const s = Math.sin(stridePhase);
    const c = Math.cos(stridePhase);
    const stride = running ? .78 : .56;
    const arm = running ? .72 : .5;
    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, s * stride, 20, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, -s * stride, 20, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, -Math.max(0, -s) * (running ? 1 : .72), 20, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, -Math.max(0, s) * (running ? 1 : .72), 20, dt);
    rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, -s * arm, 20, dt);
    rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, s * arm, 20, dt);
    rig.leftElbow.rotation.x = THREE.MathUtils.damp(rig.leftElbow.rotation.x, -.12 - Math.max(0, s) * .25, 16, dt);
    rig.rightElbow.rotation.x = THREE.MathUtils.damp(rig.rightElbow.rotation.x, -.12 - Math.max(0, -s) * .25, 16, dt);
    rig.leftFoot.rotation.x = THREE.MathUtils.damp(rig.leftFoot.rotation.x, c * .14, 16, dt);
    rig.rightFoot.rotation.x = THREE.MathUtils.damp(rig.rightFoot.rotation.x, -c * .14, 16, dt);
    rig.body.position.y = THREE.MathUtils.damp(rig.body.position.y, Math.abs(Math.sin(stridePhase * 2)) * (running ? .06 : .035), 18, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, running ? -.1 : -.03, 12, dt);
    rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, -THREE.MathUtils.clamp(turningDelta, -.8, .8) * .13, 12, dt);
  } else {
    [rig.leftHip, rig.rightHip, rig.leftKnee, rig.rightKnee, rig.leftShoulder, rig.rightShoulder, rig.leftElbow, rig.rightElbow].forEach((joint) => {
      joint.rotation.x = THREE.MathUtils.damp(joint.rotation.x, 0, 14, dt);
    });
    rig.leftFoot.rotation.x = THREE.MathUtils.damp(rig.leftFoot.rotation.x, 0, 14, dt);
    rig.rightFoot.rotation.x = THREE.MathUtils.damp(rig.rightFoot.rotation.x, 0, 14, dt);
    rig.body.position.y = THREE.MathUtils.damp(rig.body.position.y, 0, 14, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0, 12, dt);
    rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, 0, 12, dt);
  }
}

function valueOf(value) { return typeof value === "function" ? value() : value; }
function blockerActive(blocker) { return blocker.active === undefined ? true : Boolean(valueOf(blocker.active)); }

function blocked(x, z) {
  for (const c of colliders) {
    const bounds = c.bounds();
    if (x + PLAYER_RADIUS > bounds.min.x && x - PLAYER_RADIUS < bounds.max.x && z + PLAYER_RADIUS > bounds.min.z && z - PLAYER_RADIUS < bounds.max.z) return true;
  }
  for (const c of dynamicBlockers) {
    if (!blockerActive(c)) continue;
    if (x + PLAYER_RADIUS > valueOf(c.minX) && x - PLAYER_RADIUS < valueOf(c.maxX) && z + PLAYER_RADIUS > valueOf(c.minZ) && z - PLAYER_RADIUS < valueOf(c.maxZ)) return true;
  }
  return false;
}

function attemptHorizontalMove(dx, dz) {
  const nextX = player.position.x + dx;
  if (!blocked(nextX, player.position.z)) player.position.x = nextX;
  const nextZ = player.position.z + dz;
  if (!blocked(player.position.x, nextZ)) player.position.z = nextZ;
}

function movePlayer(dt) {
  const forwardInput = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const rightInput = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const beforeX = player.position.x;
  const beforeZ = player.position.z;
  if (forwardInput || rightInput) {
    const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
    const desired = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(rightInput)).normalize();
    const speed = (keys.has("ShiftLeft") || keys.has("ShiftRight")) ? RUN_SPEED : WALK_SPEED;
    const step = desired.multiplyScalar(speed * dt);
    attemptHorizontalMove(step.x, step.z);
  }
  const actualDx = player.position.x - beforeX;
  const actualDz = player.position.z - beforeZ;
  const actualSpeed = Math.hypot(actualDx, actualDz) / Math.max(dt, .0001);
  const turnDelta = faceActualTravel(actualDx, actualDz, dt);
  verticalVelocity -= GRAVITY * dt;
  player.position.y += verticalVelocity * dt;
  if (player.position.y <= PLAYER_GROUND_Y) {
    player.position.y = PLAYER_GROUND_Y;
    verticalVelocity = 0;
    grounded = true;
  }
  animatePlayer(actualSpeed, turnDelta, dt);
  const bounds = worldConfig.bounds || { minX: -23, maxX: 23, minZ: -23, maxZ: 23 };
  player.position.x = THREE.MathUtils.clamp(player.position.x, bounds.minX ?? -23, bounds.maxX ?? 23);
  player.position.z = THREE.MathUtils.clamp(player.position.z, bounds.minZ ?? -23, bounds.maxZ ?? 23);
}

function updateCamera(immediate = false) {
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const desired = new THREE.Vector3(target.x - Math.sin(cameraYaw) * horizontal, target.y + Math.sin(cameraPitch) * cameraDistance + .45, target.z + Math.cos(cameraYaw) * horizontal);
  const rayDirection = desired.clone().sub(target);
  const desiredDistance = rayDirection.length();
  rayDirection.normalize();
  const hits = new THREE.Raycaster(target, rayDirection, .1, desiredDistance).intersectObjects(cameraObstacles, false);
  if (hits.length) desired.copy(target).add(rayDirection.multiplyScalar(Math.max(1.25, hits[0].distance - .35)));
  if (immediate) camera.position.copy(desired); else camera.position.lerp(desired, .2);
  camera.lookAt(target);
}

function updateCameraSmooth(dt) {
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const desired = new THREE.Vector3(target.x - Math.sin(cameraYaw) * horizontal, target.y + Math.sin(cameraPitch) * cameraDistance + .45, target.z + Math.cos(cameraYaw) * horizontal);
  const direction = desired.clone().sub(target);
  const distance = direction.length();
  direction.normalize();
  const hits = new THREE.Raycaster(target, direction, .1, distance).intersectObjects(cameraObstacles, false);
  if (hits.length) desired.copy(target).add(direction.multiplyScalar(Math.max(1.35, hits[0].distance - .3)));
  camera.position.lerp(desired, 1 - Math.exp(-dt * 9.5));
  camera.lookAt(target);
}

function updateAnimated(dt, time) {
  for (const item of animated) {
    if (!item.mesh?.visible) continue;
    if (item.type === "spin") {
      const axis = item.axis || "z";
      item.mesh.rotation[axis] += (item.speed ?? .75) * dt;
    } else if (item.type === "bobSpin") {
      item.mesh.position.y = (item.baseY ?? 0) + Math.sin(time * (item.frequency ?? 2.4)) * (item.amplitude ?? .15);
      item.mesh.rotation.x += (item.xSpeed ?? .72) * dt;
      item.mesh.rotation.y += (item.ySpeed ?? 1.14) * dt;
      item.mesh.rotation.z += (item.zSpeed ?? 0) * dt;
    }
  }
}

function publishEngine() {
  const api = {
    version: "1.1",
    scene, camera, renderer, player,
    world: window.TA3DWorld,
    findObject(name) { return name ? scene.getObjectByName(name) : null; },
    onUpdate(callback) {
      if (typeof callback !== "function") return () => {};
      updateHooks.push(callback);
      return () => { const index = updateHooks.indexOf(callback); if (index >= 0) updateHooks.splice(index, 1); };
    },
    registerDynamicBlocker(blocker) {
      dynamicBlockers.push(blocker);
      return () => { const index = dynamicBlockers.indexOf(blocker); if (index >= 0) dynamicBlockers.splice(index, 1); };
    },
    addCameraObstacle(object) { if (object && !cameraObstacles.includes(object)) cameraObstacles.push(object); },
    teleport({ x = player.position.x, y = PLAYER_GROUND_Y, z = player.position.z, yaw = visualYaw } = {}) {
      player.position.set(x, y, z);
      visualYaw = yaw;
      player.rotation.y = yaw;
      verticalVelocity = 0;
      grounded = y <= PLAYER_GROUND_Y;
    },
    get grounded() { return grounded; },
  };
  window.TA3DEngine = api;
  window.dispatchEvent(new CustomEvent("ta3d:engine-ready", { detail: api }));
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .045);
  if (!questionDialog?.open && !completeDialog?.open) movePlayer(dt);
  const time = performance.now() / 1000;
  updateAnimated(dt, time);
  for (const hook of [...updateHooks]) {
    try { hook(dt, time); } catch (error) { console.warn("3D engine update hook failed", error); }
  }
  updateCameraSmooth(dt);
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    if (loadingScreen?.animate) loadingScreen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }).finished.then(() => loadingScreen.hidden = true);
    else if (loadingScreen) loadingScreen.hidden = true;
  }
}

function onResize() {
  if (!renderer || !camera) return;
  const width = mount.clientWidth;
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, worldConfig.renderer?.dprCap ?? 1.5));
}
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

try {
  if (!webglAvailable()) throw new Error("WebGL is unavailable on this browser/device.");
  if (loadingMessage) loadingMessage.textContent = `Assembling ${config.title || "3D Adventure"}`;
  createWorld();
  animate();
} catch (error) {
  fail(error?.message || "The 3D prototype could not initialize.");
}
