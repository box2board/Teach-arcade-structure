import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";
import { relayStep, relayObjective, sequenceClue } from "./relay-progress.js";

// v0.9 config-driven mission runtime.
// Keeps movement/camera ownership in main-v2.js. Adventure-specific mission
// content comes from TA3DAdventureConfig instead of being hard-coded here.

const adventure = window.TA3DAdventure;
const config = adventure?.config || window.TA3DAdventureConfig;
const missionConfig = config?.mission || {};
const relayConfig = config?.relayPuzzle || {};
const palette = config?.palette || {};
const missionQuestion = config?.questions?.archive || {};
const RELAY_ORDER = [...(relayConfig.order || [])];

let scene = null;
let player = null;
let built = false;
let missionStarted = false;
let missionFinished = false;
let missionQuestionActive = false;
let nearestInteraction = null;
let lastSafePosition = null;
let lastFrameTime = performance.now();
let relayProgress = 0;
let archiveUnlocked = false;
let knowledgePassed = false;
let finishing = false;
let selectedMissionAnswer = 0;

const blockers = [];
const interactions = [];
const animated = [];
const effects = [];
const cameraObstacles = [];
const relayStates = [];

let missionRoot = null;
let bulkhead = null;
let bulkheadBlocker = null;
let archiveConsole = null;
let commandCore = null;

const objectiveText = document.getElementById("objectiveText");
const objectiveSubtext = document.getElementById("objectiveSubtext");
const questionDialog = document.getElementById("questionDialog");
const questionText = document.getElementById("questionText");
const answerList = document.getElementById("answerList");
const questionFeedback = document.getElementById("questionFeedback");
const completeDialog = document.getElementById("completeDialog");
const isTouch = navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)")?.matches;

const color = (id, fallback = 0xffffff) => palette[id] ?? fallback;
const text = (template, values = {}) => adventure?.text?.(template, values) ?? String(template || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
const station = (id) => relayConfig.stations?.[id] || null;

const relayMaterial = (value) => new THREE.MeshStandardMaterial({
  color: value,
  roughness: .3,
  metalness: .18,
  emissive: value,
  emissiveIntensity: .7,
});
const darkMaterial = () => new THREE.MeshStandardMaterial({ color: 0x1f2d3b, roughness: .68, metalness: .22 });
const steelMaterial = () => new THREE.MeshStandardMaterial({ color: 0x526879, roughness: .58, metalness: .3 });

function addMesh(parent, geometry, material, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh);
  if (options.cameraBlock) cameraObstacles.push(mesh);
  return mesh;
}

function ensureMissionUi() {
  if (!document.getElementById("ta3dMissionPrompt")) {
    const prompt = document.createElement("div");
    prompt.id = "ta3dMissionPrompt";
    prompt.hidden = true;
    prompt.style.cssText = "position:fixed;left:50%;bottom:17%;transform:translateX(-50%);z-index:8200;display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:12px;border:1px solid rgba(125,211,252,.45);background:rgba(8,18,29,.86);color:#eefaff;font:700 13px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;backdrop-filter:blur(5px)";
    prompt.innerHTML = `<kbd style="padding:4px 7px;border-radius:7px;background:#dff7ff;color:#102131;font:800 11px system-ui">${isTouch ? "ACTION" : "E"}</kbd><span id="ta3dMissionPromptText">Interact</span>`;
    document.body.appendChild(prompt);
  }
  if (!document.getElementById("ta3dMissionToast")) {
    const toast = document.createElement("div");
    toast.id = "ta3dMissionToast";
    toast.setAttribute("role", "status");
    toast.style.cssText = "position:fixed;left:50%;top:18%;transform:translate(-50%,-8px);z-index:9100;padding:10px 14px;border:1px solid rgba(125,211,252,.5);border-radius:12px;background:rgba(8,20,32,.9);color:#eaf9ff;font:800 13px/1.25 system-ui,sans-serif;letter-spacing:.02em;opacity:0;transition:opacity .18s ease,transform .18s ease;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.3)";
    document.body.appendChild(toast);
  }
  if (!document.getElementById("ta3dMissionFade")) {
    const fade = document.createElement("div");
    fade.id = "ta3dMissionFade";
    fade.style.cssText = "position:fixed;inset:0;z-index:8800;background:#07111b;opacity:0;transition:opacity .2s ease;pointer-events:none";
    document.body.appendChild(fade);
  }
}

let toastTimer = null;
function toast(message) {
  const node = document.getElementById("ta3dMissionToast");
  if (!node || !message) return;
  node.textContent = message;
  node.style.opacity = "1";
  node.style.transform = "translate(-50%,0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translate(-50%,-8px)";
  }, 2100);
}

function setObjective(definition, values = {}) {
  if (!definition) return;
  if (objectiveText) objectiveText.textContent = text(definition.title, values);
  if (objectiveSubtext) objectiveSubtext.textContent = text(definition.detail, values);
  objectiveSubtext?.animate?.([{ opacity: .38, transform: "translateY(2px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 260, easing: "ease-out" });
}

function registerBlocker({ x, z, width, depth, height = 4.5, active = true }) {
  const blocker = { minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2, height, active };
  blockers.push(blocker);
  return blocker;
}

function registerInteraction({ id, x, z, radius = 1.65, label, enabled = () => true, interact }) {
  interactions.push({ id, x, z, radius, label, enabled, interact });
}

function addConduitSegment(parent, x1, z1, x2, z2, value) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const mesh = addMesh(parent, new THREE.BoxGeometry(.09, .035, length), relayMaterial(value), (x1 + x2) / 2, .54, (z1 + z2) / 2, { castShadow: false });
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.material.emissiveIntensity = .8;
}

function buildSequencePanel(parent) {
  const group = new THREE.Group();
  group.position.set(0, 1.45, -9.05);
  parent.add(group);
  addMesh(group, new THREE.BoxGeometry(Math.max(3.6, RELAY_ORDER.length * 1.05 + .5), 1.35, .22), darkMaterial(), 0, 0, 0);
  addMesh(group, new THREE.BoxGeometry(Math.max(3.2, RELAY_ORDER.length * 1.0), .95, .06), steelMaterial(), 0, 0, -.14, { castShadow: false });

  const spacing = 1.05;
  const startX = -((RELAY_ORDER.length - 1) * spacing) / 2;
  RELAY_ORDER.forEach((id, index) => {
    const s = station(id);
    const value = color(s?.color || id);
    const x = startX + index * spacing;
    const lamp = addMesh(group, new THREE.SphereGeometry(.22, 14, 10), relayMaterial(value), x, .08, -.2, { castShadow: false });
    lamp.material.emissiveIntensity = 1.65;
    if (index < RELAY_ORDER.length - 1) {
      const arrow = addMesh(group, new THREE.ConeGeometry(.11, .34, 3), relayMaterial(0xb8c6d1), x + spacing / 2, .08, -.2, { castShadow: false });
      arrow.rotation.z = -Math.PI / 2;
    }
  });

  group.userData.panelLabel = relayConfig.panelLabel || "POWER ROUTE";
  registerInteraction({
    id: "sequence-panel", x: group.position.x, z: group.position.z, radius: 2.4,
    label: () => `Read ${group.userData.panelLabel.toLowerCase()}`,
    enabled: () => missionStarted && !missionFinished && !archiveUnlocked && !missionQuestionActive,
    interact: () => {
      const clue = sequenceClue(relayConfig);
      if (objectiveSubtext) objectiveSubtext.textContent = clue;
      toast(clue);
    },
  });
}

function buildRelay(parent, id) {
  const s = station(id);
  if (!s) return;
  const value = color(s.color || id);
  const group = new THREE.Group();
  group.position.set(s.x, 0, s.z);
  parent.add(group);

  addMesh(group, new THREE.BoxGeometry(1.35, .9, 1.05), darkMaterial(), 0, .45, 0);
  addMesh(group, new THREE.BoxGeometry(1.05, .16, .82), steelMaterial(), 0, .94, 0);
  const orb = addMesh(group, new THREE.SphereGeometry(.23, 14, 10), relayMaterial(value), 0, 1.22, 0, { castShadow: false });
  const ring = addMesh(group, new THREE.TorusGeometry(.44, .055, 8, 22), relayMaterial(value), 0, 1.22, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  const light = new THREE.PointLight(value, 1.0, 4.2, 2);
  light.position.set(s.x, 1.4, s.z);
  parent.add(light);

  const relayState = { id, colorId: s.color || id, group, orb, ring, light, active: false, errorPulse: 0 };
  relayStates.push(relayState);
  animated.push({ type: "relay", state: relayState });
  registerBlocker({ x: s.x, z: s.z, width: 1.45, depth: 1.15, height: 1.4 });

  registerInteraction({
    id: `relay-${id}`,
    x: s.x,
    z: s.z,
    radius: 1.65,
    label: () => relayState.active ? `${s.label || id.toUpperCase()} relay online` : `Activate ${s.label || id} relay`,
    enabled: () => missionStarted && !missionFinished && !relayState.active && !missionQuestionActive,
    interact: () => activateRelay(relayState),
  });
}

function activateRelay(relayState) {
  const settings = window.TA3DDifficulty?.settings || config.difficulties?.[config.defaultDifficulty] || {};
  const result = relayStep(RELAY_ORDER, relayProgress, relayState.id, settings.preserveRelayProgressOnMistake);
  if (!result.accepted) {
    if (result.complete) return;
    if (settings.preserveRelayProgressOnMistake) {
      toast("That relay is out of sequence. Your progress is saved.");
      return;
    }
    relayProgress = result.progress;
    relayStates.forEach((relay) => {
      relay.active = false;
      relay.errorPulse = .75;
    });
    setObjective(relayObjective(config, relayProgress, settings.showNextRelay !== false));
    toast(`${relayConfig.feedback?.reset || "POWER ROUTE RESET"} · Start the sequence again`);
    spawnPulse(color("red", 0xef4444));
    return;
  }

  relayState.active = true;
  relayProgress = result.progress;
  toast(text(relayConfig.feedback?.progress || "RELAY {current}/{total} ONLINE", { current: relayProgress, total: RELAY_ORDER.length }));
  spawnPulse(color(relayState.colorId));

  if (relayProgress >= RELAY_ORDER.length) {
    archiveUnlocked = true;
    if (bulkheadBlocker) bulkheadBlocker.active = false;
    toast(relayConfig.feedback?.complete || "AUXILIARY POWER RESTORED");
    setObjective(missionConfig.objectives?.archive);
  } else {
    setObjective(relayObjective(config, relayProgress, settings.showNextRelay !== false));
  }
}

function buildBulkhead(parent) {
  const z = -14.55;
  const steel = steelMaterial();
  const dark = darkMaterial();
  addMesh(parent, new THREE.BoxGeometry(5.45, 4.7, .36), dark, -4.35, 2.35, z, { cameraBlock: true });
  addMesh(parent, new THREE.BoxGeometry(5.45, 4.7, .36), dark, 4.35, 2.35, z, { cameraBlock: true });
  addMesh(parent, new THREE.BoxGeometry(14.1, .34, .44), steel, 0, 4.7, z, { cameraBlock: true });

  // Fixed wall blockers plus the stateful center opening replace the old special-case guard.
  registerBlocker({ x: -4.35, z, width: 5.7, depth: .74, height: 4.3 });
  registerBlocker({ x: 4.35, z, width: 5.7, depth: .74, height: 4.3 });

  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, z);
  parent.add(doorGroup);
  const left = addMesh(doorGroup, new THREE.BoxGeometry(1.55, 4.2, .28), steel, -.78, 2.1, 0, { cameraBlock: true });
  const right = addMesh(doorGroup, new THREE.BoxGeometry(1.55, 4.2, .28), steel, .78, 2.1, 0, { cameraBlock: true });
  const strip = addMesh(doorGroup, new THREE.BoxGeometry(2.5, .08, .34), relayMaterial(color("red", 0xef4444)), 0, 3.7, -.04, { castShadow: false });
  bulkhead = { group: doorGroup, left, right, strip };
  bulkheadBlocker = registerBlocker({ x: 0, z, width: 3.5, depth: .74, height: 4.3, active: true });
  animated.push({ type: "bulkhead", state: bulkhead });
}

function buildArchiveConsole(parent) {
  const definition = missionConfig.archiveConsole || { x: -4.7, z: -17.35 };
  const group = new THREE.Group();
  group.position.set(definition.x, 0, definition.z);
  parent.add(group);
  addMesh(group, new THREE.BoxGeometry(1.5, 1.25, 1.05), darkMaterial(), 0, .625, 0);
  const screen = addMesh(group, new THREE.BoxGeometry(1.05, .55, .08), relayMaterial(color("violet", 0xa78bfa)), 0, .86, -.57, { castShadow: false });
  screen.rotation.x = -.1;
  const ring = addMesh(group, new THREE.TorusGeometry(.47, .05, 8, 24), relayMaterial(color("violet", 0xa78bfa)), 0, 1.45, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  const light = new THREE.PointLight(color("violet", 0xa78bfa), 1.2, 4.5, 2);
  light.position.set(definition.x, 1.5, definition.z);
  parent.add(light);
  archiveConsole = { group, screen, ring, light };
  animated.push({ type: "archive", state: archiveConsole });
  registerBlocker({ x: definition.x, z: definition.z, width: 1.6, depth: 1.2, height: 1.5 });
  registerInteraction({
    id: "archive-console",
    x: definition.x,
    z: definition.z,
    radius: 1.8,
    label: () => knowledgePassed ? (definition.completeLabel || "Archive verified") : (definition.label || "Access knowledge archive"),
    enabled: () => missionStarted && archiveUnlocked && !knowledgePassed && !missionQuestionActive,
    interact: openMissionQuestion,
  });
}

function buildCommandCore(parent) {
  const definition = missionConfig.commandCore || { x: 4.65, z: -17.2 };
  const group = new THREE.Group();
  group.position.set(definition.x, 0, definition.z);
  parent.add(group);
  addMesh(group, new THREE.CylinderGeometry(.68, .82, 1.8, 12), darkMaterial(), 0, .9, 0);
  const energy = addMesh(group, new THREE.CylinderGeometry(.28, .28, 1.35, 14), relayMaterial(color("green", 0x4ade80)), 0, 1.05, 0, { castShadow: false });
  const upperRing = addMesh(group, new THREE.TorusGeometry(.78, .07, 8, 28), relayMaterial(color("green", 0x4ade80)), 0, 1.58, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  const lowerRing = addMesh(group, new THREE.TorusGeometry(.78, .07, 8, 28), relayMaterial(color("green", 0x4ade80)), 0, .52, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  energy.material.emissiveIntensity = .18;
  upperRing.material.emissiveIntensity = .18;
  lowerRing.material.emissiveIntensity = .18;
  const light = new THREE.PointLight(color("green", 0x4ade80), .25, 5.5, 2);
  light.position.set(definition.x, 1.4, definition.z);
  parent.add(light);
  commandCore = { group, energy, upperRing, lowerRing, light, active: false };
  animated.push({ type: "core", state: commandCore });
  registerBlocker({ x: definition.x, z: definition.z, width: 1.7, depth: 1.7, height: 2.0 });
  registerInteraction({
    id: "command-core",
    x: definition.x,
    z: definition.z,
    radius: 2.0,
    label: () => commandCore.active ? (definition.completeLabel || "Core stabilized") : (definition.label || "Stabilize command core"),
    enabled: () => missionStarted && knowledgePassed && !commandCore.active && !finishing,
    interact: stabilizeCore,
  });
}

function buildInterior(parent) {
  const steel = steelMaterial();
  const dark = darkMaterial();
  [-12.0, -16.1, -19.0].forEach((z) => addMesh(parent, new THREE.BoxGeometry(14.3, .18, .26), steel, 0, 4.35, z, { cameraBlock: true }));
  [-6.9, 6.9].forEach((x) => [-10.2, -12.3, -16.4, -18.5].forEach((z) => addMesh(parent, new THREE.BoxGeometry(.18, 3.6, .24), steel, x, 2.0, z)));
  addMesh(parent, new THREE.BoxGeometry(3.4, 1.0, .55), dark, -4.9, .5, -12.9);
  addMesh(parent, new THREE.BoxGeometry(3.4, 1.0, .55), dark, 4.9, .5, -13.0);

  buildSequencePanel(parent);
  RELAY_ORDER.forEach((id, index) => {
    buildRelay(parent, id);
    const s = station(id);
    if (!s) return;
    const panelX = RELAY_ORDER.length === 1 ? 0 : THREE.MathUtils.lerp(-1.2, 1.2, index / (RELAY_ORDER.length - 1));
    addConduitSegment(parent, panelX, -9.45, s.x, s.z, color(s.color || id));
  });

  buildBulkhead(parent);
  buildArchiveConsole(parent);
  buildCommandCore(parent);

  [[-5.5, -11.5, 0x86d7ef], [5.4, -12.1, 0xf3d493], [0, -16.8, 0xb8c7ff]].forEach(([x, z, value]) => {
    const light = new THREE.PointLight(value, 1.3, 7, 2);
    light.position.set(x, 3.55, z);
    parent.add(light);
  });
}

function hideBaseBeacon() {
  if (!scene) return;
  scene.traverse((object) => {
    if (!object.isMesh || Math.abs(object.position.x) > 1.4 || Math.abs(object.position.z + 16.4) > 1.2) return;
    const type = object.geometry?.type;
    if (type === "CylinderGeometry" || type === "TorusGeometry") object.visible = false;
  });
}

function beginMission() {
  if (missionStarted || missionFinished || !player) return;
  missionStarted = true;
  relayProgress = 0;
  archiveUnlocked = false;
  knowledgePassed = false;
  hideBaseBeacon();
  const fade = document.getElementById("ta3dMissionFade");
  if (fade) fade.style.opacity = "1";
  const start = missionConfig.startPosition || { x: 0, y: 0, z: -10.15, yaw: Math.PI };
  setTimeout(() => {
    player.position.set(start.x, start.y || 0, start.z);
    player.rotation.y = start.yaw || 0;
    lastSafePosition = player.position.clone();
    if (fade) fade.style.opacity = "0";
    toast(missionConfig.toasts?.start);
    setObjective(missionConfig.objectives?.start);
  }, 220);
}

function openMissionQuestion() {
  if (missionQuestionActive || knowledgePassed || !questionDialog) return;
  missionQuestionActive = true;
  selectedMissionAnswer = 0;
  questionFeedback.textContent = "";
  const heading = questionDialog.querySelector("h2");
  if (heading) heading.textContent = missionQuestion.title || "Knowledge checkpoint";
  questionText.textContent = missionQuestion.text || "";
  answerList.innerHTML = "";
  (missionQuestion.answers || []).forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.textContent = `${index + 1}. ${answer}`;
    button.addEventListener("click", () => submitMissionAnswer(index));
    answerList.appendChild(button);
  });
  updateMissionAnswerFocus();
  questionDialog.showModal();
}

function updateMissionAnswerFocus() {
  [...answerList.children].forEach((button, index) => button.classList.toggle("focused", index === selectedMissionAnswer));
}

function submitMissionAnswer(index) {
  if (!missionQuestionActive) return;
  selectedMissionAnswer = index;
  updateMissionAnswerFocus();
  const buttons = [...answerList.children];
  if (index !== missionQuestion.correct) {
    buttons[index]?.classList.add("wrong");
    questionFeedback.textContent = missionQuestion.wrongFeedback || "Not quite. Try again.";
    setTimeout(() => buttons[index]?.classList.remove("wrong"), 420);
    return;
  }
  buttons[index]?.classList.add("correct");
  questionFeedback.textContent = missionQuestion.correctFeedback || "Correct.";
  knowledgePassed = true;
  archiveConsole.screen.material.emissiveIntensity = 2.2;
  archiveConsole.ring.material.emissiveIntensity = 2.2;
  commandCore.energy.material.emissiveIntensity = 1.55;
  commandCore.upperRing.material.emissiveIntensity = 1.4;
  commandCore.lowerRing.material.emissiveIntensity = 1.4;
  commandCore.light.intensity = 1.5;
  setObjective(missionConfig.objectives?.core);
  toast(missionConfig.toasts?.archiveVerified);
  spawnPulse(color("violet", 0xa78bfa));
  setTimeout(() => questionDialog.open && questionDialog.close(), 720);
}

function handleMissionQuestionKey(event) {
  if (!missionQuestionActive) return false;
  const count = missionQuestion.answers?.length || 0;
  if (["ArrowUp", "ArrowDown", "Enter", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else return false;
  if (event.code === "ArrowUp") selectedMissionAnswer = (selectedMissionAnswer + count - 1) % count;
  else if (event.code === "ArrowDown") selectedMissionAnswer = (selectedMissionAnswer + 1) % count;
  else if (/^Digit[1-4]$/.test(event.code)) {
    const index = Number(event.code.slice(-1)) - 1;
    if (index < count) submitMissionAnswer(index);
    return true;
  } else if (event.code === "Enter") {
    submitMissionAnswer(selectedMissionAnswer);
    return true;
  }
  updateMissionAnswerFocus();
  return true;
}

function stabilizeCore() {
  if (commandCore.active || finishing) return;
  finishing = true;
  commandCore.active = true;
  toast(missionConfig.toasts?.stabilizing);
  setObjective(missionConfig.objectives?.stabilizing);
  spawnPulse(color("green", 0x4ade80));
  setTimeout(() => {
    missionFinished = true;
    finishing = false;
    finishMission();
  }, missionConfig.commandCore?.stabilizationMs || 1400);
}

const nativeShowModal = HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal = function (...args) {
  if (this.id === "completeDialog" && !missionFinished) {
    beginMission();
    return;
  }
  return nativeShowModal.apply(this, args);
};

function finishMission() {
  const completion = missionConfig.completion || {};
  const heading = completeDialog?.querySelector("h2");
  const paragraph = completeDialog?.querySelector("p");
  const eyebrow = completeDialog?.querySelector(".eyebrow");
  if (eyebrow) eyebrow.textContent = completion.eyebrow || "MISSION COMPLETE";
  if (heading) heading.textContent = completion.heading || `${config.title || "Adventure"} complete.`;
  if (paragraph) paragraph.textContent = completion.body || "Mission complete.";
  setObjective(missionConfig.objectives?.complete);
  toast(missionConfig.toasts?.complete);
  nativeShowModal.call(completeDialog);
}

function spawnPulse(value) {
  if (!scene || !player) return;
  const mesh = new THREE.Mesh(new THREE.RingGeometry(.45, .54, 30), new THREE.MeshBasicMaterial({ color: value, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(player.position.x, .06, player.position.z);
  scene.add(mesh);
  effects.push({ mesh, age: 0, duration: .8 });
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];
    effect.age += dt;
    const t = THREE.MathUtils.clamp(effect.age / effect.duration, 0, 1);
    effect.mesh.position.x = player.position.x;
    effect.mesh.position.z = player.position.z;
    effect.mesh.scale.setScalar(1 + t * 3.4);
    effect.mesh.material.opacity = .85 * (1 - t);
    if (t >= 1) {
      effect.mesh.parent?.remove(effect.mesh);
      effect.mesh.geometry?.dispose?.();
      effect.mesh.material?.dispose?.();
      effects.splice(i, 1);
    }
  }
}

function updateAnimated(dt, time) {
  for (const item of animated) {
    const s = item.state;
    if (item.type === "relay") {
      s.ring.rotation.z += dt * (s.active ? 2.7 : .7);
      s.orb.material.emissiveIntensity = THREE.MathUtils.damp(s.orb.material.emissiveIntensity, s.active ? 2.15 : .7, 8, dt);
      s.ring.material.emissiveIntensity = THREE.MathUtils.damp(s.ring.material.emissiveIntensity, s.active ? 1.8 : .65, 8, dt);
      s.light.intensity = THREE.MathUtils.damp(s.light.intensity, s.active ? 2.1 : .75, 7, dt);
      if (s.errorPulse > 0) {
        s.errorPulse = Math.max(0, s.errorPulse - dt);
        s.orb.material.emissive.setHex(color("red", 0xef4444));
        if (s.errorPulse === 0) s.orb.material.emissive.setHex(color(s.colorId));
      }
    } else if (item.type === "bulkhead") {
      s.left.position.x = THREE.MathUtils.damp(s.left.position.x, archiveUnlocked ? -2.45 : -.78, 7, dt);
      s.right.position.x = THREE.MathUtils.damp(s.right.position.x, archiveUnlocked ? 2.45 : .78, 7, dt);
      const value = archiveUnlocked ? color("green", 0x4ade80) : color("red", 0xef4444);
      if (s.strip.material.color.getHex() !== value) {
        s.strip.material.color.setHex(value);
        s.strip.material.emissive.setHex(value);
      }
    } else if (item.type === "archive") {
      s.ring.rotation.z += dt * .8;
      s.screen.material.emissiveIntensity += Math.sin(time * 2.1) * .005;
    } else if (item.type === "core") {
      s.upperRing.rotation.z += dt * (s.active ? 2.6 : .6);
      s.lowerRing.rotation.z -= dt * (s.active ? 2.2 : .5);
      if (s.active) {
        const pulse = 1.8 + Math.sin(time * 5) * .35;
        s.energy.material.emissiveIntensity = pulse;
        s.upperRing.material.emissiveIntensity = pulse * .8;
        s.lowerRing.material.emissiveIntensity = pulse * .8;
        s.light.intensity = 2.3 + Math.sin(time * 4) * .35;
      }
    }
  }
}

function resolveMissionCollisions() {
  if (!missionStarted || !player || missionFinished || missionQuestionActive) return;
  if (!lastSafePosition) lastSafePosition = player.position.clone();
  let blocked = false;
  for (const blocker of blockers) {
    if (!blocker.active || player.position.y >= blocker.height) continue;
    if (player.position.x > blocker.minX && player.position.x < blocker.maxX && player.position.z > blocker.minZ && player.position.z < blocker.maxZ) {
      blocked = true;
      break;
    }
  }
  if (blocked) {
    player.position.x = lastSafePosition.x;
    player.position.z = lastSafePosition.z;
  } else lastSafePosition.copy(player.position);
}

function updateInteractionPrompt() {
  const prompt = document.getElementById("ta3dMissionPrompt");
  const promptText = document.getElementById("ta3dMissionPromptText");
  nearestInteraction = null;
  if (!prompt || !promptText || !missionStarted || missionFinished || missionQuestionActive || !player) {
    if (prompt) prompt.hidden = true;
    return;
  }
  let distance = Infinity;
  for (const item of interactions) {
    if (!item.enabled()) continue;
    const d = Math.hypot(player.position.x - item.x, player.position.z - item.z);
    if (d <= item.radius && d < distance) {
      nearestInteraction = item;
      distance = d;
    }
  }
  prompt.hidden = !nearestInteraction;
  if (nearestInteraction) promptText.textContent = nearestInteraction.label();
}

function constrainMissionCamera(camera) {
  if (!missionStarted || missionFinished || !camera || !cameraObstacles.length) return;
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
  const direction = camera.position.clone().sub(target);
  const distance = direction.length();
  if (distance < .2) return;
  direction.normalize();
  const hits = new THREE.Raycaster(target, direction, .1, distance).intersectObjects(cameraObstacles, false);
  if (hits.length) camera.position.copy(target).add(direction.multiplyScalar(Math.max(1.35, hits[0].distance - .28)));
  camera.lookAt(target);
}

function setupMission(targetScene) {
  if (built) return;
  built = true;
  scene = targetScene;
  ensureMissionUi();
  missionRoot = new THREE.Group();
  missionRoot.name = `mission-${config.id || "adventure"}`;
  scene.add(missionRoot);
  buildInterior(missionRoot);
  const zone = missionConfig.zone || { x: 0, z: -14, activeDistance: 36 };
  window.TA3DPerformance?.registerZone({ id: `mission-${config.id || "adventure"}`, object: missionRoot, x: zone.x, z: zone.z, activeDistance: zone.activeDistance, alwaysActive: false });
}

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") {
      player = object;
      scene = this;
      setupMission(this);
    }
  }
  return result;
};

window.addEventListener("keydown", (event) => {
  if (missionQuestionActive) {
    handleMissionQuestionKey(event);
    return;
  }
  if (event.code !== "KeyE" || event.repeat || !nearestInteraction || missionFinished) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  nearestInteraction.interact();
}, true);

questionDialog?.addEventListener("close", () => {
  if (missionQuestionActive) missionQuestionActive = false;
});

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (renderScene, camera) {
  const now = performance.now();
  const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 1 / 240), .05);
  lastFrameTime = now;
  if (player) {
    resolveMissionCollisions();
    updateAnimated(dt, now / 1000);
    updateEffects(dt);
    updateInteractionPrompt();
    constrainMissionCamera(camera);
  }
  return previousRender.call(this, renderScene, camera);
};

const missionApi = {
  get started() { return missionStarted; },
  get finished() { return missionFinished; },
  get relayProgress() { return relayProgress; },
  get archiveUnlocked() { return archiveUnlocked; },
  get knowledgePassed() { return knowledgePassed; },
  get configId() { return config.id; },
  get relayCount() { return RELAY_ORDER.length; },
  snapshot() {
    return { started: missionStarted, finished: missionFinished, relayProgress, archiveUnlocked, knowledgePassed, configId: config.id };
  },
};

// Keep the v0.6 name during the migration so difficulty/checkpoint/entry modules
// remain compatible. New code should use TA3DMission.
window.TA3DMission = missionApi;
window.TA3DMissionV6 = missionApi;
