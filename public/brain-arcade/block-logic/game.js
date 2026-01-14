/* ============================================================
   BLOCK LOGIC — FULL DRAG & DROP ENGINE (Touch + Mouse)
   ============================================================ */

const GRID_SIZE = 10;
let CELL_SIZE = 0; // Calculated dynamically

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
let dragging = false;
let ghostEl = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentGhostRow = null;
let currentGhostCol = null;

let currentScore = 0;
let bestScore = parseInt(localStorage.getItem("blocklogic_best")) || 0;
let streak = 0;

const gridEl = document.getElementById("grid");
const bestScoreEl = document.getElementById("best-score");
const currentScoreEl = document.getElementById("current-score");
const pieceEls = document.querySelectorAll(".piece");
const floatingTextContainer = document.getElementById("floating-text-container");

bestScoreEl.textContent = bestScore;

/* ============================================================
   INITIALIZE GRID
   ============================================================ */
function initGrid() {
  gridEl.innerHTML = "";
  gridState = [];

  const gridWidth = gridEl.clientWidth;
  CELL_SIZE = gridWidth / GRID_SIZE;

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      gridEl.appendChild(cell);
      row.push(0);
    }
    gridState.push(row);
  }
}

/* ============================================================
   RENDER PIECES
   ============================================================ */
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
          cell.style.width = "18px";
          cell.style.height = "18px";
        }
        pieceGrid.appendChild(cell);
      }
    }

    container.appendChild(pieceGrid);

    // Add drag listeners
    container.addEventListener("touchstart", e => startDrag(e, i), { passive: false });
    container.addEventListener("mousedown", e => startDrag(e, i));
  });
}

/* ============================================================
   DRAG START
   ============================================================ */
function startDrag(e, index) {
  const pieceEl = pieceEls[index];
  if (pieceEl.classList.contains("disabled")) return;

  dragging = true;
  selectedPieceIndex = index;

  const pieceDef = JSON.parse(pieceEl.dataset.piece);

  // Create ghost element
  ghostEl = createGhostPiece(pieceDef);
  document.body.appendChild(ghostEl);

  pieceEl.style.opacity = "0.3";

  const pos = getEventPos(e);
  dragOffsetX = ghostEl.offsetWidth / 2;
  dragOffsetY = ghostEl.offsetHeight / 2;

  moveGhost(pos.x, pos.y);

  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("touchend", onDragEnd);
  document.addEventListener("mouseup", onDragEnd);
}

/* ============================================================
   CREATE GHOST PIECE
   ============================================================ */
function createGhostPiece(piece) {
  const ghost = document.createElement("div");
  ghost.className = "ghost-piece";
  ghost.style.position = "absolute";
  ghost.style.pointerEvents = "none";
  ghost.style.opacity = "0.8";
  ghost.style.transform = "scale(1.1)";

  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  ghost.style.display = "grid";
  ghost.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
  ghost.style.gap = "4px";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      if (piece.shape[r][c]) {
        cell.className = `piece-cell ${COLORS[piece.color]}`;
        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
      } else {
        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
        cell.style.opacity = "0";
      }
      ghost.appendChild(cell);
    }
  }

  return ghost;
}

/* ============================================================
   DRAG MOVE
   ============================================================ */
function onDragMove(e) {
  if (!dragging) return;

  e.preventDefault();
  const pos = getEventPos(e);
  moveGhost(pos.x, pos.y);

  const gridRect = gridEl.getBoundingClientRect();
  const pieceDef = JSON.parse(pieceEls[selectedPieceIndex].dataset.piece);

  const ghostTopLeftX = pos.x - dragOffsetX;
  const ghostTopLeftY = pos.y - dragOffsetY;

  const col = Math.floor((ghostTopLeftX - gridRect.left) / CELL_SIZE);
  const row = Math.floor((ghostTopLeftY - gridRect.top) / CELL_SIZE);

  currentGhostRow = row;
  currentGhostCol = col;

  highlightPlacement(pieceDef, row, col);
}

/* ============================================================
   MOVE GHOST
   ============================================================ */
function moveGhost(x, y) {
  ghostEl.style.left = `${x - dragOffsetX}px`;
  ghostEl.style.top = `${y - dragOffsetY}px`;
}

/* ============================================================
   HIGHLIGHT VALID / INVALID PLACEMENT
   ============================================================ */
function highlightPlacement(piece, row, col) {
  clearHighlights();

  const valid = canPlacePiece(piece, row, col);

  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!piece.shape[r][c]) continue;

      const rr = row + r;
      const cc = col + c;

      if (rr < 0 || rr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) continue;

      const cell = gridEl.children[rr * GRID_SIZE + cc];
      cell.style.background = valid ? "#2ecc71" : "#e74c3c";
    }
  }
}

/* ============================================================
   CLEAR HIGHLIGHTS
   ============================================================ */
function clearHighlights() {
  gridEl.querySelectorAll(".cell").forEach(cell => {
    cell.style.background = "";
  });
}

/* ============================================================
   DRAG END
   ============================================================ */
function onDragEnd() {
  if (!dragging) return;

  dragging = false;

  const pieceEl = pieceEls[selectedPieceIndex];
  const pieceDef = JSON.parse(pieceEl.dataset.piece);

  if (canPlacePiece(pieceDef, currentGhostRow, currentGhostCol)) {
    placePiece(pieceDef, currentGhostRow, currentGhostCol);
    pieceEl.classList.add("disabled");
  } else {
    pieceEl.style.opacity = "1";
  }

  ghostEl.remove();
  ghostEl = null;

  clearHighlights();

  selectedPieceIndex = null;

  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("touchend", onDragEnd);
  document.removeEventListener("mouseup", onDragEnd);

  if (allPiecesUsed()) renderPieces();
  if (isGameOver()) alert("Game Over");
}

/* ============================================================
   GET EVENT POSITION
   ============================================================ */
function getEventPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

/* ============================================================
   CHECK IF PIECE FITS
   ============================================================ */
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

/* ============================================================
   PLACE PIECE
   ============================================================ */
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

  const cleared = checkLines();
  applyScoring(piece, cleared);
}

/* ============================================================
   CHECK LINES
   ============================================================ */
function checkLines() {
  let cleared = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (gridState[r].every(v => v !== 0)) cleared.push({ type: "row", index: r });
  }

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

/* ============================================================
   CLEAR LINES
   ============================================================ */
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
  }, 280);
}

/* ============================================================
   SCORING
   ============================================================ */
function applyScoring(piece, cleared) {
  let lines = cleared.length;

  if (lines > 0) {
    currentScore += lines * 10;

    if (lines >= 2) {
      let bonus = lines === 2 ? 15 :
                  lines === 3 ? 30 :
                  lines === 4 ? 50 : 100;
      currentScore += bonus;
      showFloatingText(`Combo x${lines}! +${bonus}`);
    }

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

  if (isBoardEmpty()) {
    currentScore += 500;
    gridEl.classList.add("full-board-flash");
    showFloatingText("+500 Full Clear!");

    setTimeout(() => gridEl.classList.remove("full-board-flash"), 450);
  }

  bumpScore();
}

/* ============================================================
   SCORE ANIMATION
   ============================================================ */
function bumpScore() {
  currentScoreEl.textContent = currentScore;
  currentScoreEl.classList.add("score-bump");
  setTimeout(() => currentScoreEl.classList.remove("score-bump"), 250);

  if (currentScore > bestScore) {
    bestScore = currentScore;
    bestScoreEl.textContent = bestScore;
    localStorage.setItem("blocklogic_best", bestScore);
  }
}

/* ============================================================
   FLOATING TEXT
   ============================================================ */
function showFloatingText(text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  floatingTextContainer.appendChild(el);

  setTimeout(() => el.remove(), 1000);
}

/* ============================================================
   CHECK IF BOARD EMPTY
   ============================================================ */
function isBoardEmpty() {
  return gridState.every(row => row.every(v => v === 0));
}

/* ============================================================
   CHECK IF ALL PIECES USED
   ============================================================ */
function allPiecesUsed() {
  return [...pieceEls].every(el => el.classList.contains("disabled"));
}

/* ============================================================
   GAME OVER CHECK
   ============================================================ */
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

/* ============================================================
   START GAME
   ============================================================ */
initGrid();
renderPieces();
