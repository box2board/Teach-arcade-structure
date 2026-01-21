const tierSelect = document.getElementById("tier-select");
const speedSelect = document.getElementById("speed-select");
const misconceptionToggle = document.getElementById("misconception-toggle");
const soundToggle = document.getElementById("sound-toggle");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const replayButton = document.getElementById("replay-button");
const boardEl = document.getElementById("board");
const gameArea = document.getElementById("game-area");
const toast = document.getElementById("toast");
const loadError = document.getElementById("load-error");
const categoryChips = document.getElementById("category-chips");
const currentTierLabel = document.getElementById("current-tier");
const currentSpeedLabel = document.getElementById("current-speed");
const currentMisLabel = document.getElementById("current-misconceptions");
const controls = document.querySelectorAll(".control-btn");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const streakEl = document.getElementById("streak");
const timeEl = document.getElementById("time");
const answeredEl = document.getElementById("answered");
const correctEl = document.getElementById("correct");

const gameoverModal = document.getElementById("gameover-modal");
const gameoverSummary = document.getElementById("gameover-summary");
const categorySummary = document.getElementById("category-summary");
const missedList = document.getElementById("missed-list");

const COLUMN_CLEAR = 10;
const MAX_HEIGHT = 14;
const FALL_SPEEDS = {
  slow: 1200,
  normal: 900,
  fast: 650,
};

let gameState = "READY";

const state = {
  tier: "ms",
  content: null,
  misconceptions: false,
  soundOn: true,
  categories: [],
  stacks: [],
  itemsQueue: [],
  currentItem: null,
  currentColumn: 0,
  currentRow: 0,
  intervalId: null,
  timeId: null,
  rafId: null,
  seconds: 0,
  paused: false,
  gameOver: false,
  stats: {
    score: 0,
    answered: 0,
    correct: 0,
    streak: 0,
    categoryStats: {},
    missed: [],
  },
};

const sounds = {
  correct: new Audio(),
  incorrect: new Audio(),
  clear: new Audio(),
};

function initSounds() {
  const beep = (frequency, duration) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration / 1000);
    oscillator.stop(context.currentTime + duration / 1000);
  };
  sounds.correct.play = () => state.soundOn && beep(520, 140);
  sounds.incorrect.play = () => state.soundOn && beep(220, 180);
  sounds.clear.play = () => state.soundOn && beep(640, 160);
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function setToggle(button, isOn) {
  button.setAttribute("aria-pressed", String(isOn));
  button.textContent = isOn ? "On" : "Off";
}

function updatePreview(categories) {
  categoryChips.innerHTML = "";
  categories.forEach((category) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = category;
    categoryChips.appendChild(chip);
  });
}

async function loadContent(tier) {
  const file = tier === "hs" ? "content-hs.json" : "content-ms.json";
  try {
    const res = await fetch(file);
    if (!res.ok) {
      throw new Error("Unable to load content.");
    }
    const data = await res.json();
    state.content = data;
    loadError.hidden = true;
    return data;
  } catch (error) {
    loadError.textContent = "We couldn't load the question set. Please refresh or check your connection.";
    loadError.hidden = false;
    throw error;
  }
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildItemQueue() {
  if (!state.content) return [];
  let items = state.content.items;
  if (!state.misconceptions) {
    items = items.filter((item) => !item.misconception);
  }
  return shuffle(items);
}

function hideAllOverlays() {
  gameoverModal.hidden = true;
  toast.hidden = true;
}

function showGameOverOverlay() {
  if (gameState !== "GAME_OVER") return;
  gameoverModal.hidden = false;
}

function stopLoops() {
  clearInterval(state.intervalId);
  clearInterval(state.timeId);
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
  }
  state.intervalId = null;
  state.timeId = null;
  state.rafId = null;
}

function resetGameState() {
  stopLoops();
  state.stacks = state.categories.map(() => []);
  state.itemsQueue = [];
  state.currentItem = null;
  state.currentColumn = 0;
  state.currentRow = 0;
  state.seconds = 0;
  state.paused = false;
  state.gameOver = false;
  state.stats = {
    score: 0,
    answered: 0,
    correct: 0,
    streak: 0,
    categoryStats: {},
    missed: [],
  };
  state.categories.forEach((category) => {
    state.stats.categoryStats[category] = { correct: 0, total: 0 };
  });
  scoreEl.textContent = "0";
  answeredEl.textContent = "0";
  correctEl.textContent = "0";
  streakEl.textContent = "0";
  accuracyEl.textContent = "0%";
  timeEl.textContent = "0:00";
  gameoverSummary.textContent = "";
  categorySummary.innerHTML = "";
  missedList.innerHTML = "";
  updatePreview(state.categories);
  updateStatusLabels();
  buildBoard();
  pauseButton.textContent = "Pause";
}

function startGame() {
  if (!state.content) return;
  stopLoops();
  applySettingsToCategories();
  resetGameState();
  hideAllOverlays();
  gameState = "PLAYING";
  gameArea.hidden = false;
  pauseButton.disabled = false;
  restartButton.disabled = false;
  state.itemsQueue = buildItemQueue();
  spawnTile();
  startTimers();
}

function replayGame() {
  stopLoops();
  hideAllOverlays();
  gameState = "PLAYING";
  resetGameState();
  gameArea.hidden = false;
  pauseButton.disabled = false;
  restartButton.disabled = false;
  state.itemsQueue = buildItemQueue();
  spawnTile();
  startTimers();
}

function initUI() {
  gameState = "READY";
  hideAllOverlays();
  state.gameOver = false;
  gameArea.hidden = false;
  pauseButton.disabled = true;
  restartButton.disabled = true;
  resetGameState();
}

/**
 * Test plan:
 * - Load page → READY, no overlays
 * - Start → PLAYING
 * - Lose → GAME_OVER overlay
 * - Replay → PLAYING, overlay hidden
 * - Refresh anytime → READY, no overlays
 */

function buildBoard() {
  boardEl.innerHTML = "";
  state.categories.forEach((category, index) => {
    const column = document.createElement("div");
    column.className = "column";
    column.dataset.index = index;
    const header = document.createElement("div");
    header.className = "column-header";
    header.textContent = category;
    header.addEventListener("click", () => moveToColumn(index));
    const stack = document.createElement("div");
    stack.className = "column-stack";
    column.appendChild(header);
    column.appendChild(stack);
    boardEl.appendChild(column);
  });
  state.categories.forEach((_, index) => {
    renderColumn(index);
  });
}

function renderColumn(index) {
  const column = boardEl.children[index];
  if (!column) return;
  const stackEl = column.querySelector(".column-stack");
  stackEl.innerHTML = "";
  const stack = state.stacks[index];
  const emptyRows = MAX_HEIGHT - stack.length;
  for (let i = 0; i < emptyRows; i += 1) {
    stackEl.appendChild(document.createElement("div"));
  }
  stack
    .slice()
    .reverse()
    .forEach((item) => {
      stackEl.appendChild(createTileElement(item));
    });
  if (state.currentItem && state.currentColumn === index) {
    const fallingEl = createTileElement(state.currentItem, true);
    const position = Math.min(state.currentRow, MAX_HEIGHT - 1 - stack.length);
    const insertIndex = position;
    const children = stackEl.children;
    if (children[insertIndex]) {
      stackEl.insertBefore(fallingEl, children[insertIndex]);
    } else {
      stackEl.appendChild(fallingEl);
    }
  }
}

function createTileElement(item, isFalling = false) {
  const tile = document.createElement("div");
  tile.className = `tile ${item.tag ? item.tag.toLowerCase() : "prompt"}`;
  if (item.misconception) {
    tile.classList.add("misconception");
  }
  if (isFalling) tile.classList.add("falling");
  if (item.tag) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.tag;
    tile.appendChild(tag);
  }
  const prompt = document.createElement("span");
  prompt.textContent = item.prompt;
  tile.appendChild(prompt);
  return tile;
}

function spawnTile() {
  if (!state.itemsQueue.length) {
    state.itemsQueue = buildItemQueue();
  }
  state.currentItem = state.itemsQueue.shift();
  state.currentColumn = Math.floor(state.categories.length / 2);
  state.currentRow = 0;
  renderColumn(state.currentColumn);
}

function tick() {
  if (gameState !== "PLAYING" || state.paused) return;
  const stackHeight = state.stacks[state.currentColumn].length;
  if (state.currentRow + 1 >= MAX_HEIGHT - stackHeight) {
    lockTile();
    return;
  }
  state.currentRow += 1;
  renderColumn(state.currentColumn);
}

function moveToColumn(index) {
  if (gameState !== "PLAYING" || state.paused) return;
  const prevColumn = state.currentColumn;
  state.currentColumn = Math.max(0, Math.min(state.categories.length - 1, index));
  const stackHeight = state.stacks[state.currentColumn].length;
  state.currentRow = Math.max(0, Math.min(state.currentRow, MAX_HEIGHT - stackHeight - 1));
  renderColumn(prevColumn);
  renderColumn(state.currentColumn);
}

function moveDirection(direction) {
  moveToColumn(state.currentColumn + direction);
}

function softDrop() {
  if (gameState !== "PLAYING" || state.paused) return;
  tick();
}

function hardDrop() {
  if (gameState !== "PLAYING" || state.paused) return;
  const stackHeight = state.stacks[state.currentColumn].length;
  state.currentRow = MAX_HEIGHT - stackHeight - 1;
  renderColumn(state.currentColumn);
  lockTile();
}

function lockTile() {
  const stack = state.stacks[state.currentColumn];
  stack.push(state.currentItem);
  const isMis = state.currentItem.misconception && state.misconceptions;
  const correctCategory = isMis ? "Reject / Myth" : state.currentItem.answer;
  const selectedCategory = state.categories[state.currentColumn];
  const isCorrect = selectedCategory === correctCategory;
  state.stats.answered += 1;
  const categoryKey = isMis ? "Reject / Myth" : state.currentItem.answer;
  if (!state.stats.categoryStats[categoryKey]) {
    state.stats.categoryStats[categoryKey] = { correct: 0, total: 0 };
  }
  state.stats.categoryStats[categoryKey].total += 1;

  if (isCorrect) {
    state.stats.correct += 1;
    state.stats.streak += 1;
    const streakBonus = Math.min(state.stats.streak * 2, 10);
    state.stats.score += 10 + streakBonus;
    state.stats.categoryStats[categoryKey].correct += 1;
    showToast(`Correct! ${state.currentItem.explanation}`, "success");
    sounds.correct.play();
  } else {
    state.stats.streak = 0;
    state.stats.score -= 5;
    const correctMsg = isMis
      ? `Misconception: the correct idea is ${state.currentItem.answer}.`
      : `Correct answer: ${correctCategory}.`;
    state.stats.missed.push({
      prompt: state.currentItem.prompt,
      correct: correctCategory,
    });
    showToast(`${correctMsg} ${state.currentItem.explanation}`, "error");
    sounds.incorrect.play();
  }

  if (stack.length >= COLUMN_CLEAR) {
    state.stats.score += 50;
    state.stacks[state.currentColumn] = [];
    showToast(`Column cleared! +50 points`, "success");
    sounds.clear.play();
  }

  if (stack.length >= MAX_HEIGHT) {
    endGame();
    return;
  }

  updateStats();
  renderColumn(state.currentColumn);
  spawnTile();
}

function updateStats() {
  scoreEl.textContent = state.stats.score;
  answeredEl.textContent = state.stats.answered;
  correctEl.textContent = state.stats.correct;
  streakEl.textContent = state.stats.streak;
  const accuracy = state.stats.answered
    ? Math.round((state.stats.correct / state.stats.answered) * 100)
    : 0;
  accuracyEl.textContent = `${accuracy}%`;
}

function updateTime() {
  state.seconds += 1;
  const minutes = Math.floor(state.seconds / 60);
  const secs = String(state.seconds % 60).padStart(2, "0");
  timeEl.textContent = `${minutes}:${secs}`;
}

function startTimers() {
  clearInterval(state.intervalId);
  clearInterval(state.timeId);
  const speed = FALL_SPEEDS[speedSelect.value] || FALL_SPEEDS.normal;
  state.intervalId = setInterval(tick, speed);
  state.timeId = setInterval(updateTime, 1000);
}

function pauseGame() {
  if (gameState !== "PLAYING" && gameState !== "PAUSED") return;
  state.paused = !state.paused;
  gameState = state.paused ? "PAUSED" : "PLAYING";
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
}

function endGame() {
  if (gameState !== "PLAYING") return;
  gameState = "GAME_OVER";
  state.gameOver = true;
  stopLoops();
  showGameOverOverlay();
  pauseButton.disabled = true;
  restartButton.disabled = true;
  const accuracy = state.stats.answered
    ? Math.round((state.stats.correct / state.stats.answered) * 100)
    : 0;
  gameoverSummary.textContent = `Final score ${state.stats.score}. Accuracy ${accuracy}% with ${state.stats.correct}/${state.stats.answered} correct.`;
  categorySummary.innerHTML = "";
  Object.entries(state.stats.categoryStats).forEach(([category, stats]) => {
    const li = document.createElement("li");
    const percent = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    li.textContent = `${category}: ${stats.correct}/${stats.total} (${percent}%)`;
    categorySummary.appendChild(li);
  });
  missedList.innerHTML = "";
  state.stats.missed.slice(0, 5).forEach((miss) => {
    const li = document.createElement("li");
    li.textContent = `${miss.prompt} → ${miss.correct}`;
    missedList.appendChild(li);
  });
}

function updateStatusLabels() {
  const tierLabel = tierSelect.value === "hs" ? "High School" : "Middle School";
  currentTierLabel.textContent = tierLabel;
  currentSpeedLabel.textContent = `Speed: ${speedSelect.value}`;
  currentMisLabel.textContent = state.misconceptions ? "Misconceptions: ON" : "Misconceptions: OFF";
}

function applySettingsToCategories() {
  if (!state.content) return;
  state.categories = [...state.content.categories];
  if (state.misconceptions) {
    state.categories.push("Reject / Myth");
  }
  updatePreview(state.categories);
  updateStatusLabels();
}

function handleTierChange() {
  state.tier = tierSelect.value;
  state.misconceptions = state.tier === "hs";
  setToggle(misconceptionToggle, state.misconceptions);
  loadContent(state.tier).then(() => {
    applySettingsToCategories();
    if (gameState !== "PLAYING") {
      resetGameState();
    }
  });
}

function handleMisconceptionToggle() {
  state.misconceptions = !state.misconceptions;
  setToggle(misconceptionToggle, state.misconceptions);
  applySettingsToCategories();
  if (gameState !== "PLAYING") {
    resetGameState();
  }
}

function handleSoundToggle() {
  state.soundOn = !state.soundOn;
  setToggle(soundToggle, state.soundOn);
}

function handleKeydown(event) {
  if (gameArea.hidden) return;
  if (event.key === "p" || event.key === "P") {
    pauseGame();
    return;
  }
  if (gameState !== "PLAYING") return;
  switch (event.key) {
    case "ArrowLeft":
      moveDirection(-1);
      break;
    case "ArrowRight":
      moveDirection(1);
      break;
    case "ArrowDown":
      softDrop();
      break;
    case " ":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

controls.forEach((button) => {
  button.addEventListener("click", () => {
    if (gameState !== "PLAYING") return;
    const action = button.dataset.action;
    if (action === "left") moveDirection(-1);
    if (action === "right") moveDirection(1);
    if (action === "down") softDrop();
    if (action === "drop") hardDrop();
  });
});

startButton.addEventListener("click", () => {
  startGame();
});

pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", () => {
  startGame();
});
replayButton.addEventListener("click", () => {
  replayGame();
});

tierSelect.addEventListener("change", handleTierChange);
misconceptionToggle.addEventListener("click", handleMisconceptionToggle);
soundToggle.addEventListener("click", handleSoundToggle);
speedSelect.addEventListener("change", () => {
  updateStatusLabels();
  if (gameState === "PLAYING") {
    startTimers();
  }
});

document.addEventListener("keydown", handleKeydown);

document.addEventListener("DOMContentLoaded", () => {
  initSounds();
  initUI();
  handleTierChange();
});
