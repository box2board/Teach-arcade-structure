(() => {
  const difficultyConfig = {
    starter: { rows: 3, cols: 4, pairs: 6, mismatchDelay: 900, allowHint: true, rapidLock: false },
    standard: { rows: 4, cols: 4, pairs: 8, mismatchDelay: 700, allowHint: false, rapidLock: false },
    challenge: { rows: 4, cols: 6, pairs: 12, mismatchDelay: 600, allowHint: false, rapidLock: false },
    expert: { rows: 6, cols: 6, pairs: 18, mismatchDelay: 450, allowHint: false, rapidLock: true }
  };

  const themes = {
    school: ["📚","✏️","🖊️","🧠","📎","📏","🎒","🧴","🗂️","🖍️","📘","📐","📌","🧮","📝","🗃️","📒","📕","🧷","📑"],
    math: ["➕","➖","✖️","➗","🔺","🔷","🔶","🔵","◼️","◻️","🔸","🔹","🟣","🟢","🟡","📐","📊","📈","🔢","♾️"],
    science: ["🧪","🔬","🧫","⚗️","🧬","🌡️","🧲","🧯","🧰","🧻","🧴","🔭","⚙️","☄️","🌌","🧠","🔋","💡","🛰️","🧱"],
    world: ["🌎","🌍","🗺️","🏔️","🌋","🏝️","🌊","🏜️","🧭","🏛️","🌁","🏞️","🚢","✈️","🗽","🕌","🧳","🏜","🌉","🛤️"],
    arts: ["🎨","🖌️","🎭","🎼","🎺","🥁","🎬","🎤","🎻","🩰","🪇","🎹","📷","🧵","🧶","🖼️","🎛️","🎚️","🎷","🪕"],
    sports: ["⚽️","🏀","🏈","🎾","🏋️‍♂️","🏃‍♀️","🥇","🥅","🏊‍♂️","🚴‍♀️","🏓","🥎","🏐","🤾","🧗","🛹","🏸","🎯","⛹️","🏆"],
    food: ["🍎","🍌","🥨","🥗","🥛","🧀","🍞","🍇","🥕","🍓","🍉","🍪","🍳","🥑","🍐","🥒","🫐","🌽","🍊","🍍"],
    animals: ["🦊","🐻","🐼","🐸","🦉","🐢","🐬","🐙","🦁","🐧","🦄","🐘","🦋","🦒","🐳","🦓","🐝","🦔","🐇","🦜"]
  };

  const state = {
    difficulty: "standard",
    theme: "school",
    cards: [],
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    moves: 0,
    matches: 0,
    timerEnabled: true,
    hintEnabled: false,
    hintUsed: false,
    strikesEnabled: false,
    strikes: 0,
    soundEnabled: false,
    startTime: 0,
    elapsedSeconds: 0,
    timerId: null,
    teacherPairs: 8,
    activeRows: 4,
    activeCols: 4
  };

  const els = {
    board: document.getElementById("game-board"),
    difficulty: document.getElementById("difficulty-select"),
    theme: document.getElementById("theme-select"),
    restart: document.getElementById("restart-btn"),
    hint: document.getElementById("hint-btn"),
    howTo: document.getElementById("how-to-btn"),
    modal: document.getElementById("how-to-modal"),
    closeHowTo: document.getElementById("close-how-to"),
    teacherToggle: document.getElementById("teacher-btn"),
    teacherDrawer: document.getElementById("teacher-drawer"),
    applyTeacher: document.getElementById("apply-teacher"),
    teacherPairs: document.getElementById("teacher-pairs"),
    toggleTimer: document.getElementById("toggle-timer"),
    toggleHints: document.getElementById("toggle-hints"),
    toggleStrikes: document.getElementById("toggle-strikes"),
    toggleSound: document.getElementById("toggle-sound"),
    moves: document.getElementById("moves"),
    time: document.getElementById("time"),
    accuracy: document.getElementById("accuracy"),
    matches: document.getElementById("matches"),
    best: document.getElementById("best-panel"),
    status: document.getElementById("status-text"),
    strikesWrap: document.getElementById("strikes-wrap"),
    strikes: document.getElementById("strikes")
  };

  function getTeacherGrid(pairs) {
    if (pairs <= 6) return { rows: 3, cols: 4 };
    if (pairs <= 8) return { rows: 4, cols: 4 };
    if (pairs <= 12) return { rows: 4, cols: 6 };
    return { rows: 6, cols: 6 };
  }

  function getCurrentConfig() {
    if (state.difficulty === "teacher") {
      const grid = getTeacherGrid(state.teacherPairs);
      return {
        rows: grid.rows,
        cols: grid.cols,
        pairs: state.teacherPairs,
        mismatchDelay: 650,
        allowHint: state.hintEnabled,
        rapidLock: true
      };
    }
    return difficultyConfig[state.difficulty];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTime(total) {
    const min = Math.floor(total / 60).toString().padStart(2, "0");
    const sec = (total % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* no-op */ }
  }

  function playTone(freq = 440, duration = 0.08) {
    if (!state.soundEnabled) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = playTone.ctx || (playTone.ctx = new Ctx());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function updateStats() {
    const cfg = getCurrentConfig();
    els.moves.textContent = String(state.moves);
    els.time.textContent = state.timerEnabled ? formatTime(state.elapsedSeconds) : "Hidden";
    const accuracy = state.moves === 0 ? 100 : Math.round((state.matches / state.moves) * 100);
    els.accuracy.textContent = `${accuracy}%`;
    els.matches.textContent = `${state.matches}/${cfg.pairs}`;
    els.strikes.textContent = `${state.strikes}/3`;
  }

  function updateBestPanel() {
    const key = `memoryMatchBest_${state.difficulty}_${state.theme}`;
    const raw = safeGet(key);
    if (!raw) {
      els.best.textContent = "Personal Best: No saved score yet.";
      return;
    }
    try {
      const best = JSON.parse(raw);
      els.best.textContent = `Personal Best — Moves: ${best.bestMoves}, Time: ${best.bestTime || "N/A"}, Accuracy: ${best.bestAccuracy}%`;
    } catch (_) {
      els.best.textContent = "Personal Best: No saved score yet.";
    }
  }

  function saveBest() {
    const key = `memoryMatchBest_${state.difficulty}_${state.theme}`;
    const accuracy = state.moves === 0 ? 100 : Math.round((state.matches / state.moves) * 100);
    const current = {
      bestMoves: state.moves,
      bestTime: state.timerEnabled ? formatTime(state.elapsedSeconds) : null,
      bestAccuracy: accuracy
    };

    const raw = safeGet(key);
    if (!raw) {
      safeSet(key, JSON.stringify(current));
      return;
    }

    try {
      const prev = JSON.parse(raw);
      const prevTime = prev.bestTime ? prev.bestTime.split(":").map(Number) : null;
      const currTime = current.bestTime ? current.bestTime.split(":").map(Number) : null;
      const prevSeconds = prevTime ? prevTime[0] * 60 + prevTime[1] : Infinity;
      const currSeconds = currTime ? currTime[0] * 60 + currTime[1] : Infinity;
      const shouldUpdate = (current.bestMoves < prev.bestMoves) ||
        (current.bestMoves === prev.bestMoves && currSeconds < prevSeconds) ||
        (current.bestAccuracy > prev.bestAccuracy);
      if (shouldUpdate) safeSet(key, JSON.stringify(current));
    } catch (_) {
      safeSet(key, JSON.stringify(current));
    }
  }

  function startTimer() {
    clearInterval(state.timerId);
    if (!state.timerEnabled) return;
    state.startTime = Date.now() - (state.elapsedSeconds * 1000);
    state.timerId = setInterval(() => {
      state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
      updateStats();
    }, 250);
  }

  function stopTimer() {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  function createCards() {
    const cfg = getCurrentConfig();
    state.activeRows = cfg.rows;
    state.activeCols = cfg.cols;
    const emojiPool = [...themes[state.theme]];
    shuffle(emojiPool);
    const picks = emojiPool.slice(0, cfg.pairs);
    const cardData = shuffle([...picks, ...picks]).map((emoji, index) => ({
      id: `${emoji}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      emoji,
      flipped: false,
      matched: false
    }));
    state.cards = cardData;
  }

  function renderBoard() {
    const cfg = getCurrentConfig();
    els.board.innerHTML = "";
    els.board.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;

    state.cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.type = "button";
      button.dataset.index = String(index);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Card ${index + 1}, hidden`);
      button.innerHTML = '<span class="back" aria-hidden="true">?</span><span class="front" aria-hidden="true"></span>';
      const front = button.querySelector(".front");
      front.textContent = card.emoji;
      button.addEventListener("click", () => handleFlip(index));
      els.board.appendChild(button);
    });
  }

  function revealAllForHint(duration = 800) {
    state.lockBoard = true;
    state.cards.forEach((card, index) => {
      if (!card.matched) {
        card.flipped = true;
        paintCard(index);
      }
    });
    setTimeout(() => {
      state.cards.forEach((card, index) => {
        if (!card.matched) {
          card.flipped = false;
          paintCard(index);
        }
      });
      state.lockBoard = false;
    }, duration);
  }

  function paintCard(index) {
    const button = els.board.querySelector(`[data-index="${index}"]`);
    if (!button) return;
    const card = state.cards[index];
    button.classList.toggle("is-flipped", card.flipped || card.matched);
    button.classList.toggle("is-matched", card.matched);
    button.disabled = card.matched;
    const label = card.flipped || card.matched ? `Card ${index + 1}, ${card.emoji}` : `Card ${index + 1}, hidden`;
    button.setAttribute("aria-label", label);
  }

  function resetTurn() {
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
  }

  function checkWin() {
    const cfg = getCurrentConfig();
    if (state.matches !== cfg.pairs) return;
    stopTimer();
    saveBest();
    updateBestPanel();
    els.status.textContent = `You won in ${state.moves} moves${state.timerEnabled ? ` and ${formatTime(state.elapsedSeconds)}` : ""}!`;
    playTone(700, 0.16);
  }

  function handleMismatch() {
    const cfg = getCurrentConfig();
    const delay = cfg.mismatchDelay;
    setTimeout(() => {
      state.firstCard.flipped = false;
      state.secondCard.flipped = false;
      paintCard(state.cards.indexOf(state.firstCard));
      paintCard(state.cards.indexOf(state.secondCard));
      if (state.strikesEnabled) {
        state.strikes += 1;
        if (state.strikes >= 3) {
          stopTimer();
          els.status.textContent = "Three strikes reached. Restart to try again.";
          state.lockBoard = true;
        }
      }
      updateStats();
      resetTurn();
    }, delay);
  }

  function handleFlip(index) {
    const cfg = getCurrentConfig();
    const card = state.cards[index];
    if (state.lockBoard || card.flipped || card.matched) return;

    if (cfg.rapidLock && state.secondCard) return;

    card.flipped = true;
    paintCard(index);
    playTone(360, 0.05);

    if (!state.firstCard) {
      state.firstCard = card;
      return;
    }

    state.secondCard = card;
    state.moves += 1;

    if (state.firstCard.emoji === state.secondCard.emoji) {
      state.firstCard.matched = true;
      state.secondCard.matched = true;
      state.matches += 1;
      paintCard(state.cards.indexOf(state.firstCard));
      paintCard(state.cards.indexOf(state.secondCard));
      playTone(550, 0.08);
      updateStats();
      resetTurn();
      checkWin();
      return;
    }

    state.lockBoard = true;
    playTone(220, 0.08);
    handleMismatch();
    updateStats();
  }

  function applyDifficultyDefaults() {
    if (state.difficulty === "teacher") {
      return;
    }
    const cfg = difficultyConfig[state.difficulty];
    state.hintEnabled = cfg.allowHint;
    state.strikesEnabled = state.difficulty === "challenge" ? els.toggleStrikes.checked : false;
    els.toggleHints.checked = state.hintEnabled;
    els.toggleStrikes.checked = state.strikesEnabled;
  }

  function restartGame() {
    stopTimer();
    const cfg = getCurrentConfig();
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.moves = 0;
    state.matches = 0;
    state.strikes = 0;
    state.elapsedSeconds = 0;
    state.hintUsed = false;
    els.status.textContent = "Find all matching emoji pairs.";
    els.hint.disabled = !state.hintEnabled;
    els.hint.textContent = state.hintEnabled ? "Hint" : "Hint Off";
    els.strikesWrap.hidden = !state.strikesEnabled;
    createCards(cfg);
    renderBoard();
    updateStats();
    updateBestPanel();
    startTimer();
  }

  function syncTeacherUI() {
    els.toggleTimer.checked = state.timerEnabled;
    els.toggleHints.checked = state.hintEnabled;
    els.toggleStrikes.checked = state.strikesEnabled;
    els.toggleSound.checked = state.soundEnabled;
    els.teacherPairs.value = String(state.teacherPairs);
  }

  function initEvents() {
    els.difficulty.addEventListener("change", (e) => {
      state.difficulty = e.target.value;
      applyDifficultyDefaults();
      restartGame();
    });

    els.theme.addEventListener("change", (e) => {
      state.theme = e.target.value;
      restartGame();
    });

    els.restart.addEventListener("click", restartGame);

    els.hint.addEventListener("click", () => {
      if (!state.hintEnabled || state.hintUsed || state.lockBoard) return;
      state.hintUsed = true;
      els.hint.disabled = true;
      revealAllForHint(800);
    });

    els.howTo.addEventListener("click", () => {
      if (typeof els.modal.showModal === "function") {
        els.modal.showModal();
      }
    });

    els.closeHowTo.addEventListener("click", () => els.modal.close());

    els.teacherToggle.addEventListener("click", () => {
      syncTeacherUI();
      const isOpen = els.teacherDrawer.classList.toggle("open");
      els.teacherDrawer.setAttribute("aria-hidden", String(!isOpen));
    });

    els.applyTeacher.addEventListener("click", () => {
      state.teacherPairs = Number(els.teacherPairs.value);
      state.timerEnabled = els.toggleTimer.checked;
      state.hintEnabled = els.toggleHints.checked;
      state.strikesEnabled = els.toggleStrikes.checked;
      state.soundEnabled = els.toggleSound.checked;
      if (state.difficulty !== "teacher") {
        state.difficulty = "teacher";
        els.difficulty.value = "teacher";
      }
      restartGame();
      els.teacherDrawer.classList.remove("open");
      els.teacherDrawer.setAttribute("aria-hidden", "true");
    });

    document.addEventListener("keydown", (event) => {
      if ((event.key === "r" || event.key === "R") && !event.repeat) {
        restartGame();
      }
      if (event.key === "Escape" && els.teacherDrawer.classList.contains("open")) {
        els.teacherDrawer.classList.remove("open");
        els.teacherDrawer.setAttribute("aria-hidden", "true");
      }
    });
  }

  function init() {
    applyDifficultyDefaults();
    initEvents();
    restartGame();
  }

  init();
})();
