(() => {
  const STATES = {
    IDLE: "IDLE",
    ARMED: "ARMED",
    COUNTDOWN: "COUNTDOWN",
    GO: "GO",
    RESULT: "RESULT",
    FALSE_START: "FALSE_START"
  };

  const DIFFICULTY_WINDOWS = {
    easy: { min: 1200, max: 2500 },
    normal: { min: 800, max: 2200 },
    pro: { min: 400, max: 2000 }
  };

  const els = {
    difficulty: document.getElementById("difficulty"),
    mode: document.getElementById("mode"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),
    shareBtn: document.getElementById("shareBtn"),
    status: document.getElementById("statusLine"),
    pressZone: document.getElementById("pressZone"),
    reactionTime: document.getElementById("reactionTime"),
    sessionBest: document.getElementById("sessionBest"),
    personalBest: document.getElementById("personalBest"),
    streakAttempts: document.getElementById("streakAttempts"),
    seriesSummary: document.getElementById("seriesSummary"),
    lights: {
      pre: document.getElementById("lightPre"),
      stage: document.getElementById("lightStage"),
      amber1: document.getElementById("lightAmber1"),
      amber2: document.getElementById("lightAmber2"),
      amber3: document.getElementById("lightAmber3"),
      green: document.getElementById("lightGreen"),
      red: document.getElementById("lightRed")
    }
  };

  let state = STATES.IDLE;
  let timers = [];
  let greenTimestamp = 0;
  let sessionBest = null;
  let personalBest = null;
  let attempts = 0;
  let streak = 0;
  let bestOfFiveRuns = [];
  let bestOfFiveAttempts = 0;
  let latestReaction = null;

  function setState(nextState) {
    state = nextState;
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function setLight(name, active) {
    const light = els.lights[name];
    if (light) {
      light.classList.toggle("active", active);
    }
  }

  function resetLights() {
    Object.keys(els.lights).forEach((key) => setLight(key, false));
  }

  function setButtonLabels() {
    if (els.mode.value === "best5") {
      const runsLeft = Math.max(0, 5 - bestOfFiveAttempts);
      els.startBtn.textContent = runsLeft > 0 ? `Start Run (${runsLeft} left)` : "Series Complete";
      els.startBtn.disabled = runsLeft === 0;
    } else {
      els.startBtn.textContent = "Start Run";
      els.startBtn.disabled = false;
    }
  }

  function safeGetPersonalBest(difficulty) {
    try {
      const raw = window.localStorage.getItem(`reactionDragStrip.pb.${difficulty}`);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }

  function safeSetPersonalBest(difficulty, ms) {
    try {
      window.localStorage.setItem(`reactionDragStrip.pb.${difficulty}`, String(ms));
    } catch {
      // localStorage may be blocked; fail silently.
    }
  }

  function updatePersonalBestLabel() {
    const currentDifficulty = els.difficulty.value;
    personalBest = safeGetPersonalBest(currentDifficulty);
    els.personalBest.textContent = Number.isFinite(personalBest) ? `${personalBest} ms` : "—";
  }

  function updateResults() {
    els.reactionTime.textContent = Number.isFinite(latestReaction) ? `${latestReaction} ms` : "—";
    els.sessionBest.textContent = Number.isFinite(sessionBest) ? `${sessionBest} ms` : "—";
    els.streakAttempts.textContent = `${streak} / ${attempts}`;

    if (els.mode.value === "best5") {
      const average = bestOfFiveRuns.length
        ? Math.round(bestOfFiveRuns.reduce((sum, ms) => sum + ms, 0) / bestOfFiveRuns.length)
        : null;
      const best = bestOfFiveRuns.length ? Math.min(...bestOfFiveRuns) : null;
      els.seriesSummary.textContent = `Best of 5: ${bestOfFiveAttempts}/5 attempts • Valid runs: ${bestOfFiveRuns.length} • Avg: ${average ? `${average} ms` : "—"} • Best: ${best ? `${best} ms` : "—"}`;
    } else {
      els.seriesSummary.textContent = "Single Run mode: your latest run appears above.";
    }
  }

  function randomDelayForDifficulty() {
    const range = DIFFICULTY_WINDOWS[els.difficulty.value] || DIFFICULTY_WINDOWS.normal;
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  function beginCountdown() {
    if (state !== STATES.ARMED) {
      return;
    }
    setState(STATES.COUNTDOWN);
    setStatus("WAIT…");
    resetLights();
    setLight("pre", true);
    setLight("stage", true);

    timers.push(window.setTimeout(() => setLight("amber1", true), 350));
    timers.push(window.setTimeout(() => setLight("amber2", true), 700));
    timers.push(window.setTimeout(() => setLight("amber3", true), 1050));

    const finalDelay = 1200 + randomDelayForDifficulty();
    timers.push(window.setTimeout(() => {
      if (state !== STATES.COUNTDOWN) {
        return;
      }
      setLight("amber1", false);
      setLight("amber2", false);
      setLight("amber3", false);
      setLight("green", true);
      greenTimestamp = performance.now();
      setState(STATES.GO);
      setStatus("GO!");
    }, finalDelay));
  }

  function completeFalseStart() {
    clearTimers();
    resetLights();
    setLight("red", true);
    setState(STATES.FALSE_START);
    setStatus("FALSE START");
    latestReaction = null;
    attempts += 1;
    streak = 0;

    if (els.mode.value === "best5") {
      bestOfFiveAttempts += 1;
    }

    updateResults();
    setButtonLabels();
  }

  function completeRun(reactionMs) {
    clearTimers();
    setState(STATES.RESULT);
    latestReaction = reactionMs;
    attempts += 1;
    streak += 1;

    sessionBest = Number.isFinite(sessionBest) ? Math.min(sessionBest, reactionMs) : reactionMs;

    const currentDifficulty = els.difficulty.value;
    const pb = safeGetPersonalBest(currentDifficulty);
    if (!Number.isFinite(pb) || reactionMs < pb) {
      safeSetPersonalBest(currentDifficulty, reactionMs);
    }

    if (els.mode.value === "best5") {
      bestOfFiveAttempts += 1;
      bestOfFiveRuns.push(reactionMs);
      if (bestOfFiveAttempts >= 5) {
        setStatus("Series complete. Review your average and best time.");
      } else {
        setStatus(`Run ${bestOfFiveAttempts}/5 complete. Ready for next run.`);
      }
    } else {
      setStatus(`Reaction: ${reactionMs} ms`);
    }

    updatePersonalBestLabel();
    updateResults();
    setButtonLabels();
  }

  function handlePress() {
    if (state === STATES.ARMED || state === STATES.COUNTDOWN) {
      completeFalseStart();
      return;
    }

    if (state === STATES.GO) {
      const reactionMs = Math.max(0, Math.round(performance.now() - greenTimestamp));
      completeRun(reactionMs);
    }
  }

  function startRun() {
    if (els.mode.value === "best5" && bestOfFiveAttempts >= 5) {
      return;
    }

    clearTimers();
    resetLights();
    latestReaction = null;
    setState(STATES.ARMED);
    setStatus("WAIT…");
    updateResults();

    timers.push(window.setTimeout(beginCountdown, 220));
  }

  function fullReset() {
    clearTimers();
    setState(STATES.IDLE);
    resetLights();
    latestReaction = null;
    attempts = 0;
    streak = 0;
    sessionBest = null;
    bestOfFiveRuns = [];
    bestOfFiveAttempts = 0;
    setStatus("Press Start to arm the tree.");
    updatePersonalBestLabel();
    updateResults();
    setButtonLabels();
  }

  function shareResult() {
    const difficultyLabel = els.difficulty.options[els.difficulty.selectedIndex].text;
    const modeLabel = els.mode.options[els.mode.selectedIndex].text;
    const reactionText = Number.isFinite(latestReaction) ? `${latestReaction}ms` : "false start";
    const text = `I played Reaction Drag Strip on Teach Arcade: ${reactionText} (${difficultyLabel}, ${modeLabel}). Test your timing: https://teacharcade.com/brain-arcade/reaction-drag-strip/`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => setStatus("Result copied to clipboard."))
        .catch(() => setStatus("Copy failed. You can copy manually."));
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    setStatus("Result copied to clipboard.");
  }

  els.startBtn.addEventListener("click", startRun);
  els.restartBtn.addEventListener("click", fullReset);
  els.shareBtn.addEventListener("click", shareResult);
  els.pressZone.addEventListener("click", handlePress);

  els.mode.addEventListener("change", () => {
    bestOfFiveRuns = [];
    bestOfFiveAttempts = 0;
    latestReaction = null;
    updateResults();
    setButtonLabels();
    setStatus("Mode updated. Press Start to arm the tree.");
  });

  els.difficulty.addEventListener("change", () => {
    updatePersonalBestLabel();
    setStatus("Difficulty updated. Press Start to arm the tree.");
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      handlePress();
    }
  });

  fullReset();
})();
