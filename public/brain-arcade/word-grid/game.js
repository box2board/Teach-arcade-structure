(() => {
  let DICT = new Set();
  let DICT_READY = false;

  const loadDictionary = async (showToast) => {
    const toast = typeof showToast === "function" ? showToast : () => {};
    DICT = new Set();
    DICT_READY = false;
    fetch("./dictionary.txt", { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const words = text
          .split("\n")
          .map((word) => word.trim().toLowerCase())
          .filter((word) => /^[a-z]+$/.test(word));
        DICT = new Set(words);
        DICT_READY = true;
        console.log(
          "Dictionary loaded:",
          DICT.size,
          "face:",
          DICT.has("face"),
          "pace:",
          DICT.has("pace")
        );
        if (DICT.size < 5000) {
          console.warn("dictionary.txt may be missing or too small");
        }
      })
      .catch((error) => {
        console.error("Dictionary failed to load.", error);
        DICT_READY = false;
        toast("Dictionary failed to load. Check dictionary.txt.");
      });
  };
  const defaultSettings = {
    gridSize: 4,
    timerSetting: 60,
    minLength: 3,
    speedMode: true,
    strictDictionary: true,
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
    activePointerId: null,
    justScored: false,
    lastToastTime: 0
  };

  let DICT = new Set();
  let DICT_READY = false;

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

  const init = async () => {
    const requiredIds = [
      "board",
      "timerDisplay",
      "scoreDisplay",
      "bestDisplay",
      "dictionaryStatus",
      "gridBadge",
      "speedModeBadge",
      "currentWord",
      "submitWord",
      "undoWord",
      "clearWord",
      "startPause",
      "finishRound",
      "newGrid",
      "foundList",
      "statCount",
      "statLongest",
      "statAverage",
      "settingsToggle",
      "settingsDrawer",
      "closeSettings",
      "saveSettings",
      "gridSize",
      "timerSetting",
      "minLength",
      "speedMode",
      "strictDictionary",
      "themeSetting",
      "endModal",
      "endScore",
      "endCount",
      "endLongest",
      "playAgain",
      "newGridModal",
      "reviewWords",
      "toast"
    ];

    const elements = requiredIds.reduce((accumulator, id) => {
      const element = document.getElementById(id);
      if (!element) {
        throw new Error(`Word Grid init error: missing element #${id}`);
      }
      accumulator[id] = element;
      return accumulator;
    }, {});

    const showToast = (message) => {
      const now = Date.now();
      if (now - state.lastToastTime < 500) {
        return;
      }
      state.lastToastTime = now;
      elements.toast.textContent = message;
      elements.toast.classList.add("show");
      setTimeout(() => {
        elements.toast.classList.remove("show");
      }, 1400);
    };

    await loadDictionary(showToast);

    const updateBestScore = () => {
      const key = getSettingsKey(state.settings);
      const storedBest = Number(localStorage.getItem(key) || "0");
      state.best = Math.max(storedBest, state.score);
      elements.bestDisplay.textContent = state.best;
      if (state.score > storedBest) {
        localStorage.setItem(key, String(state.score));
      }
    };

    const applyTheme = () => {
      document.body.dataset.theme = state.settings.theme;
    };

    const updateBadge = () => {
      elements.gridBadge.textContent = `${state.settings.gridSize}x${state.settings.gridSize}`;
    };

    const updateSpeedModeBadge = () => {
      elements.speedModeBadge.textContent = `Speed Mode: ${state.settings.speedMode ? "ON" : "OFF"}`;
    };

    const updateTimerDisplay = () => {
      if (state.settings.timerSetting === 0) {
        elements.timerDisplay.textContent = "Practice";
      } else {
        elements.timerDisplay.textContent = `${state.timerRemaining}s`;
      }
    };

    const updateControlsState = () => {
      const disabled = !state.isActive || state.isPaused || state.isEnded;
      elements.submitWord.disabled = disabled;
      elements.undoWord.disabled = disabled;
      elements.clearWord.disabled = disabled;
      elements.board.setAttribute("aria-disabled", String(disabled));
      elements.finishRound.style.display = state.settings.timerSetting === 0 && state.isActive ? "inline-flex" : "none";
    };

    const renderGrid = () => {
      buildGrid();
      elements.board.innerHTML = "";
      const size = state.settings.gridSize;
      elements.board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
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
        elements.board.appendChild(button);
      });
    };

    const resetSelection = () => {
      state.selected = [];
      elements.currentWord.textContent = "—";
      elements.board.querySelectorAll(".tile").forEach((tile) => {
        tile.classList.remove("selected", "adjacent");
      });
    };

    const updateScore = () => {
      elements.scoreDisplay.textContent = state.score;
      updateBestScore();
    };

    const updateFoundList = () => {
      elements.foundList.innerHTML = "";
      state.found.forEach(({ word, points }) => {
        const item = document.createElement("div");
        item.className = "found-item";
        item.innerHTML = `<span>${word.toUpperCase()}</span><strong>${points}</strong>`;
        elements.foundList.appendChild(item);
      });
    };

    const updateStats = () => {
      const count = state.found.length;
      const totalLength = state.found.reduce((sum, item) => sum + item.word.length, 0);
      const longest = state.found.reduce((longestWord, item) =>
        item.word.length > longestWord.length ? item.word : longestWord, ""
      );
      elements.statCount.textContent = String(count);
      elements.statLongest.textContent = longest ? longest.toUpperCase() : "—";
      elements.statAverage.textContent = count ? (totalLength / count).toFixed(1) : "0";
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
      elements.board.querySelectorAll(".tile").forEach((tile) => tile.classList.remove("adjacent"));
      if (!state.selected.length) return;
      const lastIndex = state.selected[state.selected.length - 1];
      elements.board.querySelectorAll(".tile").forEach((tile) => {
        const idx = getTileIndex(tile);
        if (!state.selected.includes(idx) && isAdjacent(lastIndex, idx)) {
          tile.classList.add("adjacent");
        }
      });
    };

    const getCurrentWord = () => state.selected
      .map((index) => state.grid[index])
      .join("");

    const updateCurrentWord = () => {
      if (!state.selected.length) {
        elements.currentWord.textContent = "—";
        return "";
      }
      const word = getCurrentWord();
      elements.currentWord.textContent = word.toUpperCase();
      return word;
    };

    const attemptSelectTile = (tile) => {
      if (!state.isActive || state.isPaused || state.isEnded) return;
      const index = getTileIndex(tile);
      const selected = state.selected;
      const lastIndex = selected[selected.length - 1];
      const secondLastIndex = selected[selected.length - 2];

      if (selected.length > 1 && index === secondLastIndex) {
        const removed = selected.pop();
        const removedTile = elements.board.querySelector(`[data-index='${removed}']`);
        if (removedTile) {
          removedTile.classList.remove("selected");
        }
        updateCurrentWord();
        updateAdjacents();
        return;
      }

      if (selected.includes(index)) return;
      if (selected.length > 0 && !isAdjacent(lastIndex, index)) return;

      if (state.justScored && selected.length === 0) {
        state.justScored = false;
      }

      selected.push(index);
      tile.classList.add("selected");
      const word = updateCurrentWord();
      updateAdjacents();
      if (state.settings.speedMode) {
        attemptScoreWord(word);
      }
    };

    const undoSelection = () => {
      if (!state.selected.length) return;
      const index = state.selected.pop();
      const tile = elements.board.querySelector(`[data-index='${index}']`);
      if (tile) {
        tile.classList.remove("selected");
      }
      updateCurrentWord();
      updateAdjacents();
    };

    const attemptScoreWord = (word, { showToasts = false } = {}) => {
      if (!word) return { scored: false, reason: "empty" };
      const length = word.length;
      if (length < state.settings.minLength) {
        if (showToasts) {
          showToast("Too short");
        }
        return { scored: false, reason: "short" };
      }
      if (state.settings.strictDictionary) {
        if (!DICT_READY) {
          showToast("Dictionary loading…");
          return { scored: false, reason: "dictionary-loading" };
        }
        if (!DICT.has(word)) {
          if (showToasts) {
            showToast("Not in dictionary");
          }
          return { scored: false, reason: "dictionary" };
        }
      }
      if (state.foundSet.has(word)) {
        if (showToasts) {
          showToast("Already found");
        }
        return { scored: false, reason: "duplicate" };
      }
      const points = scoreTable(length);
      state.found.push({ word, points });
      state.foundSet.add(word);
      state.score += points;
      updateScore();
      updateFoundList();
      updateStats();
      showToast(`+${points} ${word.toUpperCase()}`);
      resetSelection();
      state.justScored = true;
      return { scored: true, reason: "scored" };
    };

    const submitWord = () => {
      if (!state.selected.length) return;
      const word = getCurrentWord();
      attemptScoreWord(word, { showToasts: true });
    };

    const handleSelectionEnd = () => {
      if (!state.selected.length || !state.settings.speedMode) return;
      const word = getCurrentWord();
      const length = word.length;
      if (length >= state.settings.minLength) {
        if (state.settings.strictDictionary) {
          if (!DICT_READY) {
            showToast("Dictionary loading…");
            resetSelection();
            return;
          }
          if (!DICT.has(word)) {
            showToast("Not in dictionary");
            resetSelection();
            return;
          }
        }
        if (state.foundSet.has(word)) {
          showToast("Already found");
        }
      }
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
      elements.startPause.textContent = "Pause";
      if (state.settings.timerSetting !== 0) {
        clearInterval(state.timerId);
        startTimer();
      }
      updateControlsState();
    };

    const pauseRound = () => {
      if (!state.isActive || state.isPaused) return;
      state.isPaused = true;
      elements.startPause.textContent = "Resume";
      clearInterval(state.timerId);
      updateControlsState();
    };

    const endRound = () => {
      clearInterval(state.timerId);
      state.isEnded = true;
      state.isActive = false;
      state.isPaused = false;
      elements.startPause.textContent = "Start";
      updateControlsState();
      updateBestScore();
      elements.endScore.textContent = state.score;
      elements.endCount.textContent = state.found.length;
      elements.endLongest.textContent = elements.statLongest.textContent;
      elements.endModal.classList.add("open");
      elements.endModal.setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      elements.endModal.classList.remove("open");
      elements.endModal.setAttribute("aria-hidden", "true");
    };

    const resetRound = ({ regenerate } = { regenerate: false }) => {
      state.score = 0;
      state.found = [];
      state.foundSet = new Set();
      state.isActive = false;
      state.isPaused = false;
      state.isEnded = false;
      state.isPointerDown = false;
      state.activePointerId = null;
      state.justScored = false;
      state.timerRemaining = state.settings.timerSetting;
      clearInterval(state.timerId);
      state.timerId = null;
      if (regenerate) {
        renderGrid();
      }
      resetSelection();
      updateBadge();
      updateTimerDisplay();
      updateScore();
      updateFoundList();
      updateStats();
      updateControlsState();
      updateBestScore();
      elements.startPause.textContent = "Start";
    };

    const saveSettings = () => {
      state.settings.gridSize = Number(elements.gridSize.value);
      state.settings.timerSetting = Number(elements.timerSetting.value);
      state.settings.minLength = Number(elements.minLength.value);
      state.settings.speedMode = elements.speedMode.checked;
      state.settings.strictDictionary = elements.strictDictionary.checked;
      state.settings.theme = elements.themeSetting.value;
      applyTheme();
      saveSettingsToStorage();
      updateBadge();
      updateSpeedModeBadge();
      resetRound({ regenerate: true });
      elements.settingsDrawer.classList.remove("open");
      elements.settingsDrawer.setAttribute("aria-hidden", "true");
      elements.settingsToggle.setAttribute("aria-expanded", "false");
    };

    const openSettings = () => {
      elements.gridSize.value = String(state.settings.gridSize);
      elements.timerSetting.value = String(state.settings.timerSetting);
      elements.minLength.value = String(state.settings.minLength);
      elements.speedMode.checked = state.settings.speedMode;
      elements.strictDictionary.checked = state.settings.strictDictionary;
      elements.themeSetting.value = state.settings.theme;
      elements.settingsDrawer.classList.add("open");
      elements.settingsDrawer.setAttribute("aria-hidden", "false");
      elements.settingsToggle.setAttribute("aria-expanded", "true");
    };

    const closeSettingsDrawer = () => {
      elements.settingsDrawer.classList.remove("open");
      elements.settingsDrawer.setAttribute("aria-hidden", "true");
      elements.settingsToggle.setAttribute("aria-expanded", "false");
    };

    loadSettings();
    applyTheme();
    renderGrid();
    updateBadge();
    updateSpeedModeBadge();
    updateTimerDisplay();
    updateScore();
    updateFoundList();
    updateStats();
    updateControlsState();

    elements.board.addEventListener("pointerdown", (event) => {
      const tile = event.target.closest(".tile");
      if (!tile) return;
      state.isPointerDown = true;
      state.activePointerId = event.pointerId;
      try {
        elements.board.setPointerCapture(event.pointerId);
      } catch (error) {
        // ignore capture errors
      }
      attemptSelectTile(tile);
    });

    elements.board.addEventListener("pointermove", (event) => {
      if (!state.isPointerDown || event.pointerId !== state.activePointerId) return;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const tile = element && element.closest(".tile");
      if (!tile) return;
      attemptSelectTile(tile);
    });

    const handlePointerEnd = (event) => {
      if (event.pointerId !== state.activePointerId) return;
      state.isPointerDown = false;
      state.activePointerId = null;
      try {
        elements.board.releasePointerCapture(event.pointerId);
      } catch (error) {
        // ignore capture errors
      }
      handleSelectionEnd();
    };

    elements.board.addEventListener("pointerup", handlePointerEnd);
    elements.board.addEventListener("pointercancel", handlePointerEnd);

    elements.submitWord.addEventListener("click", submitWord);
    elements.undoWord.addEventListener("click", undoSelection);
    elements.clearWord.addEventListener("click", resetSelection);

    elements.startPause.addEventListener("click", () => {
      if (!state.isActive || state.isPaused) {
        startRound();
      } else {
        pauseRound();
      }
    });

    elements.finishRound.addEventListener("click", () => {
      if (state.settings.timerSetting === 0) {
        endRound();
      }
    });

    elements.newGrid.addEventListener("click", () => {
      resetRound({ regenerate: true });
    });

    elements.settingsToggle.addEventListener("click", openSettings);
    elements.closeSettings.addEventListener("click", closeSettingsDrawer);
    elements.saveSettings.addEventListener("click", saveSettings);

    elements.playAgain.addEventListener("click", () => {
      closeModal();
      resetRound({ regenerate: true });
      startRound();
    });

    elements.newGridModal.addEventListener("click", () => {
      closeModal();
      resetRound({ regenerate: true });
    });

    elements.reviewWords.addEventListener("click", () => {
      closeModal();
      elements.foundList.scrollIntoView({ behavior: "smooth" });
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
  };

  document.addEventListener("DOMContentLoaded", init);
})();
