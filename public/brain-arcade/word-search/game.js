const STORAGE_KEY = "teach-arcade-word-search-v1";
const MAX_HINTS = 3;

const CATEGORY_LABELS = {
  "us-history": "U.S. History",
  "world-history": "World History",
  "geography": "Geography",
  "science": "Science",
  "ela": "ELA/Vocabulary",
  "brain-break": "Brain Break Fun",
};

const CATEGORY_WORDS = {
  "us-history": [
    "Constitution",
    "Federalism",
    "Civil War",
    "Reconstruction",
    "Bill of Rights",
    "Declaration",
    "Revolution",
    "Colonies",
    "Amendment",
    "Washington",
    "Lincoln",
    "Hamilton",
    "Suffrage",
    "Abolition",
    "Manifest Destiny",
    "New Deal",
    "Immigration",
    "Supreme Court",
    "Industrial",
    "Frontier",
  ],
  "world-history": [
    "Renaissance",
    "Industrialization",
    "Silk Road",
    "Cold War",
    "World War",
    "Imperialism",
    "Reformation",
    "Enlightenment",
    "Dynasty",
    "Empire",
    "Revolution",
    "Feudalism",
    "Colonization",
    "Treaty",
    "Globalization",
    "Artifact",
    "Philosophy",
    "Archaeology",
  ],
  "geography": [
    "Latitude",
    "Longitude",
    "Continent",
    "Hemisphere",
    "Topography",
    "Elevation",
    "Population",
    "Climate",
    "Plateau",
    "Delta",
    "Archipelago",
    "Valley",
    "Equator",
    "Cartography",
    "Biodiversity",
    "Navigation",
    "Resources",
  ],
  "science": [
    "Photosynthesis",
    "Ecosystem",
    "Gravity",
    "Atom",
    "Molecule",
    "Energy",
    "Adaptation",
    "Genetics",
    "Neuron",
    "Circuit",
    "Osmosis",
    "Hypothesis",
    "Experiment",
    "Orbit",
    "Bacteria",
    "Evolution",
    "Climate",
  ],
  "ela": [
    "Synonym",
    "Antonym",
    "Context",
    "Inference",
    "Theme",
    "Character",
    "Plot",
    "Narrative",
    "Vocabulary",
    "Metaphor",
    "Simile",
    "Alliteration",
    "Revision",
    "Evidence",
    "Persuasion",
    "Dialogue",
  ],
  "brain-break": [
    "Penguin",
    "Volcano",
    "Basketball",
    "Rainbow",
    "Sandwich",
    "Skateboard",
    "Lightning",
    "Pancake",
    "Festival",
    "Adventure",
    "Guitar",
    "Mountain",
    "Starfish",
    "Snowflake",
    "Soccer",
    "Cupcake",
    "Sunshine",
  ],
};

const DIFFICULTY_SETTINGS = {
  easy: { min: 8, max: 10, maxLength: 6 },
  medium: { min: 10, max: 12, maxLength: 10 },
  hard: { min: 12, max: 16, minLength: 6 },
};

const elements = {
  board: document.getElementById("game-board"),
  wordList: document.getElementById("word-list"),
  foundCount: document.getElementById("found-count"),
  totalCount: document.getElementById("total-count"),
  difficulty: document.getElementById("difficulty"),
  category: document.getElementById("category"),
  gridSize: document.getElementById("grid-size"),
  dailyToggle: document.getElementById("daily-toggle"),
  timerToggle: document.getElementById("timer-toggle"),
  timerDisplay: document.getElementById("timer-display"),
  newPuzzle: document.getElementById("new-puzzle"),
  newRandom: document.getElementById("new-random"),
  resetPuzzle: document.getElementById("reset-puzzle"),
  hint: document.getElementById("hint"),
  hintRemaining: document.getElementById("hint-remaining"),
  feedback: document.getElementById("feedback"),
  completeBanner: document.getElementById("complete-banner"),
  completeNew: document.getElementById("complete-new"),
  clearSave: document.getElementById("clear-save"),
  categoryLabel: document.getElementById("category-label"),
  difficultyLabel: document.getElementById("difficulty-label"),
  gridHelper: document.getElementById("grid-helper"),
};

let state = {
  gridSize: 12,
  difficulty: "medium",
  category: "random",
  resolvedCategory: "brain-break",
  dailyOn: false,
  timerEnabled: true,
  seed: "",
  grid: [],
  placements: {},
  words: [],
  foundWords: [],
  elapsed: 0,
  hintsUsed: 0,
  dailyDate: "",
};

let cellMatrix = [];
let selection = [];
let isDragging = false;
let dragPointerId = null;
let dragStart = null;
let timerInterval = null;

const clampGridSize = (size) => {
  const width = window.innerWidth;
  const max = width < 700 ? 12 : width < 1024 ? 15 : 18;
  return Math.min(size, max);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const hashString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const seededRng = (seedString) => mulberry32(hashString(seedString));

const shuffle = (array, rng) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getCategoryForSeed = (rng) => {
  const keys = Object.keys(CATEGORY_WORDS);
  return keys[Math.floor(rng() * keys.length)];
};

const sanitizeWord = (word) => word.replace(/[^A-Za-z]/g, "").toUpperCase();

const buildWordList = (categoryKey, difficulty, rng) => {
  const rawWords = CATEGORY_WORDS[categoryKey] || [];
  const settings = DIFFICULTY_SETTINGS[difficulty];
  let filtered = rawWords;
  if (settings.maxLength) {
    filtered = filtered.filter((word) => sanitizeWord(word).length <= settings.maxLength);
  }
  if (settings.minLength) {
    filtered = filtered.filter((word) => sanitizeWord(word).length >= settings.minLength);
  }
  if (filtered.length < settings.min) {
    filtered = rawWords;
  }
  const count = Math.min(
    filtered.length,
    settings.min + Math.floor(rng() * (settings.max - settings.min + 1))
  );
  const shuffled = shuffle(filtered, rng).slice(0, count);
  return shuffled.map((word) => ({
    display: word,
    value: sanitizeWord(word),
  }));
};

const getDirections = (difficulty, rng) => {
  const straight = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const diagonals = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];
  if (difficulty === "easy") {
    return rng() < 0.2 ? straight.concat(diagonals) : straight;
  }
  if (difficulty === "medium") {
    return straight.concat(diagonals);
  }
  return straight.concat(diagonals, diagonals);
};

const createEmptyGrid = (size) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => ""));

const placeWord = (grid, word, difficulty, rng) => {
  const size = grid.length;
  const letters = word.value;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const directions = getDirections(difficulty, rng);
    const dir = directions[Math.floor(rng() * directions.length)];
    const maxRow = dir.dy === 1 ? size - letters.length : dir.dy === -1 ? size - 1 : size - 1;
    const minRow = dir.dy === -1 ? letters.length - 1 : 0;
    const maxCol = dir.dx === 1 ? size - letters.length : dir.dx === -1 ? size - 1 : size - 1;
    const minCol = dir.dx === -1 ? letters.length - 1 : 0;

    const row = Math.floor(rng() * (maxRow - minRow + 1)) + minRow;
    const col = Math.floor(rng() * (maxCol - minCol + 1)) + minCol;

    const coords = [];
    let fits = true;
    for (let i = 0; i < letters.length; i += 1) {
      const r = row + dir.dy * i;
      const c = col + dir.dx * i;
      if (r < 0 || r >= size || c < 0 || c >= size) {
        fits = false;
        break;
      }
      const existing = grid[r][c];
      if (existing && existing !== letters[i]) {
        fits = false;
        break;
      }
      coords.push({ row: r, col: c });
    }
    if (!fits) {
      continue;
    }
    coords.forEach((point, index) => {
      grid[point.row][point.col] = letters[index];
    });
    return coords;
  }
  return null;
};

const generatePuzzle = (config) => {
  const size = config.gridSize;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const rng = seededRng(`${config.seed}:${attempt}`);
    const grid = createEmptyGrid(size);
    const words = buildWordList(config.resolvedCategory, config.difficulty, rng);
    const placements = {};
    let success = true;
    for (const word of words) {
      const coords = placeWord(grid, word, config.difficulty, rng);
      if (!coords) {
        success = false;
        break;
      }
      placements[word.value] = coords;
    }
    if (!success) {
      continue;
    }
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!grid[row][col]) {
          const letterCode = 65 + Math.floor(rng() * 26);
          grid[row][col] = String.fromCharCode(letterCode);
        }
      }
    }
    return { grid, placements, words };
  }
  return null;
};

const saveState = () => {
  const payload = {
    version: 1,
    ...state,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!parsed || parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

const clearSelection = () => {
  selection.forEach((cell) => {
    cell.classList.remove("selected");
  });
  selection = [];
};

const setFeedback = (message) => {
  elements.feedback.textContent = message;
  if (message) {
    elements.feedback.classList.remove("shake");
    void elements.feedback.offsetWidth;
    elements.feedback.classList.add("shake");
  }
};

const buildGridDom = () => {
  const { gridSize, grid, difficulty } = state;
  elements.board.innerHTML = "";
  elements.board.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
  elements.board.dataset.difficulty = difficulty;
  cellMatrix = [];
  for (let row = 0; row < gridSize; row += 1) {
    const rowCells = [];
    for (let col = 0; col < gridSize; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.textContent = grid[row][col];
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", `Row ${row + 1} column ${col + 1}`);
      elements.board.appendChild(cell);
      rowCells.push(cell);
    }
    cellMatrix.push(rowCells);
  }
};

const updateWordList = () => {
  elements.wordList.innerHTML = "";
  state.words.forEach((word) => {
    const listItem = document.createElement("li");
    listItem.className = "word-item";
    listItem.dataset.word = word.value;
    const label = document.createElement("span");
    label.textContent = word.display.toUpperCase();
    const status = document.createElement("span");
    status.className = "word-status";
    const found = state.foundWords.includes(word.value);
    status.textContent = found ? "✓" : "";
    if (found) {
      listItem.classList.add("found");
    }
    listItem.appendChild(label);
    listItem.appendChild(status);
    elements.wordList.appendChild(listItem);
  });
};

const updateStats = () => {
  elements.foundCount.textContent = String(state.foundWords.length);
  elements.totalCount.textContent = String(state.words.length);
  elements.hintRemaining.textContent = String(MAX_HINTS - state.hintsUsed);
  elements.timerDisplay.textContent = formatTime(state.elapsed);
  elements.categoryLabel.textContent = CATEGORY_LABELS[state.resolvedCategory] || "Random";
  elements.difficultyLabel.textContent = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
  elements.hint.textContent = `Hint (${MAX_HINTS - state.hintsUsed})`;
};

const markFound = (wordValue, coords) => {
  coords.forEach((point) => {
    const cell = cellMatrix[point.row][point.col];
    if (cell) {
      cell.classList.add("found");
      cell.classList.remove("selected");
    }
  });
  if (!state.foundWords.includes(wordValue)) {
    state.foundWords.push(wordValue);
  }
  updateWordList();
  updateStats();
  checkCompletion();
  saveState();
};

const checkCompletion = () => {
  if (state.foundWords.length === state.words.length) {
    elements.completeBanner.hidden = false;
  } else {
    elements.completeBanner.hidden = true;
  }
};

const getCellFromEvent = (event) => {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  if (!target) {
    return null;
  }
  return target.closest(".cell");
};

const getLineCoords = (start, end) => {
  const dx = end.col - start.col;
  const dy = end.row - start.row;
  if (dx === 0 && dy === 0) {
    return [start];
  }
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
    return null;
  }
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
  const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
  const coords = [];
  for (let i = 0; i <= steps; i += 1) {
    coords.push({ row: start.row + stepY * i, col: start.col + stepX * i });
  }
  return coords;
};

const handlePointerDown = (event) => {
  const cell = event.target.closest(".cell");
  if (!cell) {
    return;
  }
  event.preventDefault();
  isDragging = true;
  dragPointerId = event.pointerId;
  dragStart = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  selection = [cell];
  cell.classList.add("selected");
  setFeedback("");
};

const handlePointerMove = (event) => {
  if (!isDragging || event.pointerId !== dragPointerId) {
    return;
  }
  const cell = getCellFromEvent(event);
  if (!cell) {
    return;
  }
  if (!dragStart) {
    return;
  }
  const start = dragStart;
  const end = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  const coords = getLineCoords(start, end);
  clearSelection();
  if (!coords) {
    setFeedback("Selection must be a straight line.");
    const startCell = cellMatrix[start.row]?.[start.col];
    if (startCell) {
      startCell.classList.add("selected");
      selection = [startCell];
    }
    return;
  }
  coords.forEach((point) => {
    const selectedCell = cellMatrix[point.row]?.[point.col];
    if (selectedCell) {
      selectedCell.classList.add("selected");
      selection.push(selectedCell);
    }
  });
};

const handlePointerUp = (event) => {
  if (!isDragging || event.pointerId !== dragPointerId) {
    return;
  }
  isDragging = false;
  dragPointerId = null;
  dragStart = null;

  if (selection.length === 0) {
    return;
  }
  const coords = selection.map((cell) => ({
    row: Number(cell.dataset.row),
    col: Number(cell.dataset.col),
  }));

  let matchedWord = null;
  let matchedCoords = null;
  for (const word of state.words) {
    if (state.foundWords.includes(word.value)) {
      continue;
    }
    const placement = state.placements[word.value];
    if (!placement || placement.length !== coords.length) {
      continue;
    }
    const forwardMatch = placement.every((point, index) =>
      point.row === coords[index].row && point.col === coords[index].col
    );
    const reverseMatch = placement.every((point, index) => {
      const reversed = coords[coords.length - 1 - index];
      return point.row === reversed.row && point.col === reversed.col;
    });
    if (forwardMatch || reverseMatch) {
      matchedWord = word.value;
      matchedCoords = placement;
      break;
    }
  }

  if (matchedWord) {
    markFound(matchedWord, matchedCoords);
    setFeedback("");
  } else {
    setFeedback("Not a word yet. Try a different line.");
  }
  clearSelection();
};

const applyFoundHighlights = () => {
  state.foundWords.forEach((word) => {
    const placement = state.placements[word];
    if (placement) {
      placement.forEach((point) => {
        const cell = cellMatrix[point.row]?.[point.col];
        if (cell) {
          cell.classList.add("found");
        }
      });
    }
  });
};

const updateToggle = (button, value) => {
  button.setAttribute("aria-pressed", value ? "true" : "false");
  button.textContent = value ? "On" : "Off";
};

const updateNewRandomVisibility = () => {
  elements.newRandom.disabled = state.dailyOn;
};

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  if (!state.timerEnabled) {
    return;
  }
  timerInterval = setInterval(() => {
    state.elapsed += 1;
    updateStats();
    saveState();
  }, 1000);
};

const buildSeed = (dailyOn, configSeed) => {
  if (!dailyOn) {
    return `random:${Date.now()}:${Math.floor(Math.random() * 100000)}`;
  }
  return `daily:${configSeed}`;
};

const buildConfigSeed = (dailyDate, difficulty, category, gridSize) =>
  `${dailyDate}|${difficulty}|${category}|${gridSize}`;

const createNewPuzzle = ({ useDailySeed, forceRandomCategory = false } = {}) => {
  const requestedSize = Number(elements.gridSize.value);
  const clampedSize = clampGridSize(requestedSize);
  state.gridSize = clampedSize;
  elements.gridSize.value = String(clampedSize);
  elements.gridHelper.textContent =
    requestedSize !== clampedSize
      ? `Grid size limited to ${clampedSize} on this screen.`
      : "Grid size may clamp on small screens.";

  state.difficulty = elements.difficulty.value;
  state.category = elements.category.value;
  state.dailyOn = useDailySeed ?? state.dailyOn;
  state.timerEnabled = elements.timerToggle.getAttribute("aria-pressed") === "true";

  const today = new Date();
  const dailyDate = today.toISOString().slice(0, 10);
  state.dailyDate = state.dailyOn ? dailyDate : "";

  const rngForCategory = seededRng(buildConfigSeed(dailyDate, state.difficulty, state.category, state.gridSize));
  if (state.category === "random") {
    state.resolvedCategory = forceRandomCategory ? getCategoryForSeed(seededRng(`random:${Date.now()}`)) : getCategoryForSeed(rngForCategory);
  } else {
    state.resolvedCategory = state.category;
  }

  const seedBase = state.dailyOn
    ? buildConfigSeed(dailyDate, state.difficulty, state.resolvedCategory, state.gridSize)
    : `${Date.now()}-${Math.random()}`;
  state.seed = buildSeed(state.dailyOn, seedBase);

  const generated = generatePuzzle({
    gridSize: state.gridSize,
    difficulty: state.difficulty,
    resolvedCategory: state.resolvedCategory,
    seed: state.seed,
  });

  if (!generated) {
    setFeedback("Puzzle generation failed. Try a different setting.");
    return;
  }

  state.grid = generated.grid;
  state.placements = generated.placements;
  state.words = generated.words;
  state.foundWords = [];
  state.elapsed = 0;
  state.hintsUsed = 0;

  buildGridDom();
  updateWordList();
  updateStats();
  applyFoundHighlights();
  clearSelection();
  checkCompletion();
  startTimer();
  updateNewRandomVisibility();
  saveState();
};

const resetPuzzle = () => {
  state.foundWords = [];
  state.hintsUsed = 0;
  state.elapsed = 0;
  buildGridDom();
  updateWordList();
  updateStats();
  applyFoundHighlights();
  clearSelection();
  checkCompletion();
  startTimer();
  saveState();
};

const applySavedState = (saved) => {
  const today = new Date().toISOString().slice(0, 10);
  if (saved.dailyOn && saved.dailyDate && saved.dailyDate !== today) {
    return false;
  }
  if (clampGridSize(saved.gridSize) !== saved.gridSize) {
    return false;
  }
  state = { ...state, ...saved };
  elements.difficulty.value = state.difficulty;
  elements.category.value = state.category;
  elements.gridSize.value = String(state.gridSize);
  updateToggle(elements.dailyToggle, state.dailyOn);
  updateToggle(elements.timerToggle, state.timerEnabled);
  buildGridDom();
  updateWordList();
  updateStats();
  applyFoundHighlights();
  checkCompletion();
  startTimer();
  updateNewRandomVisibility();
  return true;
};

const handleHint = () => {
  if (state.hintsUsed >= MAX_HINTS) {
    setFeedback("No hints left. Keep searching!");
    return;
  }
  const remaining = state.words.filter((word) => !state.foundWords.includes(word.value));
  if (remaining.length === 0) {
    return;
  }
  const rng = seededRng(`${state.seed}:${state.hintsUsed}`);
  const word = remaining[Math.floor(rng() * remaining.length)];
  const placement = state.placements[word.value];
  if (!placement) {
    return;
  }
  placement.forEach((point) => {
    const cell = cellMatrix[point.row]?.[point.col];
    if (cell) {
      cell.classList.add("hint");
    }
  });
  setTimeout(() => {
    placement.forEach((point) => {
      const cell = cellMatrix[point.row]?.[point.col];
      if (cell) {
        cell.classList.remove("hint");
      }
    });
  }, 2000);
  state.hintsUsed += 1;
  updateStats();
  saveState();
};

const init = () => {
  const defaultSize = window.innerWidth < 700 ? 12 : 15;
  state.gridSize = clampGridSize(defaultSize);
  elements.gridSize.value = String(state.gridSize);
  updateToggle(elements.dailyToggle, state.dailyOn);
  updateToggle(elements.timerToggle, state.timerEnabled);

  const saved = loadState();
  if (!saved || !applySavedState(saved)) {
    createNewPuzzle();
  }

  elements.board.addEventListener("pointerdown", handlePointerDown);
  elements.board.addEventListener("pointermove", handlePointerMove);
  elements.board.addEventListener("pointerup", handlePointerUp);
  elements.board.addEventListener("pointercancel", handlePointerUp);
  elements.board.addEventListener("pointerleave", handlePointerUp);

  elements.newPuzzle.addEventListener("click", () => createNewPuzzle({ useDailySeed: state.dailyOn }));
  elements.newRandom.addEventListener("click", () => createNewPuzzle({ useDailySeed: false, forceRandomCategory: true }));
  elements.resetPuzzle.addEventListener("click", resetPuzzle);
  elements.completeNew.addEventListener("click", () => createNewPuzzle({ useDailySeed: state.dailyOn }));
  elements.clearSave.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    createNewPuzzle({ useDailySeed: state.dailyOn });
  });

  elements.difficulty.addEventListener("change", () => createNewPuzzle({ useDailySeed: state.dailyOn }));
  elements.category.addEventListener("change", () => createNewPuzzle({ useDailySeed: state.dailyOn }));
  elements.gridSize.addEventListener("change", () => createNewPuzzle({ useDailySeed: state.dailyOn }));

  elements.dailyToggle.addEventListener("click", () => {
    state.dailyOn = !state.dailyOn;
    updateToggle(elements.dailyToggle, state.dailyOn);
    createNewPuzzle({ useDailySeed: state.dailyOn });
  });

  elements.timerToggle.addEventListener("click", () => {
    state.timerEnabled = !state.timerEnabled;
    updateToggle(elements.timerToggle, state.timerEnabled);
    state.elapsed = 0;
    updateStats();
    startTimer();
    saveState();
  });

  elements.hint.addEventListener("click", handleHint);

  window.addEventListener("resize", () => {
    const clamped = clampGridSize(state.gridSize);
    if (clamped !== state.gridSize) {
      state.gridSize = clamped;
      elements.gridSize.value = String(clamped);
      createNewPuzzle({ useDailySeed: state.dailyOn });
    }
  });
};

init();
