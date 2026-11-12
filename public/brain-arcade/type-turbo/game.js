(() => {
  const { STATES, MODE_CONFIG, create } = window.TypeTurboEngine;
  const els = {
    difficulty: document.getElementById('difficultySelect'),
    mode: document.getElementById('modeSelect'),
    start: document.getElementById('startBtn'),
    pbSummary: document.getElementById('pbSummary'),
    pause: document.getElementById('pauseBtn'),
    restart: document.getElementById('restartBtn'),
    timer: document.getElementById('timerDisplay'),
    lives: document.getElementById('livesDisplay'),
    wpm: document.getElementById('wpmDisplay'),
    accuracy: document.getElementById('accuracyDisplay'),
    combo: document.getElementById('comboDisplay'),
    score: document.getElementById('scoreDisplay'),
    round: document.getElementById('roundDisplay'),
    target: document.getElementById('targetText'),
    input: document.getElementById('typingInput'),
    feedback: document.getElementById('feedbackLine'),
    track: document.getElementById('raceCanvas'),
    trackWrap: document.getElementById('trackWrap'),
    trackStatus: document.getElementById('trackStatus'),
    results: document.getElementById('resultsPanel'),
    finalScore: document.getElementById('finalScore'),
    finalWpm: document.getElementById('finalWpm'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalWords: document.getElementById('finalWords'),
    finalStreak: document.getElementById('finalStreak'),
    finalGrade: document.getElementById('finalGrade'),
    playAgain: document.getElementById('playAgainBtn'),
    copy: document.getElementById('copyResultBtn')
  };
  const ctx = els.track.getContext('2d');
  const engine = create({ wordlists: window.TYPE_TURBO_WORDLISTS || {}, onEvent: handleEvent });
  let latestStats = null;
  let currentTarget = '';
  let animationFrame = 0;
  let lastFrame = 0;
  let scroll = 0;
  let celebration = 0;
  let errorPulse = 0;
  let inputErrorCount = 0;
  let active = false;

  function setFeedback(message, kind = '') {
    els.feedback.textContent = message;
    els.feedback.className = `feedback ${kind}`.trim();
  }

  function setTarget(text) {
    currentTarget = text || '';
    els.target.replaceChildren();
    [...currentTarget].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00a0' : char;
      if (index < els.input.value.length) {
        span.className = els.input.value[index] === char ? 'typed' : 'typed-wrong';
      }
      els.target.appendChild(span);
    });
    els.input.value = '';
    els.input.maxLength = currentTarget.length;
    inputErrorCount = 0;
    updateRoundLabel();
    if (active) requestAnimationFrame(() => els.input.focus());
  }

  function paintTyped(value) {
    const spans = els.target.querySelectorAll('span');
    spans.forEach((span, index) => {
      span.className = index < value.length
        ? value[index] === currentTarget[index] ? 'typed' : 'typed-wrong'
        : '';
    });
  }

  function updateRoundLabel() {
    const mode = els.mode.value;
    if (mode === 'accuracy') {
      els.round.textContent = `${latestStats?.completedItems || 0}/50`;
    } else {
      els.round.textContent = String((latestStats?.correctItems || 0) + 1);
    }
  }

  function handleEvent(name, payload = {}) {
    if (name === 'onStart') {
      active = true;
      latestStats = null;
      els.results.hidden = true;
      els.mode.disabled = true;
      els.difficulty.disabled = true;
      els.start.disabled = true;
      els.pause.disabled = false;
      els.pause.textContent = 'Pause';
      els.trackWrap.classList.add('is-racing');
      els.trackStatus.textContent = 'RACE IN PROGRESS';
      setFeedback('Find your rhythm. Clean words build your combo.', 'ok');
      scroll = 0;
      celebration = 0;
      inputErrorCount = 0;
      setTimeout(() => els.input.focus(), 40);
    }
    if (name === 'onPause') {
      active = false;
      els.pause.textContent = 'Resume';
      setFeedback('Paused. Take a breath, then keep going.');
    }
    if (name === 'onResume') {
      active = true;
      els.pause.textContent = 'Pause';
      setFeedback('Back on track.', 'ok');
      els.input.focus();
    }
    if (name === 'onTargetNew') setTarget(payload.targetText);
    if (name === 'onInputChange') paintTyped(payload.value || '');
    if (name === 'onInputError') {
      inputErrorCount += 1;
      errorPulse = 1;
      els.trackWrap.classList.add('has-error');
      setFeedback('Typo spotted — backspace to fix it. Your run keeps going.', 'warn');
      setTimeout(() => els.trackWrap.classList.remove('has-error'), 260);
    }
    if (name === 'onCorrect') {
      celebration = 1;
      setFeedback(payload.clean
        ? `Clean run! +${payload.points} points${payload.combo > 1 ? ` · ${payload.combo}× combo` : ''}`
        : `Word cleared! +${payload.points} points`, 'ok');
    }
    if (name === 'onTimeout') {
      errorPulse = 1;
      setFeedback('Time ran out. Reset, then chase the next word.', 'warn');
    }
    if (name === 'onStatsUpdate') {
      latestStats = payload;
      updateHud(payload);
    }
    if (name === 'onEnd') {
      active = false;
      els.mode.disabled = false;
      els.difficulty.disabled = false;
      els.start.disabled = false;
      els.pause.disabled = true;
      els.pause.textContent = 'Pause';
      els.trackWrap.classList.remove('is-racing');
      els.trackStatus.textContent = 'FINISH LINE';
      setFeedback(payload.reason || 'Run complete', 'ok');
      showResults(payload.stats || latestStats || {});
    }
  }

  function updateHud(stats) {
    const mode = stats.mode || els.mode.value;
    els.timer.textContent = mode === 'sprint'
      ? `${Math.ceil((stats.remainingMs || 0) / 1000)}s`
      : mode === 'survival'
        ? 'SURVIVE'
        : mode === 'accuracy'
          ? `${stats.completedItems}/50`
          : '∞';
    els.lives.textContent = stats.lives == null ? '—' : '♥'.repeat(Math.max(0, stats.lives));
    els.wpm.textContent = String(Math.round(stats.wpm || 0));
    els.accuracy.textContent = `${Math.round(stats.accuracy || 0)}%`;
    els.combo.textContent = `${stats.combo || 0}×`;
    els.score.textContent = (stats.score || 0).toLocaleString();
    updateRoundLabel();
    if (mode === 'survival' && Number.isFinite(stats.targetDeadline) && active) {
      const ratio = Math.max(0, Math.min(1, (stats.targetDeadline - performance.now()) / 12000));
      els.trackWrap.style.setProperty('--pressure', String(ratio));
    } else {
      els.trackWrap.style.setProperty('--pressure', '1');
    }
  }

  function getPbKey() { return `typeTurboPB:${els.mode.value}:${els.difficulty.value}`; }

  function loadPb() {
    try { return JSON.parse(localStorage.getItem(getPbKey())) || { score: 0, wpm: 0, accuracy: 0 }; }
    catch { return { score: 0, wpm: 0, accuracy: 0 }; }
  }

  function savePb(value) {
    try { localStorage.setItem(getPbKey(), JSON.stringify(value)); } catch {}
  }

  function showResults(stats) {
    const accuracy = Math.round(stats.accuracy || 0);
    const pb = loadPb();
    const best = {
      score: Math.max(pb.score || 0, stats.score || 0),
      wpm: Math.max(pb.wpm || 0, Math.round(stats.wpm || 0)),
      accuracy: Math.max(pb.accuracy || 0, accuracy)
    };
    savePb(best);
    els.pbSummary.textContent = `Personal best · ${best.score.toLocaleString()} points · ${best.wpm} WPM · ${best.accuracy}% accuracy`;
    els.finalScore.textContent = (stats.score || 0).toLocaleString();
    els.finalWpm.textContent = String(Math.round(stats.wpm || 0));
    els.finalAccuracy.textContent = `${accuracy}%`;
    els.finalWords.textContent = String(stats.correctItems || 0);
    els.finalStreak.textContent = String(stats.bestCombo || 0);
    els.finalGrade.textContent = stats.mode === 'accuracy'
      ? accuracy >= 98 ? 'S' : accuracy >= 92 ? 'A' : accuracy >= 82 ? 'B' : accuracy >= 70 ? 'C' : 'D'
      : stats.score >= 4000 ? 'S' : stats.score >= 2500 ? 'A' : stats.score >= 1400 ? 'B' : stats.score >= 700 ? 'C' : 'D';
    els.results.hidden = false;
  }

  function start() { engine.start({ mode: els.mode.value, difficulty: els.difficulty.value }); }
  function togglePause() {
    if (engine.getState() === STATES.RUNNING) engine.pause();
    else if (engine.getState() === STATES.PAUSED) engine.resume();
  }
  function reset() {
    engine.restart();
    active = false;
    latestStats = { mode: els.mode.value, remainingMs: MODE_CONFIG[els.mode.value].timeLimitMs, lives: MODE_CONFIG[els.mode.value].lives, score: 0, wpm: 0, accuracy: 100, combo: 0, completedItems: 0, correctItems: 0 };
    els.mode.disabled = false;
    els.difficulty.disabled = false;
    els.start.disabled = false;
    els.pause.disabled = true;
    els.pause.textContent = 'Pause';
    els.trackWrap.classList.remove('is-racing', 'has-error');
    els.trackStatus.textContent = 'READY TO RACE';
    els.trackWrap.style.setProperty('--pressure', '1');
    els.results.hidden = true;
    setTarget('Press start to race');
    els.input.value = '';
    els.input.disabled = true;
    setFeedback('Type each word to launch forward. Fix typos with backspace.');
    updateHud(latestStats);
    scroll = 0;
    drawTrack(0, 0);
  }

  function copyResult() {
    const stats = latestStats || {};
    const line = `Type Turbo ${MODE_CONFIG[els.mode.value].label} · ${els.difficulty.value.toUpperCase()} · ${stats.score || 0} points · ${Math.round(stats.wpm || 0)} WPM · ${Math.round(stats.accuracy || 0)}% accuracy`;
    navigator.clipboard.writeText(line)
      .then(() => setFeedback('Result copied.', 'ok'))
      .catch(() => setFeedback('Copy is unavailable on this device.', 'warn'));
  }

  function fitCanvas() {
    const rect = els.track.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.track.width = Math.max(1, Math.round(rect.width * dpr));
    els.track.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTrack(0, 0);
  }

  function drawTrack(delta, now) {
    const width = els.track.clientWidth;
    const height = els.track.clientHeight;
    if (!width || !height) return;
    scroll += delta * (active ? 0.15 + Math.min((latestStats?.wpm || 0) / 320, 0.2) : 0.025);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#07142d');
    gradient.addColorStop(.58, '#132a4e');
    gradient.addColorStop(1, '#07101f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 32; i += 1) {
      const x = (i * 89 + 21) % width;
      const y = (i * 53 + (scroll * (0.35 + (i % 4) * 0.12)) % (height + 20)) % height;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(52,211,255,.75)' : 'rgba(216,234,255,.45)';
      ctx.fillRect(x, y, i % 5 === 0 ? 3 : 1.5, i % 5 === 0 ? 3 : 1.5);
    }

    const trackWidth = Math.min(width * .72, 480);
    const left = (width - trackWidth) / 2;
    ctx.fillStyle = '#131c30';
    ctx.beginPath();
    ctx.moveTo(left + 22, 0);
    ctx.lineTo(left + trackWidth - 22, 0);
    ctx.lineTo(left + trackWidth, height);
    ctx.lineTo(left, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(54,222,255,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left + 24, 0); ctx.lineTo(left + 2, height);
    ctx.moveTo(left + trackWidth - 24, 0); ctx.lineTo(left + trackWidth - 2, height);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232,247,255,.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 22]);
    ctx.lineDashOffset = -(scroll % 46);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Horizon glow and side scenery keep the course lively on small screens.
    ctx.fillStyle = 'rgba(35,213,255,.07)';
    ctx.fillRect(left, height * .18, trackWidth, 2);
    for (let side = 0; side < 2; side += 1) {
      const sx = side ? left + trackWidth + 18 : left - 42;
      for (let j = 0; j < 4; j += 1) {
        const y = ((j * 86 + scroll * .55) % (height + 70)) - 35;
        ctx.fillStyle = j % 2 ? 'rgba(45,120,190,.13)' : 'rgba(79,229,255,.12)';
        ctx.fillRect(sx, y, 22, 26);
      }
    }

    const carX = width / 2 + Math.sin(now / 650) * (active ? 3 : 0);
    const carY = height * .68;
    const boost = active && (latestStats?.combo || 0) >= 3;
    ctx.save();
    if (active && latestStats?.wpm > 20) {
      ctx.strokeStyle = boost ? 'rgba(255,191,71,.7)' : 'rgba(69,220,255,.48)';
      ctx.lineWidth = 2;
      for (let n = 0; n < (boost ? 7 : 4); n += 1) {
        const trailY = carY + 27 + ((n * 13 + scroll * 1.7) % 42);
        ctx.beginPath();
        ctx.moveTo(carX - 11 + n * 3.6, trailY);
        ctx.lineTo(carX - 11 + n * 3.6, trailY + 8 + n * 1.5);
        ctx.stroke();
      }
    }
    ctx.shadowColor = boost ? '#ffc857' : '#30d7ff';
    ctx.shadowBlur = active ? (boost ? 28 : 18) : 10;
    ctx.fillStyle = boost ? '#ffc857' : '#35d8ff';
    ctx.beginPath();
    ctx.moveTo(carX, carY - 27);
    ctx.lineTo(carX + 22, carY + 15);
    ctx.lineTo(carX + 14, carY + 25);
    ctx.lineTo(carX - 14, carY + 25);
    ctx.lineTo(carX - 22, carY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e9fbff';
    ctx.beginPath();
    ctx.moveTo(carX, carY - 18);
    ctx.lineTo(carX + 8, carY + 4);
    ctx.lineTo(carX - 8, carY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10233e';
    ctx.fillRect(carX - 19, carY + 10, 6, 13);
    ctx.fillRect(carX + 13, carY + 10, 6, 13);
    ctx.restore();

    if (celebration > 0.01) {
      ctx.globalAlpha = celebration;
      ctx.strokeStyle = boost ? '#ffd166' : '#48e7ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(carX, carY, 34 + (1 - celebration) * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      celebration *= .89;
    }
    if (errorPulse > 0.01) {
      ctx.globalAlpha = errorPulse * .55;
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      errorPulse *= .83;
    }
  }

  function animate(now = 0) {
    const delta = Math.min(now - lastFrame, 40);
    lastFrame = now;
    drawTrack(delta, now);
    animationFrame = requestAnimationFrame(animate);
  }

  els.start.addEventListener('click', start);
  els.pause.addEventListener('click', togglePause);
  els.restart.addEventListener('click', reset);
  els.playAgain.addEventListener('click', start);
  els.copy.addEventListener('click', copyResult);
  els.input.addEventListener('input', () => engine.submitInput(els.input.value));
  els.mode.addEventListener('change', reset);
  els.difficulty.addEventListener('change', reset);
  window.addEventListener('resize', fitCanvas);
  els.input.disabled = true;

  // Input is enabled on start and frozen while a round is paused/finished.
  const originalHandle = engine.onEvent;
  engine.onEvent = (name, payload) => {
    originalHandle(name, payload);
    if (name === 'onStart' || name === 'onResume') els.input.disabled = false;
    if (name === 'onPause' || name === 'onEnd') els.input.disabled = true;
  };

  fitCanvas();
  reset();
  animationFrame = requestAnimationFrame(animate);
})();
