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
  let targetWindowMs = null;
  let active = false;

  function setFeedback(message, kind = '') {
    els.feedback.textContent = message;
    els.feedback.className = `feedback ${kind}`.trim();
  }

  function setTarget(text) {
    currentTarget = text || '';
    els.input.value = '';
    els.target.replaceChildren();
    [...currentTarget].forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00a0' : char;
      els.target.appendChild(span);
    });
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
      els.trackStatus.textContent = 'LAUNCH IN PROGRESS';
      setFeedback('Find your rhythm. Clean words charge your thrusters.', 'ok');
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
      setFeedback('Back in orbit.', 'ok');
      els.input.focus();
    }
    if (name === 'onTargetNew') {
      targetWindowMs = payload.timeLimitMs;
      setTarget(payload.targetText);
    }
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
      setFeedback('Word timer expired. Power up for the next word.', 'warn');
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
      els.trackStatus.textContent = 'MISSION COMPLETE';
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
      const ratio = Math.max(0, Math.min(1, (stats.targetDeadline - performance.now()) / (targetWindowMs || 12000)));
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
    setFeedback('Type each word to send your rocket higher. Fix typos with backspace.');
    updateHud(latestStats);
    scroll = 0;
    targetWindowMs = null;
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
    scroll += delta * (active ? 0.12 + Math.min((latestStats?.wpm || 0) / 300, 0.22) : 0.018);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#080b28');
    sky.addColorStop(.48, '#141745');
    sky.addColorStop(1, '#080d24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(width * .76, height * .28, 4, width * .76, height * .28, width * .62);
    nebula.addColorStop(0, 'rgba(105,72,210,.25)');
    nebula.addColorStop(.48, 'rgba(44,105,196,.12)');
    nebula.addColorStop(1, 'rgba(8,13,36,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    // Star layers drift at different speeds to make the rocket feel like it is climbing.
    for (let i = 0; i < 78; i += 1) {
      const x = (i * 97 + 17) % width;
      const speed = .22 + (i % 5) * .16;
      const y = (i * 59 + (scroll * speed) % (height + 12)) % height;
      const size = i % 11 === 0 ? 2.4 : i % 3 === 0 ? 1.5 : 1;
      ctx.fillStyle = i % 8 === 0 ? 'rgba(180,231,255,.9)' : 'rgba(240,243,255,.72)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      if (active && i % 13 === 0) {
        ctx.strokeStyle = 'rgba(120,218,255,.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x, y + 11 + (latestStats?.wpm || 0) * .08);
        ctx.stroke();
      }
    }

    // Distant planet with a luminous rim.
    const planetX = width * .79, planetY = height * .27, planetR = Math.min(width, height) * .13;
    const planet = ctx.createRadialGradient(planetX - planetR * .35, planetY - planetR * .42, 2, planetX, planetY, planetR);
    planet.addColorStop(0, '#d4c8ff');
    planet.addColorStop(.42, '#7669d7');
    planet.addColorStop(1, '#302c78');
    ctx.save();
    ctx.shadowColor = 'rgba(144,130,255,.55)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(186,194,255,.22)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY + 2, planetR * 1.65, planetR * .36, -.18, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // A few distant orbiting rocks give the starfield depth without distracting from typing.
    for (let i = 0; i < 4; i += 1) {
      const x = width * (i % 2 ? .13 : .88) + Math.sin(scroll * .001 + i) * 9;
      const y = (height * (.22 + i * .17) + (scroll * .28) % (height + 40)) % height;
      const radius = 3 + (i % 3) * 1.5;
      ctx.fillStyle = 'rgba(122,151,194,.68)';
      ctx.beginPath();
      ctx.moveTo(x - radius, y - radius * .4);
      ctx.lineTo(x + radius * .7, y - radius);
      ctx.lineTo(x + radius, y + radius * .3);
      ctx.lineTo(x - radius * .5, y + radius);
      ctx.closePath();
      ctx.fill();
    }

    const rocketX = width / 2 + Math.sin(now / 700) * (active ? 3 : 0);
    const rocketY = height * .67;
    const boost = active && (latestStats?.combo || 0) >= 3;
    const flameLength = active ? 22 + Math.sin(now / 48) * 7 + Math.min((latestStats?.wpm || 0) * .14, 18) : 12;
    ctx.save();
    if (active && (latestStats?.wpm || 0) > 8) {
      ctx.strokeStyle = boost ? 'rgba(255,197,92,.72)' : 'rgba(87,221,255,.48)';
      ctx.lineWidth = 2;
      for (let n = 0; n < 5; n += 1) {
        const trailX = rocketX - 10 + n * 5;
        const trailY = rocketY + 30 + ((n * 13 + scroll * 1.4) % 30);
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(trailX, trailY + 8 + n);
        ctx.stroke();
      }
    }

    // Rocket exhaust.
    ctx.shadowColor = boost ? '#ffd166' : '#ff8c5a';
    ctx.shadowBlur = active ? 24 : 10;
    ctx.fillStyle = boost ? '#ffd166' : '#ff9b66';
    ctx.beginPath();
    ctx.moveTo(rocketX - 8, rocketY + 17);
    ctx.lineTo(rocketX, rocketY + 17 + flameLength);
    ctx.lineTo(rocketX + 8, rocketY + 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2a6';
    ctx.beginPath();
    ctx.moveTo(rocketX - 3, rocketY + 18);
    ctx.lineTo(rocketX, rocketY + 18 + flameLength * .62);
    ctx.lineTo(rocketX + 3, rocketY + 18);
    ctx.closePath();
    ctx.fill();

    // Rocket body, nose cone, fins, and cockpit.
    ctx.shadowColor = boost ? '#ffd166' : '#49dcff';
    ctx.shadowBlur = active ? (boost ? 28 : 18) : 12;
    ctx.fillStyle = '#eaf5ff';
    ctx.beginPath();
    ctx.moveTo(rocketX, rocketY - 29);
    ctx.quadraticCurveTo(rocketX + 16, rocketY - 8, rocketX + 13, rocketY + 14);
    ctx.lineTo(rocketX - 13, rocketY + 14);
    ctx.quadraticCurveTo(rocketX - 16, rocketY - 8, rocketX, rocketY - 29);
    ctx.fill();
    ctx.fillStyle = '#ff6f91';
    ctx.beginPath();
    ctx.moveTo(rocketX, rocketY - 29);
    ctx.lineTo(rocketX + 8, rocketY - 12);
    ctx.lineTo(rocketX - 8, rocketY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3b8cff';
    ctx.beginPath();
    ctx.arc(rocketX, rocketY - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.86)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = boost ? '#ffc857' : '#45ddff';
    ctx.beginPath();
    ctx.moveTo(rocketX - 12, rocketY + 5);
    ctx.lineTo(rocketX - 22, rocketY + 19);
    ctx.lineTo(rocketX - 11, rocketY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rocketX + 12, rocketY + 5);
    ctx.lineTo(rocketX + 22, rocketY + 19);
    ctx.lineTo(rocketX + 11, rocketY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (celebration > 0.01) {
      ctx.globalAlpha = celebration;
      ctx.strokeStyle = boost ? '#ffd166' : '#48e7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rocketX, rocketY, 32 + (1 - celebration) * 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      celebration *= .89;
    }
    if (errorPulse > 0.01) {
      ctx.globalAlpha = errorPulse * .4;
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
