import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";
import { answerChoices, renderEvidence, retryControl } from "./evidence-questions.js";

// v1.0 config-driven exterior progression.
// Owns the Lost Facility's cell -> terminal -> switch -> gate loop while the
// engine controller remains responsible only for movement/rendering/collision.

const config = window.TA3DAdventure?.config || window.TA3DAdventureConfig || {};
const exterior = config.exterior || {};
const question = config.questions?.exteriorTerminal || {};
const names = exterior.objects || {};
const radii = exterior.interactionRadius || {};

const objectiveText = document.getElementById("objectiveText");
const objectiveSubtext = document.getElementById("objectiveSubtext");
const cellStatus = document.getElementById("cellStatus");
const terminalStatus = document.getElementById("terminalStatus");
const gateStatus = document.getElementById("gateStatus");
const interactionPrompt = document.getElementById("interactionPrompt");
const interactionText = document.getElementById("interactionText");
const questionDialog = document.getElementById("questionDialog");
const questionText = document.getElementById("questionText");
const answerList = document.getElementById("answerList");
const questionFeedback = document.getElementById("questionFeedback");

const state = {
  hasCell: false,
  terminalPowered: false,
  gateOpen: false,
  nearest: null,
  selectedAnswer: 0,
  questionLocked: false,
  questionActive: false,
};

let presentedAnswers = [];
let retryButton = null;
let exteriorCloseTimer = null;
let engine = null;
let player = null;
let gateDoor = null;
let gateStripe = null;
let energyCell = null;
let energyCellRing = null;
let terminalGlow = null;
let switchGlow = null;

function missionStarted() {
  return Boolean((window.TA3DMission || window.TA3DMissionV6)?.started);
}

function setObjective(entry) {
  if (!entry) return;
  if (objectiveText) objectiveText.textContent = entry.title || "";
  if (objectiveSubtext) objectiveSubtext.textContent = entry.detail || "";
}

function pulseMessage(text) {
  if (!objectiveSubtext || !text) return;
  objectiveSubtext.textContent = text;
  objectiveSubtext.animate?.([{ opacity: .35 }, { opacity: 1 }], { duration: 220 });
}

function updateHud() {
  if (cellStatus) cellStatus.textContent = state.hasCell ? "Collected" : "Not found";
  if (terminalStatus) terminalStatus.textContent = state.terminalPowered ? "Online" : (state.hasCell ? "Ready" : "Offline");
  if (gateStatus) gateStatus.textContent = state.gateOpen ? "Open" : "Locked";

  if (missionStarted()) return;
  if (!state.hasCell) setObjective(exterior.objectives?.start);
  else if (!state.terminalPowered) setObjective(exterior.objectives?.terminal);
  else if (!state.gateOpen) setObjective(exterior.objectives?.gate);
  else setObjective(exterior.objectives?.entrance);
}

function applyVisualState(dt = .016) {
  if (energyCell) energyCell.visible = !state.hasCell;
  if (energyCellRing) energyCellRing.visible = !state.hasCell;

  if (terminalGlow) {
    if (state.terminalPowered) {
      terminalGlow.material.color.setHex(0x38bdf8);
      terminalGlow.material.emissive.setHex(0x0284c7);
      terminalGlow.material.emissiveIntensity = 1.8;
    } else {
      terminalGlow.material.color.setHex(0x233349);
      terminalGlow.material.emissive.setHex(0x172033);
      terminalGlow.material.emissiveIntensity = .5;
    }
  }

  if (switchGlow) {
    if (state.terminalPowered) {
      switchGlow.material.color.setHex(0xfacc15);
      switchGlow.material.emissive.setHex(0xa16207);
      switchGlow.material.emissiveIntensity = 1.6;
    } else {
      switchGlow.material.color.setHex(0xef4444);
      switchGlow.material.emissive.setHex(0x7f1d1d);
      switchGlow.material.emissiveIntensity = 1;
    }
  }

  if (gateDoor) {
    const animation = exterior.gateAnimation || {};
    const target = state.gateOpen ? (animation.openY ?? 6.7) : (animation.closedY ?? 2.25);
    gateDoor.position.y = THREE.MathUtils.damp(gateDoor.position.y, target, animation.damping ?? 5.2, dt);
  }
  if (gateStripe) gateStripe.visible = !state.gateOpen;
}

function distanceTo(point) {
  if (!player || !point) return Infinity;
  return Math.hypot(player.position.x - point.x, player.position.z - point.z);
}

function interactionLabel(id) {
  const labels = exterior.labels || {};
  if (id === "cell") return labels.energyCell || "Pick up energy cell";
  if (id === "terminal") {
    if (!state.hasCell) return labels.terminalNeedsCell || "Terminal needs an energy cell";
    if (state.terminalPowered) return labels.terminalOnline || "Terminal online";
    return labels.terminalReady || "Use knowledge terminal";
  }
  if (id === "switch") {
    if (!state.terminalPowered) return labels.switchNoPower || "Switch has no power";
    if (state.gateOpen) return labels.switchOpen || "Gate already open";
    return labels.switchReady || "Activate gate switch";
  }
  return "Interact";
}

function updateNearestInteraction() {
  state.nearest = null;
  if (!player || missionStarted() || state.questionActive) {
    if (interactionPrompt) interactionPrompt.hidden = true;
    return;
  }

  const options = [];
  if (!state.hasCell) options.push({ id: "cell", point: exterior.energyCell, radius: radii.energyCell ?? 2 });
  options.push({ id: "terminal", point: exterior.terminal, radius: radii.terminal ?? 2.2 });
  options.push({ id: "switch", point: exterior.switch, radius: radii.switch ?? 2 });

  let bestDistance = Infinity;
  for (const option of options) {
    const distance = distanceTo(option.point);
    if (distance <= option.radius && distance < bestDistance) {
      state.nearest = option;
      bestDistance = distance;
    }
  }

  if (interactionPrompt) interactionPrompt.hidden = !state.nearest;
  if (state.nearest && interactionText) interactionText.textContent = interactionLabel(state.nearest.id);
}

function buildAnswers() {
  if (!answerList) return;
  answerList.innerHTML = "";
  presentedAnswers = answerChoices(question);
  presentedAnswers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.textContent = `${index + 1}. ${answer.text}`;
    button.addEventListener("click", () => submitAnswer(index));
    answerList.appendChild(button);
  });
  updateAnswerFocus();
}

function updateAnswerFocus() {
  [...(answerList?.children || [])].forEach((button, index) => button.classList.toggle("focused", index === state.selectedAnswer));
}

function openQuestion() {
  if (!questionDialog || state.questionActive || state.terminalPowered) return;
  state.questionActive = true;
  state.selectedAnswer = 0;
  state.questionLocked = false;
  if (questionFeedback) questionFeedback.textContent = "";
  const heading = questionDialog.querySelector("h2");
  if (heading) heading.textContent = question.title || "Restore terminal power";
  if (questionText) questionText.textContent = question.text || "";
  renderEvidence(question, questionText);
  retryButton = retryControl(answerList, () => {
    state.questionLocked = false;
    retryButton.hidden = true;
    questionFeedback.textContent = "Compare the evidence, then choose again.";
    state.selectedAnswer = 0;
    buildAnswers();
  });
  buildAnswers();
  questionDialog.showModal();
}

function submitAnswer(index) {
  if (!state.questionActive || state.questionLocked || !presentedAnswers[index]) return;
  state.selectedAnswer = index;
  updateAnswerFocus();
  const buttons = [...(answerList?.children || [])];
  const correct = question.correct ?? 0;

  if (presentedAnswers[index].sourceIndex !== correct) {
    buttons[index]?.classList.add("wrong");
    if (questionFeedback) questionFeedback.textContent = question.wrongFeedback || "Not quite. Try another answer.";
    if (question.reviewBeforeRetry) {
      state.questionLocked = true;
      buttons.forEach(button => button.disabled = true);
      retryButton.hidden = false;
    } else setTimeout(() => buttons[index]?.classList.remove("wrong"), 420);
    return;
  }

  state.questionLocked = true;
  buttons[index]?.classList.add("correct");
  if (questionFeedback) questionFeedback.textContent = question.correctFeedback || "Correct.";
  state.terminalPowered = true;
  applyVisualState();
  updateHud();
  if (question.reviewBeforeRetry) {
    retryButton.textContent = "Continue investigation";
    retryButton.onclick = () => questionDialog.close();
    retryButton.hidden = false;
  } else exteriorCloseTimer = setTimeout(() => questionDialog.open && questionDialog.close(), 700);
}

function handleQuestionKey(event) {
  const answers = question.answers || [];
  if (!["ArrowUp", "ArrowDown", "Enter", "Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (state.questionLocked) return true;

  if (event.code === "ArrowUp") state.selectedAnswer = (state.selectedAnswer + answers.length - 1) % answers.length;
  else if (event.code === "ArrowDown") state.selectedAnswer = (state.selectedAnswer + 1) % answers.length;
  else if (/^Digit[1-4]$/.test(event.code)) {
    const index = Number(event.code.slice(-1)) - 1;
    if (index < answers.length) submitAnswer(index);
    return true;
  } else if (event.code === "Enter") {
    submitAnswer(state.selectedAnswer);
    return true;
  }
  updateAnswerFocus();
  return true;
}

function interact() {
  const id = state.nearest?.id;
  if (!id || state.questionActive || missionStarted()) return;
  const feedback = exterior.feedback || {};

  if (id === "cell") {
    state.hasCell = true;
    applyVisualState();
    updateHud();
    window.dispatchEvent(new CustomEvent("ta3d:progress", { detail: { system: "exterior", stage: "cell" } }));
    return;
  }

  if (id === "terminal") {
    if (!state.hasCell) return pulseMessage(feedback.terminalNeedsCell || "The terminal needs an energy cell first.");
    if (state.terminalPowered) return pulseMessage(feedback.terminalOnline || "Terminal restored. The gate switch now has power.");
    openQuestion();
    return;
  }

  if (id === "switch") {
    if (!state.terminalPowered) return pulseMessage(feedback.switchNoPower || "No power. Restore the knowledge terminal first.");
    if (!state.gateOpen) {
      state.gateOpen = true;
      applyVisualState();
      updateHud();
      pulseMessage(feedback.gateUnlocked || "Gate unlocked. Enter the facility.");
      window.dispatchEvent(new CustomEvent("ta3d:progress", { detail: { system: "exterior", stage: "entrance" } }));
    }
  }
}

function attachToEngine(api) {
  if (!api || engine) return;
  engine = api;
  player = api.player;
  gateDoor = api.findObject(names.gateDoor || "exterior-gate-door");
  gateStripe = api.findObject(names.gateStripe || "exterior-gate-stripe");
  energyCell = api.findObject(names.energyCell || "exterior-energy-cell");
  energyCellRing = api.findObject(names.energyCellRing || "exterior-energy-cell-ring");
  terminalGlow = api.findObject(names.terminalGlow || "exterior-terminal-glow");
  switchGlow = api.findObject(names.switchGlow || "exterior-switch-glow");

  const blocker = exterior.gateBlocker || { minX: -2.2, maxX: 2.2, minZ: -8.12, maxZ: -7.60 };
  api.registerDynamicBlocker({ ...blocker, active: () => !state.gateOpen });
  api.onUpdate((dt) => {
    applyVisualState(dt);
    updateNearestInteraction();
  });

  applyVisualState();
  updateHud();
}

window.addEventListener("ta3d:engine-ready", (event) => attachToEngine(event.detail));
if (window.TA3DEngine) attachToEngine(window.TA3DEngine);

window.addEventListener("keydown", (event) => {
  if (state.questionActive) {
    handleQuestionKey(event);
    return;
  }
  if (event.code !== "KeyE" || event.repeat || !state.nearest || missionStarted()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  interact();
}, true);

questionDialog?.addEventListener("close", () => {
  clearTimeout(exteriorCloseTimer);
  if (retryButton) retryButton.hidden = true;
  if (state.questionActive) state.questionActive = false;
});

const api = {
  get hasCell() { return state.hasCell; },
  get terminalPowered() { return state.terminalPowered; },
  get gateOpen() { return state.gateOpen; },
  get questionActive() { return state.questionActive; },
  snapshot() {
    return {
      hasCell: state.hasCell,
      terminalPowered: state.terminalPowered,
      gateOpen: state.gateOpen,
    };
  },
};
window.TA3DExteriorProgression = api;
