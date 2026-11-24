export const boardStepMs = 145;

export function boardPoint(points, position, movement, now) {
  const path = movement?.path;
  if (!Array.isArray(path) || path.length < 2 || path.at(-1) !== position) return points[position];
  const cursor = Math.max(0, (now - movement.at) / boardStepMs);
  if (cursor >= path.length - 1) return points[position];
  const step = Math.floor(cursor);
  const from = points[path[step]], to = points[path[step + 1]];
  if (!from || !to) return points[position];
  const amount = cursor - step;
  return {x:from.x + (to.x - from.x) * amount, y:from.y + (to.y - from.y) * amount};
}

export function boardMoving(movement, now) {
  return Boolean(movement?.path?.length > 1 && now - movement.at < (movement.path.length - 1) * boardStepMs);
}
