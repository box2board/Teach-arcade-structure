import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// Starts the v0.6 interior mission immediately after the player passes through
// the powered main entrance, instead of waiting for the old prototype beacon.

let player = null;
let triggered = false;

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") player = object;
  }
  return result;
};

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  const mission = window.TA3DMissionV6;
  const gateOpen = document.getElementById("gateStatus")?.textContent === "Open";

  if (
    !triggered && player && gateOpen && mission && !mission.started && !mission.finished &&
    Math.abs(player.position.x) < 6.8 && player.position.z < -9.0
  ) {
    triggered = true;
    // mission-v6 intercepts this call and converts it into the interior handoff.
    document.getElementById("completeDialog")?.showModal();
  }

  return previousRender.call(this, scene, camera);
};
