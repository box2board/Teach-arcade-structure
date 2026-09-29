const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("new-game");
const undoBtn = document.getElementById("undo");
const redCountEl = document.getElementById("red-count");
const yellowCountEl = document.getElementById("yellow-count");
const modeComputerBtn = document.getElementById("mode-computer");
const modeTwoPlayerBtn = document.getElementById("mode-two-player");

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
let gameMode = "computer";
let computerThinking = false;
let computerTimer = null;

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
  clearTimeout(computerTimer);
  computerThinking = false;
  boardEl.classList.remove("computer-turn");
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
  updateStatus(gameMode === "computer" ? "Your turn. Red goes first." : "Red goes first.");
  syncModeUI();
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

function syncModeUI() {
  const vsComputer = gameMode === "computer";
  modeComputerBtn.classList.toggle("active", vsComputer);
  modeTwoPlayerBtn.classList.toggle("active", !vsComputer);
  modeComputerBtn.setAttribute("aria-pressed", String(vsComputer));
  modeTwoPlayerBtn.setAttribute("aria-pressed", String(!vsComputer));
}

function setGameMode(mode) {
  if (mode !== "computer" && mode !== "two-player") return;
  gameMode = mode;
  initBoard();
}

function isComputerTurn() {
  return gameMode === "computer" && currentPlayer === YELLOW && !gameOver;
}

function collectLegalChoices(player) {
  computeForcedCaptures(player);
  const capturesRequired = forcedCaptureMap.size > 0;
  const choices = [];

  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (!isPlayerPiece(board[r][c], player)) continue;
      const available = getAvailableMoves(r, c, player);
      const moves = capturesRequired ? available.captures : (available.captures.length ? available.captures : available.moves);
      moves.forEach((move) => choices.push({ from: { r, c }, move }));
    }
  }
  return choices;
}

function scoreComputerChoice(choice) {
  const piece = board[choice.from.r][choice.from.c];
  const [toR, toC] = choice.move.to;
  let score = 0;

  if (choice.move.capture) score += 100;
  if (piece === YELLOW && toR === SIZE - 1) score += 70;
  if (piece === YELLOW_KING) score += 8;

  // Prefer useful central squares and forward progress.
  const centerDistance = Math.abs(3.5 - toR) + Math.abs(3.5 - toC);
  score += Math.max(0, 12 - centerDistance * 2);
  if (piece === YELLOW) score += toR * 2;

  // Avoid obvious immediate capture when possible.
  const original = board[toR][toC];
  board[choice.from.r][choice.from.c] = 0;
  board[toR][toC] = piece;
  if (choice.move.capture) {
    const [capR, capC] = choice.move.capture;
    const captured = board[capR][capC];
    board[capR][capC] = 0;
    const threatened = collectLegalChoices(RED).some((reply) =>
      reply.move.capture && reply.move.capture[0] === toR && reply.move.capture[1] === toC
    );
    if (threatened) score -= 24;
    board[capR][capC] = captured;
  } else {
    const threatened = collectLegalChoices(RED).some((reply) =>
      reply.move.capture && reply.move.capture[0] === toR && reply.move.capture[1] === toC
    );
    if (threatened) score -= 24;
  }
  board[toR][toC] = original;
  board[choice.from.r][choice.from.c] = piece;

  return score + Math.random() * 4;
}

function chooseComputerMove() {
  const choices = collectLegalChoices(YELLOW);
  if (!choices.length) return null;
  return choices
    .map((choice) => ({ ...choice, score: scoreComputerChoice(choice) }))
    .sort((a, b) => b.score - a.score)[0];
}

function queueComputerTurn(delay = 420) {
  if (!isComputerTurn() || computerThinking) return;
  computerThinking = true;
  boardEl.classList.add("computer-turn");
  updateStatus("Computer thinking…");
  clearTimeout(computerTimer);
  computerTimer = setTimeout(runComputerTurn, delay);
}

function runComputerTurn() {
  if (!isComputerTurn()) {
    computerThinking = false;
    boardEl.classList.remove("computer-turn");
    return;
  }

  computerThinking = false;
  boardEl.classList.remove("computer-turn");

  // During a multi-jump, continue with the selected piece only.
  let choice = null;
  if (mustContinue && selected) {
    const captures = getAvailableMoves(selected.r, selected.c, YELLOW).captures;
    if (captures.length) {
      choice = captures
        .map((move) => ({ from: { ...selected }, move, score: scoreComputerChoice({ from: selected, move }) }))
        .sort((a, b) => b.score - a.score)[0];
    }
  } else {
    choice = chooseComputerMove();
  }

  if (!choice) {
    gameOver = true;
    updateStatus("Red wins!");
    renderBoard();
    return;
  }

  selected = { ...choice.from };
  legalMoves = [choice.move];
  applyMove(selected, choice.move);
}



function renderBoard() {
  boardEl.innerHTML = "";
  computeForcedCaptures(currentPlayer);

  let redCount = 0;
  let yellowCount = 0;
  board.forEach((row) => row.forEach((value) => {
    if (value > 0) redCount += 1;
    if (value < 0) yellowCount += 1;
  }));
  if (redCountEl) redCountEl.textContent = String(redCount);
  if (yellowCountEl) yellowCountEl.textContent = String(yellowCount);

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

  const playerLabel = currentPlayer === RED ? "Red" : (gameMode === "computer" ? "Computer" : "Yellow");
  if (mustContinue) {
    updateStatus(`${playerLabel}, continue capturing with the same piece.`);
    return;
  }
  if (forcedCaptureMap.size > 0) {
    updateStatus(`${playerLabel} to move. Capture required.`);
    return;
  }
  updateStatus(gameMode === "computer" && currentPlayer === RED ? "Your turn." : `${playerLabel} to move.`);
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
  const wasMan = piece === RED || piece === YELLOW;
  let crownedThisMove = false;
  board[from.r][from.c] = 0;
  board[toR][toC] = piece;

  if (move.capture) {
    const [capR, capC] = move.capture;
    board[capR][capC] = 0;
  }

  if (piece === RED && toR === 0) {
    board[toR][toC] = RED_KING;
    crownedThisMove = wasMan;
  }
  if (piece === YELLOW && toR === SIZE - 1) {
    board[toR][toC] = YELLOW_KING;
    crownedThisMove = wasMan;
  }

  // In American checkers, reaching the king row ends a man's capture turn.
  if (move.capture && crownedThisMove) {
    finishTurn();
    return;
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
  if (isComputerTurn()) queueComputerTurn();
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
  if (computerThinking || isComputerTurn()) return;
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

modeComputerBtn.addEventListener("click", () => setGameMode("computer"));
modeTwoPlayerBtn.addEventListener("click", () => setGameMode("two-player"));

undoBtn.addEventListener("click", () => {
  clearTimeout(computerTimer);
  computerThinking = false;
  boardEl.classList.remove("computer-turn");

  let snapshot = history.pop();
  if (!snapshot) {
    return;
  }

  // In computer mode, undo both the computer reply and the player's preceding turn.
  if (gameMode === "computer" && currentPlayer === RED && history.length > 0) {
    snapshot = history.pop();
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
  if (isComputerTurn()) queueComputerTurn();
});

syncModeUI();
initBoard();
