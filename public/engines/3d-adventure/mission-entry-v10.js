// v1.0 exterior-to-mission handoff.
// Uses the engine update hook and the exterior progression API rather than
// renderer monkey-patching or reading HUD text as game state.

const config = window.TA3DAdventure?.config || window.TA3DAdventureConfig || {};
const trigger = config.exterior?.entryTrigger || { maxAbsX: 6.8, zLessThan: -9.0 };
const completeDialog = document.getElementById("completeDialog");

let engine = null;
let triggered = false;

function update() {
  const mission = window.TA3DMission || window.TA3DMissionV6;
  const exterior = window.TA3DExteriorProgression;
  const player = engine?.player;
  if (!player || triggered || !exterior?.gateOpen || !mission || mission.started || mission.finished) return;

  if (
    Math.abs(player.position.x) < (trigger.maxAbsX ?? 6.8) &&
    player.position.z < (trigger.zLessThan ?? -9.0)
  ) {
    triggered = true;
    // The mission runtime owns the completeDialog interception and converts
    // this call into the configured exterior-to-interior handoff.
    completeDialog?.showModal();
  }
}

function attach(api) {
  if (!api || engine) return;
  engine = api;
  api.onUpdate(update);
}

window.addEventListener("ta3d:engine-ready", (event) => attach(event.detail));
if (window.TA3DEngine) attach(window.TA3DEngine);
