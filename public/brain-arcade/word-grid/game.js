(() => {
  const board = document.getElementById("board");
  const timerDisplay = document.getElementById("timerDisplay");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const bestDisplay = document.getElementById("bestDisplay");
  const gridBadge = document.getElementById("gridBadge");
  const currentWordEl = document.getElementById("currentWord");
  const submitBtn = document.getElementById("submitWord");
  const undoBtn = document.getElementById("undoWord");
  const clearBtn = document.getElementById("clearWord");
  const startPauseBtn = document.getElementById("startPause");
  const finishRoundBtn = document.getElementById("finishRound");
  const newGridBtn = document.getElementById("newGrid");
  const foundList = document.getElementById("foundList");
  const statCount = document.getElementById("statCount");
  const statLongest = document.getElementById("statLongest");
  const statAverage = document.getElementById("statAverage");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsDrawer = document.getElementById("settingsDrawer");
  const closeSettings = document.getElementById("closeSettings");
  const saveSettings = document.getElementById("saveSettings");
  const gridSizeSelect = document.getElementById("gridSize");
  const timerSettingSelect = document.getElementById("timerSetting");
  const minLengthSelect = document.getElementById("minLength");
  const themeSelect = document.getElementById("themeSetting");
  const endModal = document.getElementById("endModal");
  const endScore = document.getElementById("endScore");
  const endCount = document.getElementById("endCount");
  const endLongest = document.getElementById("endLongest");
  const playAgainBtn = document.getElementById("playAgain");
  const newGridModalBtn = document.getElementById("newGridModal");
  const reviewWordsBtn = document.getElementById("reviewWords");
  const toast = document.getElementById("toast");

  const { WORD_SET, PREFIX_SET } = window.WORD_GRID_DATA || { WORD_SET: new Set(), PREFIX_SET: new Set() };

  const defaultSettings = {
    gridSize: 4,
    timerSetting: 60,
    minLength: 3,
    theme: "arcade"
  };

  const state = {
    settings: { ...defaultSettings },
    grid: [],
    selected: [],
    found: [],
    foundSet: new Set(),
    score: 0,
    best: 0,
    timerRemaining: 60,
    timerId: null,
    isActive: false,
    isPaused: false,
    isEnded: false,
    isPointerDown: false,
    lastToastTime: 0
  };

  const vowels = ["a", "e", "i", "o", "u"];
  const consonantBag = [
    "b", "b", "c", "c", "d", "d", "f", "f", "g", "g", "h", "h", "j", "k", "l", "l", "m", "m", "n", "n", "p", "p", "q", "r", "r", "s", "s", "t", "t", "v", "w", "x", "y", "z", "qu", "qu"
  ];
  const vowelBag = ["a", "a", "a", "e", "e", "e", "i", "i", "o", "o", "u", "u"];

  const scoreTable = (length) => {
    if (length <= 2) return 0;
    if (length === 3) return 1;
    if (length === 4) return 2;
    if (length === 5) return 4;
    if (length === 6) return 7;
    return 10;
  };

  const getSettingsKey = ({ gridSize, timerSetting, minLength }) =>
    `wordGridBest_${gridSize}_${timerSetting}_${minLength}`;

  const saveSettingsToStorage = () => {
    localStorage.setItem("wordGridSettings", JSON.stringify(state.settings));
  };

  const loadSettings = () => {
    const stored = localStorage.getItem("wordGridSettings");
    if (stored) {
      try {
        state.settings = { ...state.settings, ...JSON.parse(stored) };
      } catch (error) {
        state.settings = { ...defaultSettings };
      }
    }
  };

  const updateBestScore = () => {
    const key = getSettingsKey(state.settings);
    const storedBest = Number(localStorage.getItem(key) || "0");
    state.best = Math.max(storedBest, state.score);
    bestDisplay.textContent = state.best;
    if (state.score > storedBest) {
      localStorage.setItem(key, String(state.score));
    }
  };

  const applyTheme = () => {
    document.body.dataset.theme = state.settings.theme;
  };

  const updateBadge = () => {
    gridBadge.textContent = `${state.settings.gridSize}x${state.settings.gridSize}`;
  };

  const updateTimerDisplay = () => {
    if (state.settings.timerSetting === 0) {
      timerDisplay.textContent = "Practice";
    } else {
      timerDisplay.textContent = `${state.timerRemaining}s`;
    }
  };

  const updateControlsState = () => {
    const disabled = !state.isActive || state.isPaused || state.isEnded;
    submitBtn.disabled = disabled;
    undoBtn.disabled = disabled;
    clearBtn.disabled = disabled;
    board.setAttribute("aria-disabled", String(disabled));
    finishRoundBtn.style.display = state.settings.timerSetting === 0 && state.isActive ? "inline-flex" : "none";
  };

  const showToast = (message) => {
    const now = Date.now();
    if (now - state.lastToastTime < 500) {
      return;
    }
    state.lastToastTime = now;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 1400);
  };

  const buildGrid = () => {
    const size = state.settings.gridSize;
    const total = size * size;
    const letters = [];

    for (let i = 0; i < total; i += 1) {
      const bag = Math.random() < 0.35 ? vowelBag : consonantBag;
      letters.push(bag[Math.floor(Math.random() * bag.length)]);
    }

    const minVowels = size === 4 ? 5 : 7;
    let vowelCount = letters.filter((letter) => vowels.includes(letter)).length;
    while (vowelCount < minVowels) {
      const idx = Math.floor(Math.random() * letters.length);
      if (!vowels.includes(letters[idx])) {
        letters[idx] = vowelBag[Math.floor(Math.random() * vowelBag.length)];
        vowelCount += 1;
      }
    }

    state.grid = letters;
  };

  const renderBoard = () => {
    board.innerHTML = "";
    const size = state.settings.gridSize;
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    state.grid.forEach((letter, index) => {
      const row = Math.floor(index / size) + 1;
      const col = (index % size) + 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile";
      button.dataset.index = String(index);
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.dataset.letter = letter;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Row ${row} Column ${col} Letter ${letter.toUpperCase()}`);
      button.textContent = letter === "qu" ? "Qu" : letter.toUpperCase();
      button.tabIndex = 0;
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          attemptSelectTile(button);
        }
      });
      board.appendChild(button);
    });
  };

  const resetSelection = () => {
    state.selected = [];
    currentWordEl.textContent = "—";
    board.querySelectorAll(".tile").forEach((tile) => {
      tile.classList.remove("selected", "adjacent");
    });
  };

  const resetRound = ({ regenerate } = { regenerate: false }) => {
    state.score = 0;
    state.found = [];
    state.foundSet = new Set();
    state.isActive = false;
    state.isPaused = false;
    state.isEnded = false;
    state.timerRemaining = state.settings.timerSetting;
    clearInterval(state.timerId);
    state.timerId = null;
    if (regenerate) {
      buildGrid();
      renderBoard();
    }
    resetSelection();
    updateBadge();
    updateTimerDisplay();
    updateScore();
    updateFoundList();
    updateStats();
    updateControlsState();
    updateBestScore();
    startPauseBtn.textContent = "Start";
  };

  const updateScore = () => {
    scoreDisplay.textContent = state.score;
    updateBestScore();
  };

  const updateFoundList = () => {
    foundList.innerHTML = "";
    state.found.forEach(({ word, points }) => {
      const item = document.createElement("div");
      item.className = "found-item";
      item.innerHTML = `<span>${word.toUpperCase()}</span><strong>${points}</strong>`;
      foundList.appendChild(item);
    });
  };

  const updateStats = () => {
    const count = state.found.length;
    const totalLength = state.found.reduce((sum, item) => sum + item.word.length, 0);
    const longest = state.found.reduce((longestWord, item) =>
      item.word.length > longestWord.length ? item.word : longestWord, ""
    );
    statCount.textContent = String(count);
    statLongest.textContent = longest ? longest.toUpperCase() : "—";
    statAverage.textContent = count ? (totalLength / count).toFixed(1) : "0";
  };

  const getTileIndex = (tile) => Number(tile.dataset.index);

  const isAdjacent = (indexA, indexB) => {
    const size = state.settings.gridSize;
    const rowA = Math.floor(indexA / size);
    const colA = indexA % size;
    const rowB = Math.floor(indexB / size);
    const colB = indexB % size;
    return Math.abs(rowA - rowB) <= 1 && Math.abs(colA - colB) <= 1;
  };

  const updateAdjacents = () => {
    board.querySelectorAll(".tile").forEach((tile) => tile.classList.remove("adjacent"));
    if (!state.selected.length) return;
    const lastIndex = state.selected[state.selected.length - 1];
    board.querySelectorAll(".tile").forEach((tile) => {
      const idx = getTileIndex(tile);
      if (!state.selected.includes(idx) && isAdjacent(lastIndex, idx)) {
        tile.classList.add("adjacent");
      }
    });
  };

  const updateCurrentWord = () => {
    if (!state.selected.length) {
      currentWordEl.textContent = "—";
      return;
    }
    const word = state.selected
      .map((index) => state.grid[index])
      .join("");
    currentWordEl.textContent = word.toUpperCase();
  };

  const attemptSelectTile = (tile) => {
    if (!state.isActive || state.isPaused || state.isEnded) return;
    const index = getTileIndex(tile);
    if (state.selected.includes(index)) return;
    if (state.selected.length > 0) {
      const lastIndex = state.selected[state.selected.length - 1];
      if (!isAdjacent(lastIndex, index)) return;
    }
    state.selected.push(index);
    tile.classList.add("selected");
    updateCurrentWord();
    updateAdjacents();
  };

  const undoSelection = () => {
    if (!state.selected.length) return;
    const index = state.selected.pop();
    const tile = board.querySelector(`[data-index='${index}']`);
    if (tile) {
      tile.classList.remove("selected");
    }
    updateCurrentWord();
    updateAdjacents();
  };

  const submitWord = () => {
    if (!state.selected.length) return;
    const word = state.selected.map((index) => state.grid[index]).join("");
    const length = word.length;
    if (length < state.settings.minLength) {
      showToast("Too short");
      return;
    }
    if (!WORD_SET.has(word)) {
      showToast("Not in dictionary");
      return;
    }
    if (state.foundSet.has(word)) {
      showToast("Already found");
      return;
    }
    const points = scoreTable(length);
    state.found.push({ word, points });
    state.foundSet.add(word);
    state.score += points;
    updateScore();
    updateFoundList();
    updateStats();
    resetSelection();
  };

  const startTimer = () => {
    if (state.settings.timerSetting === 0) {
      return;
    }
    state.timerId = setInterval(() => {
      if (state.timerRemaining <= 0) {
        endRound();
        return;
      }
      state.timerRemaining -= 1;
      updateTimerDisplay();
      if (state.timerRemaining <= 0) {
        endRound();
      }
    }, 1000);
  };

  const startRound = () => {
    if (state.isActive && !state.isPaused) return;
    if (!state.isActive) {
      state.isActive = true;
      state.isEnded = false;
      if (state.settings.timerSetting !== 0) {
        state.timerRemaining = state.settings.timerSetting;
      }
    }
    state.isPaused = false;
    startPauseBtn.textContent = "Pause";
    if (state.settings.timerSetting !== 0) {
      clearInterval(state.timerId);
      startTimer();
    }
    updateControlsState();
  };

  const pauseRound = () => {
    if (!state.isActive || state.isPaused) return;
    state.isPaused = true;
    startPauseBtn.textContent = "Resume";
    clearInterval(state.timerId);
    updateControlsState();
  };

  const endRound = () => {
    clearInterval(state.timerId);
    state.isEnded = true;
    state.isActive = false;
    state.isPaused = false;
    startPauseBtn.textContent = "Start";
    updateControlsState();
    updateBestScore();
    endScore.textContent = state.score;
    endCount.textContent = state.found.length;
    endLongest.textContent = statLongest.textContent;
    endModal.classList.add("open");
    endModal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    endModal.classList.remove("open");
    endModal.setAttribute("aria-hidden", "true");
  };

  const saveSettings = () => {
    state.settings.gridSize = Number(gridSizeSelect.value);
    state.settings.timerSetting = Number(timerSettingSelect.value);
    state.settings.minLength = Number(minLengthSelect.value);
    state.settings.theme = themeSelect.value;
    applyTheme();
    saveSettingsToStorage();
    updateBadge();
    resetRound({ regenerate: true });
    settingsDrawer.classList.remove("open");
    settingsDrawer.setAttribute("aria-hidden", "true");
    settingsToggle.setAttribute("aria-expanded", "false");
  };

  const openSettings = () => {
    gridSizeSelect.value = String(state.settings.gridSize);
    timerSettingSelect.value = String(state.settings.timerSetting);
    minLengthSelect.value = String(state.settings.minLength);
    themeSelect.value = state.settings.theme;
    settingsDrawer.classList.add("open");
    settingsDrawer.setAttribute("aria-hidden", "false");
    settingsToggle.setAttribute("aria-expanded", "true");
  };

  const closeSettingsDrawer = () => {
    settingsDrawer.classList.remove("open");
    settingsDrawer.setAttribute("aria-hidden", "true");
    settingsToggle.setAttribute("aria-expanded", "false");
  };

  const init = () => {
    loadSettings();
    applyTheme();
    buildGrid();
    renderBoard();
    updateBadge();
    updateTimerDisplay();
    updateScore();
    updateFoundList();
    updateStats();
    updateControlsState();
  };

  board.addEventListener("pointerdown", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    state.isPointerDown = true;
    attemptSelectTile(tile);
  });

  board.addEventListener("pointerover", (event) => {
    if (!state.isPointerDown) return;
    const tile = event.target.closest(".tile");
    if (!tile) return;
    attemptSelectTile(tile);
  });

  window.addEventListener("pointerup", () => {
    state.isPointerDown = false;
  });

  board.addEventListener("touchmove", (event) => {
    if (!state.isPointerDown) return;
    const touch = event.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = element && element.closest(".tile");
    if (tile) {
      attemptSelectTile(tile);
    }
  }, { passive: true });

  submitBtn.addEventListener("click", submitWord);
  undoBtn.addEventListener("click", undoSelection);
  clearBtn.addEventListener("click", resetSelection);

  startPauseBtn.addEventListener("click", () => {
    if (!state.isActive || state.isPaused) {
      startRound();
    } else {
      pauseRound();
    }
  });

  finishRoundBtn.addEventListener("click", () => {
    if (state.settings.timerSetting === 0) {
      endRound();
    }
  });

  newGridBtn.addEventListener("click", () => {
    resetRound({ regenerate: true });
  });

  settingsToggle.addEventListener("click", openSettings);
  closeSettings.addEventListener("click", closeSettingsDrawer);
  saveSettings.addEventListener("click", saveSettings);

  playAgainBtn.addEventListener("click", () => {
    closeModal();
    resetRound({ regenerate: true });
    startRound();
  });

  newGridModalBtn.addEventListener("click", () => {
    closeModal();
    resetRound({ regenerate: true });
  });

  reviewWordsBtn.addEventListener("click", () => {
    closeModal();
    foundList.scrollIntoView({ behavior: "smooth" });
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(activeTag)) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      undoSelection();
    }
    if (event.key === "Escape") {
      resetSelection();
    }
    if (event.key.toLowerCase() === "s") {
      submitWord();
    }
  });

  init();
})();
