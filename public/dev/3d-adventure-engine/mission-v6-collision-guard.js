import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// Small collision guard for the v0.6 archive bulkhead. The mission module owns
// puzzle state; this module simply guarantees that the visible fixed walls stay
// physically solid and the center opening remains blocked until power is routed.

let player = null;
let lastSafe = null;

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") {
      player = object;
      lastSafe = object.position.clone();
    }
  }
  return result;
};

function inside(x, z, minX, maxX, minZ, maxZ) {
  return x > minX && x < maxX && z > minZ && z < maxZ;
}

function resolveBulkhead() {
  const mission = window.TA3DMissionV6;
  if (!player || !mission?.started || mission.finished) {
    if (player) lastSafe = player.position.clone();
    return;
  }
  if (!lastSafe) lastSafe = player.position.clone();

  const x = player.position.x;
  const z = player.position.z;
  const wallBandMinZ = -14.92;
  const wallBandMaxZ = -14.18;

  const hitsLeftWall = inside(x, z, -7.45, -1.52, wallBandMinZ, wallBandMaxZ);
  const hitsRightWall = inside(x, z, 1.52, 7.45, wallBandMinZ, wallBandMaxZ);
  const hitsClosedCenter = !mission.archiveUnlocked && inside(x, z, -1.62, 1.62, wallBandMinZ, wallBandMaxZ);

  if ((hitsLeftWall || hitsRightWall || hitsClosedCenter) && player.position.y < 4.25) {
    player.position.x = lastSafe.x;
    player.position.z = lastSafe.z;
  } else {
    lastSafe.copy(player.position);
  }
}

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  resolveBulkhead();
  return previousRender.call(this, scene, camera);
};
