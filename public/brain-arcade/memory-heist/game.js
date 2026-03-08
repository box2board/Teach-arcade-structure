(() => {
  const STORAGE_KEY = "ta-memory-heist-best";
  const GRID_SIZE = 16;

  const state = {
    sequence: [],
    inputIndex: 0,
    round: 1,
    score: 0,
    streak: 0,
    bestScore: 0,
    security: 10,
    isRunActive: false,
    isShowingSequence: false,
    canInput: false,
    soundEnabled: false,
    pressureTimer: null,
    roundTimer: null,
  };

  const dom = {
    grid: document.getElementById("vaultGrid"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),
    soundBtn: document.getElementById("soundBtn"),
    roundDisplay: document.getElementById("roundDisplay"),
    scoreDisplay: document.getElementById("scoreDisplay"),
    bestDisplay: document.getElementById("bestDisplay"),
    streakDisplay: document.getElementById("streakDisplay"),
    rankDisplay: document.getElementById("rankDisplay"),
    phaseDisplay: document.getElementById("phaseDisplay"),
    statusLine: document.getElementById("statusLine"),
    securityState: document.getElementById("securityState"),
    meterFill: document.getElementById("meterFill"),
  };

  function initGame() {
    renderTiles();
    wireEvents();
    loadBestScore();
    updateHUD();
    updateSecurityMeter();
  }

  function renderTiles() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < GRID_SIZE; i += 1) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "vault-tile";
      tile.dataset.index = String(i);
      tile.setAttribute("role", "gridcell");
      tile.setAttribute("aria-label", `Vault tile ${i + 1}`);
      tile.textContent = String(i + 1);
      fragment.appendChild(tile);
    }
    dom.grid.innerHTML = "";
    dom.grid.appendChild(fragment);
  }

  function wireEvents() {
    dom.startBtn.addEventListener("click", startRun);
    dom.restartBtn.addEventListener("click", startRun);
    dom.soundBtn.addEventListener("click", toggleSound);

    dom.grid.addEventListener("click", (event) => {
      const tile = event.target.closest(".vault-tile");
      if (!tile) return;
      handleTileInput(Number(tile.dataset.index), tile);
    });

    dom.grid.addEventListener("keydown", (event) => {
      const tile = event.target.closest(".vault-tile");
      if (!tile) return;
      const index = Number(tile.dataset.index);
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTileInput(index, tile);
        return;
      }
      handleArrowNavigation(event, index);
    });
  }

  function startRun() {
    clearTimers();
    state.sequence = [];
    state.inputIndex = 0;
    state.round = 1;
    state.score = 0;
    state.streak = 0;
    state.security = 10;
    state.isRunActive = true;
    state.isShowingSequence = false;
    state.canInput = false;

    dom.statusLine.textContent = "Vault online. Study the sequence.";
    updateHUD();
    updateSecurityMeter();
    startRound();
  }

  function startRound() {
    if (!state.isRunActive) return;

    clearTimers();
    state.isShowingSequence = true;
    state.canInput = false;
    state.inputIndex = 0;

    const targetLength = getSequenceLength();
    while (state.sequence.length < targetLength) {
      state.sequence.push(randomTileIndex());
    }

    dom.phaseDisplay.textContent = "Watch";
    dom.grid.classList.add("locked");
    dom.statusLine.textContent = `Round ${state.round}: memorize ${targetLength} tiles.`;

    playSequence().then(() => {
      if (!state.isRunActive) return;
      beginInputPhase();
    });
  }

  async function playSequence() {
    const flashDuration = getFlashDuration();
    const pauseDuration = Math.max(120, flashDuration - 120);

    for (let i = 0; i < state.sequence.length; i += 1) {
      const tileIndex = state.sequence[i];
      const tile = getTile(tileIndex);
      flashTile(tile, flashDuration);
      await wait(flashDuration + pauseDuration);
    }
  }

  function beginInputPhase() {
    state.isShowingSequence = false;
    state.canInput = true;
    dom.phaseDisplay.textContent = "Input";
    dom.grid.classList.remove("locked");
    dom.statusLine.textContent = "Repeat the sequence before security climbs.";
    beginPressure();
  }

  function handleTileInput(index, tile) {
    if (!state.isRunActive) {
      dom.statusLine.textContent = "Press Start Heist to begin.";
      return;
    }

    if (!state.canInput || state.isShowingSequence) {
      nudgeSecurity(1.5);
      dom.statusLine.textContent = "Hold steady. Wait for input phase.";
      return;
    }

    const expectedIndex = state.sequence[state.inputIndex];
    if (index !== expectedIndex) {
      markWrong(tile);
      failInput("Wrong tile. Security spiked.");
      return;
    }

    markHit(tile);
    state.inputIndex += 1;

    if (state.inputIndex >= state.sequence.length) {
      completeRound();
    } else {
      dom.statusLine.textContent = `Good. ${state.sequence.length - state.inputIndex} tile(s) left.`;
    }
  }

  function completeRound() {
    state.canInput = false;
    clearPressureTimer();

    state.streak += 1;
    const points = 25 + state.round * 12 + Math.min(120, state.streak * 4);
    state.score += points;

    dom.statusLine.textContent = `Vault cracked. +${points} points.`;
    state.round += 1;
    updateBestScore();
    updateHUD();

    state.roundTimer = window.setTimeout(startRound, 900);
  }

  function failInput(message) {
    state.canInput = false;
    state.streak = 0;
    nudgeSecurity(22);
    dom.statusLine.textContent = message;
    updateHUD();

    if (state.security >= 100) {
      endRun("ALARM TRIGGERED. Vault lockdown.");
      return;
    }

    state.roundTimer = window.setTimeout(startRound, 1100);
  }

  function endRun(message) {
    state.isRunActive = false;
    state.canInput = false;
    state.isShowingSequence = false;
    clearTimers();
    dom.grid.classList.add("locked");
    dom.phaseDisplay.textContent = "Ended";
    updateBestScore();
    updateHUD();
    dom.statusLine.textContent = `${message} Run ended at round ${state.round}. Tap Start Heist to try again.`;
  }

  function beginPressure() {
    clearPressureTimer();
    const increasePerSecond = getPressureRate();
    state.pressureTimer = window.setInterval(() => {
      if (!state.canInput || !state.isRunActive) return;
      nudgeSecurity(increasePerSecond / 5);
      if (state.security >= 100) {
        endRun("ALARM TRIGGERED by hesitation.");
      }
    }, 200);
  }

  function nudgeSecurity(value) {
    state.security = Math.min(100, state.security + value);
    updateSecurityMeter();
  }

  function updateSecurityMeter() {
    const pct = Math.max(0, Math.min(100, state.security));
    dom.meterFill.style.width = `${pct}%`;

    let label = "SAFE";
    let color = "#22c55e";
    if (pct >= 85) {
      label = "LOCKDOWN";
      color = "#ef4444";
    } else if (pct >= 60) {
      label = "ALERT";
      color = "#f97316";
    } else if (pct >= 35) {
      label = "CAUTION";
      color = "#facc15";
    }
    dom.securityState.textContent = label;
    dom.securityState.style.color = color;
  }

  function updateHUD() {
    dom.roundDisplay.textContent = String(state.round);
    dom.scoreDisplay.textContent = String(state.score);
    dom.bestDisplay.textContent = String(state.bestScore);
    dom.streakDisplay.textContent = String(state.streak);
    dom.rankDisplay.textContent = getRankLabel(state.score);
  }

  function updateBestScore() {
    if (state.score <= state.bestScore) return;
    state.bestScore = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.bestScore));
    dom.bestDisplay.textContent = String(state.bestScore);
  }

  function loadBestScore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.bestScore = Number(raw) || 0;
  }

  function getSequenceLength() {
    return 3 + Math.floor((state.round - 1) / 2);
  }

  function getFlashDuration() {
    return Math.max(260, 620 - Math.floor((state.round - 1) / 3) * 45);
  }

  function getPressureRate() {
    return 2 + Math.floor((state.round - 1) / 3) * 0.6;
  }

  function getRankLabel(score) {
    if (score >= 900) return "Master Thief";
    if (score >= 550) return "Safecracker";
    if (score >= 260) return "Crew Member";
    return "Rookie";
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    dom.soundBtn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
    dom.soundBtn.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
    dom.statusLine.textContent = state.soundEnabled
      ? "Sound enabled (audio effects can be added in a future update)."
      : "Sound disabled.";
  }

  function handleArrowNavigation(event, currentIndex) {
    let next = currentIndex;
    if (event.key === "ArrowRight") next = currentIndex % 4 === 3 ? currentIndex : currentIndex + 1;
    if (event.key === "ArrowLeft") next = currentIndex % 4 === 0 ? currentIndex : currentIndex - 1;
    if (event.key === "ArrowDown") next = currentIndex + 4 > 15 ? currentIndex : currentIndex + 4;
    if (event.key === "ArrowUp") next = currentIndex - 4 < 0 ? currentIndex : currentIndex - 4;

    if (next !== currentIndex) {
      event.preventDefault();
      getTile(next).focus();
    }
  }

  function flashTile(tile, duration = 420) {
    if (!tile) return;
    tile.dataset.active = "true";
    window.setTimeout(() => {
      tile.dataset.active = "false";
    }, duration);
  }

  function markHit(tile) {
    if (!tile) return;
    tile.dataset.hit = "true";
    window.setTimeout(() => {
      tile.dataset.hit = "false";
    }, 180);
  }

  function markWrong(tile) {
    if (!tile) return;
    tile.dataset.wrong = "true";
    window.setTimeout(() => {
      tile.dataset.wrong = "false";
    }, 300);
  }

  function getTile(index) {
    return dom.grid.querySelector(`.vault-tile[data-index="${index}"]`);
  }

  function randomTileIndex() {
    return Math.floor(Math.random() * GRID_SIZE);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function clearPressureTimer() {
    if (state.pressureTimer) {
      window.clearInterval(state.pressureTimer);
      state.pressureTimer = null;
    }
  }

  function clearTimers() {
    clearPressureTimer();
    if (state.roundTimer) {
      window.clearTimeout(state.roundTimer);
      state.roundTimer = null;
    }
  }

  initGame();
})();
