import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v0.6 mission layer
// Keeps main-v2 movement/camera ownership intact while extending the Lost Facility
// into a complete interior mission: environmental relay puzzle -> academic archive
// checkpoint -> final command-core action.

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

const COLORS = {
  cyan: 0x38bdf8,
  amber: 0xfbbf24,
  green: 0x4ade80,
  violet: 0xa78bfa,
  red: 0xef4444,
};
const RELAY_ORDER = ["cyan", "amber", "green"];

const relayMaterial = (color) => new THREE.MeshStandardMaterial({
  color,
  roughness: .3,
  metalness: .18,
  emissive: color,
  emissiveIntensity: .7,
});

const darkMaterial = () => new THREE.MeshStandardMaterial({ color: 0x1f2d3b, roughness: .68, metalness: .22 });
const steelMaterial = () => new THREE.MeshStandardMaterial({ color: 0x526879, roughness: .58, metalness: .3 });
const floorMaterial = () => new THREE.MeshStandardMaterial({ color: 0x33424d, roughness: .92, metalness: .05 });

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
    prompt.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:17%",
      "transform:translateX(-50%)",
      "z-index:8200",
      "display:flex",
      "align-items:center",
      "gap:9px",
      "padding:9px 12px",
      "border-radius:12px",
      "border:1px solid rgba(125,211,252,.45)",
      "background:rgba(8,18,29,.86)",
      "color:#eefaff",
      "font:700 13px/1.2 system-ui,sans-serif",
      "box-shadow:0 8px 24px rgba(0,0,0,.25)",
      "pointer-events:none",
      "backdrop-filter:blur(5px)",
    ].join(";");
    prompt.innerHTML = `<kbd style="padding:4px 7px;border-radius:7px;background:#dff7ff;color:#102131;font:800 11px system-ui">${isTouch ? "ACTION" : "E"}</kbd><span id="ta3dMissionPromptText">Interact</span>`;
    document.body.appendChild(prompt);
  }

  if (!document.getElementById("ta3dMissionToast")) {
    const toast = document.createElement("div");
    toast.id = "ta3dMissionToast";
    toast.style.cssText = [
      "position:fixed",
      "left:50%",
      "top:18%",
      "transform:translate(-50%,-8px)",
      "z-index:9100",
      "padding:10px 14px",
      "border:1px solid rgba(125,211,252,.5)",
      "border-radius:12px",
      "background:rgba(8,20,32,.9)",
      "color:#eaf9ff",
      "font:800 13px/1.25 system-ui,sans-serif",
      "letter-spacing:.02em",
      "opacity:0",
      "transition:opacity .18s ease, transform .18s ease",
      "pointer-events:none",
      "box-shadow:0 8px 28px rgba(0,0,0,.3)",
    ].join(";");
    document.body.appendChild(toast);
  }

  if (!document.getElementById("ta3dMissionFade")) {
    const fade = document.createElement("div");
    fade.id = "ta3dMissionFade";
    fade.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:8800",
      "background:#07111b",
      "opacity:0",
      "transition:opacity .2s ease",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(fade);
  }
}

let toastTimer = null;
function toast(message) {
  const node = document.getElementById("ta3dMissionToast");
  if (!node) return;
  node.textContent = message;
  node.style.opacity = "1";
  node.style.transform = "translate(-50%,0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translate(-50%,-8px)";
  }, 2100);
}

function setObjective(title, detail) {
  if (objectiveText) objectiveText.textContent = title;
  if (objectiveSubtext) objectiveSubtext.textContent = detail;
  objectiveSubtext?.animate?.([
    { opacity: .38, transform: "translateY(2px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 260, easing: "ease-out" });
}

function registerBlocker({ x, z, width, depth, height = 4.5, active = true }) {
  const blocker = {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
    height,
    active,
  };
  blockers.push(blocker);
  return blocker;
}

function registerInteraction({ id, x, z, radius = 1.65, label, enabled = () => true, interact }) {
  interactions.push({ id, x, z, radius, label, enabled, interact });
}

function addConduitSegment(parent, x1, z1, x2, z2, color) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const mesh = addMesh(
    parent,
    new THREE.BoxGeometry(.09, .035, length),
    relayMaterial(color),
    (x1 + x2) / 2,
    .54,
    (z1 + z2) / 2,
    { castShadow: false },
  );
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.material.emissiveIntensity = .8;
  return mesh;
}

function buildSequencePanel(parent) {
  const group = new THREE.Group();
  group.position.set(0, 1.45, -9.05);
  parent.add(group);

  addMesh(group, new THREE.BoxGeometry(3.6, 1.35, .22), darkMaterial(), 0, 0, 0);
  addMesh(group, new THREE.BoxGeometry(3.2, .95, .06), steelMaterial(), 0, 0, -.14, { castShadow: false });

  const xs = [-1.05, 0, 1.05];
  RELAY_ORDER.forEach((id, index) => {
    const lamp = addMesh(group, new THREE.SphereGeometry(.22, 14, 10), relayMaterial(COLORS[id]), xs[index], .08, -.2, { castShadow: false });
    lamp.material.emissiveIntensity = 1.65;
    if (index < 2) {
      const arrow = addMesh(group, new THREE.ConeGeometry(.11, .34, 3), relayMaterial(0xb8c6d1), xs[index] + .52, .08, -.2, { castShadow: false });
      arrow.rotation.z = -Math.PI / 2;
    }
  });

  const caption = document.createElement("div");
  caption.textContent = "AUX POWER ROUTE";
  caption.style.cssText = "position:fixed;left:-9999px";
  document.body.appendChild(caption);
}

function buildRelay(parent, { id, x, z, color }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);

  const base = addMesh(group, new THREE.BoxGeometry(1.35, .9, 1.05), darkMaterial(), 0, .45, 0);
  addMesh(group, new THREE.BoxGeometry(1.05, .16, .82), steelMaterial(), 0, .94, 0);
  const orb = addMesh(group, new THREE.SphereGeometry(.23, 14, 10), relayMaterial(color), 0, 1.22, 0, { castShadow: false });
  const ring = addMesh(group, new THREE.TorusGeometry(.44, .055, 8, 22), relayMaterial(color), 0, 1.22, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  orb.material.emissiveIntensity = .8;
  ring.material.emissiveIntensity = .65;

  const light = new THREE.PointLight(color, 1.0, 4.2, 2);
  light.position.set(x, 1.4, z);
  parent.add(light);

  const state = { id, group, orb, ring, light, active: false, errorPulse: 0 };
  relayStates.push(state);
  animated.push({ type: "relay", state });
  registerBlocker({ x, z, width: 1.45, depth: 1.15, height: 1.4 });

  registerInteraction({
    id: `relay-${id}`,
    x,
    z,
    radius: 1.65,
    label: () => state.active ? `${id.toUpperCase()} relay online` : `Activate ${id} relay`,
    enabled: () => missionStarted && !missionFinished && !state.active && !missionQuestionActive,
    interact: () => activateRelay(state),
  });
}

function activateRelay(state) {
  const expected = RELAY_ORDER[relayProgress];
  if (state.id !== expected) {
    relayProgress = 0;
    relayStates.forEach((relay) => {
      relay.active = false;
      relay.errorPulse = .75;
    });
    toast("POWER ROUTE RESET · Follow the color sequence");
    spawnPulse(COLORS.red);
    return;
  }

  state.active = true;
  relayProgress += 1;
  toast(`RELAY ${relayProgress}/3 ONLINE`);
  spawnPulse(COLORS[state.id]);

  if (relayProgress >= RELAY_ORDER.length) {
    archiveUnlocked = true;
    bulkheadBlocker.active = false;
    toast("AUXILIARY POWER RESTORED · Archive unlocked");
    setObjective("Access the research archive.", "The rear bulkhead is open. Find the violet knowledge console.");
  } else {
    const next = RELAY_ORDER[relayProgress].toUpperCase();
    setObjective("Restore auxiliary power.", `Power is routing correctly. Find the ${next} relay next.`);
  }
}

function buildBulkhead(parent) {
  const steel = steelMaterial();
  const dark = darkMaterial();

  addMesh(parent, new THREE.BoxGeometry(5.45, 4.7, .36), dark, -4.35, 2.35, -14.55, { cameraBlock: true });
  addMesh(parent, new THREE.BoxGeometry(5.45, 4.7, .36), dark, 4.35, 2.35, -14.55, { cameraBlock: true });
  addMesh(parent, new THREE.BoxGeometry(14.1, .34, .44), steel, 0, 4.7, -14.55, { cameraBlock: true });

  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, -14.55);
  parent.add(doorGroup);
  const left = addMesh(doorGroup, new THREE.BoxGeometry(1.55, 4.2, .28), steel, -.78, 2.1, 0, { cameraBlock: true });
  const right = addMesh(doorGroup, new THREE.BoxGeometry(1.55, 4.2, .28), steel, .78, 2.1, 0, { cameraBlock: true });
  const stripMat = relayMaterial(COLORS.red);
  const strip = addMesh(doorGroup, new THREE.BoxGeometry(2.5, .08, .34), stripMat, 0, 3.7, -.04, { castShadow: false });
  strip.material.emissiveIntensity = 1.35;

  bulkhead = { group: doorGroup, left, right, strip };
  bulkheadBlocker = registerBlocker({ x: 0, z: -14.55, width: 3.5, depth: .7, height: 4.3, active: true });
  animated.push({ type: "bulkhead", state: bulkhead });
}

function buildArchiveConsole(parent) {
  const group = new THREE.Group();
  group.position.set(-4.7, 0, -17.35);
  parent.add(group);

  addMesh(group, new THREE.BoxGeometry(1.5, 1.25, 1.05), darkMaterial(), 0, .625, 0);
  const screen = addMesh(group, new THREE.BoxGeometry(1.05, .55, .08), relayMaterial(COLORS.violet), 0, .86, -.57, { castShadow: false });
  screen.rotation.x = -.1;
  const ring = addMesh(group, new THREE.TorusGeometry(.47, .05, 8, 24), relayMaterial(COLORS.violet), 0, 1.45, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });

  const light = new THREE.PointLight(COLORS.violet, 1.2, 4.5, 2);
  light.position.set(-4.7, 1.5, -17.35);
  parent.add(light);

  archiveConsole = { group, screen, ring, light };
  animated.push({ type: "archive", state: archiveConsole });
  registerBlocker({ x: -4.7, z: -17.35, width: 1.6, depth: 1.2, height: 1.5 });

  registerInteraction({
    id: "archive-console",
    x: -4.7,
    z: -17.35,
    radius: 1.8,
    label: () => knowledgePassed ? "Archive verified" : "Access knowledge archive",
    enabled: () => missionStarted && archiveUnlocked && !knowledgePassed && !missionQuestionActive,
    interact: openMissionQuestion,
  });
}

function buildCommandCore(parent) {
  const group = new THREE.Group();
  group.position.set(4.65, 0, -17.2);
  parent.add(group);

  addMesh(group, new THREE.CylinderGeometry(.68, .82, 1.8, 12), darkMaterial(), 0, .9, 0);
  const energy = addMesh(group, new THREE.CylinderGeometry(.28, .28, 1.35, 14), relayMaterial(COLORS.green), 0, 1.05, 0, { castShadow: false });
  const upperRing = addMesh(group, new THREE.TorusGeometry(.78, .07, 8, 28), relayMaterial(COLORS.green), 0, 1.58, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  const lowerRing = addMesh(group, new THREE.TorusGeometry(.78, .07, 8, 28), relayMaterial(COLORS.green), 0, .52, 0, { castShadow: false, rotation: [Math.PI / 2, 0, 0] });
  energy.material.emissiveIntensity = .18;
  upperRing.material.emissiveIntensity = .18;
  lowerRing.material.emissiveIntensity = .18;

  const light = new THREE.PointLight(COLORS.green, .25, 5.5, 2);
  light.position.set(4.65, 1.4, -17.2);
  parent.add(light);

  commandCore = { group, energy, upperRing, lowerRing, light, active: false };
  animated.push({ type: "core", state: commandCore });
  registerBlocker({ x: 4.65, z: -17.2, width: 1.7, depth: 1.7, height: 2.0 });

  registerInteraction({
    id: "command-core",
    x: 4.65,
    z: -17.2,
    radius: 2.0,
    label: () => commandCore.active ? "Core stabilized" : "Stabilize command core",
    enabled: () => missionStarted && knowledgePassed && !commandCore.active && !finishing,
    interact: stabilizeCore,
  });
}

function buildInterior(parent) {
  const steel = steelMaterial();
  const dark = darkMaterial();

  // Interior identity: ceiling braces, wall ribs, low consoles, and illuminated conduits.
  [-12.0, -16.1, -19.0].forEach((z) => {
    addMesh(parent, new THREE.BoxGeometry(14.3, .18, .26), steel, 0, 4.35, z, { cameraBlock: true });
  });

  [-6.9, 6.9].forEach((x) => {
    [-10.2, -12.3, -16.4, -18.5].forEach((z) => {
      addMesh(parent, new THREE.BoxGeometry(.18, 3.6, .24), steel, x, 2.0, z);
    });
  });

  // Low equipment dividers create rooms without turning the prototype into corridors.
  addMesh(parent, new THREE.BoxGeometry(3.4, 1.0, .55), dark, -4.9, .5, -12.9);
  addMesh(parent, new THREE.BoxGeometry(3.4, 1.0, .55), dark, 4.9, .5, -13.0);

  buildSequencePanel(parent);
  buildRelay(parent, { id: "cyan", x: -4.75, z: -10.65, color: COLORS.cyan });
  buildRelay(parent, { id: "amber", x: 4.75, z: -11.55, color: COLORS.amber });
  buildRelay(parent, { id: "green", x: 0, z: -13.1, color: COLORS.green });

  addConduitSegment(parent, -1.2, -9.45, -4.75, -10.65, COLORS.cyan);
  addConduitSegment(parent, 0, -9.45, 4.75, -11.55, COLORS.amber);
  addConduitSegment(parent, 1.2, -9.45, 0, -13.1, COLORS.green);

  buildBulkhead(parent);
  buildArchiveConsole(parent);
  buildCommandCore(parent);

  // Soft practical lights. The performance layer will budget these automatically.
  [
    [-5.5, -11.5, 0x86d7ef],
    [5.4, -12.1, 0xf3d493],
    [0, -16.8, 0xb8c7ff],
  ].forEach(([x, z, color]) => {
    const light = new THREE.PointLight(color, 1.3, 7, 2);
    light.position.set(x, 3.55, z);
    parent.add(light);
  });
}

function hideBaseBeacon() {
  if (!scene) return;
  scene.traverse((object) => {
    if (!object.isMesh) return;
    if (Math.abs(object.position.x) > 1.4 || Math.abs(object.position.z + 16.4) > 1.2) return;
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

  setTimeout(() => {
    player.position.set(0, 0, -10.15);
    player.rotation.y = Math.PI;
    lastSafePosition = player.position.clone();
    if (fade) fade.style.opacity = "0";
    toast("LOST FACILITY · Interior systems offline");
    setObjective("Restore auxiliary power.", "Read the color route on the wall, then activate the three matching relays in order.");
  }, 220);
}

const missionQuestion = {
  text: "Which process helps move heat through Earth's mantle and contributes to plate motion?",
  answers: [
    "Convection currents in the mantle",
    "Erosion by rivers",
    "Radiation from the Sun",
    "Weathering at Earth's surface",
  ],
  correct: 0,
};
let selectedMissionAnswer = 0;

function openMissionQuestion() {
  if (missionQuestionActive || knowledgePassed || !questionDialog) return;
  missionQuestionActive = true;
  selectedMissionAnswer = 0;
  questionFeedback.textContent = "";
  const heading = questionDialog.querySelector("h2");
  if (heading) heading.textContent = "Verify the archive record";
  questionText.textContent = missionQuestion.text;
  answerList.innerHTML = "";

  missionQuestion.answers.forEach((answer, index) => {
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
    questionFeedback.textContent = "Not quite. Use the archive clues and try again.";
    setTimeout(() => buttons[index]?.classList.remove("wrong"), 420);
    return;
  }

  buttons[index]?.classList.add("correct");
  questionFeedback.textContent = "Correct — command authorization restored.";
  knowledgePassed = true;
  archiveConsole.screen.material.emissiveIntensity = 2.2;
  archiveConsole.ring.material.emissiveIntensity = 2.2;
  commandCore.energy.material.emissiveIntensity = 1.55;
  commandCore.upperRing.material.emissiveIntensity = 1.4;
  commandCore.lowerRing.material.emissiveIntensity = 1.4;
  commandCore.light.intensity = 1.5;
  setObjective("Stabilize the facility core.", "Archive verification unlocked the command core on the opposite side of the chamber.");
  toast("ARCHIVE VERIFIED · Command core unlocked");
  spawnPulse(COLORS.violet);
  setTimeout(() => questionDialog.open && questionDialog.close(), 720);
}

function handleMissionQuestionKey(event) {
  if (!missionQuestionActive) return false;
  if (["ArrowUp", "ArrowDown", "Enter", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else return false;

  if (event.code === "ArrowUp") selectedMissionAnswer = (selectedMissionAnswer + missionQuestion.answers.length - 1) % missionQuestion.answers.length;
  else if (event.code === "ArrowDown") selectedMissionAnswer = (selectedMissionAnswer + 1) % missionQuestion.answers.length;
  else if (/^Digit[1-4]$/.test(event.code)) return submitMissionAnswer(Number(event.code.slice(-1)) - 1), true;
  else if (event.code === "Enter") return submitMissionAnswer(selectedMissionAnswer), true;
  updateMissionAnswerFocus();
  return true;
}

function stabilizeCore() {
  if (commandCore.active || finishing) return;
  finishing = true;
  commandCore.active = true;
  toast("CORE STABILIZATION IN PROGRESS");
  setObjective("Stabilizing facility core…", "Power is returning throughout the Lost Facility.");
  spawnPulse(COLORS.green);

  setTimeout(() => {
    missionFinished = true;
    finishing = false;
    finishMission();
  }, 1400);
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
  const heading = completeDialog?.querySelector("h2");
  const paragraph = completeDialog?.querySelector("p");
  const eyebrow = completeDialog?.querySelector(".eyebrow");
  if (eyebrow) eyebrow.textContent = "MISSION COMPLETE";
  if (heading) heading.textContent = "The Lost Facility is online.";
  if (paragraph) paragraph.textContent = "You restored external power, solved the auxiliary routing puzzle, verified the archive, and stabilized the command core.";
  setObjective("Facility restored!", "The complete v0.6 adventure loop is working.");
  toast("MISSION COMPLETE · Lost Facility restored");
  nativeShowModal.call(completeDialog);
}

function spawnPulse(color) {
  if (!scene || !player) return;
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(.45, .54, 30),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }),
  );
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
    const state = item.state;
    if (item.type === "relay") {
      state.ring.rotation.z += dt * (state.active ? 2.7 : .7);
      const target = state.active ? 2.15 : .7;
      state.orb.material.emissiveIntensity = THREE.MathUtils.damp(state.orb.material.emissiveIntensity, target, 8, dt);
      state.ring.material.emissiveIntensity = THREE.MathUtils.damp(state.ring.material.emissiveIntensity, state.active ? 1.8 : .65, 8, dt);
      state.light.intensity = THREE.MathUtils.damp(state.light.intensity, state.active ? 2.1 : .75, 7, dt);
      if (state.errorPulse > 0) {
        state.errorPulse = Math.max(0, state.errorPulse - dt);
        state.orb.material.emissive.setHex(COLORS.red);
        if (state.errorPulse === 0) state.orb.material.emissive.setHex(COLORS[state.id]);
      }
    } else if (item.type === "bulkhead") {
      const open = archiveUnlocked;
      state.left.position.x = THREE.MathUtils.damp(state.left.position.x, open ? -2.45 : -.78, 7, dt);
      state.right.position.x = THREE.MathUtils.damp(state.right.position.x, open ? 2.45 : .78, 7, dt);
      const targetColor = open ? COLORS.green : COLORS.red;
      if (state.strip.material.color.getHex() !== targetColor) {
        state.strip.material.color.setHex(targetColor);
        state.strip.material.emissive.setHex(targetColor);
      }
    } else if (item.type === "archive") {
      state.ring.rotation.z += dt * .8;
      state.screen.material.emissiveIntensity += Math.sin(time * 2.1) * .005;
    } else if (item.type === "core") {
      state.upperRing.rotation.z += dt * (state.active ? 2.6 : .6);
      state.lowerRing.rotation.z -= dt * (state.active ? 2.2 : .5);
      if (state.active) {
        const pulse = 1.8 + Math.sin(time * 5) * .35;
        state.energy.material.emissiveIntensity = pulse;
        state.upperRing.material.emissiveIntensity = pulse * .8;
        state.lowerRing.material.emissiveIntensity = pulse * .8;
        state.light.intensity = 2.3 + Math.sin(time * 4) * .35;
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
    if (
      player.position.x > blocker.minX && player.position.x < blocker.maxX &&
      player.position.z > blocker.minZ && player.position.z < blocker.maxZ
    ) {
      blocked = true;
      break;
    }
  }

  if (blocked) {
    player.position.x = lastSafePosition.x;
    player.position.z = lastSafePosition.z;
  } else {
    lastSafePosition.copy(player.position);
  }
}

function updateInteractionPrompt() {
  const prompt = document.getElementById("ta3dMissionPrompt");
  const text = document.getElementById("ta3dMissionPromptText");
  nearestInteraction = null;

  if (!prompt || !text || !missionStarted || missionFinished || missionQuestionActive || !player) {
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
  if (nearestInteraction) text.textContent = nearestInteraction.label();
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

function setupV6(targetScene) {
  if (built) return;
  built = true;
  scene = targetScene;
  ensureMissionUi();

  missionRoot = new THREE.Group();
  missionRoot.name = "v6-interior-mission";
  scene.add(missionRoot);
  buildInterior(missionRoot);

  window.TA3DPerformance?.registerZone({
    id: "v6-interior-mission",
    object: missionRoot,
    x: 0,
    z: -14,
    activeDistance: 36,
    alwaysActive: false,
  });
}

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") {
      player = object;
      scene = this;
      setupV6(this);
    }
  }
  return result;
};

// Own E/ACTION only when a v0.6 mission interaction is active. This listener is
// capture-phase so the original terminal handler cannot also process the same key.
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

window.TA3DMissionV6 = {
  get started() { return missionStarted; },
  get finished() { return missionFinished; },
  get relayProgress() { return relayProgress; },
  get archiveUnlocked() { return archiveUnlocked; },
  get knowledgePassed() { return knowledgePassed; },
};
