(() => {
  const VALID_SIZES = [3, 4, 5, 6];
  const DEFAULT_SIZE = 4;

  const boardEl = document.getElementById("board");
  const sizeSelect = document.getElementById("size-select");
  const moveCountEl = document.getElementById("move-count");
  const timerEl = document.getElementById("timer");
  const boardSizeEl = document.getElementById("board-size");
  const bestTimeEl = document.getElementById("best-time");
  const newPuzzleBtn = document.getElementById("new-puzzle");
  const calmToggle = document.getElementById("calm-toggle");
  const winModal = document.getElementById("win-modal");
  const winStats = document.getElementById("win-stats");
  const playAgainBtn = document.getElementById("play-again");
  const changeDifficultyBtn = document.getElementById("change-difficulty");
  const confettiEl = document.getElementById("confetti");

  let size = DEFAULT_SIZE;
  let board = [];
  let emptyIndex = 0;
  let moves = 0;
  let timerId = null;
  let elapsedSeconds = 0;
  let hasStarted = false;
  let calmMode = false;
  let isSolved = false;
  let tileElements = new Map();
  let tileMetrics = { size: 0, gap: 0 };

  const parseSizeFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const sizeParam = Number(params.get("size"));
    return VALID_SIZES.includes(sizeParam) ? sizeParam : DEFAULT_SIZE;
  };

  const saveBestTimes = (bestTimes) => {
    localStorage.setItem("slideSnapBestTimes", JSON.stringify(bestTimes));
  };

  const loadBestTimes = () => {
    const stored = localStorage.getItem("slideSnapBestTimes");
    if (!stored) return {};
    try {
      return JSON.parse(stored) || {};
    } catch (error) {
      return {};
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const setTimerDisplay = () => {
    timerEl.textContent = calmMode ? "Calm Mode" : formatTime(elapsedSeconds);
  };

  const resetTimer = () => {
    elapsedSeconds = 0;
    hasStarted = false;
    clearInterval(timerId);
    timerId = null;
    setTimerDisplay();
  };

  const startTimer = () => {
    if (calmMode || timerId) return;
    timerId = setInterval(() => {
      elapsedSeconds += 1;
      timerEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerId);
    timerId = null;
  };

  const getSolvedBoard = (boardSize) => {
    return Array.from({ length: boardSize * boardSize }, (_, idx) =>
      idx === boardSize * boardSize - 1 ? 0 : idx + 1
    );
  };

  const getRowCol = (index) => {
    return { row: Math.floor(index / size), col: index % size };
  };

  const isAdjacent = (indexA, indexB) => {
    const a = getRowCol(indexA);
    const b = getRowCol(indexB);
    const rowDiff = Math.abs(a.row - b.row);
    const colDiff = Math.abs(a.col - b.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const getAdjacentIndices = (index) => {
    const { row, col } = getRowCol(index);
    const neighbors = [];
    if (row > 0) neighbors.push(index - size);
    if (row < size - 1) neighbors.push(index + size);
    if (col > 0) neighbors.push(index - 1);
    if (col < size - 1) neighbors.push(index + 1);
    return neighbors;
  };

  const shuffleBoard = () => {
    const solved = getSolvedBoard(size);
    let current = [...solved];
    let blankIndex = current.length - 1;
    let previousBlank = null;
    const shuffleMoves = size * size * 20;

    for (let step = 0; step < shuffleMoves; step += 1) {
      const neighbors = getAdjacentIndices(blankIndex);
      const options = neighbors.filter((neighbor) => neighbor !== previousBlank);
      const pickFrom = options.length ? options : neighbors;
      const nextIndex = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      current[blankIndex] = current[nextIndex];
      current[nextIndex] = 0;
      previousBlank = blankIndex;
      blankIndex = nextIndex;
    }

    board = current;
    emptyIndex = blankIndex;
  };

  const updateBoardMetrics = () => {
    const boardSize = boardEl.clientWidth;
    const gap = Math.max(6, Math.round(boardSize * 0.02));
    const tileSize = (boardSize - gap * (size + 1)) / size;
    tileMetrics = { size: tileSize, gap };

    tileElements.forEach((tile) => {
      tile.style.width = `${tileSize}px`;
      tile.style.height = `${tileSize}px`;
    });
    updateTilePositions();
  };

  const updateTilePositions = () => {
    tileElements.forEach((tile, value) => {
      const index = board.indexOf(value);
      const { row, col } = getRowCol(index);
      const x = tileMetrics.gap + col * (tileMetrics.size + tileMetrics.gap);
      const y = tileMetrics.gap + row * (tileMetrics.size + tileMetrics.gap);
      tile.style.transform = `translate(${x}px, ${y}px)`;
    });
  };

  const buildTiles = () => {
    boardEl.innerHTML = "";
    tileElements = new Map();
    for (let value = 1; value < size * size; value += 1) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.textContent = value;
      tile.setAttribute("aria-label", `Move tile ${value}`);
      tile.addEventListener("click", () => handleTileMove(value));
      tileElements.set(value, tile);
      boardEl.appendChild(tile);
    }
    updateBoardMetrics();
  };

  const handleTileMove = (value) => {
    if (isSolved) return;
    const tileIndex = board.indexOf(value);
    if (!isAdjacent(tileIndex, emptyIndex)) return;

    board[emptyIndex] = value;
    board[tileIndex] = 0;
    emptyIndex = tileIndex;

    moves += 1;
    moveCountEl.textContent = moves;

    if (!hasStarted) {
      hasStarted = true;
      startTimer();
    }

    updateTilePositions();
    checkSolved();
  };

  const handleKeyboard = (event) => {
    if (isSolved) return;
    const key = event.key;
    const { row, col } = getRowCol(emptyIndex);
    let targetIndex = null;

    if (key === "ArrowUp" && row < size - 1) targetIndex = emptyIndex + size;
    if (key === "ArrowDown" && row > 0) targetIndex = emptyIndex - size;
    if (key === "ArrowLeft" && col < size - 1) targetIndex = emptyIndex + 1;
    if (key === "ArrowRight" && col > 0) targetIndex = emptyIndex - 1;

    if (targetIndex !== null) {
      event.preventDefault();
      const value = board[targetIndex];
      handleTileMove(value);
    }
  };

  const checkSolved = () => {
    const solved = getSolvedBoard(size);
    const isComplete = board.every((value, idx) => value === solved[idx]);
    if (!isComplete) return;

    isSolved = true;
    stopTimer();
    showWinModal();
    if (!calmMode) updateBestTime();
    launchConfetti();
  };

  const updateBestTime = () => {
    const bestTimes = loadBestTimes();
    const currentBest = bestTimes[size];
    if (!currentBest || elapsedSeconds < currentBest) {
      bestTimes[size] = elapsedSeconds;
      saveBestTimes(bestTimes);
    }
    updateBestTimeDisplay();
  };

  const updateBestTimeDisplay = () => {
    const bestTimes = loadBestTimes();
    const best = bestTimes[size];
    bestTimeEl.textContent = best ? `Best: ${formatTime(best)}` : "Best: --";
  };

  const showWinModal = () => {
    const timeLabel = calmMode ? "Calm Mode" : formatTime(elapsedSeconds);
    winStats.innerHTML = `
      <div>Moves: <strong>${moves}</strong></div>
      <div>Time: <strong>${timeLabel}</strong></div>
      <div>Board: <strong>${size}×${size}</strong></div>
    `;
    winModal.classList.add("active");
    winModal.setAttribute("aria-hidden", "false");
  };

  const hideWinModal = () => {
    winModal.classList.remove("active");
    winModal.setAttribute("aria-hidden", "true");
  };

  const launchConfetti = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confettiEl.innerHTML = "";
    const colors = ["#2563eb", "#a855f7", "#22c55e", "#f97316"];
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement("span");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      confettiEl.appendChild(piece);
    }
    setTimeout(() => {
      confettiEl.innerHTML = "";
    }, 2200);
  };

  const setBoardSize = (newSize) => {
    size = newSize;
    sizeSelect.value = String(newSize);
    boardSizeEl.textContent = `${newSize}×${newSize}`;
    updateBestTimeDisplay();
  };

  const resetGame = () => {
    moves = 0;
    moveCountEl.textContent = moves;
    resetTimer();
    isSolved = false;
    shuffleBoard();
    buildTiles();
    updateBestTimeDisplay();
  };

  const toggleCalmMode = () => {
    calmMode = !calmMode;
    calmToggle.textContent = `Calm Mode: ${calmMode ? "On" : "Off"}`;
    calmToggle.setAttribute("aria-pressed", String(calmMode));
    if (calmMode) {
      stopTimer();
      setTimerDisplay();
    } else {
      resetTimer();
    }
  };

  const init = () => {
    const initialSize = parseSizeFromQuery();
    setBoardSize(initialSize);
    resetGame();

    sizeSelect.addEventListener("change", (event) => {
      const newSize = Number(event.target.value);
      if (!VALID_SIZES.includes(newSize)) return;
      setBoardSize(newSize);
      resetGame();
    });

    newPuzzleBtn.addEventListener("click", () => {
      resetGame();
    });

    calmToggle.addEventListener("click", toggleCalmMode);

    playAgainBtn.addEventListener("click", () => {
      hideWinModal();
      resetGame();
    });

    changeDifficultyBtn.addEventListener("click", () => {
      hideWinModal();
      sizeSelect.focus();
    });

    window.addEventListener("resize", () => {
      updateBoardMetrics();
    });

    document.addEventListener("keydown", handleKeyboard);

    updateBestTimeDisplay();
  };

  init();
})();
