import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v0.9 config-driven mission entry trigger.
// The active adventure package decides where the exterior-to-interior handoff occurs.

const config = window.TA3DAdventureConfig;
const trigger = config?.exterior?.entryTrigger || { maxAbsX: 6.8, zLessThan: -9.0 };

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
  const mission = window.TA3DMission || window.TA3DMissionV6;
  const gateOpen = document.getElementById("gateStatus")?.textContent === "Open";

  if (
    !triggered && player && gateOpen && mission && !mission.started && !mission.finished &&
    Math.abs(player.position.x) < (trigger.maxAbsX ?? 6.8) &&
    player.position.z < (trigger.zLessThan ?? -9.0)
  ) {
    triggered = true;
    // The mission runtime intercepts this legacy completion dialog call and
    // converts it into the configured mission handoff.
    document.getElementById("completeDialog")?.showModal();
  }

  return previousRender.call(this, scene, camera);
};
