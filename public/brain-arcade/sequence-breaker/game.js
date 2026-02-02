(() => {
  const tileGrid = document.getElementById("tileGrid");
  const timerDisplay = document.getElementById("timerDisplay");
  const streakDisplay = document.getElementById("streakDisplay");
  const bestDisplay = document.getElementById("bestDisplay");
  const accuracyDisplay = document.getElementById("accuracyDisplay");
  const roundsDisplay = document.getElementById("roundsDisplay");
  const avgTimeDisplay = document.getElementById("avgTimeDisplay");
  const modeSelect = document.getElementById("modeSelect");
  const explainToggle = document.getElementById("explainToggle");
  const explanation = document.getElementById("explanation");
  const ruleText = document.getElementById("ruleText");
  const oddText = document.getElementById("oddText");
  const modeHint = document.getElementById("modeHint");
  const endRunBtn = document.getElementById("endRunBtn");
  const summaryModal = document.getElementById("summaryModal");
  const summaryMode = document.getElementById("summaryMode");
  const summaryBest = document.getElementById("summaryBest");
  const summaryStreak = document.getElementById("summaryStreak");
  const summaryAccuracy = document.getElementById("summaryAccuracy");
  const summaryRounds = document.getElementById("summaryRounds");
  const playAgainBtn = document.getElementById("playAgainBtn");

  const MODES = {
    easy: {
      label: "Easy",
      tileRange: [5, 6],
      timerSeconds: 10,
      rules: ["numeric", "color", "shape"],
      allowDecoy: false
    },
    normal: {
      label: "Normal",
      tileRange: [6, 8],
      timerSeconds: 8,
      rules: ["numeric", "color", "shape", "direction"],
      allowDecoy: false
    },
    hard: {
      label: "Hard",
      tileRange: [8, 10],
      timerSeconds: 6,
      rules: ["numeric", "color", "shape", "direction"],
      allowDecoy: true
    },
    calm: {
      label: "Calm",
      tileRange: [6, 8],
      timerSeconds: 0,
      rules: ["numeric", "color", "shape", "direction"],
      allowDecoy: false
    }
  };

  const state = {
    mode: "normal",
    tiles: [],
    oddIndex: 0,
    streak: 0,
    best: 0,
    rounds: 0,
    correct: 0,
    totalResponseTime: 0,
    timerId: null,
    timeRemaining: 0,
    roundStart: 0,
    explanation: {
      rule: "",
      odd: ""
    },
    isLocked: false
  };

  const getModeFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    return MODES[mode] ? mode : "normal";
  };

  const setMode = (mode) => {
    state.mode = mode;
    modeSelect.value = mode;
    const config = MODES[mode];
    const bestKey = `sequenceBreakerBest:${mode}`;
    state.best = Number(localStorage.getItem(bestKey)) || 0;
    bestDisplay.textContent = state.best;
    explainToggle.checked = mode === "calm";
    explanation.hidden = !explainToggle.checked;
    modeHint.textContent = config.timerSeconds
      ? `${config.label} mode · ${config.tileRange[0]}–${config.tileRange[1]} tiles · ${config.timerSeconds}s timer`
      : `${config.label} mode · ${config.tileRange[0]}–${config.tileRange[1]} tiles · No timer`;
  };

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateNumericRound = (count, difficulty) => {
    const useArithmetic = difficulty !== "hard" ? Math.random() < 0.75 : Math.random() < 0.5;
    let sequence = [];
    let rule = "";

    if (useArithmetic) {
      const step = difficulty === "easy" ? randomInt(2, 4) : randomInt(1, 3);
      const start = randomInt(2, 12);
      sequence = Array.from({ length: count }, (_, i) => start + i * step);
      rule = `Numbers increase by +${step}.`;
    } else {
      const start = randomInt(3, 12);
      sequence = Array.from({ length: count }, (_, i) => start + i);
      rule = "Numbers alternate even and odd.";
    }

    const oddIndex = randomInt(0, count - 1);
    let oddValue = sequence[oddIndex];
    if (useArithmetic) {
      oddValue = oddValue + (Math.random() < 0.5 ? 1 : -1);
    } else {
      oddValue = oddValue + 1;
    }

    const tiles = sequence.map((value, index) => ({
      type: "number",
      label: value,
      value: index === oddIndex ? oddValue : value
    }));

    tiles[oddIndex].label = tiles[oddIndex].value;

    return {
      tiles,
      oddIndex,
      rule,
      oddExplanation: "The odd tile breaks the number sequence."
    };
  };

  const generateColorRound = (count, difficulty) => {
    const baseHue = randomInt(180, 320);
    const useGradient = difficulty === "hard" ? Math.random() < 0.6 : Math.random() < 0.3;
    let colors = [];
    let rule = "";

    if (useGradient) {
      const step = difficulty === "hard" ? randomInt(10, 18) : randomInt(18, 24);
      colors = Array.from({ length: count }, (_, i) => `hsl(${baseHue + i * step}, 70%, 60%)`);
      rule = "Colors shift in a smooth gradient.";
    } else {
      const colorA = `hsl(${baseHue}, 70%, 60%)`;
      const colorB = `hsl(${baseHue + 60}, 70%, 60%)`;
      colors = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? colorA : colorB));
      rule = "Colors alternate in a repeating pattern.";
    }

    const oddIndex = randomInt(0, count - 1);
    const oddColor = useGradient
      ? `hsl(${baseHue + oddIndex * 18 + 12}, 70%, 60%)`
      : `hsl(${baseHue + 120}, 70%, 60%)`;

    const tiles = colors.map((color, index) => ({
      type: "color",
      label: "",
      color: index === oddIndex ? oddColor : color
    }));

    return {
      tiles,
      oddIndex,
      rule,
      oddExplanation: "The odd tile uses a color that breaks the pattern."
    };
  };

  const generateShapeRound = (count, difficulty) => {
    const shapes = ["circle", "square", "triangle"];
    const patternLength = difficulty === "easy" ? 2 : 3;
    const ruleShapes = shapes.slice(0, patternLength);
    const tiles = Array.from({ length: count }, (_, i) => ({
      type: "shape",
      shape: ruleShapes[i % ruleShapes.length]
    }));

    const oddIndex = randomInt(0, count - 1);
    const oddShape = shapes.find((shape) => shape !== tiles[oddIndex].shape);
    tiles[oddIndex].shape = oddShape;

    return {
      tiles,
      oddIndex,
      rule: "Shapes repeat in a looping pattern.",
      oddExplanation: "The odd tile uses a different shape than the pattern."
    };
  };

  const generateDirectionRound = (count, difficulty) => {
    const step = difficulty === "hard" ? 30 : 45;
    const start = randomInt(0, 5) * step;
    const tiles = Array.from({ length: count }, (_, i) => ({
      type: "direction",
      rotation: (start + i * step) % 360
    }));

    const oddIndex = randomInt(0, count - 1);
    tiles[oddIndex].rotation = (tiles[oddIndex].rotation + step * 2) % 360;

    return {
      tiles,
      oddIndex,
      rule: "Arrows rotate by a consistent step.",
      oddExplanation: "The odd arrow rotates by the wrong amount."
    };
  };

  const RULE_GENERATORS = {
    numeric: generateNumericRound,
    color: generateColorRound,
    shape: generateShapeRound,
    direction: generateDirectionRound
  };

  const buildRound = () => {
    const config = MODES[state.mode];
    const tileCount = randomInt(config.tileRange[0], config.tileRange[1]);
    const ruleType = config.rules[randomInt(0, config.rules.length - 1)];
    const round = RULE_GENERATORS[ruleType](tileCount, state.mode);
    const tilesWithFlag = round.tiles.map((tile, index) => ({
      ...tile,
      isOdd: index === round.oddIndex
    }));

    const shuffled = shuffle(tilesWithFlag);
    const oddIndex = shuffled.findIndex((tile) => tile.isOdd);

    state.tiles = shuffled;
    state.oddIndex = oddIndex;
    state.explanation = {
      rule: round.rule,
      odd: round.oddExplanation
    };
  };

  const updateStats = () => {
    streakDisplay.textContent = state.streak;
    bestDisplay.textContent = state.best;
    roundsDisplay.textContent = state.rounds;
    const accuracy = state.rounds ? Math.round((state.correct / state.rounds) * 100) : 0;
    accuracyDisplay.textContent = `${accuracy}%`;
    const avgTime = state.rounds ? (state.totalResponseTime / state.rounds).toFixed(1) : "—";
    avgTimeDisplay.textContent = state.rounds ? `${avgTime}s` : "—";
  };

  const saveBest = () => {
    const bestKey = `sequenceBreakerBest:${state.mode}`;
    localStorage.setItem(bestKey, String(state.best));
  };

  const stopTimer = () => {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    const config = MODES[state.mode];
    if (!config.timerSeconds) {
      timerDisplay.textContent = "Calm";
      return;
    }
    state.timeRemaining = config.timerSeconds;
    timerDisplay.textContent = `${state.timeRemaining}s`;
    state.timerId = window.setInterval(() => {
      state.timeRemaining -= 1;
      timerDisplay.textContent = `${state.timeRemaining}s`;
      if (state.timeRemaining <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  };

  const renderTiles = () => {
    tileGrid.innerHTML = "";
    state.tiles.forEach((tile, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", `Tile ${index + 1}`);

      if (tile.type === "number") {
        button.textContent = tile.value ?? tile.label;
      }

      if (tile.type === "color") {
        button.dataset.variant = "color";
        button.style.background = tile.color;
      }

      if (tile.type === "shape") {
        const shapeSpan = document.createElement("span");
        shapeSpan.className = `shape ${tile.shape}`;
        button.appendChild(shapeSpan);
      }

      if (tile.type === "direction") {
        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.style.transform = `rotate(${tile.rotation}deg)`;
        arrow.textContent = "➤";
        button.appendChild(arrow);
      }

      button.addEventListener("click", () => handleSelection(index, button));
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelection(index, button);
        }
      });

      tileGrid.appendChild(button);
    });
  };

  const showExplanation = () => {
    if (!explainToggle.checked) {
      explanation.hidden = true;
      return;
    }
    explanation.hidden = false;
    ruleText.textContent = state.explanation.rule;
    oddText.textContent = state.explanation.odd;
  };

  const handleSelection = (index, element) => {
    if (state.isLocked) return;
    state.isLocked = true;
    const isCorrect = index === state.oddIndex;
    const responseTime = (Date.now() - state.roundStart) / 1000;
    state.totalResponseTime += responseTime;

    if (isCorrect) {
      state.streak += 1;
      state.correct += 1;
      element.classList.add("correct");
    } else {
      state.streak = 0;
      element.classList.add("wrong");
    }

    state.rounds += 1;
    if (state.streak > state.best) {
      state.best = state.streak;
      saveBest();
    }

    showExplanation();
    updateStats();
    stopTimer();

    window.setTimeout(() => {
      state.isLocked = false;
      nextRound();
    }, 600);
  };

  const handleTimeout = () => {
    state.rounds += 1;
    state.streak = 0;
    state.totalResponseTime += MODES[state.mode].timerSeconds;
    updateStats();
    showExplanation();

    if (state.mode === "hard") {
      openSummary();
      return;
    }

    window.setTimeout(() => {
      nextRound();
    }, 500);
  };

  const nextRound = () => {
    buildRound();
    renderTiles();
    showExplanation();
    startTimer();
    state.roundStart = Date.now();
  };

  const resetRun = () => {
    state.streak = 0;
    state.rounds = 0;
    state.correct = 0;
    state.totalResponseTime = 0;
    updateStats();
    nextRound();
  };

  const openSummary = () => {
    stopTimer();
    state.isLocked = true;
    summaryMode.textContent = `Mode: ${MODES[state.mode].label}`;
    summaryBest.textContent = state.best;
    summaryStreak.textContent = state.streak;
    const accuracy = state.rounds ? Math.round((state.correct / state.rounds) * 100) : 0;
    summaryAccuracy.textContent = `${accuracy}%`;
    summaryRounds.textContent = state.rounds;
    summaryModal.classList.add("open");
    summaryModal.setAttribute("aria-hidden", "false");
  };

  const closeSummary = () => {
    summaryModal.classList.remove("open");
    summaryModal.setAttribute("aria-hidden", "true");
    state.isLocked = false;
  };

  modeSelect.addEventListener("change", (event) => {
    const newMode = event.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set("mode", newMode);
    window.location.href = url.toString();
  });

  explainToggle.addEventListener("change", () => {
    showExplanation();
  });

  endRunBtn.addEventListener("click", () => {
    openSummary();
  });

  playAgainBtn.addEventListener("click", () => {
    closeSummary();
    resetRun();
  });

  const init = () => {
    const mode = getModeFromQuery();
    setMode(mode);
    resetRun();
  };

  init();
})();
