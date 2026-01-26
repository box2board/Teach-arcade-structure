(() => {
  const BOARD_SIZE = 8;
  const TILE_TYPES = 6;
  const MAX_CASCADE = 15;
  const SWAP_DURATION = 230;
  const CLEAR_DURATION = 160;
  const FALL_DURATION = 220;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const levelLabelEl = document.getElementById("level-label");
  const movesLabelEl = document.getElementById("moves-label");
  const movesRemainingEl = document.getElementById("moves-remaining");
  const goalLabelEl = document.getElementById("goal-label");
  const paceLabelEl = document.getElementById("pace-label");
  const toastStack = document.getElementById("toast-stack");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const resumeButton = document.getElementById("resume-game");

  const levelModeBtn = document.getElementById("level-mode");
  const endlessModeBtn = document.getElementById("endless-mode");
  const pauseBtn = document.getElementById("pause-game");
  const restartBtn = document.getElementById("restart-game");
  const muteBtn = document.getElementById("mute-toggle");

  const levels = window.BrainCrushLevels || [];

  let grid = [];
  let tileIdCounter = 0;
  let selectedTile = null;
  let isProcessing = false;
  let isPaused = false;
  let isEndless = false;
  let levelIndex = 0;
  let score = 0;
  let movesRemaining = 0;
  let paceMultiplier = 1;
  let comboMultiplier = 1;
  let lastMatchTime = 0;
  let highScore = Number(localStorage.getItem("brain-crush-high-score")) || 0;
  let overlayAction = null;
  let audioContext = null;
  let isMuted = false;
  let goalProgress = { collected: 0, blockers: 0 };
  let dragStart = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const tileSize = () => {
    const styles = getComputedStyle(boardEl);
    const size = parseFloat(styles.getPropertyValue("--tile-size"));
    const gap = parseFloat(styles.getPropertyValue("--tile-gap"));
    return { size, gap };
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  };

  const vibrate = (pattern) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const initAudio = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playTone = (freq, duration = 0.12, type = "sine") => {
    if (isMuted) return;
    initAudio();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.stop(audioContext.currentTime + duration);
  };

  const playSound = (type) => {
    if (type === "swap") playTone(440, 0.08, "triangle");
    if (type === "match") playTone(620, 0.12, "sine");
    if (type === "special") playTone(880, 0.15, "square");
    if (type === "invalid") playTone(220, 0.08, "sawtooth");
  };

  const buildEmptyGrid = () => {
    grid = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );
  };

  const createTile = (type, row, col) => ({
    id: tileIdCounter++,
    type,
    row,
    col,
    special: null,
    blocker: false
  });

  const placeBlockers = (blockers) => {
    blockers.forEach(({ row, col }) => {
      if (grid[row] && grid[row][col]) {
        grid[row][col].blocker = true;
      }
    });
  };

  const randomType = () => Math.floor(Math.random() * TILE_TYPES);

  const hasMatchAt = (row, col, type) => {
    const left1 = grid[row]?.[col - 1];
    const left2 = grid[row]?.[col - 2];
    const up1 = grid[row - 1]?.[col];
    const up2 = grid[row - 2]?.[col];
    if (left1 && left2 && left1.type === type && left2.type === type) return true;
    if (up1 && up2 && up1.type === type && up2.type === type) return true;
    return false;
  };

  const initBoard = () => {
    buildEmptyGrid();
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        let type = randomType();
        while (hasMatchAt(row, col, type)) {
          type = randomType();
        }
        grid[row][col] = createTile(type, row, col);
      }
    }

    const level = levels[levelIndex];
    if (!isEndless && level?.blockers?.length) {
      placeBlockers(level.blockers);
    }

    while (!findPossibleMoves().length) {
      shuffleBoard(false);
    }

    renderBoard(true);
  };

  const renderBoard = (initial = false) => {
    const { size, gap } = tileSize();
    grid.flat().forEach((tile) => {
      if (!tile) return;
      let el = document.querySelector(`.tile[data-id='${tile.id}']`);
      if (!el) {
        el = document.createElement("div");
        el.className = "tile";
        el.dataset.id = tile.id;
        boardEl.appendChild(el);
      }
      el.dataset.type = tile.type;
      el.classList.toggle("selected", selectedTile?.id === tile.id);
      el.classList.toggle("blocked", tile.blocker);
      el.classList.remove("special-line", "special-bomb", "special-color", "vertical");
      if (tile.special === "lineH") {
        el.classList.add("special-line");
      }
      if (tile.special === "lineV") {
        el.classList.add("special-line", "vertical");
      }
      if (tile.special === "bomb") {
        el.classList.add("special-bomb");
      }
      if (tile.special === "color") {
        el.classList.add("special-color");
      }
      el.style.transform = `translate(${tile.col * (size + gap)}px, ${tile.row * (size + gap)}px)`;
      if (initial) {
        el.style.transition = "none";
        requestAnimationFrame(() => {
          el.style.transition = "transform 220ms ease, opacity 160ms ease";
        });
      }
    });
  };

  const findMatches = () => {
    const matches = [];
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      let run = [grid[row][0]];
      for (let col = 1; col < BOARD_SIZE; col += 1) {
        const current = grid[row][col];
        if (current && run[0] && current.type === run[0].type) {
          run.push(current);
        } else {
          if (run.length >= 3) {
            matches.push({ tiles: [...run], direction: "h" });
          }
          run = [current];
        }
      }
      if (run.length >= 3) {
        matches.push({ tiles: [...run], direction: "h" });
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let run = [grid[0][col]];
      for (let row = 1; row < BOARD_SIZE; row += 1) {
        const current = grid[row][col];
        if (current && run[0] && current.type === run[0].type) {
          run.push(current);
        } else {
          if (run.length >= 3) {
            matches.push({ tiles: [...run], direction: "v" });
          }
          run = [current];
        }
      }
      if (run.length >= 3) {
        matches.push({ tiles: [...run], direction: "v" });
      }
    }

    matches.forEach((match) => {
      match.tiles.forEach((tile) => {
        visited[tile.row][tile.col] = true;
      });
    });

    return matches;
  };

  const matchesToClearSet = (matches) => {
    const set = new Set();
    matches.forEach((match) => {
      match.tiles.forEach((tile) => set.add(`${tile.row},${tile.col}`));
    });
    return set;
  };

  const getTile = (row, col) => grid[row]?.[col];

  const swapTiles = (tileA, tileB) => {
    const tempRow = tileA.row;
    const tempCol = tileA.col;
    grid[tileA.row][tileA.col] = tileB;
    grid[tileB.row][tileB.col] = tileA;
    tileA.row = tileB.row;
    tileA.col = tileB.col;
    tileB.row = tempRow;
    tileB.col = tempCol;
  };

  const areAdjacent = (tileA, tileB) => {
    const dr = Math.abs(tileA.row - tileB.row);
    const dc = Math.abs(tileA.col - tileB.col);
    return dr + dc === 1;
  };

  const getSwapDirection = (tileA, tileB) => {
    if (tileA.row === tileB.row) return "h";
    return "v";
  };

  const clearTiles = async (positions) => {
    positions.forEach((pos) => {
      const [row, col] = pos.split(",").map(Number);
      const tile = grid[row][col];
      if (!tile) return;
      const el = document.querySelector(`.tile[data-id='${tile.id}']`);
      if (el) {
        el.classList.add("fade");
      }
    });
    await sleep(CLEAR_DURATION);
    positions.forEach((pos) => {
      const [row, col] = pos.split(",").map(Number);
      const tile = grid[row][col];
      if (!tile) return;
      const el = document.querySelector(`.tile[data-id='${tile.id}']`);
      if (el) el.remove();
      grid[row][col] = null;
    });
  };

  const applyGravity = () => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
        if (grid[row][col] === null) {
          for (let above = row - 1; above >= 0; above -= 1) {
            if (grid[above][col]) {
              const tile = grid[above][col];
              grid[row][col] = tile;
              grid[above][col] = null;
              tile.row = row;
              tile.col = col;
              break;
            }
          }
        }
      }
    }
  };

  const refill = () => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (!grid[row][col]) {
          const tile = createTile(randomType(), row, col);
          grid[row][col] = tile;
        }
      }
    }
  };

  const findPossibleMoves = () => {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const tile = grid[row][col];
        if (!tile) continue;
        const right = grid[row][col + 1];
        const down = grid[row + 1]?.[col];
        if (right && wouldMatchAfterSwap(tile, right)) moves.push([tile, right]);
        if (down && wouldMatchAfterSwap(tile, down)) moves.push([tile, down]);
      }
    }
    return moves;
  };

  const wouldMatchAfterSwap = (tileA, tileB) => {
    swapTiles(tileA, tileB);
    const matches = findMatches();
    swapTiles(tileA, tileB);
    return matches.length > 0;
  };

  const shuffleBoard = (animate = true) => {
    const tiles = grid.flat().filter(Boolean);
    const types = tiles.map((tile) => tile.type);
    types.sort(() => Math.random() - 0.5);
    tiles.forEach((tile, index) => {
      tile.type = types[index];
      tile.special = null;
    });
    if (animate) {
      boardEl.classList.add("shuffle");
      setTimeout(() => boardEl.classList.remove("shuffle"), 420);
    }
    renderBoard();
  };

  const updateGoalLabel = () => {
    if (isEndless) {
      goalLabelEl.textContent = "Free play";
      return;
    }
    const level = levels[levelIndex];
    if (!level) return;
    const goal = level.goal;
    if (goal.type === "score") {
      goalLabelEl.textContent = `Score ${goal.target}`;
    }
    if (goal.type === "collect") {
      goalLabelEl.textContent = `Collect ${goal.target}`;
    }
    if (goal.type === "blockers") {
      goalLabelEl.textContent = `Clear ${goal.target} ice`;
    }
  };

  const updateStats = () => {
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
    levelLabelEl.textContent = isEndless ? "Endless" : levels[levelIndex]?.id || 1;
    movesLabelEl.textContent = isEndless ? "Timer" : "Moves";
    if (isEndless) {
      const timeLeft = Math.max(0, Math.ceil((lastMatchTime + 5000 - Date.now()) / 1000));
      movesRemainingEl.textContent = `${timeLeft}s`;
      if (timeLeft === 0) paceMultiplier = 1;
    } else {
      movesRemainingEl.textContent = movesRemaining;
    }
    paceLabelEl.textContent = `x${paceMultiplier}`;
  };

  const updateHighScore = () => {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("brain-crush-high-score", String(highScore));
      showToast("New High Score!");
    }
  };

  const checkGoalComplete = () => {
    if (isEndless) return false;
    const level = levels[levelIndex];
    if (!level) return false;
    const goal = level.goal;
    if (goal.type === "score") return score >= goal.target;
    if (goal.type === "collect") return goalProgress.collected >= goal.target;
    if (goal.type === "blockers") return goalProgress.blockers >= goal.target;
    return false;
  };

  const triggerOverlay = (title, text, buttonText, action) => {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    resumeButton.textContent = buttonText;
    overlayAction = action;
    overlay.classList.add("active");
    boardEl.classList.add("paused");
  };

  const closeOverlay = () => {
    overlay.classList.remove("active");
    boardEl.classList.remove("paused");
    overlayAction = null;
  };

  const handleMatchRewards = (clearedTiles, cascadeIndex) => {
    const base = clearedTiles * 10;
    const chainBonus = cascadeIndex + comboMultiplier - 1;
    const total = Math.round(base * chainBonus * paceMultiplier);
    score += total;
    if (cascadeIndex > 1) {
      showToast(`Combo x${cascadeIndex}`);
    }
    updateHighScore();
    handleMatchTiming();
  };

  const registerCollected = (tiles) => {
    if (isEndless) return;
    const level = levels[levelIndex];
    if (!level) return;
    if (level.goal.type === "collect") {
      tiles.forEach((tile) => {
        if (tile.type === level.goal.tileType) goalProgress.collected += 1;
      });
    }
    if (level.goal.type === "blockers") {
      tiles.forEach((tile) => {
        if (tile.blocker) {
          goalProgress.blockers += 1;
        }
      });
    }
  };

  const handleSpecialActivation = (tileA, tileB) => {
    const tilesToClear = new Set();
    const bothSpecial = tileA.special && tileB.special;

    if (tileA.special === "color" && tileB.special === "color") {
      grid.flat().forEach((tile) => {
        if (tile) tilesToClear.add(`${tile.row},${tile.col}`);
      });
      playSound("special");
      return tilesToClear;
    }

    if (tileA.special === "color" || tileB.special === "color") {
      const colorTile = tileA.special === "color" ? tileB : tileA;
      const targetType = colorTile.type;
      grid.flat().forEach((tile) => {
        if (tile && tile.type === targetType) {
          tilesToClear.add(`${tile.row},${tile.col}`);
          if (colorTile.special?.startsWith("line")) {
            for (let c = 0; c < BOARD_SIZE; c += 1) tilesToClear.add(`${tile.row},${c}`);
          }
          if (colorTile.special === "bomb") {
            for (let r = tile.row - 1; r <= tile.row + 1; r += 1) {
              for (let c = tile.col - 1; c <= tile.col + 1; c += 1) {
                if (getTile(r, c)) tilesToClear.add(`${r},${c}`);
              }
            }
          }
        }
      });
      tilesToClear.add(`${tileA.row},${tileA.col}`);
      tilesToClear.add(`${tileB.row},${tileB.col}`);
      playSound("special");
      return tilesToClear;
    }

    if (bothSpecial && tileA.special?.startsWith("line") && tileB.special?.startsWith("line")) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        tilesToClear.add(`${tileA.row},${c}`);
        tilesToClear.add(`${tileB.row},${c}`);
      }
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        tilesToClear.add(`${r},${tileA.col}`);
        tilesToClear.add(`${r},${tileB.col}`);
      }
      playSound("special");
      return tilesToClear;
    }

    if (tileA.special === "bomb" || tileB.special === "bomb") {
      const bomb = tileA.special === "bomb" ? tileA : tileB;
      for (let r = bomb.row - 1; r <= bomb.row + 1; r += 1) {
        for (let c = bomb.col - 1; c <= bomb.col + 1; c += 1) {
          if (getTile(r, c)) tilesToClear.add(`${r},${c}`);
        }
      }
      if (bothSpecial && (tileA.special?.startsWith("line") || tileB.special?.startsWith("line"))) {
        const line = tileA.special?.startsWith("line") ? tileA : tileB;
        if (line.special === "lineH") {
          for (let c = 0; c < BOARD_SIZE; c += 1) tilesToClear.add(`${line.row},${c}`);
        } else {
          for (let r = 0; r < BOARD_SIZE; r += 1) tilesToClear.add(`${r},${line.col}`);
        }
      }
      playSound("special");
      return tilesToClear;
    }

    if (tileA.special?.startsWith("line") || tileB.special?.startsWith("line")) {
      const line = tileA.special?.startsWith("line") ? tileA : tileB;
      if (line.special === "lineH") {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          tilesToClear.add(`${line.row},${c}`);
        }
      } else {
        for (let r = 0; r < BOARD_SIZE; r += 1) {
          tilesToClear.add(`${r},${line.col}`);
        }
      }
      playSound("special");
      return tilesToClear;
    }
    return tilesToClear;
  };

  const expandSpecials = (positions) => {
    const expanded = new Set(positions);
    positions.forEach((pos) => {
      const [row, col] = pos.split(",").map(Number);
      const tile = grid[row][col];
      if (!tile) return;
      if (tile.special === "lineH") {
        for (let c = 0; c < BOARD_SIZE; c += 1) expanded.add(`${row},${c}`);
      }
      if (tile.special === "lineV") {
        for (let r = 0; r < BOARD_SIZE; r += 1) expanded.add(`${r},${col}`);
      }
      if (tile.special === "bomb") {
        for (let r = row - 1; r <= row + 1; r += 1) {
          for (let c = col - 1; c <= col + 1; c += 1) {
            if (getTile(r, c)) expanded.add(`${r},${c}`);
          }
        }
      }
    });
    return expanded;
  };

  const createSpecialsFromMatches = (matches, swapInfo) => {
    const specials = [];
    const intersectionMap = new Map();
    matches.forEach((match) => {
      match.tiles.forEach((tile) => {
        const key = `${tile.row},${tile.col}`;
        const count = intersectionMap.get(key) || 0;
        intersectionMap.set(key, count + 1);
      });
    });

    intersectionMap.forEach((count, key) => {
      if (count > 1) {
        const [row, col] = key.split(",").map(Number);
        specials.push({ row, col, special: "bomb" });
      }
    });

    matches.forEach((match) => {
      if (match.tiles.length >= 5) {
        const target = swapInfo && match.tiles.some((t) => t.id === swapInfo.to.id)
          ? swapInfo.to
          : match.tiles[0];
        specials.push({ row: target.row, col: target.col, special: "color" });
      } else if (match.tiles.length === 4) {
        const target = swapInfo && match.tiles.some((t) => t.id === swapInfo.to.id)
          ? swapInfo.to
          : match.tiles[0];
        const direction = swapInfo ? swapInfo.direction : match.direction;
        specials.push({
          row: target.row,
          col: target.col,
          special: direction === "h" ? "lineH" : "lineV"
        });
      }
    });

    return specials;
  };

  const applySpecials = (specials, clearSet) => {
    specials.forEach(({ row, col, special }) => {
      const tile = grid[row][col];
      if (!tile) return;
      if (tile.special === "bomb") return;
      if (tile.special === "color" && special !== "bomb") return;
      tile.special = special;
      clearSet.delete(`${row},${col}`);
    });
  };

  const resolveMatches = async (swapInfo) => {
    let cascade = 1;
    while (cascade <= MAX_CASCADE) {
      const matches = findMatches();
      if (!matches.length) break;
      const clearSet = matchesToClearSet(matches);
      const specials = createSpecialsFromMatches(matches, swapInfo);
      applySpecials(specials, clearSet);
      const expanded = expandSpecials(clearSet);
      const tilesToClear = Array.from(expanded);
      const tileObjects = tilesToClear
        .map((pos) => {
          const [row, col] = pos.split(",").map(Number);
          return grid[row][col];
        })
        .filter(Boolean);
      registerCollected(tileObjects);
      handleMatchRewards(tilesToClear.length, cascade);
      playSound("match");
      vibrate(20);
      await clearTiles(tilesToClear);
      applyGravity();
      renderBoard();
      await sleep(FALL_DURATION);
      refill();
      renderBoard();
      await sleep(FALL_DURATION);
      cascade += 1;
      comboMultiplier += 1;
    }
    comboMultiplier = 1;
  };

  const handleSwap = async (tileA, tileB) => {
    if (!tileA || !tileB) return;
    isProcessing = true;
    swapTiles(tileA, tileB);
    renderBoard();
    await sleep(SWAP_DURATION);

    const swapInfo = { from: tileA, to: tileB, direction: getSwapDirection(tileA, tileB) };
    let specialClear = new Set();
    if (tileA.special || tileB.special) {
      specialClear = handleSpecialActivation(tileA, tileB);
    }

    const matches = findMatches();
    const hasMatches = matches.length > 0;
    if (!hasMatches && specialClear.size === 0) {
      const elA = document.querySelector(`.tile[data-id='${tileA.id}']`);
      const elB = document.querySelector(`.tile[data-id='${tileB.id}']`);
      if (elA) elA.classList.add("shake");
      if (elB) elB.classList.add("shake");
      playSound("invalid");
      vibrate([10, 40, 10]);
      await sleep(200);
      if (elA) elA.classList.remove("shake");
      if (elB) elB.classList.remove("shake");
      swapTiles(tileA, tileB);
      renderBoard();
      isProcessing = false;
      return;
    }

    if (!isEndless) {
      movesRemaining = Math.max(0, movesRemaining - 1);
    }

    if (specialClear.size > 0) {
      const expanded = expandSpecials(specialClear);
      const tilesToClear = Array.from(expanded);
      const tileObjects = tilesToClear
        .map((pos) => {
          const [row, col] = pos.split(",").map(Number);
          return grid[row][col];
        })
        .filter(Boolean);
      registerCollected(tileObjects);
      handleMatchRewards(tilesToClear.length, 1);
      await clearTiles(tilesToClear);
      applyGravity();
      renderBoard();
      await sleep(FALL_DURATION);
      refill();
      renderBoard();
      await sleep(FALL_DURATION);
    }

    await resolveMatches(swapInfo);

    if (!findPossibleMoves().length) {
      showToast("No moves — shuffling!");
      shuffleBoard(true);
      while (!findPossibleMoves().length) {
        shuffleBoard(false);
      }
    }

    playSound("swap");
    isProcessing = false;
    updateStats();

    if (checkGoalComplete()) {
      triggerOverlay("Level Complete!", "Ready for the next Brain Crush challenge?", "Next Level", () => {
        levelIndex = Math.min(levelIndex + 1, levels.length - 1);
        startLevel();
      });
      return;
    }

    if (!isEndless && movesRemaining === 0) {
      triggerOverlay("Out of Moves", "Try the level again or switch to Endless mode.", "Retry", () => {
        startLevel();
      });
    }
  };

  const startLevel = () => {
    const level = levels[levelIndex];
    isEndless = false;
    levelModeBtn.classList.add("active");
    endlessModeBtn.classList.remove("active");
    goalProgress = { collected: 0, blockers: 0 };
    score = 0;
    movesRemaining = level.moves;
    paceMultiplier = 1;
    lastMatchTime = Date.now();
    initBoard();
    updateGoalLabel();
    updateStats();
    closeOverlay();
  };

  const startEndless = () => {
    isEndless = true;
    levelModeBtn.classList.remove("active");
    endlessModeBtn.classList.add("active");
    score = 0;
    movesRemaining = 0;
    paceMultiplier = 1;
    lastMatchTime = Date.now();
    initBoard();
    updateGoalLabel();
    updateStats();
    closeOverlay();
  };

  const togglePause = () => {
    if (isPaused) {
      isPaused = false;
      closeOverlay();
      pauseBtn.textContent = "Pause";
      return;
    }
    isPaused = true;
    triggerOverlay("Paused", "Tap resume to keep matching.", "Resume", () => {
      isPaused = false;
      pauseBtn.textContent = "Pause";
      closeOverlay();
    });
    pauseBtn.textContent = "Resume";
  };

  const handleBoardPointerDown = (event) => {
    if (isPaused || isProcessing) return;
    const tileEl = event.target.closest(".tile");
    if (!tileEl) return;
    const tile = findTileById(tileEl.dataset.id);
    selectedTile = tile;
    dragStart = { x: event.clientX, y: event.clientY };
    renderBoard();
  };

  const handleBoardPointerMove = (event) => {
    if (!selectedTile || isPaused || isProcessing || !dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    const target = getAdjacentTile(selectedTile, dir);
    if (target) {
      handleSwap(selectedTile, target);
    }
    selectedTile = null;
    dragStart = null;
  };

  const handleBoardPointerUp = (event) => {
    if (isPaused || isProcessing) return;
    if (!selectedTile) return;
    const tileEl = event.target.closest(".tile");
    if (!tileEl) {
      selectedTile = null;
      renderBoard();
      return;
    }
    const tile = findTileById(tileEl.dataset.id);
    if (!tile) return;
    if (tile.id === selectedTile.id) {
      selectedTile = null;
      renderBoard();
      return;
    }
    if (areAdjacent(tile, selectedTile)) {
      handleSwap(selectedTile, tile);
    }
    selectedTile = null;
    renderBoard();
  };

  const getAdjacentTile = (tile, dir) => {
    if (dir === "left") return getTile(tile.row, tile.col - 1);
    if (dir === "right") return getTile(tile.row, tile.col + 1);
    if (dir === "up") return getTile(tile.row - 1, tile.col);
    if (dir === "down") return getTile(tile.row + 1, tile.col);
    return null;
  };

  const findTileById = (id) => grid.flat().find((tile) => tile && tile.id === Number(id));

  const handleMatchTiming = () => {
    if (!isEndless) return;
    const now = Date.now();
    if (now - lastMatchTime < 5000) {
      paceMultiplier = Math.min(5, paceMultiplier + 1);
      showToast(`Pace up! x${paceMultiplier}`);
    } else {
      paceMultiplier = 1;
    }
    lastMatchTime = now;
  };

  const bindEvents = () => {
    boardEl.addEventListener("pointerdown", handleBoardPointerDown);
    boardEl.addEventListener("pointermove", handleBoardPointerMove);
    boardEl.addEventListener("pointerup", handleBoardPointerUp);
    boardEl.addEventListener("pointerleave", handleBoardPointerUp);

    levelModeBtn.addEventListener("click", () => startLevel());
    endlessModeBtn.addEventListener("click", () => startEndless());
    pauseBtn.addEventListener("click", () => togglePause());
    restartBtn.addEventListener("click", () => (isEndless ? startEndless() : startLevel()));
    muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      muteBtn.textContent = `Sound: ${isMuted ? "Off" : "On"}`;
    });

    resumeButton.addEventListener("click", () => {
      if (overlayAction) {
        overlayAction();
      } else {
        closeOverlay();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !isPaused) {
        togglePause();
      }
    });
  };

  const init = () => {
    highScoreEl.textContent = highScore;
    bindEvents();
    startLevel();
    setInterval(() => {
      if (!isPaused) updateStats();
    }, 1000);
  };

  init();
})();
