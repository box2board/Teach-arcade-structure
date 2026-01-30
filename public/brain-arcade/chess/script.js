const boardElement = document.getElementById("board");
const turnElement = document.getElementById("turn");
const modeSelect = document.getElementById("mode");
const sideSelect = document.getElementById("side");
const difficultySelect = document.getElementById("difficulty");
const newGameButton = document.getElementById("new-game");
const debugStatusElement = document.getElementById("debug-status");

const PIECES = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const PIECE_VALUES = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 999,
};

const INITIAL_BOARD = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

let board = [];
let turn = "white";
let selected = null;
let legalMoves = [];
let castlingRights = null;
let enPassantTarget = null;
let mode = "2p";
let playerColor = "white";
let cpuColor = "black";
let difficulty = "easy";
let cpuThinking = false;
let gameOver = false;
const isDebugAllowed = () => {
  const params = new URLSearchParams(window.location.search);
  const param = params.get("debug");
  if (param === "1" || param === "true") return true;
  try {
    const stored = window.localStorage?.getItem("chessDebug");
    return stored === "1" || stored === "true";
  } catch (error) {
    return false;
  }
};

const debugAllowed = isDebugAllowed();
let debugEnabled = debugAllowed;
let lastStatus = null;

const cloneBoard = (source) => source.map((row) => row.slice());

const pieceColor = (piece) => {
  if (piece === ".") return null;
  return piece === piece.toUpperCase() ? "white" : "black";
};

const getOppositeColor = (color) => (color === "white" ? "black" : "white");

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const getSquareIndex = (r, c) => r * 8 + c;

const getGameState = () => ({
  board,
  turn,
  castlingRights,
  enPassantTarget,
});

const assertTurnSynced = () => {
  if (!turnElement) return;
  const uiTurn = turnElement.dataset.turn;
  if (uiTurn && uiTurn !== turn) {
    console.warn(`Turn desync detected (ui=${uiTurn}, engine=${turn}). Using engine turn.`);
  }
  turnElement.dataset.turn = turn;
};

const renderBoard = () => {
  boardElement.innerHTML = "";
  const state = getGameState();
  const opponent = getOppositeColor(state.turn);
  const attackedSquares = debugEnabled ? getAttackedSquares(state, opponent) : null;
  const kingSquare = debugEnabled ? locateKingSquare(state.board, state.turn) : null;
  const inCheck = debugEnabled ? isKingInCheck(state, state.turn) : false;

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((r + c) % 2 === 0 ? "light" : "dark");
      square.dataset.r = r;
      square.dataset.c = c;

      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      }

      if (legalMoves.some((move) => move.to.r === r && move.to.c === c)) {
        square.classList.add("legal");
      }

      if (debugEnabled && attackedSquares && attackedSquares.has(getSquareIndex(r, c))) {
        square.classList.add("attacked");
      }

      if (debugEnabled && inCheck && kingSquare && kingSquare.r === r && kingSquare.c === c) {
        square.classList.add("in-check");
      }

      const piece = board[r][c];
      square.textContent = PIECES[piece] || "";
      square.addEventListener("click", () => handleSquareClick(r, c));
      boardElement.appendChild(square);
    }
  }
};

const updateTurnText = (status) => {
  turnElement.textContent = status.message;
  assertTurnSynced();
};

const updateDebugStatus = (status) => {
  if (!debugStatusElement) return;
  if (!debugEnabled) {
    debugStatusElement.hidden = true;
    debugStatusElement.textContent = "";
    return;
  }
  const current = status.details.turn === "white" ? "White" : "Black";
  debugStatusElement.hidden = false;
  debugStatusElement.textContent = `Turn: ${current} | In check: ${status.details.inCheck} | Legal moves: ${status.details.legalMoves}`;
};

const updateControlsForMode = () => {
  const isCpu = mode === "cpu";
  sideSelect.disabled = !isCpu;
  difficultySelect.disabled = !isCpu;
};

const applySettings = () => {
  mode = modeSelect.value;
  playerColor = sideSelect.value;
  cpuColor = playerColor === "white" ? "black" : "white";
  difficulty = difficultySelect.value;
  updateControlsForMode();
};

const resetGameState = () => {
  board = cloneBoard(INITIAL_BOARD);
  turn = "white";
  selected = null;
  legalMoves = [];
  castlingRights = {
    wK: true,
    wQ: true,
    bK: true,
    bQ: true,
  };
  enPassantTarget = null;
  cpuThinking = false;
  gameOver = false;
};

const startNewGame = () => {
  applySettings();
  resetGameState();
  refreshGameStatus();
  renderBoard();
  if (mode === "cpu" && playerColor === "black") {
    scheduleCpuMove();
  }
};

const refreshGameStatus = () => {
  const state = getGameState();
  lastStatus = getGameStatus(state);
  updateTurnText(lastStatus);
  updateDebugStatus(lastStatus);
  gameOver = ["checkmate", "stalemate", "draw"].includes(lastStatus.outcome);
};

const afterMoveUpdate = () => {
  refreshGameStatus();
};

const handleSquareClick = (r, c) => {
  if (cpuThinking || gameOver) return;
  if (mode === "cpu") {
    if (turn !== playerColor) return;
  }

  const piece = board[r][c];
  const color = pieceColor(piece);

  if (!selected) {
    if (color === turn) {
      selected = { r, c };
      legalMoves = getLegalMovesForSquare(getGameState(), r, c);
      renderBoard();
    }
    return;
  }

  const move = legalMoves.find((candidate) => candidate.to.r === r && candidate.to.c === c);
  if (move) {
    makeMove(move);
    return;
  }

  if (color === turn) {
    selected = { r, c };
    legalMoves = getLegalMovesForSquare(getGameState(), r, c);
    renderBoard();
    return;
  }

  selected = null;
  legalMoves = [];
  renderBoard();
};

const getLegalMovesForSquare = (state, r, c, color = state.turn) => {
  const piece = state.board[r][c];
  if (piece === ".") return [];
  if (pieceColor(piece) !== color) return [];

  const pseudoMoves = getPseudoLegalMoves(state, r, c, piece);
  return filterMovesThatLeaveKingInCheck(state, pseudoMoves, color);
};

const getAllLegalMoves = (state, color = state.turn) => {
  const moves = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (pieceColor(state.board[r][c]) === color) {
        moves.push(...getLegalMovesForSquare(state, r, c, color));
      }
    }
  }
  return moves;
};

const filterMovesThatLeaveKingInCheck = (state, pseudoMoves, color) =>
  pseudoMoves.filter((move) => {
    const simulated = applyMoveToBoard(state.board, move);
    return !isKingInCheck({ board: simulated }, color);
  });

const getPseudoLegalMoves = (state, r, c, piece) => {
  const moves = [];
  const color = pieceColor(piece);
  const opponent = color === "white" ? "black" : "white";
  const boardState = state.board;

  const addMove = (toR, toC, options = {}) => {
    if (!inBounds(toR, toC)) return;
    moves.push({
      from: { r, c },
      to: { r: toR, c: toC },
      piece,
      ...options,
    });
  };

  const isOpponentPiece = (target) => target !== "." && pieceColor(target) === opponent;

  switch (piece.toUpperCase()) {
    case "P": {
      const dir = color === "white" ? -1 : 1;
      const startRow = color === "white" ? 6 : 1;
      const lastRow = color === "white" ? 0 : 7;
      const oneStep = r + dir;
      if (inBounds(oneStep, c) && boardState[oneStep][c] === ".") {
        addMove(oneStep, c, { promotion: oneStep === lastRow ? "Q" : null });
        const twoStep = r + dir * 2;
        if (r === startRow && boardState[twoStep][c] === ".") {
          addMove(twoStep, c, { doubleStep: true });
        }
      }

      [-1, 1].forEach((dc) => {
        const captureR = r + dir;
        const captureC = c + dc;
        if (!inBounds(captureR, captureC)) return;
        const target = boardState[captureR][captureC];
        if (isOpponentPiece(target)) {
          addMove(captureR, captureC, { capture: true, promotion: captureR === lastRow ? "Q" : null });
        }
        if (
          state.enPassantTarget &&
          state.enPassantTarget.r === captureR &&
          state.enPassantTarget.c === captureC
        ) {
          addMove(captureR, captureC, { enPassant: true });
        }
      });
      break;
    }
    case "N": {
      const jumps = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ];
      jumps.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) return;
        const target = boardState[nr][nc];
        if (target === "." || isOpponentPiece(target)) {
          addMove(nr, nc, { capture: target !== "." });
        }
      });
      break;
    }
    case "B": {
      const directions = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      directions.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = boardState[nr][nc];
          if (target === ".") {
            addMove(nr, nc);
          } else {
            if (isOpponentPiece(target)) {
              addMove(nr, nc, { capture: true });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      });
      break;
    }
    case "R": {
      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      directions.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = boardState[nr][nc];
          if (target === ".") {
            addMove(nr, nc);
          } else {
            if (isOpponentPiece(target)) {
              addMove(nr, nc, { capture: true });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      });
      break;
    }
    case "Q": {
      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      directions.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = boardState[nr][nc];
          if (target === ".") {
            addMove(nr, nc);
          } else {
            if (isOpponentPiece(target)) {
              addMove(nr, nc, { capture: true });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      });
      break;
    }
    case "K": {
      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) return;
        const target = boardState[nr][nc];
        if (target === "." || isOpponentPiece(target)) {
          addMove(nr, nc, { capture: target !== "." });
        }
      });

      if (color === "white" && r === 7 && c === 4) {
        if (state.castlingRights.wK && canCastle(state, "white", "kingside")) {
          addMove(7, 6, { castle: "kingside" });
        }
        if (state.castlingRights.wQ && canCastle(state, "white", "queenside")) {
          addMove(7, 2, { castle: "queenside" });
        }
      }

      if (color === "black" && r === 0 && c === 4) {
        if (state.castlingRights.bK && canCastle(state, "black", "kingside")) {
          addMove(0, 6, { castle: "kingside" });
        }
        if (state.castlingRights.bQ && canCastle(state, "black", "queenside")) {
          addMove(0, 2, { castle: "queenside" });
        }
      }
      break;
    }
    default:
      break;
  }

  return moves;
};

const canCastle = (state, color, side) => {
  const boardState = state.board;
  const row = color === "white" ? 7 : 0;
  const opponent = getOppositeColor(color);
  if (isKingInCheck(state, color)) return false;
  const attackedSquares = getAttackedSquares(state, opponent);

  if (side === "kingside") {
    if (boardState[row][5] !== "." || boardState[row][6] !== ".") return false;
    const rook = boardState[row][7];
    if (rook !== (color === "white" ? "R" : "r")) return false;
    if (attackedSquares.has(getSquareIndex(row, 5))) return false;
    if (attackedSquares.has(getSquareIndex(row, 6))) return false;
    return true;
  }

  if (boardState[row][1] !== "." || boardState[row][2] !== "." || boardState[row][3] !== ".") {
    return false;
  }
  const rook = boardState[row][0];
  if (rook !== (color === "white" ? "R" : "r")) return false;
  if (attackedSquares.has(getSquareIndex(row, 3))) return false;
  if (attackedSquares.has(getSquareIndex(row, 2))) return false;
  return true;
};

const applyMoveToBoard = (boardState, move) => {
  const next = cloneBoard(boardState);
  const { from, to, piece } = move;
  next[from.r][from.c] = ".";

  if (move.enPassant) {
    const captureRow = pieceColor(piece) === "white" ? to.r + 1 : to.r - 1;
    next[captureRow][to.c] = ".";
  }

  if (move.castle) {
    const row = from.r;
    if (move.castle === "kingside") {
      const rook = next[row][7];
      next[row][7] = ".";
      next[row][5] = rook;
    } else {
      const rook = next[row][0];
      next[row][0] = ".";
      next[row][3] = rook;
    }
  }

  let placed = piece;
  if (move.promotion) {
    placed = pieceColor(piece) === "white" ? "Q" : "q";
  }
  next[to.r][to.c] = placed;
  return next;
};

const makeMove = (move, { fromCpu = false } = {}) => {
  const movingPiece = board[move.from.r][move.from.c];
  const targetPiece = board[move.to.r][move.to.c];

  if (movingPiece.toUpperCase() === "K") {
    if (turn === "white") {
      castlingRights.wK = false;
      castlingRights.wQ = false;
    } else {
      castlingRights.bK = false;
      castlingRights.bQ = false;
    }
  }

  if (movingPiece.toUpperCase() === "R") {
    if (turn === "white" && move.from.r === 7) {
      if (move.from.c === 0) castlingRights.wQ = false;
      if (move.from.c === 7) castlingRights.wK = false;
    }
    if (turn === "black" && move.from.r === 0) {
      if (move.from.c === 0) castlingRights.bQ = false;
      if (move.from.c === 7) castlingRights.bK = false;
    }
  }

  if (targetPiece.toUpperCase() === "R") {
    if (move.to.r === 7) {
      if (move.to.c === 0) castlingRights.wQ = false;
      if (move.to.c === 7) castlingRights.wK = false;
    }
    if (move.to.r === 0) {
      if (move.to.c === 0) castlingRights.bQ = false;
      if (move.to.c === 7) castlingRights.bK = false;
    }
  }

  board = applyMoveToBoard(board, move);

  enPassantTarget = null;
  if (movingPiece.toUpperCase() === "P" && move.doubleStep) {
    enPassantTarget = {
      r: (move.from.r + move.to.r) / 2,
      c: move.from.c,
    };
  }

  selected = null;
  legalMoves = [];
  turn = turn === "white" ? "black" : "white";

  afterMoveUpdate();
  renderBoard();

  if (!fromCpu) {
    scheduleCpuMove();
  }
};

const getPieceValue = (piece) => PIECE_VALUES[piece.toUpperCase()] || 0;

const chooseCpuMove = (moves) => {
  if (!moves.length) return null;

  const opponent = getOppositeColor(cpuColor);
  const scoredMoves = moves.map((move) => {
    let score = 0;
    if (move.enPassant) {
      score += 1;
    } else {
      const target = board[move.to.r][move.to.c];
      if (target !== ".") {
        score += getPieceValue(target);
      }
    }

    const simulated = applyMoveToBoard(board, move);
    if (isKingInCheck({ board: simulated }, opponent)) {
      score += 2;
    }

    return { move, score };
  });

  const maxScore = Math.max(...scoredMoves.map((entry) => entry.score));
  const bestMoves = scoredMoves.filter((entry) => entry.score === maxScore).map((entry) => entry.move);
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

const scheduleCpuMove = () => {
  if (mode !== "cpu" || gameOver) return;
  if (turn !== cpuColor) return;

  cpuThinking = true;
  const delay = 300 + Math.floor(Math.random() * 300);
  setTimeout(() => {
    if (gameOver) {
      cpuThinking = false;
      return;
    }
    if (turn !== cpuColor) {
      cpuThinking = false;
      return;
    }

    const state = getGameState();
    const moves = getAllLegalMoves(state, cpuColor);
    if (!moves.length) {
      refreshGameStatus();
      cpuThinking = false;
      renderBoard();
      return;
    }

    const move = chooseCpuMove(moves);
    if (move) {
      makeMove(move, { fromCpu: true });
    }
    cpuThinking = false;
  }, delay);
};

const locateKingSquare = (boardState, color) => {
  const king = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (boardState[r][c] === king) {
        return { r, c };
      }
    }
  }
  return null;
};

const getAttackedSquares = (state, attackerColor) => {
  const attacked = new Set();
  const boardState = state.board;
  const addAttack = (r, c) => {
    if (inBounds(r, c)) {
      attacked.add(getSquareIndex(r, c));
    }
  };

  const addRayAttacks = (r, c, directions) => {
    directions.forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        addAttack(nr, nc);
        if (boardState[nr][nc] !== ".") {
          break;
        }
        nr += dr;
        nc += dc;
      }
    });
  };

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = boardState[r][c];
      if (piece === "." || pieceColor(piece) !== attackerColor) continue;
      switch (piece.toUpperCase()) {
        case "P": {
          // Pawn attacks are diagonals only (not forward pushes).
          const dir = attackerColor === "white" ? -1 : 1;
          addAttack(r + dir, c - 1);
          addAttack(r + dir, c + 1);
          break;
        }
        case "N": {
          const jumps = [
            [2, 1],
            [2, -1],
            [-2, 1],
            [-2, -1],
            [1, 2],
            [1, -2],
            [-1, 2],
            [-1, -2],
          ];
          jumps.forEach(([dr, dc]) => addAttack(r + dr, c + dc));
          break;
        }
        case "B":
          addRayAttacks(r, c, [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]);
          break;
        case "R":
          addRayAttacks(r, c, [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]);
          break;
        case "Q":
          addRayAttacks(r, c, [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]);
          break;
        case "K": {
          const steps = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ];
          steps.forEach(([dr, dc]) => addAttack(r + dr, c + dc));
          break;
        }
        default:
          break;
      }
    }
  }
  return attacked;
};

const isKingInCheck = (state, color) => {
  const kingSquare = locateKingSquare(state.board, color);
  if (!kingSquare) return false;
  const attackedByOpponent = getAttackedSquares(state, getOppositeColor(color));
  return attackedByOpponent.has(getSquareIndex(kingSquare.r, kingSquare.c));
};

const getGameStatus = (state) => {
  const legalMoves = getAllLegalMoves(state, state.turn);
  const inCheck = isKingInCheck(state, state.turn);
  const current = state.turn === "white" ? "White" : "Black";

  if (legalMoves.length === 0) {
    return {
      outcome: inCheck ? "checkmate" : "stalemate",
      message: inCheck ? "Checkmate (no legal moves)." : "Stalemate (no legal moves).",
      details: { inCheck, legalMoves: legalMoves.length, turn: state.turn },
    };
  }

  if (inCheck) {
    return {
      outcome: "check",
      message: `${current} to move — CHECK!`,
      details: { inCheck, legalMoves: legalMoves.length, turn: state.turn },
    };
  }

  return {
    outcome: "playing",
    message: `${current} to move`,
    details: { inCheck, legalMoves: legalMoves.length, turn: state.turn },
  };
};

const setGameState = (nextState) => {
  board = cloneBoard(nextState.board);
  turn = nextState.turn;
  castlingRights = nextState.castlingRights || {
    wK: false,
    wQ: false,
    bK: false,
    bQ: false,
  };
  enPassantTarget = nextState.enPassantTarget || null;
  selected = null;
  legalMoves = [];
  gameOver = false;
  cpuThinking = false;
};

modeSelect.addEventListener("change", () => {
  mode = modeSelect.value;
  updateControlsForMode();
});

newGameButton.addEventListener("click", startNewGame);

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "d") return;
  if (event.target && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
  if (!debugAllowed) return;
  debugEnabled = !debugEnabled;
  renderBoard();
  refreshGameStatus();
});

window.ChessGame = {
  getGameState,
  getGameStatus,
  getAttackedSquares,
  isKingInCheck,
  getAllLegalMoves,
  setGameState,
};

startNewGame();
