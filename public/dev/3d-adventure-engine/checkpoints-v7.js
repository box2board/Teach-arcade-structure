import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v0.7 checkpoint/recovery layer.
// This intentionally does not own movement or mission rules. It watches the
// existing v0.2-v0.6 systems, records milestone progress, and restores progress
// by replaying the real interactions behind a short loading veil.

const STORAGE_KEY = "teachArcade3D.lostFacility.v07.checkpoint";
const VERSION = 1;

const STAGES = ["start", "cell", "terminal", "entrance", "facility", "archive", "core"];
const LABELS = {
  start: "Exterior",
  cell: "Energy Cell",
  terminal: "Terminal Online",
  entrance: "Main Gate",
  facility: "Facility Interior",
  archive: "Research Archive",
  core: "Command Core",
};

let scene = null;
let player = null;
let restoreStarted = false;
let restoring = false;
let lastObservedStage = "start";
let lastSavedStage = readSave()?.stage || "start";
let lastPoll = 0;

const cellStatus = document.getElementById("cellStatus");
const terminalStatus = document.getElementById("terminalStatus");
const gateStatus = document.getElementById("gateStatus");
const questionDialog = document.getElementById("questionDialog");
const answerList = document.getElementById("answerList");
const restartGame = document.getElementById("restartGame");

function rank(stage) {
  return Math.max(0, STAGES.indexOf(stage));
}

function readSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.version !== VERSION || !STAGES.includes(parsed.stage)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSave(stage) {
  if (!STAGES.includes(stage) || rank(stage) < rank(lastSavedStage)) return;
  lastSavedStage = stage;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: VERSION,
      stage,
      savedAt: Date.now(),
    }));
  } catch {
    // Private browsing / locked-down school browsers may disable storage.
  }
  updateCheckpointUi(stage);
}

function clearSave() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  lastSavedStage = "start";
  updateCheckpointUi("start");
}

function ensureUi() {
  const status = document.querySelector(".status-card");
  if (status && !document.getElementById("checkpointStatus")) {
    const line = document.createElement("span");
    line.innerHTML = '<b>Checkpoint</b> <span id="checkpointStatus">Exterior</span>';
    status.appendChild(line);
  }

  if (!document.getElementById("ta3dCheckpointVeil")) {
    const veil = document.createElement("div");
    veil.id = "ta3dCheckpointVeil";
    veil.hidden = true;
    veil.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:20000",
      "display:grid",
      "place-items:center",
      "background:#07111b",
      "color:#eaf9ff",
      "font:700 14px/1.45 system-ui,sans-serif",
      "text-align:center",
      "letter-spacing:.02em",
      "pointer-events:all",
    ].join(";");
    veil.innerHTML = '<div><div style="font-size:11px;letter-spacing:.14em;opacity:.65;margin-bottom:8px">LOST FACILITY</div><strong id="ta3dCheckpointMessage">Restoring checkpoint…</strong></div>';
    document.body.appendChild(veil);
  }

  const saved = readSave();
  updateCheckpointUi(saved?.stage || "start");
}

function updateCheckpointUi(stage) {
  const node = document.getElementById("checkpointStatus");
  if (node) node.textContent = LABELS[stage] || "Exterior";
}

function setVeil(show, message = "Restoring checkpoint…") {
  const veil = document.getElementById("ta3dCheckpointVeil");
  const text = document.getElementById("ta3dCheckpointMessage");
  if (text) text.textContent = message;
  if (veil) veil.hidden = !show;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeout = 4200, interval = 45) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    if (predicate()) return true;
    await sleep(interval);
  }
  return false;
}

function teleport(x, z, y = 0) {
  if (!player) return;
  player.position.set(x, y, z);
}

function tapInteract() {
  window.dispatchEvent(new KeyboardEvent("keydown", {
    code: "KeyE",
    key: "e",
    bubbles: true,
    cancelable: true,
  }));
  window.setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent("keyup", {
      code: "KeyE",
      key: "e",
      bubbles: true,
      cancelable: true,
    }));
  }, 36);
}

async function interactAt(x, z, confirm, timeout = 2400) {
  teleport(x, z);
  await sleep(150);
  tapInteract();
  return waitFor(confirm, timeout);
}

async function restoreBaseTo(stage) {
  if (rank(stage) < rank("cell")) return true;

  if (cellStatus?.textContent !== "Collected") {
    await interactAt(-6.3, 5.2, () => cellStatus?.textContent === "Collected");
  }

  if (rank(stage) < rank("terminal")) {
    teleport(5.2, -1.8);
    return true;
  }

  if (terminalStatus?.textContent !== "Online") {
    teleport(6.35, -3.6);
    await sleep(160);
    tapInteract();
    const opened = await waitFor(() => questionDialog?.open, 2200);
    if (opened) {
      await sleep(90);
      const buttons = [...(answerList?.children || [])];
      buttons[2]?.click();
      await waitFor(() => terminalStatus?.textContent === "Online", 2600);
      await waitFor(() => !questionDialog?.open, 2600);
    }
  }

  if (rank(stage) < rank("entrance")) {
    teleport(2.8, -4.7);
    return true;
  }

  if (gateStatus?.textContent !== "Open") {
    await interactAt(2.8, -6.35, () => gateStatus?.textContent === "Open", 2600);
  }

  if (rank(stage) === rank("entrance")) {
    teleport(0, -6.45);
  }
  return true;
}

async function ensureMissionStarted() {
  const mission = () => window.TA3DMissionV6;
  if (mission()?.started) return true;
  teleport(0, -9.65);
  await waitFor(() => mission()?.started, 3200);
  await sleep(360);
  return Boolean(mission()?.started);
}

async function restoreMissionTo(stage) {
  if (rank(stage) < rank("facility")) return true;
  const mission = () => window.TA3DMissionV6;
  if (!(await ensureMissionStarted())) return false;

  if (rank(stage) === rank("facility")) {
    teleport(0, -10.15);
    return true;
  }

  const relaySteps = [
    [-4.75, -10.65, 1],
    [4.75, -11.55, 2],
    [0, -13.1, 3],
  ];
  for (const [x, z, expected] of relaySteps) {
    if ((mission()?.relayProgress || 0) >= expected) continue;
    await interactAt(x, z, () => (mission()?.relayProgress || 0) >= expected, 2400);
  }

  await waitFor(() => mission()?.archiveUnlocked, 2200);
  if (rank(stage) === rank("archive")) {
    teleport(0, -15.55);
    return true;
  }

  if (!mission()?.knowledgePassed) {
    teleport(-4.7, -17.35);
    await sleep(180);
    tapInteract();
    const opened = await waitFor(() => questionDialog?.open, 2200);
    if (opened) {
      await sleep(90);
      const buttons = [...(answerList?.children || [])];
      buttons[0]?.click();
      await waitFor(() => mission()?.knowledgePassed, 2600);
      await waitFor(() => !questionDialog?.open, 2600);
    }
  }

  teleport(0.5, -16.25);
  return true;
}

async function restoreCheckpoint(stage) {
  if (!player || stage === "start") return;
  restoring = true;
  setVeil(true, `Restoring: ${LABELS[stage] || "checkpoint"}…`);

  try {
    await restoreBaseTo(stage);
    await restoreMissionTo(stage);
    writeSave(stage);
  } catch (error) {
    console.warn("Checkpoint restore failed; returning to exterior start.", error);
    clearSave();
    teleport(0, 12.5);
  }

  await sleep(220);
  setVeil(false);
  restoring = false;
}

function observedStage() {
  const mission = window.TA3DMissionV6;
  if (mission?.knowledgePassed) return "core";
  if (mission?.archiveUnlocked) return "archive";
  if (mission?.started) return "facility";
  if (gateStatus?.textContent === "Open") return "entrance";
  if (terminalStatus?.textContent === "Online") return "terminal";
  if (cellStatus?.textContent === "Collected") return "cell";
  return "start";
}

function pollProgress(now) {
  if (restoring || now - lastPoll < 220) return;
  lastPoll = now;
  const stage = observedStage();
  lastObservedStage = stage;
  if (rank(stage) > rank(lastSavedStage)) writeSave(stage);
}

function capturePlayer(targetScene, object) {
  if (object?.name !== "player-controller") return;
  scene = targetScene;
  player = object;

  if (!restoreStarted) {
    restoreStarted = true;
    const saved = readSave();
    if (saved?.stage && saved.stage !== "start") {
      window.setTimeout(() => restoreCheckpoint(saved.stage), 360);
    }
  }
}

ensureUi();

// "Play again" must mean a genuinely fresh run, not a reload back into the
// final checkpoint.
restartGame?.addEventListener("click", () => {
  clearSave();
}, true);

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) capturePlayer(this, object);
  return result;
};

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (renderScene, camera) {
  pollProgress(performance.now());
  return previousRender.call(this, renderScene, camera);
};

window.TA3DCheckpoints = {
  get stage() { return lastSavedStage; },
  get restoring() { return restoring; },
  clear: clearSave,
  async recover() {
    const saved = readSave();
    if (!saved?.stage || saved.stage === "start") {
      teleport(0, 12.5);
      return;
    }
    await restoreCheckpoint(saved.stage);
  },
  snapshot() {
    return {
      stage: lastSavedStage,
      observedStage: lastObservedStage,
      label: LABELS[lastSavedStage] || "Exterior",
    };
  },
};
