import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

const config = window.TA3DAdventureConfig;
const STORAGE_KEY = "teachArcade3D.lostFacility.v08.difficulty";
const CHECKPOINT_KEY = "teachArcade3D.lostFacility.v07.checkpoint";

let current = null;
let player = null;
let lastUiUpdate = 0;
let hintAttachedForQuestion = "";

function readStoredDifficulty() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return config?.difficulties?.[value] ? value : null;
  } catch {
    return null;
  }
}

function hasExistingProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || "null");
    return Boolean(parsed?.stage && parsed.stage !== "start");
  } catch {
    return false;
  }
}

function writeStoredDifficulty(id) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}

function clearStoredDifficulty() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function settings() {
  return config?.difficulties?.[current] || config?.difficulties?.medium || {};
}

function ensureStatusLine() {
  const status = document.querySelector(".status-card");
  if (!status || document.getElementById("difficultyStatus")) return;
  const line = document.createElement("span");
  line.innerHTML = '<b>Difficulty</b> <span id="difficultyStatus">—</span>';
  status.appendChild(line);
}

function updateStatusLine() {
  const node = document.getElementById("difficultyStatus");
  if (node) node.textContent = settings().label || "Medium";
}

function ensureGuidanceBadge() {
  if (document.getElementById("ta3dGuidance")) return;
  const badge = document.createElement("div");
  badge.id = "ta3dGuidance";
  badge.hidden = true;
  badge.style.cssText = [
    "position:fixed",
    "right:18px",
    "top:152px",
    "z-index:7600",
    "padding:9px 12px",
    "border-radius:11px",
    "border:1px solid rgba(125,211,252,.38)",
    "background:rgba(8,18,29,.78)",
    "color:#eaf9ff",
    "font:700 12px/1.25 system-ui,sans-serif",
    "box-shadow:0 8px 24px rgba(0,0,0,.2)",
    "pointer-events:none",
    "backdrop-filter:blur(5px)",
  ].join(";");
  badge.innerHTML = '<span style="font-size:9px;letter-spacing:.12em;opacity:.6">GUIDANCE</span><br><span id="ta3dGuidanceText">Explore the facility</span>';
  document.body.appendChild(badge);
}

function ensureToast() {
  if (document.getElementById("ta3dDifficultyToast")) return;
  const toast = document.createElement("div");
  toast.id = "ta3dDifficultyToast";
  toast.style.cssText = [
    "position:fixed",
    "left:50%",
    "top:24%",
    "transform:translate(-50%,-8px)",
    "z-index:22000",
    "padding:10px 14px",
    "border-radius:12px",
    "border:1px solid rgba(125,211,252,.45)",
    "background:rgba(8,20,32,.92)",
    "color:#eaf9ff",
    "font:800 13px/1.25 system-ui,sans-serif",
    "opacity:0",
    "transition:opacity .16s ease,transform .16s ease",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(toast);
}

let toastTimer = null;
function toast(message) {
  const node = document.getElementById("ta3dDifficultyToast");
  if (!node) return;
  node.textContent = message;
  node.style.opacity = "1";
  node.style.transform = "translate(-50%,0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translate(-50%,-8px)";
  }, 1700);
}

function ensureAcademicHintNode() {
  if (document.getElementById("ta3dAcademicHint")) return;
  const feedback = document.getElementById("questionFeedback");
  if (!feedback?.parentElement) return;
  const hint = document.createElement("p");
  hint.id = "ta3dAcademicHint";
  hint.hidden = true;
  hint.style.cssText = "margin:8px 0 0;padding:8px 10px;border-radius:9px;background:rgba(56,189,248,.09);border:1px solid rgba(56,189,248,.22);font-size:13px;line-height:1.35;color:#d9f5ff";
  feedback.parentElement.insertBefore(hint, feedback);
}

function ensureSelector() {
  if (document.getElementById("ta3dDifficultySelect")) return;
  const overlay = document.createElement("div");
  overlay.id = "ta3dDifficultySelect";
  overlay.hidden = true;
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:25000",
    "display:grid",
    "place-items:center",
    "padding:20px",
    "background:linear-gradient(rgba(4,12,20,.92),rgba(5,15,25,.96))",
    "color:#effaff",
    "font-family:system-ui,sans-serif",
  ].join(";");

  const card = document.createElement("div");
  card.style.cssText = "width:min(680px,100%);padding:24px;border-radius:18px;border:1px solid rgba(125,211,252,.32);background:rgba(10,24,38,.94);box-shadow:0 24px 70px rgba(0,0,0,.38)";
  card.innerHTML = `
    <div style="font-size:10px;letter-spacing:.17em;opacity:.62;margin-bottom:7px">TEACH ARCADE 3D ADVENTURE</div>
    <h1 style="margin:0 0 5px;font-size:28px">${config?.title || "3D Adventure"}</h1>
    <p style="margin:0 0 19px;opacity:.72">Choose how much guidance you want. Movement and controls stay the same.</p>
    <div id="ta3dDifficultyChoices" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px"></div>
    <p style="margin:16px 0 0;font-size:12px;opacity:.55">You can start over later and choose a different mode.</p>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const choices = card.querySelector("#ta3dDifficultyChoices");
  ["easy", "medium", "hard"].forEach((id, index) => {
    const d = config.difficulties[id];
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.difficulty = id;
    button.style.cssText = "appearance:none;text-align:left;padding:15px;border-radius:13px;border:1px solid rgba(148,203,231,.28);background:#13283a;color:#f1fbff;cursor:pointer;min-height:118px";
    button.innerHTML = `<strong style="display:block;font-size:17px;margin-bottom:6px">${d.label}</strong><span style="display:block;font-size:12px;line-height:1.4;opacity:.72">${d.summary}</span><span style="display:block;margin-top:10px;font-size:10px;opacity:.48">KEY ${index + 1}</span>`;
    button.addEventListener("click", () => selectDifficulty(id));
    choices.appendChild(button);
  });
}

function selectDifficulty(id, { silent = false } = {}) {
  if (!config?.difficulties?.[id]) id = config?.defaultDifficulty || "medium";
  current = id;
  writeStoredDifficulty(id);
  updateStatusLine();
  const overlay = document.getElementById("ta3dDifficultySelect");
  if (overlay) overlay.hidden = true;
  if (!silent) toast(`${settings().label.toUpperCase()} MODE`);
}

function showSelector() {
  const overlay = document.getElementById("ta3dDifficultySelect");
  if (overlay) overlay.hidden = false;
}

function initializeSelection() {
  const stored = readStoredDifficulty();
  if (stored) return selectDifficulty(stored, { silent: true });
  if (hasExistingProgress()) return selectDifficulty(config?.defaultDifficulty || "medium", { silent: true });
  showSelector();
}

function updateGuidance(now) {
  if (!current || now - lastUiUpdate < 140) return;
  lastUiUpdate = now;
  const mission = window.TA3DMissionV6;
  const badge = document.getElementById("ta3dGuidance");
  const text = document.getElementById("ta3dGuidanceText");
  if (!badge || !text) return;

  if (!mission?.started || mission.finished || mission.archiveUnlocked || !settings().showNextRelay) {
    badge.hidden = true;
  } else {
    const order = config?.relayPuzzle?.order || [];
    const nextId = order[Math.min(mission.relayProgress || 0, order.length - 1)];
    badge.hidden = !nextId;
    if (nextId) text.textContent = `Next relay: ${config.relayPuzzle.stations[nextId]?.label || nextId.toUpperCase()}`;
  }

  const sub = document.getElementById("objectiveSubtext");
  if (current === "hard" && sub) {
    const value = sub.textContent || "";
    if (/Power is routing correctly\. Find the .* relay next\./i.test(value)) {
      sub.textContent = "The route is working. Use the wall sequence to determine the next relay.";
    } else if (value === "Read the color route on the wall, then activate the three matching relays in order.") {
      sub.textContent = "Restore auxiliary power using the wall routing panel.";
    }
  }

  updateAcademicHint();
}

function updateAcademicHint() {
  const dialog = document.getElementById("questionDialog");
  const hint = document.getElementById("ta3dAcademicHint");
  const question = document.getElementById("questionText")?.textContent || "";
  if (!hint || !dialog?.open || !settings().academicHints) {
    if (hint) hint.hidden = true;
    hintAttachedForQuestion = "";
    return;
  }
  const message = config?.academicHints?.[question];
  if (!message) {
    hint.hidden = true;
    return;
  }
  if (hintAttachedForQuestion !== question) {
    hint.textContent = `Hint: ${message}`;
    hintAttachedForQuestion = question;
  }
  hint.hidden = false;
}

function nearbyRelay() {
  if (!player) return null;
  const stations = config?.relayPuzzle?.stations || {};
  let best = null;
  let distance = Infinity;
  for (const [id, station] of Object.entries(stations)) {
    const d = Math.hypot(player.position.x - station.x, player.position.z - station.z);
    if (d <= 1.8 && d < distance) {
      best = id;
      distance = d;
    }
  }
  return best;
}

function interceptForgivingRelayMistake(event) {
  if (event.code !== "KeyE" || event.repeat || current !== "easy" || !settings().preserveRelayProgressOnMistake) return false;
  const mission = window.TA3DMissionV6;
  if (!mission?.started || mission.finished || mission.archiveUnlocked) return false;
  const near = nearbyRelay();
  if (!near) return false;
  const order = config?.relayPuzzle?.order || [];
  const expected = order[mission.relayProgress || 0];
  if (!expected || near === expected) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  toast(`TRY ${config.relayPuzzle.stations[expected]?.label || expected.toUpperCase()} NEXT`);
  return true;
}

ensureStatusLine();
ensureGuidanceBadge();
ensureToast();
ensureAcademicHintNode();
ensureSelector();
initializeSelection();

window.addEventListener("keydown", (event) => {
  const overlay = document.getElementById("ta3dDifficultySelect");
  if (overlay && !overlay.hidden) {
    if (["Digit1", "Digit2", "Digit3"].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectDifficulty({ Digit1: "easy", Digit2: "medium", Digit3: "hard" }[event.code]);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  interceptForgivingRelayMistake(event);
}, true);

const previousSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = previousSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") player = object;
  }
  return result;
};

const previousRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (renderScene, camera) {
  updateGuidance(performance.now());
  return previousRender.call(this, renderScene, camera);
};

const restart = document.getElementById("restartGame");
restart?.addEventListener("click", () => clearStoredDifficulty(), true);

window.TA3DDifficulty = {
  get id() { return current || config?.defaultDifficulty || "medium"; },
  get settings() { return settings(); },
  choose(id) { selectDifficulty(id); },
  reset() {
    clearStoredDifficulty();
    current = null;
    updateStatusLine();
    showSelector();
  },
};
