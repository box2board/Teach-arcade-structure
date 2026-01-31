const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("new-game");
const undoBtn = document.getElementById("undo");

const SIZE = 8;
const RED = 1;
const RED_KING = 2;
const YELLOW = -1;
const YELLOW_KING = -2;

let board = [];
let currentPlayer = RED;
let selected = null;
let legalMoves = [];
let forcedCaptureMap = new Map();
let mustContinue = false;
let history = [];
let gameOver = false;
let pendingSnapshot = null;

const directions = {
  [RED]: [{ r: -1, c: -1 }, { r: -1, c: 1 }],
  [YELLOW]: [{ r: 1, c: -1 }, { r: 1, c: 1 }]
};

const kingDirections = [
  { r: -1, c: -1 },
  { r: -1, c: 1 },
  { r: 1, c: -1 },
  { r: 1, c: 1 }
];

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if ((r + c) % 2 === 1) {
        board[r][c] = YELLOW;
      }
    }
  }
  for (let r = SIZE - 3; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if ((r + c) % 2 === 1) {
        board[r][c] = RED;
      }
    }
  }
  currentPlayer = RED;
  selected = null;
  legalMoves = [];
  forcedCaptureMap.clear();
  mustContinue = false;
  history = [];
  gameOver = false;
  pendingSnapshot = null;
  updateUndo();
  updateStatus("Red goes first.");
  renderBoard();
}

function cloneBoard(source) {
  return source.map((row) => row.slice());
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function getPieceValue(r, c) {
  return board[r][c];
}

function isPlayerPiece(value, player) {
  if (player === RED) {
    return value === RED || value === RED_KING;
  }
  return value === YELLOW || value === YELLOW_KING;
}

function isOpponentPiece(value, player) {
  if (player === RED) {
    return value === YELLOW || value === YELLOW_KING;
  }
  return value === RED || value === RED_KING;
}

function isKing(value) {
  return Math.abs(value) === 2;
}

function getAvailableMoves(r, c, player) {
  const piece = getPieceValue(r, c);
  if (!isPlayerPiece(piece, player)) {
    return { moves: [], captures: [] };
  }
  const dirs = isKing(piece) ? kingDirections : directions[player];
  const moves = [];
  const captures = [];

  dirs.forEach((dir) => {
    const nr = r + dir.r;
    const nc = c + dir.c;
    if (!inBounds(nr, nc)) {
      return;
    }
    if (board[nr][nc] === 0) {
      moves.push({ to: [nr, nc] });
      return;
    }
    if (isOpponentPiece(board[nr][nc], player)) {
      const jumpR = nr + dir.r;
      const jumpC = nc + dir.c;
      if (inBounds(jumpR, jumpC) && board[jumpR][jumpC] === 0) {
        captures.push({ to: [jumpR, jumpC], capture: [nr, nc] });
      }
    }
  });

  return { moves, captures };
}

function computeForcedCaptures(player) {
  forcedCaptureMap.clear();
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (!isPlayerPiece(board[r][c], player)) {
        continue;
      }
      const available = getAvailableMoves(r, c, player);
      if (available.captures.length > 0) {
        forcedCaptureMap.set(`${r}-${c}`, available.captures);
      }
    }
  }
}

function buildLegalMoves(r, c) {
  if (!isPlayerPiece(board[r][c], currentPlayer)) {
    legalMoves = [];
    return;
  }
  if (mustContinue && selected && (selected.r !== r || selected.c !== c)) {
    legalMoves = [];
    return;
  }
  const available = getAvailableMoves(r, c, currentPlayer);
  if (forcedCaptureMap.size > 0) {
    legalMoves = available.captures;
    return;
  }
  legalMoves = available.captures.length > 0 ? available.captures : available.moves;
}

function hasAnyMoves(player) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (!isPlayerPiece(board[r][c], player)) {
        continue;
      }
      const { moves, captures } = getAvailableMoves(r, c, player);
      if (moves.length > 0 || captures.length > 0) {
        return true;
      }
    }
  }
  return false;
}

function countPieces(player) {
  let total = 0;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (isPlayerPiece(board[r][c], player)) {
        total += 1;
      }
    }
  }
  return total;
}

function updateStatus(message) {
  statusEl.textContent = message;
}

function updateUndo() {
  undoBtn.disabled = history.length === 0;
}

function renderBoard() {
  boardEl.innerHTML = "";
  computeForcedCaptures(currentPlayer);

  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.row = r;
      square.dataset.col = c;
      square.setAttribute("role", "gridcell");
      square.setAttribute("aria-label", `Row ${r + 1} Column ${c + 1}`);

      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      }

      const hint = legalMoves.find((move) => move.to[0] === r && move.to[1] === c);
      if (hint) {
        square.classList.add(hint.capture ? "capture-hint" : "hint");
      }

      const value = board[r][c];
      if (value !== 0) {
        const piece = document.createElement("div");
        piece.className = `piece ${value > 0 ? "red" : "yellow"}`;
        if (isKing(value)) {
          const badge = document.createElement("span");
          badge.className = "king-badge";
          badge.textContent = "K";
          piece.appendChild(badge);
        }
        square.appendChild(piece);
      }
      boardEl.appendChild(square);
    }
  }

  if (gameOver) {
    return;
  }

  const playerLabel = currentPlayer === RED ? "Red" : "Yellow";
  if (mustContinue) {
    updateStatus(`${playerLabel}, continue capturing with the same piece.`);
    return;
  }
  if (forcedCaptureMap.size > 0) {
    updateStatus(`${playerLabel} to move. Capture required.`);
    return;
  }
  updateStatus(`${playerLabel} to move.`);
}

function handleSelection(r, c) {
  if (gameOver) {
    return;
  }
  if (mustContinue && selected && (selected.r !== r || selected.c !== c)) {
    return;
  }
  if (!isPlayerPiece(board[r][c], currentPlayer)) {
    return;
  }
  if (forcedCaptureMap.size > 0 && !forcedCaptureMap.has(`${r}-${c}`)) {
    return;
  }
  selected = { r, c };
  buildLegalMoves(r, c);
  renderBoard();
}

function applyMove(from, move) {
  if (!pendingSnapshot) {
    pendingSnapshot = {
      board: cloneBoard(board),
      currentPlayer
    };
  }

  const [toR, toC] = move.to;
  const piece = board[from.r][from.c];
  board[from.r][from.c] = 0;
  board[toR][toC] = piece;

  if (move.capture) {
    const [capR, capC] = move.capture;
    board[capR][capC] = 0;
  }

  if (piece === RED && toR === 0) {
    board[toR][toC] = RED_KING;
  }
  if (piece === YELLOW && toR === SIZE - 1) {
    board[toR][toC] = YELLOW_KING;
  }

  if (move.capture) {
    selected = { r: toR, c: toC };
    const nextCaptures = getAvailableMoves(toR, toC, currentPlayer).captures;
    if (nextCaptures.length > 0) {
      mustContinue = true;
      legalMoves = nextCaptures;
      renderBoard();
      return;
    }
  }

  finishTurn();
}

function finishTurn() {
  mustContinue = false;
  selected = null;
  legalMoves = [];

  if (pendingSnapshot) {
    history.push(pendingSnapshot);
    pendingSnapshot = null;
  }
  updateUndo();

  currentPlayer = currentPlayer === RED ? YELLOW : RED;

  const opponentPieces = countPieces(currentPlayer);
  const opponentMoves = hasAnyMoves(currentPlayer);
  if (opponentPieces === 0 || !opponentMoves) {
    gameOver = true;
    const winner = currentPlayer === RED ? "Yellow" : "Red";
    updateStatus(`${winner} wins!`);
    renderBoard();
    return;
  }

  renderBoard();
}

function handleMove(r, c) {
  if (!selected) {
    handleSelection(r, c);
    return;
  }

  if (selected.r === r && selected.c === c) {
    if (!mustContinue) {
      selected = null;
      legalMoves = [];
      renderBoard();
    }
    return;
  }

  const move = legalMoves.find((option) => option.to[0] === r && option.to[1] === c);
  if (!move) {
    if (!mustContinue) {
      handleSelection(r, c);
    }
    return;
  }

  applyMove(selected, move);
}

boardEl.addEventListener("click", (event) => {
  const target = event.target.closest("button.square");
  if (!target) {
    return;
  }
  const r = Number(target.dataset.row);
  const c = Number(target.dataset.col);
  handleMove(r, c);
});

newGameBtn.addEventListener("click", () => {
  initBoard();
});

undoBtn.addEventListener("click", () => {
  const snapshot = history.pop();
  if (!snapshot) {
    return;
  }
  board = cloneBoard(snapshot.board);
  currentPlayer = snapshot.currentPlayer;
  selected = null;
  legalMoves = [];
  mustContinue = false;
  gameOver = false;
  pendingSnapshot = null;
  updateUndo();
  renderBoard();
});

initBoard();
