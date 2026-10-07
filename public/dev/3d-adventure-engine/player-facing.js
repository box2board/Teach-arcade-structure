import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

let player = null;
let lastPosition = null;
let facingYaw = 0;
let lastFrameTime = performance.now() / 1000;
let stridePhase = 0;

let bodyRig = null;
let leftArmPivot = null;
let rightArmPivot = null;
let leftLegPivot = null;
let rightLegPivot = null;

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function decoratePlayer(group) {
  if (group.userData.facingDecorated) return;
  group.userData.facingDecorated = true;

  const suit = new THREE.MeshStandardMaterial({ color: 0xe8a92e, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.55, metalness: 0.12 });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.35,
    metalness: 0.18,
    emissive: 0x075985,
    emissiveIntensity: 0.55,
  });

  // Put the prototype torso/head inside a small visual rig. The engine still
  // moves the outer player group, while this rig supplies animation only.
  const existingParts = [...group.children];
  bodyRig = new THREE.Group();
  bodyRig.name = "player-body-rig";
  group.add(bodyRig);
  existingParts.forEach((part) => bodyRig.add(part));

  // The character's visible front points down local -Z.
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.12), suit);
  chest.position.set(0, 1.02, -0.45);
  chest.castShadow = true;
  bodyRig.add(chest);

  const chestLight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.035), blue);
  chestLight.position.set(0, 1.07, -0.52);
  bodyRig.add(chestLight);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.28), dark);
  pack.position.set(0, 1.03, 0.43);
  pack.castShadow = true;
  bodyRig.add(pack);

  // Arms are pivoted from the shoulders so they can swing naturally.
  const armGeometry = new THREE.CapsuleGeometry(0.12, 0.48, 4, 7);
  leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.54, 1.24, -0.01);
  const leftArm = new THREE.Mesh(armGeometry, suit);
  leftArm.position.y = -0.34;
  leftArm.rotation.z = -0.08;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  bodyRig.add(leftArmPivot);

  rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.54, 1.24, -0.01);
  const rightArm = new THREE.Mesh(armGeometry, suit);
  rightArm.position.y = -0.34;
  rightArm.rotation.z = 0.08;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  bodyRig.add(rightArmPivot);

  // Simple articulated legs are enough to remove the skating/gliding look.
  const legGeometry = new THREE.CapsuleGeometry(0.14, 0.46, 4, 7);
  const bootGeometry = new THREE.BoxGeometry(0.3, 0.22, 0.48);

  leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.23, 0.28, 0);
  const leftLeg = new THREE.Mesh(legGeometry, suit);
  leftLeg.position.y = -0.31;
  leftLeg.castShadow = true;
  const leftBoot = new THREE.Mesh(bootGeometry, dark);
  leftBoot.position.set(0, -0.68, -0.08);
  leftBoot.castShadow = true;
  leftLegPivot.add(leftLeg, leftBoot);
  bodyRig.add(leftLegPivot);

  rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.23, 0.28, 0);
  const rightLeg = new THREE.Mesh(legGeometry, suit);
  rightLeg.position.y = -0.31;
  rightLeg.castShadow = true;
  const rightBoot = new THREE.Mesh(bootGeometry, dark);
  rightBoot.position.set(0, -0.68, -0.08);
  rightBoot.castShadow = true;
  rightLegPivot.add(rightLeg, rightBoot);
  bodyRig.add(rightLegPivot);
}

function animateLocomotion(dx, dy, dz, dt) {
  if (!bodyRig || !leftArmPivot || !rightArmPivot || !leftLegPivot || !rightLegPivot) return;

  const horizontalDistance = Math.hypot(dx, dz);
  const speed = dt > 0 ? horizontalDistance / dt : 0;
  const moving = speed > 0.18;
  const running = speed > 6.25;
  const airborne = player.position.y > 1.03;

  if (airborne) {
    // Readable airborne silhouette instead of continuing to "walk" in midair.
    leftArmPivot.rotation.x = damp(leftArmPivot.rotation.x, -0.42, 10, dt);
    rightArmPivot.rotation.x = damp(rightArmPivot.rotation.x, -0.42, 10, dt);
    leftLegPivot.rotation.x = damp(leftLegPivot.rotation.x, 0.28, 10, dt);
    rightLegPivot.rotation.x = damp(rightLegPivot.rotation.x, -0.22, 10, dt);
    bodyRig.position.y = damp(bodyRig.position.y, 0.02, 10, dt);
    bodyRig.rotation.x = damp(bodyRig.rotation.x, dy > 0 ? -0.08 : 0.05, 9, dt);
    bodyRig.rotation.z = damp(bodyRig.rotation.z, 0, 10, dt);
    return;
  }

  if (moving) {
    // Advance animation from actual ground distance traveled, not input. This
    // keeps foot cadence sensible when the player bumps or slides along walls.
    stridePhase += horizontalDistance * (running ? 3.8 : 3.15);
    const swing = Math.sin(stridePhase) * (running ? 0.78 : 0.52);
    const armSwing = swing * (running ? 0.92 : 0.82);
    const bob = Math.abs(Math.sin(stridePhase * 2)) * (running ? 0.075 : 0.045);
    const sway = Math.sin(stridePhase) * (running ? 0.035 : 0.02);

    leftLegPivot.rotation.x = damp(leftLegPivot.rotation.x, swing, 18, dt);
    rightLegPivot.rotation.x = damp(rightLegPivot.rotation.x, -swing, 18, dt);
    leftArmPivot.rotation.x = damp(leftArmPivot.rotation.x, -armSwing, 18, dt);
    rightArmPivot.rotation.x = damp(rightArmPivot.rotation.x, armSwing, 18, dt);

    bodyRig.position.y = damp(bodyRig.position.y, bob, 18, dt);
    bodyRig.rotation.x = damp(bodyRig.rotation.x, running ? -0.095 : -0.035, 10, dt);
    bodyRig.rotation.z = damp(bodyRig.rotation.z, sway, 13, dt);
  } else {
    // Settle cleanly into a neutral idle pose instead of freezing mid-stride.
    leftLegPivot.rotation.x = damp(leftLegPivot.rotation.x, 0, 12, dt);
    rightLegPivot.rotation.x = damp(rightLegPivot.rotation.x, 0, 12, dt);
    leftArmPivot.rotation.x = damp(leftArmPivot.rotation.x, 0, 12, dt);
    rightArmPivot.rotation.x = damp(rightArmPivot.rotation.x, 0, 12, dt);
    bodyRig.position.y = damp(bodyRig.position.y, 0, 12, dt);
    bodyRig.rotation.x = damp(bodyRig.rotation.x, 0, 10, dt);
    bodyRig.rotation.z = damp(bodyRig.rotation.z, 0, 10, dt);
  }
}

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (!player && object?.isGroup && object.children?.some((child) => child.geometry?.type === "CapsuleGeometry")) {
      player = object;
      decoratePlayer(player);
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

    if (distanceSq > 0.0000005) {
      // Local forward is -Z. Negating X is required by Three.js Y rotation
      // convention so the model faces the same world-space vector it travels.
      const targetYaw = Math.atan2(-dx, -dz);
      const delta = wrapAngle(targetYaw - facingYaw);
      // Faster turn while running, while preserving a small natural turn-in.
      const horizontalSpeed = Math.sqrt(distanceSq) / dt;
      const turnResponse = horizontalSpeed > 6.25 ? 0.84 : 0.76;
      facingYaw = wrapAngle(facingYaw + delta * turnResponse);
    }

    // Keep this visual heading authoritative. main.js still contains an older
    // input-based rotation, so the render-time value prevents the systems from
    // fighting while the prototype controller is being iterated.
    player.rotation.y = facingYaw;

    animateLocomotion(dx, dy, dz, dt);
    lastPosition.copy(player.position);
  }

  return originalRender.call(this, scene, camera);
};
