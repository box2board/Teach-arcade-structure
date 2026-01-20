import {
  gamePillars,
  coreSystems,
  regions,
  notebookTemplate,
  npcLines,
  classroomModes
} from "./game-data.js";

const renderList = (items, renderItem) => items.map(renderItem).join("");

const pillarsTarget = document.querySelector("[data-pillars]");
const systemsTarget = document.querySelector("[data-systems]");
const regionsTarget = document.querySelector("[data-regions]");
const notebookTarget = document.querySelector("[data-notebook]");
const npcTarget = document.querySelector("[data-npc]");
const classroomTarget = document.querySelector("[data-classroom]");
const classroomNotice = document.querySelector("[data-classroom-note]");
const restorationRoot = document.querySelector("[data-restoration]");

if (pillarsTarget) {
  pillarsTarget.innerHTML = renderList(gamePillars, (pillar) => {
    return `
      <div class="card">
        <h3>${pillar.title}</h3>
        <p>${pillar.detail}</p>
      </div>
    `;
  });
}

if (systemsTarget) {
  systemsTarget.innerHTML = renderList(coreSystems, (system) => {
    return `
      <div class="card">
        <h3>${system.title}</h3>
        <ul>
          ${system.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>
      </div>
    `;
  });
}

if (regionsTarget) {
  regionsTarget.innerHTML = renderList(regions, (region) => {
    return `
      <article class="card">
        <h3>${region.name}</h3>
        <p><strong>Theme:</strong> ${region.theme}</p>
        <p><strong>Concepts:</strong> ${region.concepts.join(", ")}</p>
        <p><strong>Tools:</strong> ${region.tools.join(", ")}</p>
        <p><strong>Encounter:</strong> ${region.enemy}</p>
        <p><strong>Experience loop:</strong></p>
        <ul>
          ${region.experiences.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p><strong>Reflection:</strong> ${region.reflection}</p>
      </article>
    `;
  });
}

if (notebookTarget) {
  notebookTarget.innerHTML = renderList(notebookTemplate, (section) => {
    return `
      <div class="card">
        <h3>${section.section}</h3>
        <ul>
          ${section.entries.map((entry) => `<li>${entry}</li>`).join("")}
        </ul>
      </div>
    `;
  });
}

if (npcTarget) {
  npcTarget.innerHTML = renderList(npcLines, (line) => {
    return `<span>${line}</span>`;
  });
}

if (classroomTarget) {
  classroomTarget.innerHTML = renderList(classroomModes, (mode, index) => {
    const id = `mode-${mode.title.toLowerCase()}`;
    return `
      <div class="toggle">
        <label for="${id}">
          <input type="radio" name="classroom-mode" id="${id}" value="${mode.title}"
            ${index === 1 ? "checked" : ""}>
          ${mode.title}
        </label>
        <small>${mode.description}</small>
      </div>
    `;
  });
}

const updateClassroomNotice = (mode) => {
  if (!classroomNotice) return;
  classroomNotice.textContent = `Classroom Mode: ${mode} — students see the same UI, but hints and vocabulary timing shift in the background.`;
};

const modeInputs = document.querySelectorAll("input[name='classroom-mode']");
modeInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    updateClassroomNotice(event.target.value);
  });
});

updateClassroomNotice("Standard");

if (restorationRoot) {
  const toolButtons = restorationRoot.querySelectorAll("[data-tool]");
  const statusText = restorationRoot.querySelector("[data-status]");
  const resetButton = restorationRoot.querySelector("[data-reset]");
  const toolReadout = restorationRoot.querySelector("[data-tool-readout]");
  const progressReadout = restorationRoot.querySelector("[data-progress]");
  const canvas = restorationRoot.querySelector("[data-canvas]");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const tileSize = 32;
  const mapWidth = 30;
  const mapHeight = 16;
  const mapOffset = {
    x: Math.floor((canvas.width - mapWidth * tileSize) / 2),
    y: Math.floor((canvas.height - mapHeight * tileSize) / 2)
  };

  const mapRows = [
    "##############################",
    "#S....#.......#.......#......#",
    "#.##..#..W....#..###..#..w...#",
    "#.....#.......#..#....#......#",
    "###.#####.########.#####.#####",
    "#.....#.....#......#....#....#",
    "#..L..#..###.#..E..#..###..e.#",
    "#.....#......#.....#.........#",
    "#####.#####.########.#####.###",
    "#.....#....#.....#....#......#",
    "#..###.#.##.#..###.##.#.##...#",
    "#.....#.....#........#..#....#",
    "#..l..#..###.#####..#..#..D..#",
    "#.....#.....#......#.....#...#",
    "#.....#..E..#..###.#..###.##.#",
    "##############################"
  ];

  const tileTypes = {
    wall: "#",
    floor: ".",
    start: "S",
    windStation: "W",
    lightStation: "L",
    energyStation: "E",
    windSystem: "w",
    lightSystem: "l",
    energySystem: "e",
    checkpoint: "D"
  };

  const systems = [
    { type: "wind", key: tileTypes.windSystem, restored: false },
    { type: "prism", key: tileTypes.lightSystem, restored: false },
    { type: "dynamo", key: tileTypes.energySystem, restored: false }
  ];

  const toolStations = [
    { type: "wind", key: tileTypes.windStation },
    { type: "prism", key: tileTypes.lightStation },
    { type: "dynamo", key: tileTypes.energyStation }
  ];

  const player = {
    x: 0,
    y: 0,
    size: 18,
    speed: 2.1
  };

  const checkpoint = { x: 0, y: 0 };
  let selectedTool = "";
  let lastStatus = "";

  const echoes = [
    {
      path: [
        { x: 5, y: 9 },
        { x: 12, y: 9 },
        { x: 12, y: 12 },
        { x: 5, y: 12 }
      ],
      index: 0,
      progress: 0,
      speed: 0.012
    },
    {
      path: [
        { x: 19, y: 3 },
        { x: 26, y: 3 },
        { x: 26, y: 7 },
        { x: 19, y: 7 }
      ],
      index: 0,
      progress: 0,
      speed: 0.01
    }
  ];

  const keys = new Set();

  const getTile = (x, y) => {
    if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return tileTypes.wall;
    return mapRows[y][x];
  };

  const setStatus = (message) => {
    if (!statusText) return;
    if (message !== lastStatus) {
      statusText.textContent = message;
      lastStatus = message;
    }
  };

  const updateHud = () => {
    if (toolReadout) {
      toolReadout.textContent = selectedTool ? selectedTool : "None";
    }
    if (progressReadout) {
      const restoredCount = systems.filter((system) => system.restored).length;
      progressReadout.textContent = restoredCount;
    }
  };

  const resetGame = () => {
    systems.forEach((system) => {
      system.restored = false;
    });
    selectedTool = "";
    toolButtons.forEach((tool) => tool.classList.remove("active"));
    player.x = checkpoint.x * tileSize + tileSize / 2;
    player.y = checkpoint.y * tileSize + tileSize / 2;
    setStatus("Find a tool station, then stabilize each system.");
    updateHud();
  };

  const findStart = () => {
    mapRows.forEach((row, rowIndex) => {
      [...row].forEach((tile, colIndex) => {
        if (tile === tileTypes.start) {
          player.x = colIndex * tileSize + tileSize / 2;
          player.y = rowIndex * tileSize + tileSize / 2;
          checkpoint.x = colIndex;
          checkpoint.y = rowIndex;
        }
        if (tile === tileTypes.checkpoint) {
          checkpoint.x = colIndex;
          checkpoint.y = rowIndex;
        }
      });
    });
  };

  const worldToTile = (value) => Math.floor(value / tileSize);
  const worldToTileY = (value) => Math.floor(value / tileSize);

  const canMoveTo = (x, y) => {
    const tileX = worldToTile(x);
    const tileY = worldToTileY(y);
    const tile = getTile(tileX, tileY);
    return tile !== tileTypes.wall;
  };

  const movePlayer = () => {
    let dx = 0;
    let dy = 0;
    if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
    if (keys.has("ArrowDown") || keys.has("s")) dy += 1;
    if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const nextX = player.x + dx * player.speed;
    const nextY = player.y + dy * player.speed;

    if (canMoveTo(nextX, player.y)) {
      player.x = nextX;
    }
    if (canMoveTo(player.x, nextY)) {
      player.y = nextY;
    }
  };

  const interact = () => {
    const tileX = worldToTile(player.x);
    const tileY = worldToTileY(player.y);
    const tile = getTile(tileX, tileY);

    const station = toolStations.find((entry) => entry.key === tile);
    if (station) {
      selectedTool = station.type;
      toolButtons.forEach((tool) => {
        const isActive = tool.dataset.tool === station.type;
        tool.classList.toggle("active", isActive);
      });
      setStatus(`${station.type} tool calibrated. Find its system.`);
      updateHud();
      return;
    }

    const system = systems.find((entry) => entry.key === tile);
    if (system && !system.restored) {
      if (!selectedTool) {
        setStatus("You need a tool from a nearby station first.");
        return;
      }
      if (system.type !== selectedTool) {
        setStatus("Wrong tool. Tune the right instrument before restoring.");
        return;
      }
      system.restored = true;
      const remaining = systems.filter((entry) => !entry.restored).length;
      setStatus(
        remaining === 0
          ? "All systems stabilized! The Archive of Balance is complete."
          : `System restored. ${remaining} remaining.`
      );
      updateHud();
      return;
    }

    setStatus("Nothing to restore here. Explore the map.");
  };

  const updateEchoes = () => {
    echoes.forEach((echo) => {
      const current = echo.path[echo.index];
      const nextIndex = (echo.index + 1) % echo.path.length;
      const next = echo.path[nextIndex];
      echo.progress += echo.speed;
      if (echo.progress >= 1) {
        echo.progress = 0;
        echo.index = nextIndex;
      }
      echo.x = current.x + (next.x - current.x) * echo.progress;
      echo.y = current.y + (next.y - current.y) * echo.progress;
    });
  };

  const checkEchoCollision = () => {
    const playerTileX = worldToTile(player.x);
    const playerTileY = worldToTileY(player.y);
    const hit = echoes.some((echo) => {
      return Math.round(echo.x) === playerTileX && Math.round(echo.y) === playerTileY;
    });
    if (hit) {
      player.x = checkpoint.x * tileSize + tileSize / 2;
      player.y = checkpoint.y * tileSize + tileSize / 2;
      setStatus("An instability echo jolted you back to the checkpoint.");
    }
  };

  const drawMap = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < mapHeight; y += 1) {
      for (let x = 0; x < mapWidth; x += 1) {
        const tile = getTile(x, y);
        const screenX = mapOffset.x + x * tileSize;
        const screenY = mapOffset.y + y * tileSize;

        if (tile === tileTypes.wall) {
          ctx.fillStyle = "#1e293b";
        } else {
          ctx.fillStyle = "#e2e8f0";
        }
        ctx.fillRect(screenX, screenY, tileSize, tileSize);

        if (tile === tileTypes.start || tile === tileTypes.checkpoint) {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(screenX + 8, screenY + 8, 16, 16);
        }

        const station = toolStations.find((entry) => entry.key === tile);
        if (station) {
          ctx.fillStyle = station.type === "wind" ? "#0ea5e9" : station.type === "prism" ? "#a855f7" : "#22c55e";
          ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
        }

        const system = systems.find((entry) => entry.key === tile);
        if (system) {
          ctx.fillStyle = system.restored ? "#4ade80" : "#f97316";
          ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
        }
      }
    }

    echoes.forEach((echo) => {
      const screenX = mapOffset.x + echo.x * tileSize + tileSize / 2;
      const screenY = mapOffset.y + echo.y * tileSize + tileSize / 2;
      ctx.beginPath();
      ctx.fillStyle = "#facc15";
      ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    const playerX = mapOffset.x + player.x;
    const playerY = mapOffset.y + player.y;
    ctx.beginPath();
    ctx.fillStyle = "#2563eb";
    ctx.arc(playerX, playerY, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const gameLoop = () => {
    movePlayer();
    updateEchoes();
    checkEchoCollision();
    drawMap();
    requestAnimationFrame(gameLoop);
  };

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedTool = button.dataset.tool;
      toolButtons.forEach((tool) => tool.classList.remove("active"));
      button.classList.add("active");
      setStatus(`Tool ready: ${button.textContent}. Seek its system.`);
      updateHud();
    });
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      interact();
    }
    if (key === "1") toolButtons[0]?.click();
    if (key === "2") toolButtons[1]?.click();
    if (key === "3") toolButtons[2]?.click();
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  if (resetButton) {
    resetButton.addEventListener("click", resetGame);
  }

  findStart();
  resetGame();
  updateHud();
  requestAnimationFrame(gameLoop);
}
