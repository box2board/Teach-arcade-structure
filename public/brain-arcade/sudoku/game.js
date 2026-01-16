const BOARD_SIZE = 9;
const STORAGE_KEY = "ta_sudoku_state_v1";
const MAX_HINTS = 3;
const UNDO_LIMIT = 200;

const boardEl = document.getElementById("sudoku-board");
const statusEl = document.getElementById("status-message");
const difficultySelect = document.getElementById("difficulty");
const newGameBtn = document.getElementById("new-game");
const resetBtn = document.getElementById("reset-game");
const undoBtn = document.getElementById("undo");
const notesToggleBtn = document.getElementById("notes-toggle");
const hintBtn = document.getElementById("hint");
const checkBtn = document.getElementById("check");
const timerDisplay = document.getElementById("timer-display");
const timerToggleBtn = document.getElementById("timer-toggle");

const keypadEl = document.querySelector(".sudoku-keypad");

let timerInterval = null;

const state = {
  puzzle: [],
  solution: [],
  entries: [],
  notes: [],
  selected: null,
  difficulty: "easy",
  hintsUsed: 0,
  notesMode: false,
  elapsed: 0,
  timerRunning: true,
  undoStack: [],
  checkedIncorrect: new Set(),
};

const cloneGrid = (grid) => grid.map((row) => [...row]);

const createEmptyGrid = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

const createNotesGrid = () =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => [])
  );

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const isValidPlacement = (grid, row, col, value) => {
  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (grid[row][i] === value) return false;
    if (grid[i][col] === value) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (grid[r][c] === value) return false;
    }
  }
  return true;
};

const findEmptyCell = (grid) => {
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
};

const setInitialSelection = () => {
  const empty = findEmptyCell(state.entries);
  if (empty) {
    state.selected = { row: empty[0], col: empty[1] };
  } else {
    state.selected = { row: 0, col: 0 };
  }
};

const solveGrid = (grid) => {
  const empty = findEmptyCell(grid);
  if (!empty) return true;
  const [row, col] = empty;
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const value of numbers) {
    if (isValidPlacement(grid, row, col, value)) {
      grid[row][col] = value;
      if (solveGrid(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
};

const countSolutions = (grid, limit = 2) => {
  const empty = findEmptyCell(grid);
  if (!empty) return 1;
  const [row, col] = empty;
  let count = 0;
  for (let value = 1; value <= 9; value += 1) {
    if (isValidPlacement(grid, row, col, value)) {
      grid[row][col] = value;
      count += countSolutions(grid, limit - count);
      grid[row][col] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
};

const difficultyConfig = {
  easy: { removals: 40 },
  medium: { removals: 50 },
  hard: { removals: 58 },
};

const generatePuzzle = (difficulty) => {
  const grid = createEmptyGrid();
  solveGrid(grid);
  const solution = cloneGrid(grid);
  const puzzle = cloneGrid(grid);
  const targetRemovals = difficultyConfig[difficulty]?.removals ?? 40;
  let removed = 0;
  let attempts = 0;

  while (removed < targetRemovals && attempts < 2000) {
    attempts += 1;
    const row = Math.floor(Math.random() * BOARD_SIZE);
    const col = Math.floor(Math.random() * BOARD_SIZE);
    if (puzzle[row][col] === 0) continue;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    const candidate = cloneGrid(puzzle);
    const solutions = countSolutions(candidate, 2);
    if (solutions !== 1) {
      puzzle[row][col] = backup;
    } else {
      removed += 1;
    }
  }

  return { puzzle, solution };
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#0f172a";
};

const syncTimer = () => {
  timerDisplay.textContent = formatTime(state.elapsed);
  timerToggleBtn.textContent = state.timerRunning ? "Pause Timer" : "Resume Timer";
  timerToggleBtn.setAttribute("aria-pressed", String(state.timerRunning));
};

const startTimer = () => {
  if (timerInterval) return;
  timerInterval = window.setInterval(() => {
    if (state.timerRunning) {
      state.elapsed += 1;
      syncTimer();
      saveState();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
};

const updateHintButton = () => {
  hintBtn.textContent = `Hint (${state.hintsUsed}/${MAX_HINTS})`;
};

const saveState = () => {
  const payload = {
    puzzle: state.puzzle,
    solution: state.solution,
    entries: state.entries,
    notes: state.notes,
    selected: state.selected,
    difficulty: state.difficulty,
    hintsUsed: state.hintsUsed,
    notesMode: state.notesMode,
    elapsed: state.elapsed,
    timerRunning: state.timerRunning,
    undoStack: state.undoStack,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to save Sudoku state.", error);
  }
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.puzzle) || data.puzzle.length !== 9) {
      return false;
    }
    Object.assign(state, {
      puzzle: data.puzzle,
      solution: data.solution,
      entries: data.entries,
      notes: data.notes,
      selected: data.selected,
      difficulty: data.difficulty || "easy",
      hintsUsed: data.hintsUsed || 0,
      notesMode: data.notesMode || false,
      elapsed: data.elapsed || 0,
      timerRunning: data.timerRunning !== false,
      undoStack: data.undoStack || [],
    });
    return true;
  } catch (error) {
    console.warn("Unable to load Sudoku state.", error);
    return false;
  }
};

const initBoard = () => {
  boardEl.innerHTML = "";
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "sudoku-cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${row + 1} Column ${col + 1}`);

      const valueSpan = document.createElement("span");
      valueSpan.className = "cell-value";

      const notes = document.createElement("div");
      notes.className = "cell-notes";
      for (let i = 1; i <= 9; i += 1) {
        const note = document.createElement("span");
        note.textContent = String(i);
        notes.appendChild(note);
      }

      cell.appendChild(valueSpan);
      cell.appendChild(notes);
      boardEl.appendChild(cell);
    }
  }
};

const getConflictSet = () => {
  const conflicts = new Set();
  const markConflicts = (positions) => {
    positions.forEach((pos) => conflicts.add(pos));
  };

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const map = new Map();
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = state.entries[row][col];
      if (!value) continue;
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(`${row}-${col}`);
    }
    map.forEach((positions) => {
      if (positions.length > 1) markConflicts(positions);
    });
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const map = new Map();
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const value = state.entries[row][col];
      if (!value) continue;
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(`${row}-${col}`);
    }
    map.forEach((positions) => {
      if (positions.length > 1) markConflicts(positions);
    });
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const map = new Map();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
          const value = state.entries[row][col];
          if (!value) continue;
          if (!map.has(value)) map.set(value, []);
          map.get(value).push(`${row}-${col}`);
        }
      }
      map.forEach((positions) => {
        if (positions.length > 1) markConflicts(positions);
      });
    }
  }

  return conflicts;
};

const renderBoard = () => {
  const conflictSet = getConflictSet();
  const selectedValue = state.selected
    ? state.entries[state.selected.row][state.selected.col]
    : 0;
  const selectedBox = state.selected
    ? {
        rowStart: Math.floor(state.selected.row / 3) * 3,
        colStart: Math.floor(state.selected.col / 3) * 3,
      }
    : null;

  const cells = boardEl.querySelectorAll(".sudoku-cell");
  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = state.entries[row][col];
    const given = state.puzzle[row][col] !== 0;
    const key = `${row}-${col}`;

    cell.classList.toggle("given", given);
    cell.classList.toggle("selected", state.selected?.row === row && state.selected?.col === col);
    cell.classList.toggle(
      "related",
      Boolean(
        state.selected &&
          (state.selected.row === row ||
            state.selected.col === col ||
            (selectedBox &&
              row >= selectedBox.rowStart &&
              row < selectedBox.rowStart + 3 &&
              col >= selectedBox.colStart &&
              col < selectedBox.colStart + 3))
      )
    );
    cell.classList.toggle(
      "same-number",
      selectedValue && value === selectedValue && !(state.selected?.row === row && state.selected?.col === col)
    );
    cell.classList.toggle("conflict", conflictSet.has(key));
    cell.classList.toggle("incorrect", state.checkedIncorrect.has(key));

    const valueSpan = cell.querySelector(".cell-value");
    const notesEl = cell.querySelector(".cell-notes");
    valueSpan.textContent = value ? String(value) : "";

    const notes = state.notes[row][col] || [];
    const noteSpans = notesEl.querySelectorAll("span");
    noteSpans.forEach((span, index) => {
      const noteValue = index + 1;
      span.classList.toggle("active", notes.includes(noteValue));
    });

    notesEl.style.visibility = value ? "hidden" : "visible";
  });
};

const setSelection = (row, col) => {
  state.selected = { row, col };
  renderBoard();
  saveState();
};

const clearCheckState = () => {
  state.checkedIncorrect.clear();
};

const addUndo = (action) => {
  state.undoStack.push(action);
  if (state.undoStack.length > UNDO_LIMIT) {
    state.undoStack.shift();
  }
};

const applyMove = (row, col, value, noteMode) => {
  if (state.puzzle[row][col] !== 0) return;
  const prevValue = state.entries[row][col];
  const prevNotes = [...state.notes[row][col]];
  const notes = new Set(state.notes[row][col]);

  if (noteMode) {
    if (value === 0) {
      state.entries[row][col] = 0;
      state.notes[row][col] = [];
    } else {
      if (notes.has(value)) {
        notes.delete(value);
      } else {
        notes.add(value);
      }
      state.notes[row][col] = Array.from(notes).sort();
    }
  } else {
    state.entries[row][col] = value;
    state.notes[row][col] = [];
  }

  addUndo({
    row,
    col,
    prevValue,
    newValue: state.entries[row][col],
    prevNotes,
    newNotes: [...state.notes[row][col]],
  });

  clearCheckState();
  renderBoard();
  saveState();
  checkSolved();
};

const checkSolved = () => {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (state.entries[row][col] !== state.solution[row][col]) {
        return;
      }
    }
  }
  setStatus("Solved! Great job.");
};

const resetPuzzle = () => {
  state.entries = cloneGrid(state.puzzle);
  state.notes = createNotesGrid();
  state.hintsUsed = 0;
  state.undoStack = [];
  state.elapsed = 0;
  state.timerRunning = true;
  clearCheckState();
  setInitialSelection();
  updateHintButton();
  syncTimer();
  renderBoard();
  saveState();
  setStatus("Puzzle reset. Good luck!");
};

const startNewGame = (difficulty) => {
  const { puzzle, solution } = generatePuzzle(difficulty);
  state.puzzle = puzzle;
  state.solution = solution;
  state.entries = cloneGrid(puzzle);
  state.notes = createNotesGrid();
  state.difficulty = difficulty;
  state.hintsUsed = 0;
  state.notesMode = false;
  state.undoStack = [];
  state.elapsed = 0;
  state.timerRunning = true;
  clearCheckState();
  setInitialSelection();
  updateHintButton();
  notesToggleBtn.setAttribute("aria-pressed", "false");
  notesToggleBtn.textContent = "Notes Mode";
  syncTimer();
  renderBoard();
  saveState();
  setStatus("New puzzle ready!");
};

const applyHint = () => {
  if (state.hintsUsed >= MAX_HINTS) {
    setStatus("No hints left. Try Notes Mode for logic.", true);
    return;
  }
  const emptyCells = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (state.entries[row][col] === 0) {
        emptyCells.push([row, col]);
      }
    }
  }
  if (!emptyCells.length) return;
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = state.solution[row][col];
  applyMove(row, col, value, false);
  state.hintsUsed += 1;
  updateHintButton();
  setStatus("Hint used. Keep going!");
  saveState();
};

const checkPuzzle = () => {
  state.checkedIncorrect.clear();
  let incorrectCount = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = state.entries[row][col];
      if (value && value !== state.solution[row][col]) {
        state.checkedIncorrect.add(`${row}-${col}`);
        incorrectCount += 1;
      }
    }
  }
  renderBoard();
  if (incorrectCount === 0) {
    setStatus("No mistakes found so far. Keep going!");
  } else {
    setStatus(`Check complete: ${incorrectCount} incorrect cell${incorrectCount === 1 ? "" : "s"}.`, true);
  }
};

const undoMove = () => {
  const last = state.undoStack.pop();
  if (!last) {
    setStatus("Nothing to undo.");
    return;
  }
  state.entries[last.row][last.col] = last.prevValue;
  state.notes[last.row][last.col] = [...last.prevNotes];
  clearCheckState();
  renderBoard();
  saveState();
};

const handleInput = (value) => {
  if (!state.selected) return;
  applyMove(state.selected.row, state.selected.col, value, state.notesMode);
};

const handleKeydown = (event) => {
  if (!state.selected) return;
  const { row, col } = state.selected;
  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      setSelection((row + BOARD_SIZE - 1) % BOARD_SIZE, col);
      break;
    case "ArrowDown":
      event.preventDefault();
      setSelection((row + 1) % BOARD_SIZE, col);
      break;
    case "ArrowLeft":
      event.preventDefault();
      setSelection(row, (col + BOARD_SIZE - 1) % BOARD_SIZE);
      break;
    case "ArrowRight":
      event.preventDefault();
      setSelection(row, (col + 1) % BOARD_SIZE);
      break;
    case "Backspace":
    case "Delete":
      event.preventDefault();
      handleInput(0);
      break;
    default: {
      const number = Number(event.key);
      if (number >= 1 && number <= 9) {
        event.preventDefault();
        handleInput(number);
      }
    }
  }
};

const initEvents = () => {
  boardEl.addEventListener("click", (event) => {
    const cell = event.target.closest(".sudoku-cell");
    if (!cell) return;
    setSelection(Number(cell.dataset.row), Number(cell.dataset.col));
  });

  document.addEventListener("keydown", handleKeydown);

  keypadEl.addEventListener("click", (event) => {
    const key = event.target.closest(".key");
    if (!key) return;
    const value = Number(key.dataset.value);
    handleInput(value);
  });

  newGameBtn.addEventListener("click", () => {
    startNewGame(difficultySelect.value);
  });

  resetBtn.addEventListener("click", () => {
    resetPuzzle();
  });

  undoBtn.addEventListener("click", undoMove);

  notesToggleBtn.addEventListener("click", () => {
    state.notesMode = !state.notesMode;
    notesToggleBtn.setAttribute("aria-pressed", String(state.notesMode));
    notesToggleBtn.textContent = state.notesMode ? "Notes Mode: On" : "Notes Mode";
    saveState();
  });

  hintBtn.addEventListener("click", applyHint);

  checkBtn.addEventListener("click", checkPuzzle);

  timerToggleBtn.addEventListener("click", () => {
    state.timerRunning = !state.timerRunning;
    syncTimer();
    saveState();
  });

  difficultySelect.addEventListener("change", (event) => {
    startNewGame(event.target.value);
  });
};

const init = () => {
  initBoard();
  const loaded = loadState();
  if (!loaded) {
    startNewGame(state.difficulty);
  } else {
    difficultySelect.value = state.difficulty;
    updateHintButton();
    notesToggleBtn.setAttribute("aria-pressed", String(state.notesMode));
    notesToggleBtn.textContent = state.notesMode ? "Notes Mode: On" : "Notes Mode";
    if (!state.selected) {
      setInitialSelection();
    }
    syncTimer();
    renderBoard();
  }
  initEvents();
  startTimer();
};

init();
