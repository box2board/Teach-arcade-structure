(() => {
  const BANK = [
    ["ARCADE","A place packed with games"],["PUZZLE","A brain teaser"],["LOGIC","Reasoning that follows rules"],
    ["BRAIN","Organ used for thinking"],["CLUE","A hint that points to an answer"],["WORD","A unit of language"],
    ["GRID","Rows and columns together"],["SCORE","A points total"],["LEVEL","A stage in a game"],
    ["APPLE","Fruit that can be red or green"],["LEMON","Yellow citrus fruit"],["MANGO","Sweet tropical fruit"],
    ["HONEY","Sweet food made by bees"],["BREAD","Baked sandwich staple"],["CLOUD","White or gray shape in the sky"],
    ["RIVER","Flowing body of water"],["OCEAN","Huge body of salt water"],["STONE","A small piece of rock"],
    ["NORTH","Direction opposite south"],["SOUTH","Direction opposite north"],["GLOBE","Round model of Earth"],
    ["TRAIN","Vehicle that runs on rails"],["ROBOT","Programmable machine"],["LASER","Focused beam of light"],
    ["CLOCK","It tells the time"],["CHAIR","A seat for one person"],["TABLE","Furniture with a flat top"],
    ["LIGHT","Opposite of dark"],["NIGHT","Time between evening and morning"],["DREAM","A story your mind makes while asleep"],
    ["SMILE","Happy facial expression"],["TIGER","Large striped cat"],["SHARK","Ocean predator with rows of teeth"],
    ["WHALE","Very large marine mammal"],["EAGLE","Bird known for sharp eyesight"],["COMET","Icy object that can grow a glowing tail"],
    ["ORBIT","Path around a planet or star"],["VENUS","Planet between Mercury and Earth"],["MARS","The red planet"],
    ["PLUTO","Dwarf planet beyond Neptune"],["SATURN","Planet famous for its rings"],["CROWN","Royal headwear"],
    ["QUEEN","Female monarch"],["KING","Male monarch"],["KNIGHT","Chess piece shaped like a horse"],
    ["BISHOP","Chess piece that moves diagonally"],["ROOK","Chess piece that moves in straight lines"],["PAWN","Smallest chess piece"],
    ["FOCUS","Careful attention"],["QUICK","Fast"],["BRAVE","Showing courage"],["MUSIC","Organized sound"],
    ["PIANO","Instrument with black and white keys"],["DRUM","Instrument played by striking it"],["GUITAR","Six-string instrument, often"],
    ["BRICK","Rectangular building block"],["HOUSE","A place people live"],["GREEN","Color made from blue and yellow"],
    ["BLACK","Darkest common color"],["WHITE","Color of fresh snow"],["SPACE","The region beyond Earth's atmosphere"],
    ["STARS","Points of light in the night sky"],["EARTH","Our home planet"],["MOON","Earth's natural satellite"]
  ].map(([answer, clue]) => ({ answer, clue }));

  const boardEl = document.getElementById("board");
  const acrossEl = document.getElementById("across-clues");
  const downEl = document.getElementById("down-clues");
  const keyboardEl = document.getElementById("keyboard");
  const timerEl = document.getElementById("timer");
  const progressEl = document.getElementById("progress");
  const hintsEl = document.getElementById("hints");
  const messageEl = document.getElementById("message");
  const dailyBtn = document.getElementById("daily-puzzle");
  const winModal = document.getElementById("win-modal");
  const winSummary = document.getElementById("win-summary");

  let state = null;
  let timerId = null;

  const hashString = (value) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const rngFrom = (seed) => {
    let t = hashString(seed);
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };

  const shuffle = (items, rng) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const localDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const keyForCell = (row, col) => `${row},${col}`;

  function canPlace(grid, word, row, col, dir, requireCross = true) {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const endRow = row + dr * (word.length - 1);
    const endCol = col + dc * (word.length - 1);
    if (row < 0 || col < 0 || endRow >= grid.length || endCol >= grid.length) return null;

    const beforeRow = row - dr;
    const beforeCol = col - dc;
    const afterRow = endRow + dr;
    const afterCol = endCol + dc;
    if (beforeRow >= 0 && beforeCol >= 0 && grid[beforeRow]?.[beforeCol]) return null;
    if (afterRow < grid.length && afterCol < grid.length && grid[afterRow]?.[afterCol]) return null;

    let crosses = 0;
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = grid[r][c];

      if (existing) {
        if (existing.char !== word[i]) return null;
        if (existing.dirs.has(dir)) return null;
        crosses += 1;
        continue;
      }

      if (dir === "across") {
        if ((r > 0 && grid[r - 1][c]) || (r < grid.length - 1 && grid[r + 1][c])) return null;
      } else {
        if ((c > 0 && grid[r][c - 1]) || (c < grid.length - 1 && grid[r][c + 1])) return null;
      }
    }
    if (requireCross && crosses === 0) return null;
    return crosses;
  }

  function buildAttempt(seed) {
    const SIZE = 15;
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    const rng = rngFrom(seed);
    const candidates = shuffle(BANK, rng);
    candidates.sort((a, b) => b.answer.length - a.answer.length);

    const entries = [];
    const first = candidates.shift();
    const firstRow = Math.floor(SIZE / 2);
    const firstCol = Math.floor((SIZE - first.answer.length) / 2);
    for (let i = 0; i < first.answer.length; i += 1) {
      grid[firstRow][firstCol + i] = { char: first.answer[i], dirs: new Set(["across"]) };
    }
    entries.push({ ...first, row: firstRow, col: firstCol, dir: "across" });

    let passes = 0;
    while (entries.length < 11 && passes < 4) {
      passes += 1;
      for (const item of candidates) {
        if (entries.some((entry) => entry.answer === item.answer)) continue;
        const options = [];

        for (let wi = 0; wi < item.answer.length; wi += 1) {
          const letter = item.answer[wi];
          for (let r = 0; r < SIZE; r += 1) {
            for (let c = 0; c < SIZE; c += 1) {
              if (grid[r][c]?.char !== letter) continue;
              for (const dir of ["across", "down"]) {
                const row = r - (dir === "down" ? wi : 0);
                const col = c - (dir === "across" ? wi : 0);
                const crosses = canPlace(grid, item.answer, row, col, dir, true);
                if (crosses !== null) options.push({ row, col, dir, crosses });
              }
            }
          }
        }

        if (!options.length) continue;
        const bestCrosses = Math.max(...options.map((option) => option.crosses));
        const best = options.filter((option) => option.crosses === bestCrosses);
        const pick = best[Math.floor(rng() * best.length)];
        const dr = pick.dir === "down" ? 1 : 0;
        const dc = pick.dir === "across" ? 1 : 0;

        for (let i = 0; i < item.answer.length; i += 1) {
          const r = pick.row + dr * i;
          const c = pick.col + dc * i;
          if (grid[r][c]) grid[r][c].dirs.add(pick.dir);
          else grid[r][c] = { char: item.answer[i], dirs: new Set([pick.dir]) };
        }

        entries.push({ ...item, ...pick });
        if (entries.length >= 11) break;
      }
    }

    if (entries.length < 7) return null;

    let minR = SIZE, maxR = 0, minC = SIZE, maxC = 0;
    entries.forEach((entry) => {
      const dr = entry.dir === "down" ? 1 : 0;
      const dc = entry.dir === "across" ? 1 : 0;
      minR = Math.min(minR, entry.row);
      minC = Math.min(minC, entry.col);
      maxR = Math.max(maxR, entry.row + dr * (entry.answer.length - 1));
      maxC = Math.max(maxC, entry.col + dc * (entry.answer.length - 1));
    });

    const trimmed = [];
    for (let r = minR; r <= maxR; r += 1) {
      trimmed.push(grid[r].slice(minC, maxC + 1).map((cell) => cell?.char || ""));
    }

    const shifted = entries.map((entry) => ({ ...entry, row: entry.row - minR, col: entry.col - minC }));
    const startMap = new Map();

    shifted
      .slice()
      .sort((a, b) => a.row - b.row || a.col - b.col || (a.dir === "across" ? -1 : 1))
      .forEach((entry) => {
        const key = keyForCell(entry.row, entry.col);
        if (!startMap.has(key)) startMap.set(key, startMap.size + 1);
        entry.number = startMap.get(key);
        entry.id = `${entry.number}-${entry.dir}`;
        const dr = entry.dir === "down" ? 1 : 0;
        const dc = entry.dir === "across" ? 1 : 0;
        entry.cells = Array.from({ length: entry.answer.length }, (_, i) => ({
          row: entry.row + dr * i,
          col: entry.col + dc * i
        }));
      });

    return { grid: trimmed, entries: shifted, width: trimmed[0].length, height: trimmed.length };
  }

  function generatePuzzle(seed) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const puzzle = buildAttempt(`${seed}:${attempt}`);
      if (puzzle) return puzzle;
    }
    return buildAttempt("teach-arcade-crossword-fallback");
  }

  function save() {
    if (!state) return;
    try {
      localStorage.setItem(`ta_crossword_${state.seed}`, JSON.stringify({
        values: state.values,
        elapsed: state.elapsed,
        hintsUsed: state.hintsUsed,
        revealed: [...state.revealed]
      }));
    } catch {}
  }

  function loadSaved(seed) {
    try {
      return JSON.parse(localStorage.getItem(`ta_crossword_${seed}`) || "null");
    } catch {
      return null;
    }
  }

  function setMessage(text, tone = "") {
    messageEl.textContent = text;
    messageEl.className = `cw-message ${tone}`.trim();
  }

  function startPuzzle({ daily = false } = {}) {
    clearInterval(timerId);
    const seed = daily ? `daily:${localDateKey()}` : `random:${Date.now()}:${Math.random()}`;
    const puzzle = generatePuzzle(seed);
    const saved = loadSaved(seed);
    state = {
      ...puzzle,
      seed,
      daily,
      values: saved?.values || {},
      elapsed: saved?.elapsed || 0,
      hintsUsed: saved?.hintsUsed || 0,
      revealed: new Set(saved?.revealed || []),
      incorrect: new Set(),
      selected: null,
      activeEntryId: null,
      solved: false
    };
    const first = state.entries.slice().sort((a, b) => a.number - b.number)[0];
    if (first) {
      state.activeEntryId = first.id;
      state.selected = { ...first.cells[0] };
    }
    dailyBtn.setAttribute("aria-pressed", String(daily));
    dailyBtn.textContent = `Daily: ${daily ? "On" : "Off"}`;
    winModal.classList.remove("open");
    winModal.setAttribute("aria-hidden", "true");
    render();
    setMessage(daily ? "Today’s crossword is ready." : "Fresh crossword ready.");
    timerId = setInterval(() => {
      if (!state.solved) {
        state.elapsed += 1;
        timerEl.textContent = formatTime(state.elapsed);
        if (state.elapsed % 5 === 0) save();
      }
    }, 1000);
  }

  function entriesAt(row, col) {
    return state.entries.filter((entry) => entry.cells.some((cell) => cell.row === row && cell.col === col));
  }

  function getActiveEntry() {
    return state.entries.find((entry) => entry.id === state.activeEntryId) || null;
  }

  function chooseCell(row, col, toggle = false) {
    const available = entriesAt(row, col);
    if (!available.length) return;
    const current = getActiveEntry();
    let next = available[0];
    if (available.length > 1) {
      if (toggle && current) {
        next = available.find((entry) => entry.id !== current.id) || available[0];
      } else if (current && available.some((entry) => entry.id === current.id)) {
        next = current;
      }
    }
    state.activeEntryId = next.id;
    state.selected = { row, col };
    render();
  }

  function isEntrySolved(entry) {
    return entry.cells.every((cell, index) => (state.values[keyForCell(cell.row, cell.col)] || "") === entry.answer[index]);
  }

  function updateStats() {
    const solvedCount = state.entries.filter(isEntrySolved).length;
    progressEl.textContent = `${solvedCount}/${state.entries.length}`;
    hintsEl.textContent = String(state.hintsUsed);
    timerEl.textContent = formatTime(state.elapsed);
  }

  function render() {
    const starts = new Map();
    state.entries.forEach((entry) => {
      const key = keyForCell(entry.row, entry.col);
      if (!starts.has(key)) starts.set(key, entry.number);
    });
    const active = getActiveEntry();
    const related = new Set((active?.cells || []).map((cell) => keyForCell(cell.row, cell.col)));

    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${state.width}, minmax(0,1fr))`;
    for (let r = 0; r < state.height; r += 1) {
      for (let c = 0; c < state.width; c += 1) {
        if (!state.grid[r][c]) {
          const block = document.createElement("div");
          block.className = "cw-block";
          block.setAttribute("aria-hidden", "true");
          boardEl.appendChild(block);
          continue;
        }
        const key = keyForCell(r, c);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cw-cell";
        if (related.has(key)) cell.classList.add("related");
        if (state.selected?.row === r && state.selected?.col === c) cell.classList.add("selected");
        if (state.incorrect.has(key)) cell.classList.add("incorrect");
        if (state.revealed.has(key)) cell.classList.add("revealed");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `Crossword square row ${r + 1} column ${c + 1}`);
        if (starts.has(key)) {
          const num = document.createElement("span");
          num.className = "cw-number";
          num.textContent = starts.get(key);
          cell.appendChild(num);
        }
        const letter = document.createElement("span");
        letter.textContent = state.values[key] || "";
        cell.appendChild(letter);
        boardEl.appendChild(cell);
      }
    }

    const renderClues = (dir, target) => {
      target.innerHTML = "";
      state.entries
        .filter((entry) => entry.dir === dir)
        .sort((a, b) => a.number - b.number)
        .forEach((entry) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "clue-btn";
          if (entry.id === state.activeEntryId) button.classList.add("active");
          if (isEntrySolved(entry)) button.classList.add("solved");
          button.dataset.entry = entry.id;
          button.innerHTML = `<strong>${entry.number}</strong> ${entry.clue}`;
          target.appendChild(button);
        });
    };
    renderClues("across", acrossEl);
    renderClues("down", downEl);
    updateStats();
  }

  function moveWithinEntry(offset) {
    const entry = getActiveEntry();
    if (!entry || !state.selected) return;
    const index = entry.cells.findIndex((cell) => cell.row === state.selected.row && cell.col === state.selected.col);
    const nextIndex = Math.max(0, Math.min(entry.cells.length - 1, index + offset));
    state.selected = { ...entry.cells[nextIndex] };
    render();
  }

  function enterLetter(letter) {
    if (!state.selected || state.solved) return;
    const key = keyForCell(state.selected.row, state.selected.col);
    state.values[key] = letter.toUpperCase();
    state.incorrect.delete(key);
    save();
    if (isComplete()) {
      finishPuzzle();
      return;
    }
    moveWithinEntry(1);
  }

  function eraseLetter() {
    if (!state.selected || state.solved) return;
    const key = keyForCell(state.selected.row, state.selected.col);
    if (state.values[key]) {
      delete state.values[key];
      state.incorrect.delete(key);
      save();
      render();
    } else {
      moveWithinEntry(-1);
      const prevKey = keyForCell(state.selected.row, state.selected.col);
      delete state.values[prevKey];
      state.incorrect.delete(prevKey);
      save();
      render();
    }
  }

  function isComplete() {
    return state.entries.every(isEntrySolved);
  }

  function checkPuzzle() {
    state.incorrect.clear();
    let filled = 0;
    let wrong = 0;
    for (let r = 0; r < state.height; r += 1) {
      for (let c = 0; c < state.width; c += 1) {
        if (!state.grid[r][c]) continue;
        const key = keyForCell(r, c);
        const value = state.values[key];
        if (!value) continue;
        filled += 1;
        if (value !== state.grid[r][c]) {
          state.incorrect.add(key);
          wrong += 1;
        }
      }
    }
    render();
    if (wrong) setMessage(`${wrong} letter${wrong === 1 ? "" : "s"} need another look.`, "error");
    else if (isComplete()) finishPuzzle();
    else setMessage(filled ? "Everything filled so far is correct." : "No letters to check yet.", "success");
  }

  function hintLetter() {
    if (!state.selected || state.solved) return;
    const key = keyForCell(state.selected.row, state.selected.col);
    state.values[key] = state.grid[state.selected.row][state.selected.col];
    state.revealed.add(key);
    state.incorrect.delete(key);
    state.hintsUsed += 1;
    save();
    setMessage("One letter revealed.");
    if (isComplete()) finishPuzzle();
    else {
      moveWithinEntry(1);
      render();
    }
  }

  function clearPuzzle() {
    state.values = {};
    state.incorrect.clear();
    state.revealed.clear();
    state.hintsUsed = 0;
    state.elapsed = 0;
    save();
    render();
    setMessage("Puzzle cleared.");
  }

  function finishPuzzle() {
    state.solved = true;
    clearInterval(timerId);
    render();
    save();
    winSummary.textContent = `Time: ${formatTime(state.elapsed)} · Hints used: ${state.hintsUsed}`;
    winModal.classList.add("open");
    winModal.setAttribute("aria-hidden", "false");
    setMessage("Crossword solved!", "success");
  }

  function buildKeyboard() {
    const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    keyboardEl.innerHTML = "";
    keys.forEach((letter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cw-key";
      button.textContent = letter;
      button.dataset.key = letter;
      keyboardEl.appendChild(button);
    });
    const erase = document.createElement("button");
    erase.type = "button";
    erase.className = "cw-key wide";
    erase.textContent = "⌫";
    erase.dataset.key = "Backspace";
    erase.setAttribute("aria-label", "Backspace");
    keyboardEl.appendChild(erase);
  }

  boardEl.addEventListener("click", (event) => {
    const cell = event.target.closest(".cw-cell");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const same = state.selected?.row === row && state.selected?.col === col;
    chooseCell(row, col, same);
  });

  [acrossEl, downEl].forEach((container) => container.addEventListener("click", (event) => {
    const button = event.target.closest(".clue-btn");
    if (!button) return;
    const entry = state.entries.find((item) => item.id === button.dataset.entry);
    if (!entry) return;
    state.activeEntryId = entry.id;
    state.selected = { ...entry.cells[0] };
    render();
  }));

  keyboardEl.addEventListener("click", (event) => {
    const button = event.target.closest(".cw-key");
    if (!button) return;
    if (button.dataset.key === "Backspace") eraseLetter();
    else enterLetter(button.dataset.key);
  });

  document.addEventListener("keydown", (event) => {
    if (!state || state.solved) return;
    if (event.target && ["INPUT","SELECT","TEXTAREA"].includes(event.target.tagName)) return;
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      enterLetter(event.key);
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      eraseLetter();
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      if (state.selected) chooseCell(state.selected.row, state.selected.col, true);
      return;
    }
    if (!state.selected) return;
    const delta = {
      ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1]
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    const row = state.selected.row + delta[0];
    const col = state.selected.col + delta[1];
    if (row >= 0 && row < state.height && col >= 0 && col < state.width && state.grid[row][col]) {
      chooseCell(row, col, false);
    }
  });

  document.getElementById("new-puzzle").addEventListener("click", () => startPuzzle({ daily: false }));
  dailyBtn.addEventListener("click", () => startPuzzle({ daily: dailyBtn.getAttribute("aria-pressed") !== "true" }));
  document.getElementById("check-puzzle").addEventListener("click", checkPuzzle);
  document.getElementById("hint-letter").addEventListener("click", hintLetter);
  document.getElementById("clear-puzzle").addEventListener("click", clearPuzzle);
  document.getElementById("play-again").addEventListener("click", () => startPuzzle({ daily: false }));
  winModal.addEventListener("click", (event) => {
    if (event.target === winModal) {
      winModal.classList.remove("open");
      winModal.setAttribute("aria-hidden", "true");
    }
  });

  buildKeyboard();
  startPuzzle({ daily: false });
})();
