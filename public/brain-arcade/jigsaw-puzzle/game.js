(() => {
  const byId = (id) => document.getElementById(id);
  const canvas = byId("puzzle-canvas");
  const ctx = canvas.getContext("2d");
  const setup = byId("setup");
  const game = byId("game");
  const stage = byId("stage-wrap");
  const status = byId("game-status");
  const pictures = {
  "coral-kingdom": {
    "name": "Coral Kingdom",
    "src": "/brain-arcade/jigsaw-puzzle/assets/coral-kingdom.webp"
  },
  "woodland-village": {
    "name": "Woodland Village",
    "src": "/brain-arcade/jigsaw-puzzle/assets/woodland-village.webp"
  },
  "cosmic-harbor": {
    "name": "Cosmic Harbor",
    "src": "/brain-arcade/jigsaw-puzzle/assets/cosmic-harbor.webp"
  },
  "mountain-railway": {
    "name": "Mountain Railway",
    "src": "/brain-arcade/jigsaw-puzzle/assets/mountain-railway.webp"
  },
  "dinosaur-valley": {
    "name": "Dinosaur Valley",
    "src": "/brain-arcade/jigsaw-puzzle/assets/dinosaur-valley.webp"
  },
  "harbor-lights": {
    "name": "Harbor Lights",
    "src": "/brain-arcade/jigsaw-puzzle/assets/harbor-lights.webp"
  },
  "autumn-farm": {
    "name": "Autumn Farm",
    "src": "/brain-arcade/jigsaw-puzzle/assets/autumn-farm.webp"
  },
  "rainforest-canopy": {
    "name": "Rainforest Canopy",
    "src": "/brain-arcade/jigsaw-puzzle/assets/rainforest-canopy.webp"
  },
  "winter-market": {
    "name": "Winter Market",
    "src": "/brain-arcade/jigsaw-puzzle/assets/winter-market.webp"
  },
  "inventors-workshop": {
    "name": "Inventors Workshop",
    "src": "/brain-arcade/jigsaw-puzzle/assets/inventors-workshop.webp"
  },
  "japanese-garden": {
    "name": "Japanese Garden",
    "src": "/brain-arcade/jigsaw-puzzle/assets/japanese-garden.webp"
  },
  "savanna-sunrise": {
    "name": "Savanna Sunrise",
    "src": "/brain-arcade/jigsaw-puzzle/assets/savanna-sunrise.webp"
  },
  "desert-oasis": {
    "name": "Desert Oasis",
    "src": "/brain-arcade/jigsaw-puzzle/assets/desert-oasis.webp"
  },
  "arctic-expedition": {
    "name": "Arctic Expedition",
    "src": "/brain-arcade/jigsaw-puzzle/assets/arctic-expedition.webp"
  },
  "nile-at-dusk": {
    "name": "Nile at Dusk",
    "src": "/brain-arcade/jigsaw-puzzle/assets/nile-at-dusk.webp"
  },
  "canal-town": {
    "name": "Canal Town",
    "src": "/brain-arcade/jigsaw-puzzle/assets/canal-town.webp"
  },
  "crystal-cavern": {
    "name": "Crystal Cavern",
    "src": "/brain-arcade/jigsaw-puzzle/assets/crystal-cavern.webp"
  },
  "castle-courtyard": {
    "name": "Castle Courtyard",
    "src": "/brain-arcade/jigsaw-puzzle/assets/castle-courtyard.webp"
  },
  "seaside-carnival": {
    "name": "Seaside Carnival",
    "src": "/brain-arcade/jigsaw-puzzle/assets/seaside-carnival.webp"
  },
  "balloon-valley": {
    "name": "Balloon Valley",
    "src": "/brain-arcade/jigsaw-puzzle/assets/balloon-valley.webp"
  },
  "redwood-forest": {
    "name": "Redwood Forest",
    "src": "/brain-arcade/jigsaw-puzzle/assets/redwood-forest.webp"
  },
  "ancient-greek-harbor": {
    "name": "Ancient Greek Harbor",
    "src": "/brain-arcade/jigsaw-puzzle/assets/ancient-greek-harbor.webp"
  },
  "grand-canyon-rafting": {
    "name": "Grand Canyon Rafting",
    "src": "/brain-arcade/jigsaw-puzzle/assets/grand-canyon-rafting.webp"
  },
  "wild-west-frontier": {
    "name": "Wild West Frontier",
    "src": "/brain-arcade/jigsaw-puzzle/assets/wild-west-frontier.webp"
  },
  "tropical-volcano-island": {
    "name": "Tropical Volcano Island",
    "src": "/brain-arcade/jigsaw-puzzle/assets/tropical-volcano-island.webp"
  },
  "deep-sea-exploration": {
    "name": "Deep Sea Exploration",
    "src": "/brain-arcade/jigsaw-puzzle/assets/deep-sea-exploration.webp"
  },
  "geyser-basin": {
    "name": "Geyser Basin",
    "src": "/brain-arcade/jigsaw-puzzle/assets/geyser-basin.webp"
  },
  "rooftop-garden": {
    "name": "Rooftop Garden",
    "src": "/brain-arcade/jigsaw-puzzle/assets/rooftop-garden.webp"
  },
  "wildlife-sanctuary": {
    "name": "Wildlife Sanctuary",
    "src": "/brain-arcade/jigsaw-puzzle/assets/wildlife-sanctuary.webp"
  },
  "lantern-festival": {
    "name": "Lantern Festival",
    "src": "/brain-arcade/jigsaw-puzzle/assets/lantern-festival.webp"
  }
};
  const state = { picture: "coral-kingdom", size: 3, trayPage: 0, relaxed: true, pieces: [], image: null, board: null, mobile: false, moves: 0, placed: 0, startAt: 0, elapsed: 0, timer: null, paused: false, selected: null, cycle: -1, preview: false, complete: false, width: 0, height: 0 };

  function announce(message) { status.textContent = message; }
  function rand(max) { return Math.random() * max; }
  function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  function pictureImage(key) {
    const image = new Image();
    return new Promise((resolve, reject) => { image.onload = () => resolve(image); image.onerror = reject; image.src = pictures[key].src; });
  }

  document.querySelectorAll(".picture-choice").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".picture-choice").forEach((item) => { const on = item === button; item.classList.toggle("selected", on); item.setAttribute("aria-pressed", String(on)); });
    state.picture = button.dataset.picture;
  }));
  document.querySelectorAll(".size-choice").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".size-choice").forEach((item) => { const on = item === button; item.classList.toggle("selected", on); item.setAttribute("aria-pressed", String(on)); });
    state.size = Number(button.dataset.size);
  }));
  byId("timer-toggle").addEventListener("change", (event) => { state.relaxed = event.target.checked; });

  function edgeTables(n) {
    const horizontal = Array.from({ length: n }, () => Array.from({ length: n - 1 }, () => Math.random() < .5 ? 1 : -1));
    const vertical = Array.from({ length: n - 1 }, () => Array.from({ length: n }, () => Math.random() < .5 ? 1 : -1));
    return { horizontal, vertical };
  }
  // One symmetric connector profile, rotated around each side. Adjacent
  // pieces traverse the same seam in reverse with the opposite outward normal.
  function traceEdge(path, x, y, ux, uy, cell, direction) {
    const point = (t, depth) => [
      x + ux * cell * t + uy * cell * depth * direction,
      y + uy * cell * t - ux * cell * depth * direction
    ];
    const line = (t, d) => path.lineTo(...point(t, d));
    const curve = (a, b, c, d, e, f) =>
      path.bezierCurveTo(...point(a, b), ...point(c, d), ...point(e, f));
    if (!direction) { line(1, 0); return; }
    line(.36, 0);
    curve(.40, 0, .44, -.015, .44, .035);
    curve(.44, .065, .385, .075, .385, .125);
    curve(.385, .20, .615, .20, .615, .125);
    curve(.615, .075, .56, .065, .56, .035);
    curve(.56, -.015, .60, 0, .64, 0);
    line(1, 0);
  }
  function makePath(piece, cell) {
    const p = new Path2D();
    p.moveTo(0, 0);
    traceEdge(p, 0, 0, 1, 0, cell, piece.edges.top);
    traceEdge(p, cell, 0, 0, 1, cell, piece.edges.right);
    traceEdge(p, cell, cell, -1, 0, cell, piece.edges.bottom);
    traceEdge(p, 0, cell, 0, -1, cell, piece.edges.left);
    p.closePath();
    return p;
  }
  function buildPieces(n, cell) {
    const seams = edgeTables(n);
    const pieces = [];
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      pieces.push({ row, col, edges: {
        top: row === 0 ? 0 : -seams.vertical[row - 1][col],
        right: col === n - 1 ? 0 : seams.horizontal[row][col],
        bottom: row === n - 1 ? 0 : seams.vertical[row][col],
        left: col === 0 ? 0 : -seams.horizontal[row][col - 1]
      }, x: 0, y: 0, fixed: false, path: null });
    }
    return pieces;
  }
  function getCell() { return state.board ? state.board.size / state.size : 0; }

  function layoutStage() {
    const width = Math.max(320, Math.floor(stage.clientWidth));
    const mobile = width < 720;
    const n = state.size;
    const size = mobile ? Math.min(width - 34, 330) : Math.min(468, 640 - 146, width * .44);
    const cell = size / n;
    // Allow two full connector silhouettes plus breathing room per slot.
    const pad = cell * .21 + 5;
    const gap = 2 * pad;
    const available = mobile ? width - 20 : width - size - 64;
    const cols = Math.max(1, Math.floor(available / (cell + gap)));
    const trayRows = Math.ceil(Math.min(n * n, 24) / cols);
    const trayHeight = trayRows * (cell + gap);
    const height = mobile ? 24 + size + 54 + trayHeight + 22 : Math.max(640, trayHeight + 84);
    const boardX = mobile ? (width - size) / 2 : 28;
    const boardY = mobile ? 22 : (height - size) / 2;
    const trayX = mobile ? (width - cols * (cell + gap)) / 2 + pad : boardX + size + 40 + pad;
    const trayY = mobile ? boardY + size + 54 + pad : Math.max(54, (height - trayHeight) / 2 + pad);
    return { width, height, mobile, board: { x: boardX, y: boardY, size }, cell, gap, cols, trayX, trayY };
  }
  function placeLoosePieces() {
    const { board, cell, gap, cols, trayX, trayY, width, mobile } = state.layout;
    const order = shuffle(state.pieces.filter(piece => !piece.fixed));
    state.trayPage = 0;
    order.forEach((piece, index) => {
      piece.trayPage = Math.floor(index / 24);
      index %= 24;
      const tx = trayX + (index % cols) * (cell + gap) + rand(Math.max(1, gap * .32));
      const ty = trayY + Math.floor(index / cols) * (cell + gap) + rand(Math.max(1, gap * .32));
      piece.x = tx;
      piece.y = ty;
      piece.path = makePath(piece, cell);
    });
  }
  function visibleLoose() {
    return state.pieces.filter(piece => !piece.fixed && piece.trayPage === state.trayPage);
  }
  function updateTray() {
    const pages = Math.ceil(state.pieces.length / 24);
    byId("tray-controls").hidden = pages <= 1;
    byId("tray-page").textContent = `Tray ${state.trayPage + 1} of ${pages}`;
    byId("tray-prev").disabled = state.trayPage === 0;
    byId("tray-next").disabled = state.trayPage >= pages - 1;
  }
  function advanceTray() {
    if (visibleLoose().length || state.complete) return;
    const next = state.pieces.find(piece => !piece.fixed);
    if (next) state.trayPage = next.trayPage;
  }
  function changeTray(delta) {
    if (state.paused || state.complete) return;
    state.trayPage = Math.max(0, Math.min(Math.ceil(state.pieces.length / 24) - 1, state.trayPage + delta));
    drag = null; state.selected = null; state.cycle = -1;
    draw(); announce(`Tray ${state.trayPage + 1} selected.`);
  }
  byId("tray-prev").addEventListener("click", () => changeTray(-1));
  byId("tray-next").addEventListener("click", () => changeTray(1));
  function configureCanvas() {
    const prior = state.layout;
    const next = layoutStage();
    if (prior && state.pieces.length && !state.complete) {
      const sx = next.width / prior.width, sy = next.height / prior.height;
      state.pieces.forEach(piece => { if (piece.fixed) { piece.x = next.board.x + piece.col * next.board.size / state.size; piece.y = next.board.y + piece.row * next.board.size / state.size; } else { piece.x *= sx; piece.y *= sy; } });
    }
    state.layout = next;
    state.width = next.width; state.height = next.height; state.mobile = next.mobile; state.board = next.board;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${next.width}px`; canvas.style.height = `${next.height}px`;
    canvas.width = Math.round(next.width * dpr); canvas.height = Math.round(next.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = getCell();
    state.pieces.forEach(piece => { piece.path = makePath(piece, cell); });
    draw();
  }
  function draw() {
    if (!state.layout) return;
    const { width, height, mobile, cols, trayX, trayY, gap } = state.layout;
    const { x: bx, y: by, size } = state.board;
    const cell = getCell();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5f8fc"; ctx.fillRect(0, 0, width, height);
    // Soft work surface and board frame.
    ctx.fillStyle = "#ffffff"; roundedRect(ctx, bx - 10, by - 10, size + 20, size + 20, 17); ctx.fill();
    ctx.fillStyle = "#e9f0f7"; ctx.fillRect(bx, by, size, size);
    ctx.save(); ctx.beginPath(); ctx.rect(bx, by, size, size); ctx.clip();
    if (state.preview) { ctx.globalAlpha = .17; ctx.drawImage(state.image, bx, by, size, size); ctx.globalAlpha = 1; }
    ctx.strokeStyle = "rgba(36, 63, 91, .18)"; ctx.lineWidth = 1;
    for (let i = 1; i < state.size; i++) { ctx.beginPath(); ctx.moveTo(bx + i * cell, by); ctx.lineTo(bx + i * cell, by + size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx, by + i * cell); ctx.lineTo(bx + size, by + i * cell); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = "#d9e2ec"; ctx.lineWidth = 2; roundedRect(ctx, bx, by, size, size, 4); ctx.stroke();
    if (mobile) {
      ctx.fillStyle = "#66788f"; ctx.font = "700 12px Nunito, sans-serif"; ctx.textAlign = "left"; ctx.fillText("PIECES", 14, by + size + 39);
    } else {
      const trayWidth = Math.max(0, width - trayX - 20);
      ctx.fillStyle = "#edf3f8"; roundedRect(ctx, trayX - 10, 16, trayWidth + 10, height - 32, 18); ctx.fill();
      ctx.fillStyle = "#66788f"; ctx.font = "800 12px Nunito, sans-serif"; ctx.textAlign = "left"; ctx.fillText("PIECES", trayX, Math.max(20, trayY - 14));
    }
    updateTray();
    const sorted = state.pieces.filter(piece => piece.fixed || piece.trayPage === state.trayPage).sort((a,b) => Number(b.fixed) - Number(a.fixed));
    sorted.forEach(piece => drawPiece(piece, cell, bx, by, piece === state.selected));
  }
  function drawPiece(piece, cell, bx, by, selected) {
    const x = piece.fixed ? bx + piece.col * cell : piece.x;
    const y = piece.fixed ? by + piece.row * cell : piece.y;
    ctx.save(); ctx.translate(x, y);
    if (!piece.fixed) { ctx.shadowColor = selected ? "rgba(38,113,201,.35)" : "rgba(28,48,70,.19)"; ctx.shadowBlur = selected ? 16 : 8; ctx.shadowOffsetY = selected ? 6 : 3; }
    ctx.fillStyle = "#fff"; ctx.fill(piece.path);
    ctx.shadowColor = "transparent";
    ctx.save(); ctx.clip(piece.path);
    ctx.drawImage(state.image, -piece.col * cell, -piece.row * cell, state.board.size, state.board.size);
    ctx.restore();
    ctx.strokeStyle = selected ? "#2875c7" : piece.fixed ? "rgba(255,255,255,.46)" : "rgba(28,48,70,.36)";
    ctx.lineWidth = selected ? 3 : 1.5; ctx.stroke(piece.path);
    if (selected) { ctx.setLineDash([4, 3]); ctx.strokeStyle = "#1d65ae"; ctx.lineWidth = 1.5; ctx.stroke(piece.path); }
    ctx.restore();
  }
  function roundedRect(context, x, y, w, h, r) { context.beginPath(); context.roundRect(x, y, w, h, r); }
  function point(event) { const box = canvas.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; }
  function hitPiece(x, y) {
    const cell = getCell();
    for (let i = state.pieces.length - 1; i >= 0; i--) {
      const piece = state.pieces[i]; if (piece.fixed || piece.trayPage !== state.trayPage) continue;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const hit = ctx.isPointInPath(piece.path, x - piece.x, y - piece.y); ctx.restore();
      if (hit) return piece;
    }
    return null;
  }
  function tryPlaceOnSquare(piece, col, row) {
    state.moves++;
    byId("move-count").textContent = state.moves;
    if (col !== piece.col || row !== piece.row) {
      announce("That is not the right square. The piece is still on the tabletop; choose another square.");
      draw();
      return false;
    }
    const cell = getCell();
    piece.x = state.board.x + piece.col * cell;
    piece.y = state.board.y + piece.row * cell;
    piece.fixed = true;
    state.placed++;
    state.cycle = -1;
    byId("placed-count").textContent = `${state.placed} / ${state.pieces.length}`;
    announce(`Piece placed. ${state.placed} of ${state.pieces.length} complete.`);
    if (state.placed === state.pieces.length) finish();
    state.selected = null;
    advanceTray();
    draw();
    return true;
  }
  let drag = null;
  canvas.addEventListener("pointerdown", event => {
    if (state.paused || state.complete) return;
    const pt = point(event), piece = hitPiece(pt.x, pt.y);
    if (!piece) {
      const { x, y, size } = state.board;
      if (state.selected && pt.x >= x && pt.y >= y && pt.x < x + size && pt.y < y + size) {
        const cell = getCell();
        tryPlaceOnSquare(state.selected, Math.floor((pt.x - x) / cell), Math.floor((pt.y - y) / cell));
        canvas.focus({ preventScroll: true });
        event.preventDefault();
        return;
      }
      canvas.focus();
      return;
    }
    state.pieces.splice(state.pieces.indexOf(piece), 1); state.pieces.push(piece);
    state.selected = piece; drag = { piece, dx: pt.x - piece.x, dy: pt.y - piece.y, moved: false };
    canvas.setPointerCapture(event.pointerId); draw(); event.preventDefault();
  });
  canvas.addEventListener("pointermove", event => {
    if (!drag || state.paused) return;
    const pt = point(event), cell = getCell();
    drag.piece.x = Math.max(-cell * .2, Math.min(state.width - cell * .8, pt.x - drag.dx));
    drag.piece.y = Math.max(-cell * .2, Math.min(state.height - cell * .8, pt.y - drag.dy));
    drag.moved = true; draw(); event.preventDefault();
  });
  canvas.addEventListener("pointerup", event => {
    if (!drag) return;
    const piece = drag.piece, moved = drag.moved, cell = getCell(); drag = null;
    if (moved) {
      state.moves++; byId("move-count").textContent = state.moves;
      const tx = state.board.x + piece.col * cell, ty = state.board.y + piece.row * cell;
      if (Math.hypot(piece.x - tx, piece.y - ty) <= cell * .48) {
        piece.x = tx; piece.y = ty; piece.fixed = true; state.placed++;
        state.cycle = -1;
        announce(`${state.placed} of ${state.pieces.length} pieces placed.`);
        byId("placed-count").textContent = `${state.placed} / ${state.pieces.length}`;
        if (state.placed === state.pieces.length) finish();
        state.selected = null; advanceTray();
      } else { state.selected = null; }
    }
    draw(); event.preventDefault();
  });
  canvas.addEventListener("pointercancel", () => { drag = null; draw(); });
  canvas.addEventListener("keydown", event => {
    if (state.paused || state.complete) return;
    const loose = visibleLoose();
    if (event.code === "Space" && !state.selected && loose.length) {
      state.cycle = (state.cycle + 1) % loose.length; state.selected = loose[state.cycle];
      announce(`Selected piece ${state.cycle + 1} of ${loose.length}. Use arrow keys to move; Enter to place.`); draw(); event.preventDefault(); return;
    }
    if (state.selected && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)) {
      const step = Math.max(8, getCell() * .18);
      if (event.key === "ArrowUp") state.selected.y -= step;
      if (event.key === "ArrowDown") state.selected.y += step;
      if (event.key === "ArrowLeft") state.selected.x -= step;
      if (event.key === "ArrowRight") state.selected.x += step;
      draw(); event.preventDefault();
    } else if (state.selected && (event.key === "Enter" || event.code === "Space")) {
      const piece = state.selected, cell = getCell(), tx = state.board.x + piece.col * cell, ty = state.board.y + piece.row * cell;
      state.moves++; byId("move-count").textContent = state.moves;
      if (Math.hypot(piece.x - tx, piece.y - ty) <= cell * .55) {
        piece.x = tx; piece.y = ty; piece.fixed = true; state.placed++;
        state.cycle = -1;
        byId("placed-count").textContent = `${state.placed} / ${state.pieces.length}`;
        announce(`Piece placed. ${state.placed} of ${state.pieces.length} complete.`);
        if (state.placed === state.pieces.length) finish();
        state.selected = null; advanceTray();
        state.selected = null;
      } else announce("That piece is not close enough to its place yet. Keep moving it with the arrow keys.");
      draw(); event.preventDefault();
    } else if (event.key === "Escape" && state.selected) { state.selected = null; state.cycle = -1; draw(); event.preventDefault(); }
  });

  function updateClock() {
    const seconds = Math.floor(state.elapsed + (state.paused ? 0 : (Date.now() - state.startAt) / 1000));
    byId("time-count").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function startClock() {
    clearInterval(state.timer); state.elapsed = 0; state.startAt = Date.now();
    if (!state.relaxed) { byId("time-stat").hidden = false; state.timer = setInterval(updateClock, 500); updateClock(); }
    else { byId("time-stat").hidden = true; }
  }
  async function startPuzzle() {
    byId("start-button").disabled = true;
    try {
      state.image = await pictureImage(state.picture);
      state.pieces = buildPieces(state.size, 1); state.moves = 0; state.placed = 0; state.complete = false; state.paused = false; state.selected = null;
      setup.hidden = true; game.hidden = false;
      byId("placed-count").textContent = `0 / ${state.size * state.size}`; byId("move-count").textContent = "0";
      byId("pause-button").textContent = "Pause"; byId("pause-button").setAttribute("aria-pressed", "false");
      byId("preview-image").src = pictures[state.picture].src;
      byId("preview-card").hidden = true; state.preview = false; byId("preview-button").setAttribute("aria-pressed", "false");
      configureCanvas(); placeLoosePieces(); draw(); startClock(); announce(`${pictures[state.picture].name} puzzle started. ${state.pieces.length} pieces.`);
      canvas.focus({ preventScroll: true });
    } catch (error) { announce("The puzzle picture could not load. Please choose another picture and try again."); }
    finally { byId("start-button").disabled = false; }
  }
  function finish() {
    state.complete = true; clearInterval(state.timer); updateClock();
    byId("win-summary").textContent = `${state.pieces.length} pieces · ${state.moves} moves${state.relaxed ? "" : ` · ${byId("time-count").textContent}`}`;
    byId("win-card").hidden = false; announce("Puzzle complete. Beautifully done!");
  }
  function restart() {
    state.pieces = buildPieces(state.size, 1); state.moves = 0; state.placed = 0; state.complete = false; state.paused = false; state.selected = null; state.cycle = -1;
    byId("placed-count").textContent = `0 / ${state.size * state.size}`; byId("move-count").textContent = "0"; byId("win-card").hidden = true; byId("pause-cover").hidden = true;
    configureCanvas(); placeLoosePieces(); draw(); startClock(); canvas.focus({ preventScroll: true }); announce("Puzzle restarted. Pieces have been shuffled.");
  }
  function showSetup() {
    clearInterval(state.timer); state.timer = null; game.hidden = true; setup.hidden = false;
    byId("win-card").hidden = true; byId("pause-cover").hidden = true; window.scrollTo({ top: 0, behavior: "smooth" });
  }
  byId("start-button").addEventListener("click", startPuzzle);
  byId("restart-button").addEventListener("click", restart);
  byId("new-puzzle-button").addEventListener("click", showSetup);
  byId("back-to-choices").addEventListener("click", showSetup);
  byId("play-again-button").addEventListener("click", restart);
  byId("preview-button").addEventListener("click", () => {
    state.preview = !state.preview; byId("preview-button").setAttribute("aria-pressed", String(state.preview));
    byId("preview-card").hidden = !state.preview; draw();
  });
  byId("pause-button").addEventListener("click", () => {
    if (state.complete) return;
    state.paused = !state.paused;
    if (state.paused) { state.elapsed += (Date.now() - state.startAt) / 1000; clearInterval(state.timer); }
    else { state.startAt = Date.now(); if (!state.relaxed) state.timer = setInterval(updateClock, 500); }
    byId("pause-cover").hidden = !state.paused;
    byId("pause-button").textContent = state.paused ? "Resume" : "Pause";
    byId("pause-button").setAttribute("aria-pressed", String(state.paused));
    if (!state.relaxed) updateClock(); announce(state.paused ? "Puzzle paused." : "Puzzle resumed.");
  });
  byId("resume-button").addEventListener("click", () => byId("pause-button").click());
  let resizeFrame;
  new ResizeObserver(() => { if (!game.hidden && !state.complete) { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(configureCanvas); } }).observe(stage);
})();
