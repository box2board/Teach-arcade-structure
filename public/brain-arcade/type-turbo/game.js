(() => {
  const { STATES, MODE_CONFIG, create } = window.TypeTurboEngine;

  const els = {
    difficulty: document.getElementById('difficultySelect'),
    mode: document.getElementById('modeSelect'),
    visualMode: document.getElementById('visualModeSelect'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    restartBtn: document.getElementById('restartBtn'),
    timer: document.getElementById('timerDisplay'),
    lives: document.getElementById('livesDisplay'),
    wpm: document.getElementById('wpmDisplay'),
    accuracy: document.getElementById('accuracyDisplay'),
    combo: document.getElementById('comboDisplay'),
    streak: document.getElementById('streakDisplay'),
    target: document.getElementById('targetText'),
    targetWrap: document.getElementById('targetWrap'),
    input: document.getElementById('typingInput'),
    feedback: document.getElementById('feedbackLine'),
    results: document.getElementById('resultsPanel'),
    finalWpm: document.getElementById('finalWpm'),
    finalAcc: document.getElementById('finalAccuracy'),
    finalCorrect: document.getElementById('finalCorrect'),
    finalStreak: document.getElementById('finalStreak'),
    pbStats: document.getElementById('pbStats'),
    copyBtn: document.getElementById('copyResultBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    visualPanel: document.getElementById('visualModePanel')
  };

  const WORDS = window.TYPE_TURBO_WORDLISTS || {};

  const MODE_MAP = {
    rocket: window.TypeTurboModes?.Rocket,
    city: window.TypeTurboModes?.City
  };

  const engine = create({
    wordlists: WORDS,
    onEvent: handleEngineEvent
  });

  let activeVisual = null;
  let latestStats = null;

  function setFeedback(msg, kind = '') {
    els.feedback.textContent = msg;
    els.feedback.className = `feedback ${kind}`.trim();
  }

  function focusInput() {
    requestAnimationFrame(() => els.input.focus());
  }

  function canChangeVisualMode() {
    const state = engine.getState();
    return state === STATES.IDLE || state === STATES.ENDED;
  }

  function setVisualMode(modeName) {
    if (!canChangeVisualMode()) {
      els.visualMode.value = activeVisual?.name || 'rocket';
      setFeedback('Finish or restart the run before switching visual mode.', 'bad');
      return;
    }

    if (activeVisual?.instance?.destroy) activeVisual.instance.destroy();
    const Mode = MODE_MAP[modeName] || MODE_MAP.rocket;
    const instance = Object.create(Mode);
    instance.init(els.visualPanel);
    activeVisual = { name: modeName, instance };
    setFeedback(`${modeName === 'city' ? 'City Builder' : 'Rocket Launch'} mode ready.`, 'ok');
  }

  function handleEngineEvent(eventName, payload = {}) {
    if (eventName === 'onStart') {
      els.results.hidden = true;
      els.pauseBtn.textContent = 'Pause';
      setFeedback('Go!', 'ok');
      els.visualMode.disabled = true;
      activeVisual.instance.reset();
      focusInput();
    }

    if (eventName === 'onPause') {
      els.pauseBtn.textContent = 'Resume';
      setFeedback('Paused. Press resume to continue.');
    }

    if (eventName === 'onResume') {
      els.pauseBtn.textContent = 'Pause';
      setFeedback('Resumed.', 'ok');
      focusInput();
    }

    if (eventName === 'onTargetNew') {
      els.target.textContent = payload.targetText;
      els.input.value = '';
      els.targetWrap.classList.remove('shake', 'flash');
      focusInput();
    }

    if (eventName === 'onCorrect') {
      els.targetWrap.classList.add('flash');
      setTimeout(() => els.targetWrap.classList.remove('flash'), 220);
      setFeedback('Correct', 'ok');
    }

    if (eventName === 'onMistake') {
      els.targetWrap.classList.add('shake');
      setTimeout(() => els.targetWrap.classList.remove('shake'), 240);
      setFeedback(payload.reason || 'Mistake', 'bad');
    }

    if (eventName === 'onTimeout') {
      els.targetWrap.classList.add('shake');
      setTimeout(() => els.targetWrap.classList.remove('shake'), 240);
      setFeedback('Too slow', 'bad');
    }

    if (eventName === 'onStatsUpdate') {
      latestStats = payload;
      updateHud(payload);
    }

    if (eventName === 'onEnd') {
      els.pauseBtn.textContent = 'Pause';
      els.visualMode.disabled = false;
      setFeedback(payload.reason || 'Run ended', latestStats?.correctItems >= latestStats?.missedItems ? 'ok' : 'bad');
      renderResults();
    }

    if (activeVisual?.instance?.handleEvent) {
      activeVisual.instance.handleEvent(eventName, payload);
    }
  }

  function updateHud(stats) {
    const mode = stats.mode || els.mode.value;
    const timerText = mode === 'accuracy'
      ? `${stats.completedItems}/${MODE_CONFIG.accuracy.targetItems}`
      : mode === 'endless'
        ? '—'
        : stats.remainingMs != null
          ? `${(stats.remainingMs / 1000).toFixed(1)}s`
          : '∞';

    els.timer.textContent = timerText;
    els.lives.textContent = stats.lives == null ? '∞' : String(stats.lives);
    els.wpm.textContent = String(Math.round(stats.wpm || 0));
    els.accuracy.textContent = `${Math.round(stats.accuracy || 0)}%`;
    els.combo.textContent = String(stats.combo || 0);
    els.streak.textContent = String(stats.streak || 0);
  }

  function getPBKey() {
    const visual = els.visualMode.value;
    return `typeTurboPB:${visual}:${els.mode.value}:${els.difficulty.value}`;
  }

  function loadPb() {
    try {
      return JSON.parse(localStorage.getItem(getPBKey())) || { bestWPM: 0, bestAccuracy: 0, bestStreak: 0 };
    } catch {
      return { bestWPM: 0, bestAccuracy: 0, bestStreak: 0 };
    }
  }

  function savePb(next) {
    try {
      localStorage.setItem(getPBKey(), JSON.stringify(next));
    } catch {
      // graceful no-op
    }
  }

  function renderResults() {
    const stats = latestStats || {};
    const wpm = Math.round(stats.wpm || 0);
    const acc = Math.round(stats.accuracy || 0);
    const pb = loadPb();
    const merged = {
      bestWPM: Math.max(pb.bestWPM || 0, wpm),
      bestAccuracy: Math.max(pb.bestAccuracy || 0, acc),
      bestStreak: Math.max(pb.bestStreak || 0, stats.streak || 0)
    };
    savePb(merged);

    els.finalWpm.textContent = String(wpm);
    els.finalAcc.textContent = `${acc}%`;
    els.finalCorrect.textContent = String(stats.correctItems || 0);
    els.finalStreak.textContent = String(stats.streak || 0);
    els.pbStats.textContent = `WPM ${merged.bestWPM} • Acc ${merged.bestAccuracy}% • Streak ${merged.bestStreak}`;
    els.results.hidden = false;
  }

  function startGame() {
    engine.start({ mode: els.mode.value, difficulty: els.difficulty.value });
  }

  function togglePause() {
    const state = engine.getState();
    if (state === STATES.RUNNING) {
      engine.pause();
    } else if (state === STATES.PAUSED) {
      engine.resume();
    }
  }

  function restartGame() {
    engine.restart();
    latestStats = {
      mode: els.mode.value,
      remainingMs: MODE_CONFIG[els.mode.value].timeLimitMs,
      lives: MODE_CONFIG[els.mode.value].lives,
      wpm: 0,
      accuracy: 100,
      combo: 0,
      streak: 0,
      completedItems: 0
    };
    updateHud(latestStats);
    els.target.textContent = 'Press Start to begin.';
    els.input.value = '';
    els.results.hidden = true;
    els.pauseBtn.textContent = 'Pause';
    els.visualMode.disabled = false;
    activeVisual.instance.reset();
    setFeedback('Ready.');
    focusInput();
  }

  function copyResult() {
    if (!latestStats) return;
    const modeLabel = MODE_CONFIG[els.mode.value].label;
    const visualLabel = els.visualMode.value === 'city' ? 'City Builder' : 'Rocket Launch';
    const resultText = `Type Turbo — ${modeLabel}/${els.difficulty.value.toUpperCase()}/${visualLabel} | WPM ${els.finalWpm.textContent} | Accuracy ${els.finalAcc.textContent} | Correct ${els.finalCorrect.textContent} | Best streak ${els.finalStreak.textContent}`;
    navigator.clipboard.writeText(resultText)
      .then(() => setFeedback('Result copied!', 'ok'))
      .catch(() => setFeedback('Copy unavailable on this device', 'bad'));
  }

  els.startBtn.addEventListener('click', () => {
    const state = engine.getState();
    if (state === STATES.RUNNING) return;
    startGame();
  });
  els.pauseBtn.addEventListener('click', togglePause);
  els.restartBtn.addEventListener('click', restartGame);
  els.playAgainBtn.addEventListener('click', startGame);
  els.copyBtn.addEventListener('click', copyResult);

  els.visualMode.addEventListener('change', () => setVisualMode(els.visualMode.value));

  els.mode.addEventListener('change', () => {
    if (engine.getState() === STATES.RUNNING || engine.getState() === STATES.PAUSED) return;
    restartGame();
  });

  els.input.addEventListener('input', () => {
    engine.submitInput(els.input.value);
  });

  els.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      engine.submitInput(els.input.value);
    }
  });

  setVisualMode('rocket');
  restartGame();
})();
