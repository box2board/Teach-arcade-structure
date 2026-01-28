const resultsElement = document.getElementById("test-results");

const logResult = (name, passed, detail) => {
  const line = document.createElement("div");
  line.className = passed ? "pass" : "fail";
  line.textContent = `${passed ? "PASS" : "FAIL"}: ${name} (${detail})`;
  resultsElement.appendChild(line);
  const logFn = passed ? console.log : console.error;
  logFn(`${name}: ${detail}`);
};

const parseFen = (fen) => {
  const [piecePart, turnPart, castlingPart] = fen.split(" ");
  const rows = piecePart.split("/");
  const board = rows.map((row) => {
    const squares = [];
    for (const char of row) {
      const count = Number.parseInt(char, 10);
      if (Number.isNaN(count)) {
        squares.push(char);
      } else {
        for (let i = 0; i < count; i += 1) {
          squares.push(".");
        }
      }
    }
    return squares;
  });

  return {
    board,
    turn: turnPart === "w" ? "white" : "black",
    castlingRights: {
      wK: castlingPart?.includes("K") ?? false,
      wQ: castlingPart?.includes("Q") ?? false,
      bK: castlingPart?.includes("k") ?? false,
      bQ: castlingPart?.includes("q") ?? false,
    },
    enPassantTarget: null,
  };
};

const runTests = () => {
  const cases = [
    {
      name: "Fool's mate is checkmate",
      fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
      expected: "checkmate",
    },
    {
      name: "Simple stalemate position",
      fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
      expected: "stalemate",
    },
  ];

  cases.forEach(({ name, fen, expected }) => {
    const state = parseFen(fen);
    const status = window.ChessGame.getGameStatus(state);
    const passed = status.outcome === expected;
    logResult(name, passed, `expected ${expected}, got ${status.outcome}`);
  });
};

window.addEventListener("load", () => {
  runTests();
});
