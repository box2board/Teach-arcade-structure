(() => {
  const BOARD_SIZE = 8;
  const TILE_TYPES = 6;
  const STARTING_MOVES = 25;
  const BASE_GOAL = 500;
  const GOAL_INCREMENT = 250;

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

  let grid = [];
  let selected = null;
  let isProcessing = false;
  let isPaused = false;
  let isEndless = false;
  let levelIndex = 0;
  let score = 0;
  let movesRemaining = STARTING_MOVES;
  let highScore = Number(localStorage.getItem("brain-crush-high-score")) || 0;
  let audioContext = null;
  let isMuted = false;
  let cascadeCount = 0;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
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

  const randomType = () => Math.floor(Math.random() * TILE_TYPES);

  const inBounds = (row, col) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

  const getPace = () => {
    if (isEndless) {
      return 1 + Math.floor(score / 500) * 0.05;
    }
    return 1 + levelIndex * 0.05;
  };

  const updateHUD = () => {
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
    levelLabelEl.textContent = isEndless ? "Endless" : `${levelIndex + 1}`;
    movesLabelEl.textContent = "Moves";
    movesRemainingEl.textContent = isEndless ? "∞" : `${movesRemaining}`;
    goalLabelEl.textContent = isEndless
      ? "No goal"
      : `Score ${BASE_GOAL + levelIndex * GOAL_INCREMENT}`;
    paceLabelEl.textContent = `x${getPace().toFixed(2)}`;
  };

  const buildGrid = () => {
    grid = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => ({ type: 0, special: null }))
    );
  };

  const hasImmediateMatch = (row, col, type) => {
    const left1 = grid[row]?.[col - 1];
    const left2 = grid[row]?.[col - 2];
    const up1 = grid[row - 1]?.[col];
    const up2 = grid[row - 2]?.[col];
    if (left1 && left2 && left1.type === type && left2.type === type) return true;
    if (up1 && up2 && up1.type === type && up2.type === type) return true;
    return false;
  };

  const createBoardUI = () => {
    boardEl.innerHTML = "";
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tile";
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.setAttribute("aria-label", `Tile ${row + 1}, ${col + 1}`);
        boardEl.appendChild(tile);
      }
    }
  };

  const renderBoard = () => {
    const tiles = boardEl.querySelectorAll(".tile");
    tiles.forEach((tile) => {
      const row = Number(tile.dataset.row);
      const col = Number(tile.dataset.col);
      const cell = grid[row][col];
      tile.dataset.type = cell.type;
      tile.classList.toggle("selected", selected?.row === row && selected?.col === col);
      tile.classList.remove("line-clear", "color-bomb", "vertical", "fade", "swap-back");
      if (cell.special === "lineH") {
        tile.classList.add("line-clear");
      }
      if (cell.special === "lineV") {
        tile.classList.add("line-clear", "vertical");
      }
      if (cell.special === "color") {
        tile.classList.add("color-bomb");
      }
    });
  };

  const resetSelection = () => {
    selected = null;
  };

  const initBoard = () => {
    buildGrid();
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        let type = randomType();
        while (hasImmediateMatch(row, col, type)) {
          type = randomType();
        }
        grid[row][col] = { type, special: null };
      }
    }

    while (!findPossibleMoves().length) {
      shuffleBoard();
    }

    renderBoard();
  };

  const isAdjacent = (a, b) => {
    if (!a || !b) return false;
    const distance = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    return distance === 1;
  };

  const swapTiles = (a, b) => {
    const temp = grid[a.row][a.col];
    grid[a.row][a.col] = grid[b.row][b.col];
    grid[b.row][b.col] = temp;
  };

  const findMatches = () => {
    const matches = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      let run = 1;
      for (let col = 1; col <= BOARD_SIZE; col += 1) {
        const current = grid[row][col];
        const prev = grid[row][col - 1];
        if (col < BOARD_SIZE && current.type === prev.type) {
          run += 1;
        } else {
          if (run >= 3) {
            const tiles = [];
            for (let offset = 0; offset < run; offset += 1) {
              tiles.push({ row, col: col - 1 - offset });
            }
            matches.push({ tiles, orientation: "row" });
          }
          run = 1;
        }
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let run = 1;
      for (let row = 1; row <= BOARD_SIZE; row += 1) {
        const current = grid[row]?.[col];
        const prev = grid[row - 1]?.[col];
        if (row < BOARD_SIZE && current.type === prev.type) {
          run += 1;
        } else {
          if (run >= 3) {
            const tiles = [];
            for (let offset = 0; offset < run; offset += 1) {
              tiles.push({ row: row - 1 - offset, col });
            }
            matches.push({ tiles, orientation: "col" });
          }
          run = 1;
        }
      }
    }
    return matches;
  };

  const getBaseScore = (length) => {
    if (length >= 5) return 120;
    if (length === 4) return 60;
    return 30;
  };

  const applySpecialCreation = (matches, swapOrigin) => {
    const created = [];
    matches.forEach((match) => {
      const length = match.tiles.length;
      if (length < 4) return;
      const prefer = match.tiles.find(
        (tile) =>
          (tile.row === swapOrigin?.row && tile.col === swapOrigin?.col) ||
          (tile.row === swapOrigin?.rowB && tile.col === swapOrigin?.colB)
      );
      const target = prefer || match.tiles[0];
      const cell = grid[target.row][target.col];
      if (length >= 5) {
        cell.special = "color";
        created.push({ row: target.row, col: target.col });
        return;
      }
      cell.special = match.orientation === "row" ? "lineH" : "lineV";
      created.push({ row: target.row, col: target.col });
    });
    return created;
  };

  const collectClears = (matches, createdSpecials, colorBombTarget) => {
    const clearSet = new Set();
    const addTile = (row, col) => clearSet.add(`${row},${col}`);

    matches.forEach((match) => {
      match.tiles.forEach((tile) => addTile(tile.row, tile.col));
    });

    createdSpecials.forEach((tile) => clearSet.delete(`${tile.row},${tile.col}`));

    const specialsToTrigger = [];
    clearSet.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      const cell = grid[row][col];
      if (cell.special) {
        specialsToTrigger.push({ row, col, special: cell.special, type: cell.type });
      }
    });

    specialsToTrigger.forEach((special) => {
      if (special.special === "lineH") {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          addTile(special.row, col);
        }
      }
      if (special.special === "lineV") {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          addTile(row, special.col);
        }
      }
      if (special.special === "color") {
        const targetType = colorBombTarget ?? special.type;
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (grid[row][col].type === targetType) {
              addTile(row, col);
            }
          }
        }
      }
    });

    return clearSet;
  };

  const clearTiles = (clearSet) => {
    clearSet.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      grid[row][col] = null;
    });
  };

  const collapseColumns = () => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let writeRow = BOARD_SIZE - 1;
      for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
        if (grid[row][col]) {
          if (writeRow !== row) {
            grid[writeRow][col] = grid[row][col];
            grid[row][col] = null;
          }
          writeRow -= 1;
        }
      }
      for (let row = writeRow; row >= 0; row -= 1) {
        grid[row][col] = { type: randomType(), special: null };
      }
    }
  };

  const resolveMatches = async (swapOrigin, colorBombTarget) => {
    const matches = findMatches();
    if (!matches.length) {
      return false;
    }
    cascadeCount += 1;

    const isFirstCascade = cascadeCount === 1;
    const createdSpecials = isFirstCascade ? applySpecialCreation(matches, swapOrigin) : [];

    const clearSet = collectClears(matches, createdSpecials, colorBombTarget);

    const matchScore = matches.reduce((total, match) => total + getBaseScore(match.tiles.length), 0);
    const cascadeMultiplier = 1 + (cascadeCount - 1) * 0.1;
    score += Math.round(matchScore * cascadeMultiplier);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("brain-crush-high-score", `${highScore}`);
    }

    playSound(createdSpecials.length ? "special" : "match");
    updateHUD();

    clearTiles(clearSet);
    renderBoard();
    await sleep(140 / getPace());

    collapseColumns();
    renderBoard();
    await sleep(160 / getPace());

    return true;
  };

  const findPossibleMoves = () => {
    const moves = [];
    const checkSwap = (a, b) => {
      swapTiles(a, b);
      const hasMatch = findMatches().length > 0;
      swapTiles(a, b);
      if (hasMatch) moves.push({ a, b });
    };

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const current = { row, col };
        if (col + 1 < BOARD_SIZE) checkSwap(current, { row, col: col + 1 });
        if (row + 1 < BOARD_SIZE) checkSwap(current, { row: row + 1, col });
      }
    }
    return moves;
  };

  const shuffleBoard = () => {
    const types = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        types.push({ type: grid[row][col].type, special: grid[row][col].special });
      }
    }
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    let index = 0;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        grid[row][col] = { ...types[index] };
        index += 1;
      }
    }
  };

  const attemptSwap = async (a, b) => {
    if (!inBounds(a.row, a.col) || !inBounds(b.row, b.col)) return;
    if (!isEndless && movesRemaining <= 0) return;

    isProcessing = true;
    swapTiles(a, b);
    renderBoard();

    if (!isEndless) {
      movesRemaining = Math.max(0, movesRemaining - 1);
    }
    updateHUD();
    playSound("swap");

    cascadeCount = 0;

    const aCell = grid[a.row][a.col];
    const bCell = grid[b.row][b.col];
    let colorBombTarget = null;
    if (aCell.special === "color" && bCell.special === "color") {
      colorBombTarget = null;
    } else if (aCell.special === "color") {
      colorBombTarget = bCell.type;
    } else if (bCell.special === "color") {
      colorBombTarget = aCell.type;
    }

    if (colorBombTarget !== null || aCell.special === "color" || bCell.special === "color") {
      const clearSet = new Set();
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          if (!colorBombTarget || grid[row][col].type === colorBombTarget) {
            clearSet.add(`${row},${col}`);
          }
        }
      }
      clearTiles(clearSet);
      score += Math.round(120 * (1 + cascadeCount * 0.1));
      playSound("special");
      collapseColumns();
      renderBoard();
      await sleep(180 / getPace());
      cascadeCount = 0;
    }

    let matched = await resolveMatches(
      { row: a.row, col: a.col, rowB: b.row, colB: b.col },
      colorBombTarget
    );

    while (matched) {
      matched = await resolveMatches(null, null);
    }

    if (!findMatches().length && !findPossibleMoves().length) {
      shuffleBoard();
      renderBoard();
      showToast("No moves left. Shuffling board!");
    }

    if (!findMatches().length && cascadeCount === 0 && colorBombTarget === null) {
      swapTiles(a, b);
      renderBoard();
      const tileAEl = boardEl.querySelector(`[data-row='${a.row}'][data-col='${a.col}']`);
      const tileBEl = boardEl.querySelector(`[data-row='${b.row}'][data-col='${b.col}']`);
      tileAEl?.classList.add("swap-back");
      tileBEl?.classList.add("swap-back");
      playSound("invalid");
      await sleep(140 / getPace());
    }

    if (!isEndless && movesRemaining <= 0 && score < BASE_GOAL + levelIndex * GOAL_INCREMENT) {
      showOverlay("Level Failed", "Out of moves. Try again?", "Restart Level");
      isProcessing = false;
      return;
    }

    if (!isEndless && score >= BASE_GOAL + levelIndex * GOAL_INCREMENT) {
      showOverlay("Level Complete!", "Great work. Ready for the next level?", "Next Level");
      isProcessing = false;
      return;
    }

    isProcessing = false;
  };

  const handleTileInteraction = (event) => {
    const tile = event.target.closest(".tile");
    if (!tile || isProcessing || isPaused) return;
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    const current = { row, col };

    if (!selected) {
      selected = current;
      renderBoard();
      return;
    }

    if (selected.row === row && selected.col === col) {
      resetSelection();
      renderBoard();
      return;
    }

    if (isAdjacent(selected, current)) {
      const prevSelected = selected;
      resetSelection();
      renderBoard();
      attemptSwap(prevSelected, current);
      return;
    }

    selected = current;
    renderBoard();
  };

  const showOverlay = (title, text, buttonLabel) => {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    resumeButton.textContent = buttonLabel;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    boardEl.classList.add("paused");
    isPaused = true;
  };

  const hideOverlay = () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    boardEl.classList.remove("paused");
    isPaused = false;
  };

  const resetGame = () => {
    score = 0;
    movesRemaining = STARTING_MOVES;
    cascadeCount = 0;
    resetSelection();
    hideOverlay();
    initBoard();
    updateHUD();
  };

  const startLevel = () => {
    movesRemaining = STARTING_MOVES;
    resetGame();
  };

  const startEndless = () => {
    resetGame();
  };

  const toggleMode = (endless) => {
    isEndless = endless;
    levelModeBtn.classList.toggle("active", !endless);
    endlessModeBtn.classList.toggle("active", endless);
    if (endless) {
      showToast("Endless Mode enabled.");
      startEndless();
    } else {
      showToast("Level Mode enabled.");
      startLevel();
    }
    updateHUD();
  };

  const handleOverlayAction = () => {
    if (overlayTitle.textContent === "Paused") {
      hideOverlay();
      return;
    }
    if (overlayTitle.textContent.includes("Complete")) {
      levelIndex += 1;
      startLevel();
      return;
    }
    if (overlayTitle.textContent.includes("Failed")) {
      startLevel();
      return;
    }
    hideOverlay();
  };

  levelModeBtn.addEventListener("click", () => toggleMode(false));
  endlessModeBtn.addEventListener("click", () => toggleMode(true));

  pauseBtn.addEventListener("click", () => {
    if (isPaused) {
      hideOverlay();
      return;
    }
    showOverlay("Paused", "Tap resume to keep matching.", "Resume");
  });

  restartBtn.addEventListener("click", () => {
    resetGame();
    showToast("Board reset.");
  });

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? "Sound: Off" : "Sound: On";
  });

  resumeButton.addEventListener("click", handleOverlayAction);

  boardEl.addEventListener("pointerdown", handleTileInteraction);

  createBoardUI();
  initBoard();
  updateHUD();
})();
