import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v0.9 config-driven checkpoint/recovery layer.
// Recovery coordinates, relay stations, and academic answer indexes now come
// from the active adventure package instead of Lost Facility-specific constants.

const adventure = window.TA3DAdventure;
const config = adventure?.config || window.TA3DAdventureConfig;
const exterior = config?.exterior || {};
const missionConfig = config?.mission || {};
const STAGES = [...(config?.checkpoints || ["start", "cell", "terminal", "entrance", "facility", "archive", "core"])];
const STORAGE_KEY = adventure?.storageKey?.("checkpoint.v1") || `teachArcade3D.${config?.id || "adventure"}.checkpoint.v1`;
const LEGACY_KEY = "teachArcade3D.lostFacility.v07.checkpoint";
const VERSION = 1;
const useLegacy = config?.id === "lost-facility" && config?.migrateLegacyCheckpoint !== false;

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

function parseStored(raw) {
  try {
    const parsed = JSON.parse(raw || "null");
    if (!parsed || !STAGES.includes(parsed.stage)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSave() {
  try {
    const current = parseStored(localStorage.getItem(STORAGE_KEY));
    if (current) return current;
    const legacy = useLegacy ? parseStored(localStorage.getItem(LEGACY_KEY)) : null;
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, stage: legacy.stage, savedAt: legacy.savedAt || Date.now() }));
      return legacy;
    }
  } catch {}
  return null;
}

function writeSave(stage) {
  if (!STAGES.includes(stage) || rank(stage) < rank(lastSavedStage)) return;
  lastSavedStage = stage;
  const payload = JSON.stringify({ version: VERSION, stage, adventureId: config?.id, savedAt: Date.now() });
  try {
    localStorage.setItem(STORAGE_KEY, payload);
    // Mirror during v0.9 so the v0.8 difficulty selector recognizes progress.
    if (useLegacy) localStorage.setItem(LEGACY_KEY, payload);
  } catch {}
  updateCheckpointUi(stage);
}

function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (useLegacy) localStorage.removeItem(LEGACY_KEY);
  } catch {}
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
    veil.style.cssText = "position:fixed;inset:0;z-index:20000;display:grid;place-items:center;background:#07111b;color:#eaf9ff;font:700 14px/1.45 system-ui,sans-serif;text-align:center;letter-spacing:.02em;pointer-events:all";
    veil.innerHTML = `<div><div style="font-size:11px;letter-spacing:.14em;opacity:.65;margin-bottom:8px">${config?.title?.toUpperCase?.() || "3D ADVENTURE"}</div><strong id="ta3dCheckpointMessage">Restoring checkpoint…</strong></div>`;
    document.body.appendChild(veil);
  }
  updateCheckpointUi(readSave()?.stage || "start");
}

function updateCheckpointUi(stage) {
  const node = document.getElementById("checkpointStatus");
  if (node) node.textContent = LABELS[stage] || stage;
}

function setVeil(show, message = "Restoring checkpoint…") {
  const veil = document.getElementById("ta3dCheckpointVeil");
  const label = document.getElementById("ta3dCheckpointMessage");
  if (label) label.textContent = message;
  if (veil) veil.hidden = !show;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(predicate, timeout = 4200, interval = 45) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    if (predicate()) return true;
    await sleep(interval);
  }
  return false;
}

function teleport(point, fallback = { x: 0, z: 0 }) {
  if (!player) return;
  const target = point || fallback;
  player.position.set(target.x || 0, target.y || 0, target.z || 0);
}

function tapInteract() {
  window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE", key: "e", bubbles: true, cancelable: true }));
  setTimeout(() => window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE", key: "e", bubbles: true, cancelable: true })), 36);
}

async function interactAt(point, confirm, timeout = 2400) {
  teleport(point);
  await sleep(150);
  tapInteract();
  return waitFor(confirm, timeout);
}

async function restoreBaseTo(stage) {
  if (rank(stage) < rank("cell")) return true;

  if (cellStatus?.textContent !== "Collected") {
    await interactAt(exterior.energyCell, () => cellStatus?.textContent === "Collected");
  }

  if (rank(stage) < rank("terminal")) {
    teleport(exterior.terminalWait, { x: 5.2, z: -1.8 });
    return true;
  }

  if (terminalStatus?.textContent !== "Online") {
    teleport(exterior.terminal, { x: 6.35, z: -3.6 });
    await sleep(160);
    tapInteract();
    const opened = await waitFor(() => questionDialog?.open, 2200);
    if (opened) {
      await sleep(90);
      const correct = config?.questions?.exteriorTerminal?.correct ?? 2;
      [...(answerList?.children || [])][correct]?.click();
      await waitFor(() => terminalStatus?.textContent === "Online", 2600);
      await waitFor(() => !questionDialog?.open, 2600);
    }
  }

  if (rank(stage) < rank("entrance")) {
    teleport(exterior.switchWait, { x: 2.8, z: -4.7 });
    return true;
  }

  if (gateStatus?.textContent !== "Open") {
    await interactAt(exterior.switch, () => gateStatus?.textContent === "Open", 2600);
  }

  if (rank(stage) === rank("entrance")) teleport(exterior.gateCheckpoint, { x: 0, z: -6.45 });
  return true;
}

const mission = () => window.TA3DMission || window.TA3DMissionV6;

async function ensureMissionStarted() {
  if (mission()?.started) return true;
  teleport(exterior.missionEntry, { x: 0, z: -9.65 });
  await waitFor(() => mission()?.started, 3200);
  await sleep(360);
  return Boolean(mission()?.started);
}

async function restoreMissionTo(stage) {
  if (rank(stage) < rank("facility")) return true;
  if (!(await ensureMissionStarted())) return false;

  if (rank(stage) === rank("facility")) {
    teleport(missionConfig.startPosition, { x: 0, z: -10.15 });
    return true;
  }

  const order = config?.relayPuzzle?.order || [];
  for (let index = 0; index < order.length; index += 1) {
    if ((mission()?.relayProgress || 0) >= index + 1) continue;
    const relay = config?.relayPuzzle?.stations?.[order[index]];
    if (!relay) continue;
    await interactAt(relay, () => (mission()?.relayProgress || 0) >= index + 1, 2400);
  }

  await waitFor(() => mission()?.archiveUnlocked, 2200);
  if (rank(stage) === rank("archive")) {
    teleport(missionConfig.archiveCheckpoint, { x: 0, z: -15.55 });
    return true;
  }

  if (!mission()?.knowledgePassed) {
    teleport(missionConfig.archiveConsole, { x: -4.7, z: -17.35 });
    await sleep(180);
    tapInteract();
    const opened = await waitFor(() => questionDialog?.open, 2200);
    if (opened) {
      await sleep(90);
      const correct = config?.questions?.archive?.correct ?? 0;
      [...(answerList?.children || [])][correct]?.click();
      await waitFor(() => mission()?.knowledgePassed, 2600);
      await waitFor(() => !questionDialog?.open, 2600);
    }
  }

  teleport(missionConfig.coreCheckpoint, { x: .5, z: -16.25 });
  return true;
}

async function restoreCheckpoint(stage) {
  if (!player || stage === "start") return;
  restoring = true;
  setVeil(true, `Restoring: ${LABELS[stage] || stage}…`);
  try {
    await restoreBaseTo(stage);
    await restoreMissionTo(stage);
    writeSave(stage);
  } catch (error) {
    console.warn("Checkpoint restore failed; returning to adventure start.", error);
    clearSave();
    teleport(exterior.start, { x: 0, z: 12.5 });
  }
  await sleep(220);
  setVeil(false);
  restoring = false;
}

function observedStage() {
  const currentMission = mission();
  if (currentMission?.knowledgePassed) return "core";
  if (currentMission?.archiveUnlocked) return "archive";
  if (currentMission?.started) return "facility";
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
    if (saved?.stage && saved.stage !== "start") setTimeout(() => restoreCheckpoint(saved.stage), 360);
  }
}

ensureUi();
restartGame?.addEventListener("click", clearSave, true);

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
    if (!saved?.stage || saved.stage === "start") return teleport(exterior.start, { x: 0, z: 12.5 });
    await restoreCheckpoint(saved.stage);
  },
  snapshot() {
    return { adventureId: config?.id, stage: lastSavedStage, observedStage: lastObservedStage, label: LABELS[lastSavedStage] || lastSavedStage };
  },
};
