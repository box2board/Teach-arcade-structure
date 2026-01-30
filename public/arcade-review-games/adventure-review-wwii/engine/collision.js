export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function resolveMovement(entity, dx, dy, walls, bounds) {
  let nextX = entity.x + dx;
  let nextY = entity.y + dy;

  const box = {
    x: nextX,
    y: entity.y,
    width: entity.width,
    height: entity.height
  };

  for (const wall of walls) {
    if (rectsOverlap(box, wall)) {
      if (dx > 0) {
        nextX = wall.x - entity.width;
      } else if (dx < 0) {
        nextX = wall.x + wall.width;
      }
      box.x = nextX;
    }
  }

  const boxY = {
    x: nextX,
    y: nextY,
    width: entity.width,
    height: entity.height
  };

  for (const wall of walls) {
    if (rectsOverlap(boxY, wall)) {
      if (dy > 0) {
        nextY = wall.y - entity.height;
      } else if (dy < 0) {
        nextY = wall.y + wall.height;
      }
      boxY.y = nextY;
    }
  }

  nextX = clamp(nextX, bounds.x, bounds.x + bounds.width - entity.width);
  nextY = clamp(nextY, bounds.y, bounds.y + bounds.height - entity.height);

  return { x: nextX, y: nextY };
}
