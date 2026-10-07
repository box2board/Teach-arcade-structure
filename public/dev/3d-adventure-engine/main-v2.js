import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

const mount = document.getElementById("gameMount");
const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");
const fallback = document.getElementById("fallback");
const objectiveText = document.getElementById("objectiveText");
const objectiveSubtext = document.getElementById("objectiveSubtext");
const cellStatus = document.getElementById("cellStatus");
const terminalStatus = document.getElementById("terminalStatus");
const gateStatus = document.getElementById("gateStatus");
const interactionPrompt = document.getElementById("interactionPrompt");
const interactionText = document.getElementById("interactionText");
const questionDialog = document.getElementById("questionDialog");
const answerList = document.getElementById("answerList");
const questionFeedback = document.getElementById("questionFeedback");
const closeQuestion = document.getElementById("closeQuestion");
const completeDialog = document.getElementById("completeDialog");
const restartGame = document.getElementById("restartGame");
const hideControls = document.getElementById("hideControls");

const state = {
  hasCell: false,
  terminalPowered: false,
  gateOpen: false,
  complete: false,
  nearestInteraction: null,
  selectedAnswer: 0,
  questionLocked: false,
};

const keys = new Set();
const clock = new THREE.Clock();
const colliders = [];
const cameraObstacles = [];
const animated = [];
const interactables = [];
const Y_AXIS = new THREE.Vector3(0, 1, 0);

let renderer;
let scene;
let camera;
let player;
let door;
let energyCell;
let terminalGlow;
let switchGlow;
let cameraYaw = 0;
let cameraPitch = 0.28;
let cameraDistance = 7.5;
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

const PLAYER_RADIUS = 0.52;
const PLAYER_GROUND_Y = 0;
const WALK_SPEED = 5.2;
const RUN_SPEED = 8.1;
const GRAVITY = 22;
const JUMP_SPEED = 8.1;
const TURN_SPEED = 24;

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(message);
  loadingScreen.hidden = true;
  fallback.hidden = false;
  fallback.querySelector("p").textContent = message;
}

function material(color, roughness = 0.75, metalness = 0.05, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function addBox({ x = 0, y = 0.5, z = 0, w = 1, h = 1, d = 1, color = 0x64748b, cast = true, receive = true, collider = false, cameraBlock = collider, name = "" }) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  obj.position.set(x, y, z);
  obj.castShadow = cast;
  obj.receiveShadow = receive;
  obj.name = name;
  scene.add(obj);
  if (collider) addCollider(obj, w, d);
  if (cameraBlock) cameraObstacles.push(obj);
  return obj;
}

function addCollider(obj, w, d) {
  colliders.push({
    minX: () => obj.position.x - w / 2,
    maxX: () => obj.position.x + w / 2,
    minZ: () => obj.position.z - d / 2,
    maxZ: () => obj.position.z + d / 2,
  });
}

function addTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.26 * scale, .34 * scale, 2.2 * scale, 7), material(0x6b4f36));
  trunk.position.set(x, 1.1 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * scale, 1), material(0x3f7f5a, .9));
  crown.position.set(x, 2.65 * scale, z);
  crown.scale.y = 1.18;
  crown.castShadow = true;
  scene.add(crown);
}

function addRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.65 * scale, 0), material(0x708090, .95));
  rock.position.set(x, .45 * scale, z);
  rock.scale.set(1.25, .75, 1);
  rock.rotation.set(.2, .5, .1);
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function part(parent, geometry, mat, x, y, z) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
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

function createWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bc8e5);
  scene.fog = new THREE.Fog(0x9bc8e5, 32, 72);

  camera = new THREE.PerspectiveCamera(58, mount.clientWidth / Math.max(1, mount.clientHeight), .1, 120);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(mount.clientWidth, mount.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe7f6ff, 0x35513f, 1.65));
  const sun = new THREE.DirectionalLight(0xfff4d8, 2.15);
  sun.position.set(16, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), material(0x5f8f65, .95));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 34), material(0xa8a08d, 1));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, .012, -1);
  path.receiveShadow = true;
  scene.add(path);

  addBox({ x: 0, y: .25, z: -14, w: 16, h: .5, d: 13, color: 0x566678 });
  addBox({ x: -5.2, y: 3.2, z: -8, w: 5.6, h: 6.4, d: .7, color: 0x44556a, collider: true });
  addBox({ x: 5.2, y: 3.2, z: -8, w: 5.6, h: 6.4, d: .7, color: 0x44556a, collider: true });
  addBox({ x: -7.65, y: 3.2, z: -14, w: .7, h: 6.4, d: 12.7, color: 0x3e4d61, collider: true });
  addBox({ x: 7.65, y: 3.2, z: -14, w: .7, h: 6.4, d: 12.7, color: 0x3e4d61, collider: true });
  addBox({ x: 0, y: 3.2, z: -20, w: 16, h: 6.4, d: .7, color: 0x3e4d61, collider: true });
  addBox({ x: 0, y: 6.35, z: -14, w: 16, h: .55, d: 13, color: 0x314055, cameraBlock: true });

  door = addBox({ x: 0, y: 2.25, z: -7.86, w: 4.4, h: 4.5, d: .48, color: 0x26384d, cameraBlock: true });
  const doorStripe = new THREE.Mesh(new THREE.BoxGeometry(3.6, .13, .52), material(0x5eead4, .4, .35, { emissive: 0x0f766e, emissiveIntensity: .7 }));
  doorStripe.position.set(0, 2.25, -7.59);
  scene.add(doorStripe);
  animated.push({ type: "doorStripe", mesh: doorStripe });

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, 1.15, 14), material(0x67e8f9, .35, .15, { emissive: 0x0891b2, emissiveIntensity: 1.25 }));
  beacon.position.set(0, .6, -16.4);
  scene.add(beacon);
  const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, .07, 8, 32), material(0x67e8f9, .25, .2, { emissive: 0x0891b2, emissiveIntensity: 1.8 }));
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.set(0, .18, -16.4);
  scene.add(beaconRing);
  animated.push({ type: "spin", mesh: beaconRing, speed: .75 });

  addBox({ x: 6.35, y: .7, z: -3.6, w: 1.7, h: 1.4, d: 1.2, color: 0x25364b, collider: true });
  terminalGlow = new THREE.Mesh(new THREE.BoxGeometry(1.2, .63, .08), material(0x233349, .35, .15, { emissive: 0x172033, emissiveIntensity: .5 }));
  terminalGlow.position.set(6.35, .9, -2.96);
  terminalGlow.rotation.x = -.12;
  scene.add(terminalGlow);

  addBox({ x: 2.8, y: .75, z: -6.35, w: 1.05, h: 1.5, d: .72, color: 0x2d3d50, collider: true });
  switchGlow = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .12), material(0xef4444, .3, .1, { emissive: 0x7f1d1d, emissiveIntensity: 1 }));
  switchGlow.position.set(2.8, .9, -5.94);
  scene.add(switchGlow);

  energyCell = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 1.05, 12), material(0x38bdf8, .22, .4, { emissive: 0x0284c7, emissiveIntensity: 1.8 }));
  energyCell.position.set(-6.3, .85, 5.2);
  energyCell.rotation.z = Math.PI / 2;
  scene.add(energyCell);
  const cellRing = new THREE.Mesh(new THREE.TorusGeometry(.74, .055, 8, 28), material(0x7dd3fc, .25, .2, { emissive: 0x0284c7, emissiveIntensity: 1.5 }));
  cellRing.rotation.x = Math.PI / 2;
  cellRing.position.set(-6.3, .12, 5.2);
  scene.add(cellRing);
  animated.push({ type: "cell", mesh: energyCell, baseY: .85 });
  animated.push({ type: "spin", mesh: cellRing, speed: 1.1 });

  interactables.push(
    { id: "cell", position: new THREE.Vector3(-6.3, 0, 5.2), radius: 2 },
    { id: "terminal", position: new THREE.Vector3(6.35, 0, -3.6), radius: 2.2 },
    { id: "switch", position: new THREE.Vector3(2.8, 0, -6.35), radius: 2 },
  );

  [[-12,8,1.15],[-15,0,.9],[-12,-7,1.05],[12,8,1.1],[15,1,.95],[12,-7,1.05],[-18,12,1.15],[18,12,1.2],[-18,-13,1],[18,-13,1.05]].forEach(([x,z,s]) => addTree(x,z,s));
  [[-10,3,.8],[10,4,.7],[-11,-2,.9],[11,-1,.65],[-4,10,.55],[5,11,.7]].forEach(([x,z,s]) => addRock(x,z,s));

  buildPlayer();
  setupInput();
  updateHud();
  updateCamera(true);
}

function resetPlayer() {
  if (!player) return;
  player.position.set(0, PLAYER_GROUND_Y, 12.5);
  player.rotation.set(0, 0, 0);
  visualYaw = 0;
  verticalVelocity = 0;
  grounded = true;
}

function setupInput() {
  window.addEventListener("keydown", (event) => {
    if (questionDialog.open) {
      handleQuestionKey(event);
      return;
    }
    if (completeDialog.open) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "KeyE" && !event.repeat) interact();
    if (event.code === "Space" && !event.repeat && grounded) {
      verticalVelocity = JUMP_SPEED;
      grounded = false;
    }
  }, { passive: false });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (questionDialog.open || completeDialog.open) return;
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
    cameraDistance = THREE.MathUtils.clamp(cameraDistance + Math.sign(event.deltaY) * .6, 4.5, 10.5);
  }, { passive: false });

  hideControls.addEventListener("click", () => hideControls.parentElement.remove());
  closeQuestion.addEventListener("click", () => questionDialog.close());
  restartGame.addEventListener("click", () => window.location.reload());
}

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function faceActualTravel(dx, dz, dt) {
  if (dx * dx + dz * dz < 0.0000001) return 0;

  // The visible character faces LOCAL -Z. This is the only heading formula in
  // the controller. Rightward world travel (+X) therefore requires -90deg yaw;
  // leftward world travel (-X) requires +90deg yaw.
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
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, -Math.max(0, -s) * (running ? 1.0 : .72), 20, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, -Math.max(0, s) * (running ? 1.0 : .72), 20, dt);
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
  player.position.x = THREE.MathUtils.clamp(player.position.x, -23, 23);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -23, 23);
}

function attemptHorizontalMove(dx, dz) {
  const nextX = player.position.x + dx;
  if (!blocked(nextX, player.position.z)) player.position.x = nextX;
  const nextZ = player.position.z + dz;
  if (!blocked(player.position.x, nextZ)) player.position.z = nextZ;
}

function blocked(x, z) {
  for (const c of colliders) {
    if (x + PLAYER_RADIUS > c.minX() && x - PLAYER_RADIUS < c.maxX() && z + PLAYER_RADIUS > c.minZ() && z - PLAYER_RADIUS < c.maxZ()) return true;
  }
  if (!state.gateOpen && x + PLAYER_RADIUS > -2.2 && x - PLAYER_RADIUS < 2.2 && z + PLAYER_RADIUS > -8.12 && z - PLAYER_RADIUS < -7.60) return true;
  return false;
}

function updateCamera(immediate = false) {
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const desired = new THREE.Vector3(
    target.x - Math.sin(cameraYaw) * horizontal,
    target.y + Math.sin(cameraPitch) * cameraDistance + .45,
    target.z + Math.cos(cameraYaw) * horizontal
  );
  const rayDirection = desired.clone().sub(target);
  const desiredDistance = rayDirection.length();
  rayDirection.normalize();
  const hits = new THREE.Raycaster(target, rayDirection, .1, desiredDistance).intersectObjects(cameraObstacles, false);
  if (hits.length) desired.copy(target).add(rayDirection.multiplyScalar(Math.max(1.25, hits[0].distance - .35)));
  if (immediate) camera.position.copy(desired);
  else camera.position.lerp(desired, .2);
  camera.lookAt(target);
}

function updateCameraSmooth(dt) {
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
  const horizontal = Math.cos(cameraPitch) * cameraDistance;
  const desired = new THREE.Vector3(
    target.x - Math.sin(cameraYaw) * horizontal,
    target.y + Math.sin(cameraPitch) * cameraDistance + .45,
    target.z + Math.cos(cameraYaw) * horizontal
  );
  const direction = desired.clone().sub(target);
  const distance = direction.length();
  direction.normalize();
  const hits = new THREE.Raycaster(target, direction, .1, distance).intersectObjects(cameraObstacles, false);
  if (hits.length) desired.copy(target).add(direction.multiplyScalar(Math.max(1.35, hits[0].distance - .3)));
  camera.position.lerp(desired, 1 - Math.exp(-dt * 9.5));
  camera.lookAt(target);
}

function updateInteractions() {
  if (state.complete) {
    interactionPrompt.hidden = true;
    state.nearestInteraction = null;
    return;
  }
  let nearest = null;
  let nearestDistance = Infinity;
  for (const item of interactables) {
    if (item.id === "cell" && state.hasCell) continue;
    const distance = Math.hypot(player.position.x - item.position.x, player.position.z - item.position.z);
    if (distance <= item.radius && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }
  state.nearestInteraction = nearest;
  interactionPrompt.hidden = !nearest;
  if (nearest) interactionText.textContent = interactionLabel(nearest.id);
}

function interactionLabel(id) {
  if (id === "cell") return "Pick up energy cell";
  if (id === "terminal") return state.hasCell ? (state.terminalPowered ? "Terminal online" : "Use knowledge terminal") : "Terminal needs an energy cell";
  if (id === "switch") return state.terminalPowered ? (state.gateOpen ? "Gate already open" : "Activate gate switch") : "Switch has no power";
  return "Interact";
}

function interact() {
  if (!state.nearestInteraction || questionDialog.open || completeDialog.open) return;
  const id = state.nearestInteraction.id;
  if (id === "cell") {
    state.hasCell = true;
    energyCell.visible = false;
    updateHud();
  } else if (id === "terminal") {
    if (!state.hasCell) return pulseMessage("The terminal needs an energy cell first.");
    if (state.terminalPowered) return pulseMessage("Terminal restored. The gate switch now has power.");
    openQuestion();
  } else if (id === "switch") {
    if (!state.terminalPowered) return pulseMessage("No power. Restore the knowledge terminal first.");
    if (!state.gateOpen) {
      state.gateOpen = true;
      updateHud();
      pulseMessage("Gate unlocked. Enter the facility.");
    }
  }
}

function pulseMessage(text) {
  objectiveSubtext.textContent = text;
  objectiveSubtext.animate?.([{ opacity: .35 }, { opacity: 1 }], { duration: 220 });
}

const question = {
  text: "Which layer of Earth is liquid and surrounds the inner core?",
  answers: ["Crust", "Mantle", "Outer core", "Inner core"],
  correct: 2,
};
document.getElementById("questionText").textContent = question.text;

function buildAnswers() {
  answerList.innerHTML = "";
  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.textContent = `${index + 1}. ${answer}`;
    button.addEventListener("click", () => submitAnswer(index));
    answerList.appendChild(button);
  });
  updateAnswerFocus();
}

function openQuestion() {
  state.selectedAnswer = 0;
  state.questionLocked = false;
  questionFeedback.textContent = "";
  buildAnswers();
  questionDialog.showModal();
}

function handleQuestionKey(event) {
  if (["ArrowUp", "ArrowDown", "Enter", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) event.preventDefault();
  if (state.questionLocked) return;
  if (event.code === "ArrowUp") state.selectedAnswer = (state.selectedAnswer + question.answers.length - 1) % question.answers.length;
  if (event.code === "ArrowDown") state.selectedAnswer = (state.selectedAnswer + 1) % question.answers.length;
  if (/^Digit[1-4]$/.test(event.code)) {
    state.selectedAnswer = Number(event.code.slice(-1)) - 1;
    return submitAnswer(state.selectedAnswer);
  }
  if (event.code === "Enter") return submitAnswer(state.selectedAnswer);
  updateAnswerFocus();
}

function updateAnswerFocus() {
  [...answerList.children].forEach((button, index) => button.classList.toggle("focused", index === state.selectedAnswer));
}

function submitAnswer(index) {
  if (state.questionLocked) return;
  state.selectedAnswer = index;
  updateAnswerFocus();
  const buttons = [...answerList.children];
  if (index === question.correct) {
    state.questionLocked = true;
    buttons[index].classList.add("correct");
    questionFeedback.textContent = "Correct — terminal power restored.";
    state.terminalPowered = true;
    terminalGlow.material.color.setHex(0x38bdf8);
    terminalGlow.material.emissive.setHex(0x0284c7);
    terminalGlow.material.emissiveIntensity = 1.8;
    switchGlow.material.color.setHex(0xfacc15);
    switchGlow.material.emissive.setHex(0xa16207);
    switchGlow.material.emissiveIntensity = 1.6;
    updateHud();
    setTimeout(() => questionDialog.open && questionDialog.close(), 700);
  } else {
    buttons[index].classList.add("wrong");
    questionFeedback.textContent = "Not quite. Try another answer.";
    setTimeout(() => buttons[index]?.classList.remove("wrong"), 420);
  }
}

function updateHud() {
  cellStatus.textContent = state.hasCell ? "Collected" : "Not found";
  terminalStatus.textContent = state.terminalPowered ? "Online" : (state.hasCell ? "Ready" : "Offline");
  gateStatus.textContent = state.gateOpen ? "Open" : "Locked";
  if (!state.hasCell) {
    objectiveText.textContent = "Find the energy cell.";
    objectiveSubtext.textContent = "Explore the courtyard and look for a glowing object.";
  } else if (!state.terminalPowered) {
    objectiveText.textContent = "Restore the knowledge terminal.";
    objectiveSubtext.textContent = "Bring the energy cell to the blue terminal and answer its question.";
  } else if (!state.gateOpen) {
    objectiveText.textContent = "Unlock the facility gate.";
    objectiveSubtext.textContent = "The wall switch beside the entrance now has power.";
  } else if (!state.complete) {
    objectiveText.textContent = "Enter the facility.";
    objectiveSubtext.textContent = "The gate is open. Reach the glowing beacon inside.";
  }
}

function updateDoor(dt) {
  door.position.y = THREE.MathUtils.damp(door.position.y, state.gateOpen ? 6.7 : 2.25, 5.2, dt);
}

function updateAnimated(time) {
  animated.forEach((item) => {
    if (item.type === "cell" && item.mesh.visible) {
      item.mesh.position.y = item.baseY + Math.sin(time * 2.4) * .15;
      item.mesh.rotation.x += .012;
      item.mesh.rotation.y += .019;
    } else if (item.type === "spin") {
      item.mesh.rotation.z += .006 * (item.speed || 1);
    } else if (item.type === "doorStripe") {
      item.mesh.visible = !state.gateOpen;
    }
  });
}

function checkComplete() {
  if (state.complete || !state.gateOpen) return;
  if (Math.abs(player.position.x) < 2.2 && player.position.z < -14.5) {
    state.complete = true;
    objectiveText.textContent = "Facility restored!";
    objectiveSubtext.textContent = "The prototype progression loop is complete.";
    completeDialog.showModal();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .045);
  if (!questionDialog.open && !completeDialog.open) movePlayer(dt);
  updateDoor(dt);
  updateInteractions();
  updateAnimated(performance.now() / 1000);
  checkComplete();
  updateCameraSmooth(dt);
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    if (loadingScreen.animate) {
      loadingScreen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }).finished.then(() => loadingScreen.hidden = true);
    } else loadingScreen.hidden = true;
  }
}

function onResize() {
  if (!renderer || !camera) return;
  const width = mount.clientWidth;
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

try {
  if (!webglAvailable()) throw new Error("WebGL is unavailable on this browser/device.");
  loadingMessage.textContent = "Assembling the Lost Facility";
  createWorld();
  animate();
} catch (error) {
  fail(error?.message || "The 3D prototype could not initialize.");
}
