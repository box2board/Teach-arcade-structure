import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

let player = null;
let lastPosition = null;
let facingYaw = 0;

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function decoratePlayer(group) {
  if (group.userData.facingDecorated) return;
  group.userData.facingDecorated = true;

  const suit = new THREE.MeshStandardMaterial({ color: 0xe8a92e, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.55, metalness: 0.12 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.18, emissive: 0x075985, emissiveIntensity: 0.55 });

  // The character's visible front points down local -Z.
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.12), suit);
  chest.position.set(0, 1.02, -0.45);
  chest.castShadow = true;
  group.add(chest);

  const chestLight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.035), blue);
  chestLight.position.set(0, 1.07, -0.52);
  group.add(chestLight);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.28), dark);
  pack.position.set(0, 1.03, 0.43);
  pack.castShadow = true;
  group.add(pack);

  const armGeometry = new THREE.CapsuleGeometry(0.12, 0.52, 4, 7);
  const leftArm = new THREE.Mesh(armGeometry, suit);
  leftArm.position.set(-0.54, 0.92, -0.02);
  leftArm.rotation.z = -0.08;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.54;
  rightArm.rotation.z = 0.08;
  group.add(rightArm);
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
    }
  }
  return result;
};

const originalRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  if (player) {
    if (!lastPosition) lastPosition = player.position.clone();
    const dx = player.position.x - lastPosition.x;
    const dz = player.position.z - lastPosition.z;
    const distanceSq = dx * dx + dz * dz;

    if (distanceSq > 0.0000005) {
      // Local forward is -Z. The previous heading calculation mirrored the X
      // component, so left/right movement made the character face the wrong
      // lateral direction. Negating dx maps local -Z to the actual travel vector.
      const targetYaw = Math.atan2(-dx, -dz);
      const delta = wrapAngle(targetYaw - facingYaw);
      facingYaw = wrapAngle(facingYaw + delta * 0.72);
    }

    // Keep the visual heading authoritative. main.js also applies an older
    // input-based rotation before render; overriding it here prevents the two
    // systems from fighting and eliminates the sideways/skating appearance.
    player.rotation.y = facingYaw;
    lastPosition.copy(player.position);
  }

  return originalRender.call(this, scene, camera);
};
