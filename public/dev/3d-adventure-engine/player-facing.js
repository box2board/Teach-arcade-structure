import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

let player = null;
let lastPosition = null;
let facingYaw = 0;
let lastFrameTime = performance.now() / 1000;
let stridePhase = 0;
let lastTurnDelta = 0;

let bodyRig = null;
let torsoPivot = null;
let leftShoulder = null;
let rightShoulder = null;
let leftElbow = null;
let rightElbow = null;
let leftHip = null;
let rightHip = null;
let leftKnee = null;
let rightKnee = null;
let leftFoot = null;
let rightFoot = null;

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function mesh(geometry, material, parent, x, y, z) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

function createLimb(parent, side, suit, dark) {
  const upper = new THREE.Group();
  parent.add(upper);

  const upperPart = mesh(new THREE.BoxGeometry(0.22, 0.44, 0.24), suit, upper, 0, -0.22, 0);
  upperPart.geometry.translate(0, 0, 0);

  const joint = new THREE.Group();
  joint.position.y = -0.43;
  upper.add(joint);

  mesh(new THREE.BoxGeometry(0.2, 0.4, 0.22), suit, joint, 0, -0.2, 0);
  const hand = mesh(new THREE.SphereGeometry(0.13, 8, 6), dark, joint, 0, -0.44, -0.01);
  hand.scale.set(0.9, 1.0, 0.85);

  upper.rotation.z = side * 0.07;
  return { upper, joint };
}

function createLeg(parent, side, suit, dark) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.22, 0.12, 0);
  parent.add(hip);

  mesh(new THREE.BoxGeometry(0.28, 0.46, 0.3), suit, hip, 0, -0.23, 0);

  const knee = new THREE.Group();
  knee.position.y = -0.45;
  hip.add(knee);
  mesh(new THREE.BoxGeometry(0.25, 0.42, 0.27), suit, knee, 0, -0.21, 0);

  const foot = mesh(new THREE.BoxGeometry(0.3, 0.18, 0.48), dark, knee, 0, -0.47, -0.09);
  foot.position.z = -0.09;

  return { hip, knee, foot };
}

function buildHumanoid(group) {
  if (group.userData.humanoidRigged) return;
  group.userData.humanoidRigged = true;

  // Hide the original capsule/sphere placeholder. It remains in the group only
  // as part of the prototype controller/collision identity; the articulated rig
  // below is the visible character.
  [...group.children].forEach((child) => {
    if (child.isMesh) child.visible = false;
  });

  const suit = new THREE.MeshStandardMaterial({ color: 0xe8a92e, roughness: 0.68 });
  const suitLight = new THREE.MeshStandardMaterial({ color: 0xf4c653, roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.5, metalness: 0.1 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe9b98c, roughness: 0.8 });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.18,
    emissive: 0x075985,
    emissiveIntensity: 0.7,
  });

  bodyRig = new THREE.Group();
  bodyRig.name = "articulated-player-rig";
  group.add(bodyRig);

  // Hips / pelvis.
  mesh(new THREE.BoxGeometry(0.72, 0.28, 0.42), dark, bodyRig, 0, 0.24, 0.02);

  // Torso gets its own pivot so we can lean independently of the legs.
  torsoPivot = new THREE.Group();
  torsoPivot.position.y = 0.34;
  bodyRig.add(torsoPivot);
  const torso = mesh(new THREE.BoxGeometry(0.78, 0.72, 0.44), suit, torsoPivot, 0, 0.34, 0);
  torso.scale.x = 1.03;
  mesh(new THREE.BoxGeometry(0.54, 0.3, 0.08), suitLight, torsoPivot, 0, 0.36, -0.25);
  mesh(new THREE.BoxGeometry(0.26, 0.09, 0.04), blue, torsoPivot, 0, 0.43, -0.31);

  // Backpack makes front/back impossible to confuse.
  mesh(new THREE.BoxGeometry(0.56, 0.64, 0.28), dark, torsoPivot, 0, 0.34, 0.34);

  // Neck/head. The face/visor is explicitly on local -Z, our forward axis.
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 8), skin, torsoPivot, 0, 0.78, 0);
  const head = mesh(new THREE.BoxGeometry(0.5, 0.48, 0.46), skin, torsoPivot, 0, 1.04, 0);
  head.geometry.translate(0, 0, 0);
  mesh(new THREE.BoxGeometry(0.36, 0.16, 0.055), dark, torsoPivot, 0, 1.08, -0.255);
  mesh(new THREE.BoxGeometry(0.1, 0.04, 0.025), blue, torsoPivot, 0, 1.08, -0.292);

  // Shoulders and articulated arms.
  leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.5, 0.64, 0);
  torsoPivot.add(leftShoulder);
  const lArm = createLimb(leftShoulder, -1, suit, dark);
  leftElbow = lArm.joint;

  rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.5, 0.64, 0);
  torsoPivot.add(rightShoulder);
  const rArm = createLimb(rightShoulder, 1, suit, dark);
  rightElbow = rArm.joint;

  // Articulated hips, knees and feet.
  const lLeg = createLeg(bodyRig, -1, suit, dark);
  leftHip = lLeg.hip;
  leftKnee = lLeg.knee;
  leftFoot = lLeg.foot;

  const rLeg = createLeg(bodyRig, 1, suit, dark);
  rightHip = rLeg.hip;
  rightKnee = rLeg.knee;
  rightFoot = rLeg.foot;

  // Move the whole visible rig down so the soles meet the ground while the
  // engine's existing player origin/collision height stays untouched.
  bodyRig.position.y = 0.78;
}

function animateRig(dx, dy, dz, dt) {
  if (!bodyRig || !leftHip || !rightHip || !leftKnee || !rightKnee || !leftShoulder || !rightShoulder) return;

  const distance = Math.hypot(dx, dz);
  const speed = dt > 0 ? distance / dt : 0;
  const moving = speed > 0.12;
  const running = speed > 6.15;
  const airborne = player.position.y > 1.04;

  if (airborne) {
    leftHip.rotation.x = damp(leftHip.rotation.x, 0.28, 12, dt);
    rightHip.rotation.x = damp(rightHip.rotation.x, -0.18, 12, dt);
    leftKnee.rotation.x = damp(leftKnee.rotation.x, -0.55, 12, dt);
    rightKnee.rotation.x = damp(rightKnee.rotation.x, -0.42, 12, dt);
    leftShoulder.rotation.x = damp(leftShoulder.rotation.x, -0.45, 12, dt);
    rightShoulder.rotation.x = damp(rightShoulder.rotation.x, -0.45, 12, dt);
    torsoPivot.rotation.x = damp(torsoPivot.rotation.x, -0.06, 10, dt);
    bodyRig.position.y = damp(bodyRig.position.y, 0.82, 10, dt);
    return;
  }

  if (moving) {
    stridePhase += distance * (running ? 4.5 : 3.85);
    const s = Math.sin(stridePhase);
    const c = Math.cos(stridePhase);
    const stride = running ? 0.72 : 0.5;
    const armStride = running ? 0.68 : 0.46;

    leftHip.rotation.x = damp(leftHip.rotation.x, s * stride, 20, dt);
    rightHip.rotation.x = damp(rightHip.rotation.x, -s * stride, 20, dt);

    // Bend the knee on the leg that is recovering forward. Negative X bends
    // the shin backward relative to the thigh for this rig orientation.
    const leftBend = -Math.max(0, -s) * (running ? 0.95 : 0.7);
    const rightBend = -Math.max(0, s) * (running ? 0.95 : 0.7);
    leftKnee.rotation.x = damp(leftKnee.rotation.x, leftBend, 22, dt);
    rightKnee.rotation.x = damp(rightKnee.rotation.x, rightBend, 22, dt);

    leftShoulder.rotation.x = damp(leftShoulder.rotation.x, -s * armStride, 20, dt);
    rightShoulder.rotation.x = damp(rightShoulder.rotation.x, s * armStride, 20, dt);
    leftElbow.rotation.x = damp(leftElbow.rotation.x, -0.1 - Math.max(0, s) * 0.28, 16, dt);
    rightElbow.rotation.x = damp(rightElbow.rotation.x, -0.1 - Math.max(0, -s) * 0.28, 16, dt);

    // Small foot pitch gives each step a heel/toe read instead of two rigid rods.
    leftFoot.rotation.x = damp(leftFoot.rotation.x, c * 0.11, 16, dt);
    rightFoot.rotation.x = damp(rightFoot.rotation.x, -c * 0.11, 16, dt);

    const bob = Math.abs(Math.sin(stridePhase * 2)) * (running ? 0.055 : 0.034);
    bodyRig.position.y = damp(bodyRig.position.y, 0.78 + bob, 20, dt);
    torsoPivot.rotation.x = damp(torsoPivot.rotation.x, running ? -0.11 : -0.035, 12, dt);
    torsoPivot.rotation.z = damp(torsoPivot.rotation.z, -lastTurnDelta * 0.11, 10, dt);
  } else {
    leftHip.rotation.x = damp(leftHip.rotation.x, 0, 14, dt);
    rightHip.rotation.x = damp(rightHip.rotation.x, 0, 14, dt);
    leftKnee.rotation.x = damp(leftKnee.rotation.x, 0, 14, dt);
    rightKnee.rotation.x = damp(rightKnee.rotation.x, 0, 14, dt);
    leftShoulder.rotation.x = damp(leftShoulder.rotation.x, 0, 14, dt);
    rightShoulder.rotation.x = damp(rightShoulder.rotation.x, 0, 14, dt);
    leftElbow.rotation.x = damp(leftElbow.rotation.x, 0, 14, dt);
    rightElbow.rotation.x = damp(rightElbow.rotation.x, 0, 14, dt);
    leftFoot.rotation.x = damp(leftFoot.rotation.x, 0, 14, dt);
    rightFoot.rotation.x = damp(rightFoot.rotation.x, 0, 14, dt);
    bodyRig.position.y = damp(bodyRig.position.y, 0.78, 14, dt);
    torsoPivot.rotation.x = damp(torsoPivot.rotation.x, 0, 12, dt);
    torsoPivot.rotation.z = damp(torsoPivot.rotation.z, 0, 12, dt);
  }
}

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (!player && object?.isGroup && object.children?.some((child) => child.geometry?.type === "CapsuleGeometry")) {
      player = object;
      buildHumanoid(player);
      lastPosition = player.position.clone();
      facingYaw = player.rotation.y;
      lastFrameTime = performance.now() / 1000;
    }
  }
  return result;
};

const originalRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  if (player) {
    if (!lastPosition) lastPosition = player.position.clone();

    const now = performance.now() / 1000;
    const dt = Math.min(Math.max(now - lastFrameTime, 1 / 240), 0.05);
    lastFrameTime = now;

    const dx = player.position.x - lastPosition.x;
    const dy = player.position.y - lastPosition.y;
    const dz = player.position.z - lastPosition.z;
    const distanceSq = dx * dx + dz * dz;

    if (distanceSq > 0.0000003) {
      // The visible model's forward direction is local -Z. This mapping makes
      // its chest/face point along the actual world-space travel vector.
      const targetYaw = Math.atan2(-dx, -dz);
      const delta = wrapAngle(targetYaw - facingYaw);
      lastTurnDelta = delta;

      // Turn decisively into travel direction. A third-person adventure avatar
      // should not linger in a strafe pose unless the game explicitly has one.
      const response = 1 - Math.exp(-dt * 24);
      facingYaw = wrapAngle(facingYaw + delta * response);
    } else {
      lastTurnDelta = damp(lastTurnDelta, 0, 12, dt);
    }

    // main.js still writes an older input-based rotation earlier in the frame.
    // This movement-derived heading is the final visual authority.
    player.rotation.y = facingYaw;

    animateRig(dx, dy, dz, dt);
    lastPosition.copy(player.position);
  }

  return originalRender.call(this, scene, camera);
};
