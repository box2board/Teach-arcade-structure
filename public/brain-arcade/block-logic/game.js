/* ============================
   BLOCK LOGIC — GAME ENGINE
   ============================ */

const GRID_SIZE = 10;

const COLORS = {
  1: "color-1",
  2: "color-2",
  3: "color-3"
};

/* PIECE DEFINITIONS */
const PIECES = [
  { color: 1, shape: [[1,1,1],[1,1,1],[1,1,1]] },
  { color: 2, shape: [[1],[1],[1],[1]] },
  { color: 3, shape: [[1,0],[1,0],[1,1],[1,0]] },
  { color: 1, shape: [[1,1],[1,1]] },
  { color: 2, shape: [[1]] },
  { color: 3, shape: [[1,1,1]] },
  { color: 1, shape: [[1],[1],[1],[1],[1]] },
  { color: 2, shape: [[1,1,1],[0,1,0]] },
  { color: 3, shape: [[1,1,0],[0,1,1]] }
];

let gridState = [];
let selectedPieceIndex = null;
let currentScore = 0;
let bestScore = parseInt(localStorage.getItem("blocklogic_best")) || 0;
let streak = 0;

const gridEl = document.getElementById("grid");
const bestScoreEl = document.getElementById("best-score");
const currentScoreEl = document.getElementById("current-score");
const pieceEls = document.querySelectorAll(".piece");
const floatingTextContainer = document.getElementById("floating-text-container");

bestScoreEl.textContent = bestScore;

/* INITIALIZE GRID */
function initGrid() {
  gridEl.innerHTML = "";
  gridState = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("click", onCellClick);
      gridEl.appendChild(cell);
      row.push(0);
    }
    gridState.push(row);
  }
}

/* RENDER PIECES */
function renderPieces() {
  pieceEls.forEach((container, i) => {
    container.innerHTML = "";
    container.classList.remove("disabled");

    const def = PIECES[Math.floor(Math.random() * PIECES.length)];
    container.dataset.piece = JSON.stringify(def);

    const rows = def.shape.length;
    const cols = def.shape[0].length;

    const pieceGrid = document.createElement("div");
    pieceGrid.className = "piece-grid";
    pieceGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        if (def.shape[r][c]) {
          cell.className = `piece-cell ${COLORS[def.color]}`;
        } else {
          cell.style.width = "14px";
          cell.style.height = "14px";
        }
        pieceGrid.appendChild(cell);
      }
    }

    container.appendChild(pieceGrid);
    container.onclick = () => onPieceClick(i);
  });
}

/* SELECT PIECE */
function onPieceClick(index) {
  const pieceEl = pieceEls[index];
  if (pieceEl.classList.contains("disabled")) return;

  selectedPieceIndex = index;

  pieceEls.forEach((el, i) => {
    el.style.outline = i === index ? "2px solid #ffd166" : "none";
  });
}

/* PLACE PIECE */
function onCellClick(e) {
  if (selectedPieceIndex === null) return;

  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  const pieceEl = pieceEls[selectedPieceIndex];
  const pieceDef = JSON.parse(pieceEl.dataset.piece);

  if (canPlacePiece(pieceDef, row, col)) {
    placePiece(pieceDef, row, col);
    pieceEl.classList.add("disabled");
    pieceEl.style.outline = "none";
    selectedPieceIndex = null;

    const cleared = checkLines();
    applyScoring(pieceDef, cleared);

    if (allPiecesUsed()) renderPieces();
    if (isGameOver()) alert("Game Over");
  }
}

/* CHECK IF PIECE FITS */
function canPlacePiece(piece, startRow, startCol) {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!piece.shape[r][c]) continue;

      const rr = startRow + r;
      const cc = startCol + c;

      if (rr < 0 || rr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) return false;
      if (gridState[rr][cc] !== 0) return false;
    }
  }
  return true;
}

/* PLACE PIECE ON GRID */
function placePiece(piece, startRow, startCol) {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  let blockCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!piece.shape[r][c]) continue;

      const rr = startRow + r;
      const cc = startCol + c;

      gridState[rr][cc] = piece.color;

      const cellEl = gridEl.children[rr * GRID_SIZE + cc];
      cellEl.classList.add("filled", COLORS[piece.color], "pop");

      blockCount++;
    }
  }

  currentScore += blockCount;
  bumpScore();
}

/* CHECK LINES */
function checkLines() {
  let cleared = [];

  // Rows
  for (let r = 0; r < GRID_SIZE; r++) {
    if (gridState[r].every(v => v !== 0)) cleared.push({ type: "row", index: r });
  }

  // Columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (gridState[r][c] === 0) full = false;
    }
    if (full) cleared.push({ type: "col", index: c });
  }

  clearLines(cleared);
  return cleared;
}

/* CLEAR LINES */
function clearLines(lines) {
  lines.forEach(line => {
    if (line.type === "row") {
      for (let c = 0; c < GRID_SIZE; c++) {
        gridState[line.index][c] = 0;
        const cell = gridEl.children[line.index * GRID_SIZE + c];
        cell.className = "cell clear-anim";
      }
    } else {
      for (let r = 0; r < GRID_SIZE; r++) {
        gridState[r][line.index] = 0;
        const cell = gridEl.children[r * GRID_SIZE + line.index];
        cell.className = "cell clear-anim";
      }
    }
  });

  setTimeout(() => {
    gridEl.querySelectorAll(".clear-anim").forEach(cell => {
      cell.className = "cell";
    });
  }, 250);
}

/* SCORING */
function applyScoring(piece, cleared) {
  let lines = cleared.length;

  if (lines > 0) {
    currentScore += lines * 10;

    // Combo
    if (lines >= 2) {
      let bonus = lines === 2 ? 15 :
                  lines === 3 ? 30 :
                  lines === 4 ? 50 : 100;
      currentScore += bonus;
      showFloatingText(`Combo x${lines}! +${bonus}`);
    }

    // Streak
    streak++;
    if (streak >= 2) {
      let bonus = streak === 2 ? 5 :
                  streak === 3 ? 10 : 20;
      currentScore += bonus;
      showFloatingText(`Streak x${streak}! +${bonus}`);
    }
  } else {
    streak = 0;
  }

  // Full board clear
  if (isBoardEmpty()) {
    currentScore += 500;
    gridEl.classList.add("full-board-flash");
    showFloatingText("+500 Full Clear!");

    setTimeout(() => gridEl.classList.remove("full-board-flash"), 400);
  }

  bumpScore();
}

/* SCORE ANIMATION */
function bumpScore() {
  currentScoreEl.textContent = currentScore;
  currentScoreEl.classList.add("score-bump");
  setTimeout(() => currentScoreEl.classList.remove("score-bump"), 200);

  if (currentScore > bestScore) {
    bestScore = currentScore;
    bestScoreEl.textContent = bestScore;
    localStorage.setItem("blocklogic_best", bestScore);
  }
}

/* FLOATING TEXT */
function showFloatingText(text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  floatingTextContainer.appendChild(el);

  setTimeout(() => el.remove(), 1000);
}

/* CHECK IF BOARD EMPTY */
function isBoardEmpty() {
  return gridState.every(row => row.every(v => v === 0));
}

/* CHECK IF ALL PIECES USED */
function allPiecesUsed() {
  return [...pieceEls].every(el => el.classList.contains("disabled"));
}

/* GAME OVER CHECK */
function isGameOver() {
  for (let i = 0; i < pieceEls.length; i++) {
    const el = pieceEls[i];
    if (el.classList.contains("disabled")) continue;

    const pieceDef = JSON.parse(el.dataset.piece);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlacePiece(pieceDef, r, c)) return false;
      }
    }
  }
  return true;
}

/* START GAME */
initGrid();
renderPieces();
