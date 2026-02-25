(() => {
  const STATES = { IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', ENDED: 'ENDED' };
  const MODE_CONFIG = {
    sprint: { label: 'Sprint', timeLimitMs: 60000, lives: null, targetItems: null },
    endless: { label: 'Endless', timeLimitMs: null, lives: 5, targetItems: null },
    accuracy: { label: 'Accuracy', timeLimitMs: null, lives: null, targetItems: 50 },
    zen: { label: 'Zen', timeLimitMs: null, lives: null, targetItems: null }
  };
  const DIFFICULTY_WINDOWS = {
    easy: [4000, 6000],
    normal: [3000, 5000],
    hard: [2000, 4000],
    pro: [1000, 3000]
  };

  const els = {
    difficulty: document.getElementById('difficultySelect'),
    mode: document.getElementById('modeSelect'),
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
    playAgainBtn: document.getElementById('playAgainBtn')
  };

  const WORDS = window.TYPE_TURBO_WORDLISTS || {};

  let state = STATES.IDLE;
  let run = {};

  function resetRun() {
    const mode = els.mode.value;
    run = {
      mode,
      difficulty: els.difficulty.value,
      startTs: 0,
      elapsedMs: 0,
      lastTick: 0,
      lastWord: '',
      target: '',
      targetDeadline: 0,
      timeoutCount: 0,
      correctItems: 0,
      missedItems: 0,
      totalChars: 0,
      correctChars: 0,
      combo: 0,
      streak: 0,
      bestStreak: 0,
      lives: MODE_CONFIG[mode].lives,
      remainingMs: MODE_CONFIG[mode].timeLimitMs,
      completedItems: 0,
      rafId: 0,
      pauseStartedAt: 0
    };
  }

  function getPool() {
    const d = run.difficulty;
    const byD = {
      easy: WORDS.EASY_WORDS || [],
      normal: WORDS.NORMAL_WORDS || [],
      hard: WORDS.HARD_WORDS || [],
      pro: WORDS.PRO_WORDS || []
    };
    const pool = [...byD[d]];
    if ((d === 'hard' || d === 'pro') && Math.random() < 0.3) {
      pool.push(...(WORDS.PHRASES || []));
    }
    return pool;
  }

  function pickNextTarget() {
    const pool = getPool();
    if (!pool.length) return 'type';
    let next = pool[Math.floor(Math.random() * pool.length)];
    let guard = 0;
    while (next === run.lastWord && guard < 8) {
      next = pool[Math.floor(Math.random() * pool.length)];
      guard += 1;
    }
    run.lastWord = next;
    run.target = next;
    const [minMs, maxMs] = DIFFICULTY_WINDOWS[run.difficulty] || [3000, 5000];
    run.targetDeadline = performance.now() + Math.floor(minMs + Math.random() * (maxMs - minMs));
    els.target.textContent = next;
    els.input.value = '';
    focusInput();
  }

  function focusInput() {
    requestAnimationFrame(() => els.input.focus());
  }

  function setFeedback(msg, kind = '') {
    els.feedback.textContent = msg;
    els.feedback.className = `feedback ${kind}`.trim();
  }

  function startGame() {
    resetRun();
    state = STATES.RUNNING;
    run.startTs = performance.now();
    run.lastTick = run.startTs;
    els.results.hidden = true;
    pickNextTarget();
    setFeedback('Go!', 'ok');
    updateHud();
    runLoop();
  }

  function restartGame() {
    cancelAnimationFrame(run.rafId || 0);
    resetRun();
    state = STATES.IDLE;
    els.target.textContent = 'Press Start to begin.';
    els.input.value = '';
    setFeedback('Ready.');
    els.results.hidden = true;
    updateHud();
    focusInput();
  }

  function togglePause() {
    if (state === STATES.RUNNING) {
      state = STATES.PAUSED;
      run.pauseStartedAt = performance.now();
      cancelAnimationFrame(run.rafId);
      setFeedback('Paused');
      els.pauseBtn.textContent = 'Resume';
    } else if (state === STATES.PAUSED) {
      const pausedMs = performance.now() - run.pauseStartedAt;
      run.startTs += pausedMs;
      if (run.remainingMs != null) run.remainingMs += pausedMs;
      run.targetDeadline += pausedMs;
      state = STATES.RUNNING;
      els.pauseBtn.textContent = 'Pause';
      setFeedback('Resumed', 'ok');
      runLoop();
      focusInput();
    }
  }

  function markMistake(reason = 'Mistake') {
    run.combo = 0;
    run.missedItems += 1;
    els.targetWrap.classList.remove('flash');
    els.targetWrap.classList.add('shake');
    setTimeout(() => els.targetWrap.classList.remove('shake'), 260);
    setFeedback(reason, 'bad');
    if (run.mode === 'endless') {
      run.lives -= 1;
      if (run.lives <= 0) {
        endGame('Out of lives');
        return;
      }
    }
    run.completedItems += 1;
    advanceOrEnd();
  }

  function markCorrect() {
    run.correctItems += 1;
    run.combo += 1;
    run.streak += 1;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.completedItems += 1;
    els.targetWrap.classList.remove('shake');
    els.targetWrap.classList.add('flash');
    setTimeout(() => els.targetWrap.classList.remove('flash'), 240);
    setFeedback('Correct', 'ok');
    advanceOrEnd();
  }

  function advanceOrEnd() {
    if (run.mode === 'accuracy' && run.completedItems >= MODE_CONFIG.accuracy.targetItems) {
      endGame('Accuracy set complete');
      return;
    }
    if (state === STATES.RUNNING) {
      pickNextTarget();
      updateHud();
    }
  }

  function runLoop(now = performance.now()) {
    if (state !== STATES.RUNNING) return;

    if (run.remainingMs != null) {
      const elapsed = now - run.lastTick;
      run.remainingMs = Math.max(0, run.remainingMs - elapsed);
      if (run.remainingMs <= 0) {
        endGame('Time up');
        return;
      }
    }

    if (now >= run.targetDeadline) {
      run.timeoutCount += 1;
      run.streak = 0;
      markMistake('Too slow');
    }

    run.lastTick = now;
    updateHud();
    run.rafId = requestAnimationFrame(runLoop);
  }

  function computeWpm() {
    const mins = Math.max((performance.now() - run.startTs) / 60000, 1 / 60000);
    return ((run.correctChars / 5) / mins) || 0;
  }

  function computeAccuracy() {
    return run.totalChars > 0 ? (run.correctChars / run.totalChars) * 100 : 100;
  }

  function updateHud() {
    const wpm = computeWpm();
    const acc = computeAccuracy();
    const timerText = run.mode === 'accuracy'
      ? `${run.completedItems}/${MODE_CONFIG.accuracy.targetItems}`
      : run.mode === 'endless'
        ? '—'
        : run.remainingMs != null
          ? `${(run.remainingMs / 1000).toFixed(1)}s`
          : '∞';

    els.timer.textContent = timerText;
    els.lives.textContent = run.lives == null ? '∞' : String(run.lives);
    els.wpm.textContent = Math.round(wpm);
    els.accuracy.textContent = `${Math.round(acc)}%`;
    els.combo.textContent = String(run.combo);
    els.streak.textContent = String(run.bestStreak);
  }

  function endGame(reason = 'Run ended') {
    state = STATES.ENDED;
    cancelAnimationFrame(run.rafId);
    els.pauseBtn.textContent = 'Pause';
    setFeedback(reason, run.correctItems >= run.missedItems ? 'ok' : 'bad');
    renderResults();
  }

  function getPBKey() {
    return `typeTurboPB:${run.mode}:${run.difficulty}`;
  }

  function loadPb() {
    try {
      return JSON.parse(localStorage.getItem(getPBKey())) || { wpm: 0, accuracy: 0, streak: 0 };
    } catch {
      return { wpm: 0, accuracy: 0, streak: 0 };
    }
  }

  function savePb(next) {
    try {
      localStorage.setItem(getPBKey(), JSON.stringify(next));
    } catch {
      // graceful fail
    }
  }

  function renderResults() {
    const wpm = Math.round(computeWpm());
    const acc = Math.round(computeAccuracy());
    const pb = loadPb();
    const merged = {
      wpm: Math.max(pb.wpm || 0, wpm),
      accuracy: Math.max(pb.accuracy || 0, acc),
      streak: Math.max(pb.streak || 0, run.bestStreak)
    };
    savePb(merged);

    els.finalWpm.textContent = String(wpm);
    els.finalAcc.textContent = `${acc}%`;
    els.finalCorrect.textContent = String(run.correctItems);
    els.finalStreak.textContent = String(run.bestStreak);
    els.pbStats.textContent = `WPM ${merged.wpm} • Acc ${merged.accuracy}% • Streak ${merged.streak}`;
    els.results.hidden = false;
  }

  function copyResult() {
    const resultText = `Type Turbo — ${MODE_CONFIG[run.mode].label}/${run.difficulty.toUpperCase()} | WPM ${els.finalWpm.textContent} | Accuracy ${els.finalAcc.textContent} | Correct ${els.finalCorrect.textContent} | Best streak ${els.finalStreak.textContent}`;
    navigator.clipboard.writeText(resultText)
      .then(() => setFeedback('Result copied!', 'ok'))
      .catch(() => setFeedback('Copy unavailable on this device', 'bad'));
  }

  els.startBtn.addEventListener('click', () => {
    if (state === STATES.RUNNING) return;
    startGame();
  });
  els.pauseBtn.addEventListener('click', togglePause);
  els.restartBtn.addEventListener('click', restartGame);
  els.playAgainBtn.addEventListener('click', startGame);
  els.copyBtn.addEventListener('click', copyResult);

  els.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (state !== STATES.RUNNING) return;
      evaluateInput();
      return;
    }
    if (state === STATES.RUNNING && event.key.length === 1) {
      run.totalChars += 1;
      const nextPos = els.input.value.length;
      if ((run.target[nextPos] || '') === event.key) run.correctChars += 1;
    }
  });

  els.input.addEventListener('input', () => {
    if (state !== STATES.RUNNING) return;
    evaluateInput();
  });

  function evaluateInput() {
    const raw = els.input.value;

    if (raw === run.target) {
      markCorrect();
      return;
    }

    if (!run.target.startsWith(raw) && raw.length > 0) {
      run.streak = 0;
      markMistake('Mistake');
    }
  }

  restartGame();
})();
