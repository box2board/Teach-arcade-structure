export function createRenderer({ canvas, mapData, theme }) {
  const ctx = canvas.getContext("2d");
  const camera = { x: 0, y: 0 };

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBackground() {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  function drawRegions() {
    mapData.regions.forEach((region) => {
      const { x, y, width, height } = region;
      ctx.fillStyle = region.color;
      ctx.fillRect(x - camera.x, y - camera.y, width, height);
    });
  }

  function drawSlowZones() {
    ctx.fillStyle = theme.colors.slowZone;
    mapData.slowZones.forEach((zone) => {
      ctx.fillRect(zone.x - camera.x, zone.y - camera.y, zone.width, zone.height);
    });
  }

  function drawWalls() {
    ctx.fillStyle = theme.colors.wall;
    mapData.walls.forEach((wall) => {
      ctx.fillRect(wall.x - camera.x, wall.y - camera.y, wall.width, wall.height);
    });
  }

  function drawChests(chests) {
    chests.forEach((chest) => {
      const cx = chest.x - camera.x;
      const cy = chest.y - camera.y;
      if (chest.opened) {
        ctx.fillStyle = theme.colors.chestOpen;
        ctx.fillRect(cx, cy, chest.size, chest.size);
        ctx.fillStyle = theme.colors.chestOpenLid;
        ctx.fillRect(cx, cy - 6, chest.size, 6);
        return;
      }
      ctx.fillStyle = chest.type === "secret" ? theme.colors.secretChest : theme.colors.chest;
      ctx.fillRect(cx, cy, chest.size, chest.size);
      ctx.fillStyle = theme.colors.chestTrim;
      ctx.fillRect(cx + 4, cy + 4, chest.size - 8, chest.size - 8);
      if (chest.locked) {
        ctx.fillStyle = theme.colors.lock;
        ctx.fillRect(cx + chest.size / 2 - 6, cy + chest.size / 2 - 4, 12, 10);
        ctx.strokeStyle = theme.colors.lock;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + chest.size / 2, cy + chest.size / 2 - 5, 6, Math.PI, 0);
        ctx.stroke();
      }
    });
  }

  function drawPlayer(player) {
    ctx.fillStyle = theme.colors.player;
    ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
    ctx.fillStyle = theme.colors.playerHighlight;
    ctx.fillRect(player.x - camera.x + 6, player.y - camera.y + 6, player.width - 12, player.height - 12);
  }

  function render({ player, chests }) {
    drawBackground();
    drawRegions();
    drawSlowZones();
    drawWalls();
    drawChests(chests);
    drawPlayer(player);
  }

  function updateCamera(player) {
    const targetX = player.x + player.width / 2 - canvas.clientWidth / 2;
    const targetY = player.y + player.height / 2 - canvas.clientHeight / 2;
    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.08;

    camera.x = Math.max(0, Math.min(mapData.width - canvas.clientWidth, camera.x));
    camera.y = Math.max(0, Math.min(mapData.height - canvas.clientHeight, camera.y));
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    resize,
    updateCamera,
    render,
    getCamera() {
      return camera;
    }
  };
}
