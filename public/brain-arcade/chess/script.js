const boardElement = document.getElementById("board");
const turnElement = document.getElementById("turn");
const modeSelect = document.getElementById("mode");
const sideSelect = document.getElementById("side");
const difficultySelect = document.getElementById("difficulty");
const newGameButton = document.getElementById("new-game");

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
let gameMode = "2p";
let playerSide = "white";
let difficulty = "easy";
let cpuThinking = false;
let gameOver = false;

const cloneBoard = (source) => source.map((row) => row.slice());

const pieceColor = (piece) => {
  if (piece === ".") return null;
  return piece === piece.toUpperCase() ? "white" : "black";
};

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const renderBoard = () => {
  boardElement.innerHTML = "";
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

      const piece = board[r][c];
      square.textContent = PIECES[piece] || "";
      square.addEventListener("click", () => handleSquareClick(r, c));
      boardElement.appendChild(square);
    }
  }
};

const updateTurnText = (override) => {
  if (override) {
    turnElement.textContent = override;
    return;
  }
  const current = turn === "white" ? "White" : "Black";
  let text = `${current} to move`;
  if (isKingInCheck(turn)) {
    text = `${current} to move — CHECK!`;
  }
  turnElement.textContent = text;
};

const updateControlsForMode = () => {
  const isCpu = gameMode === "cpu";
  sideSelect.disabled = !isCpu;
  difficultySelect.disabled = !isCpu;
};

const applySettings = () => {
  gameMode = modeSelect.value;
  playerSide = sideSelect.value;
  difficulty = difficultySelect.value;
  updateControlsForMode();
};

const resetGame = () => {
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
  updateTurnText();
  renderBoard();
  maybeCpuMove();
};

const startNewGame = () => {
  applySettings();
  resetGame();
};

const handleSquareClick = (r, c) => {
  if (cpuThinking || gameOver) return;
  if (gameMode === "cpu" && turn !== playerSide) return;

  const piece = board[r][c];
  const color = pieceColor(piece);

  if (!selected) {
    if (color === turn) {
      selected = { r, c };
      legalMoves = getLegalMovesForSquare(r, c);
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
    legalMoves = getLegalMovesForSquare(r, c);
    renderBoard();
    return;
  }

  selected = null;
  legalMoves = [];
  renderBoard();
};

const getLegalMovesForSquare = (r, c, color = turn) => {
  const piece = board[r][c];
  if (piece === ".") return [];
  if (pieceColor(piece) !== color) return [];

  const pseudoMoves = getPseudoLegalMoves(board, r, c, piece);
  return pseudoMoves.filter((move) => {
    const simulated = applyMoveToBoard(board, move);
    return !isKingInCheck(color, simulated);
  });
};

const getAllLegalMoves = (color) => {
  const moves = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (pieceColor(board[r][c]) === color) {
        moves.push(...getLegalMovesForSquare(r, c, color));
      }
    }
  }
  return moves;
};

const getPseudoLegalMoves = (boardState, r, c, piece) => {
  const moves = [];
  const color = pieceColor(piece);
  const opponent = color === "white" ? "black" : "white";

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
        if (enPassantTarget && enPassantTarget.r === captureR && enPassantTarget.c === captureC) {
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
        if (castlingRights.wK && canCastle(boardState, "white", "kingside")) {
          addMove(7, 6, { castle: "kingside" });
        }
        if (castlingRights.wQ && canCastle(boardState, "white", "queenside")) {
          addMove(7, 2, { castle: "queenside" });
        }
      }

      if (color === "black" && r === 0 && c === 4) {
        if (castlingRights.bK && canCastle(boardState, "black", "kingside")) {
          addMove(0, 6, { castle: "kingside" });
        }
        if (castlingRights.bQ && canCastle(boardState, "black", "queenside")) {
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

const canCastle = (boardState, color, side) => {
  const row = color === "white" ? 7 : 0;
  const opponent = color === "white" ? "black" : "white";
  if (isKingInCheck(color, boardState)) return false;

  if (side === "kingside") {
    if (boardState[row][5] !== "." || boardState[row][6] !== ".") return false;
    const rook = boardState[row][7];
    if (rook !== (color === "white" ? "R" : "r")) return false;
    if (isSquareAttacked(boardState, row, 5, opponent)) return false;
    if (isSquareAttacked(boardState, row, 6, opponent)) return false;
    return true;
  }

  if (boardState[row][1] !== "." || boardState[row][2] !== "." || boardState[row][3] !== ".") {
    return false;
  }
  const rook = boardState[row][0];
  if (rook !== (color === "white" ? "R" : "r")) return false;
  if (isSquareAttacked(boardState, row, 3, opponent)) return false;
  if (isSquareAttacked(boardState, row, 2, opponent)) return false;
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

  if (getAllLegalMoves(turn).length === 0) {
    gameOver = true;
    updateTurnText("Game over (no legal moves).");
  } else {
    updateTurnText();
  }

  renderBoard();

  if (!fromCpu) {
    maybeCpuMove();
  }
};

const getPieceValue = (piece) => PIECE_VALUES[piece.toUpperCase()] || 0;

const chooseCpuMove = (moves) => {
  if (!moves.length) return null;

  const captureScores = moves.map((move) => {
    if (move.enPassant) return { move, score: 1 };
    const target = board[move.to.r][move.to.c];
    if (target === ".") return { move, score: 0 };
    return { move, score: getPieceValue(target) };
  });

  const maxCapture = Math.max(...captureScores.map((entry) => entry.score));
  if (maxCapture > 0) {
    const bestCaptures = captureScores.filter((entry) => entry.score === maxCapture).map((entry) => entry.move);
    return bestCaptures[Math.floor(Math.random() * bestCaptures.length)];
  }

  const cpuColor = turn;
  const opponent = cpuColor === "white" ? "black" : "white";
  const checkingMoves = moves.filter((move) => {
    const simulated = applyMoveToBoard(board, move);
    return isKingInCheck(opponent, simulated);
  });

  if (checkingMoves.length) {
    return checkingMoves[Math.floor(Math.random() * checkingMoves.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
};

const maybeCpuMove = () => {
  if (gameMode !== "cpu" || gameOver) return;
  const cpuSide = playerSide === "white" ? "black" : "white";
  if (turn !== cpuSide) return;

  const moves = getAllLegalMoves(cpuSide);
  if (!moves.length) {
    gameOver = true;
    updateTurnText("Game over (no legal moves).");
    return;
  }

  cpuThinking = true;
  const delay = 300 + Math.floor(Math.random() * 300);
  setTimeout(() => {
    if (gameOver) {
      cpuThinking = false;
      return;
    }
    const move = chooseCpuMove(moves);
    if (move) {
      makeMove(move, { fromCpu: true });
    }
    cpuThinking = false;
  }, delay);
};

const isKingInCheck = (color, boardState = board) => {
  const king = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (boardState[r][c] === king) {
        return isSquareAttacked(boardState, r, c, color === "white" ? "black" : "white");
      }
    }
  }
  return false;
};

const isSquareAttacked = (boardState, r, c, attackerColor) => {
  const pawn = attackerColor === "white" ? "P" : "p";
  const pawnDir = attackerColor === "white" ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir;
    const pc = c + dc;
    if (inBounds(pr, pc) && boardState[pr][pc] === pawn) {
      return true;
    }
  }

  const knight = attackerColor === "white" ? "N" : "n";
  const knightMoves = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];
  for (const [dr, dc] of knightMoves) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && boardState[nr][nc] === knight) {
      return true;
    }
  }

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

  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = boardState[nr][nc];
      if (target !== ".") {
        const isWhite = target === target.toUpperCase();
        if ((attackerColor === "white" && isWhite) || (attackerColor === "black" && !isWhite)) {
          const upper = target.toUpperCase();
          if ((dr === 0 || dc === 0) && (upper === "R" || upper === "Q")) {
            return true;
          }
          if (dr !== 0 && dc !== 0 && (upper === "B" || upper === "Q")) {
            return true;
          }
          if (upper === "K" && Math.max(Math.abs(nr - r), Math.abs(nc - c)) === 1) {
            return true;
          }
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
};

modeSelect.addEventListener("change", () => {
  gameMode = modeSelect.value;
  updateControlsForMode();
});

newGameButton.addEventListener("click", startNewGame);

applySettings();
resetGame();
