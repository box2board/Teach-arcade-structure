import { endpoint } from "./geometry.js";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const angle = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
export function connectionGraph(pieces) {
  const links = [],
    invalid = [];
  for (const a of pieces)
    for (const b of pieces) {
      if (a.id === b.id) continue;
      const end = endpoint(a),
        start = endpoint(b, 0),
        d = distance(end, start);
      if (
        d < 0.12 &&
        angle(end.heading, start.heading) < 0.035 &&
        Math.abs(end.pitch - start.pitch) < 0.08
      )
        links.push({ from: a.id, to: b.id });
      else if (d < 1.25)
        invalid.push({
          from: a.id,
          to: b.id,
          reason:
            d >= 0.12
              ? "Joint gap"
              : angle(end.heading, start.heading) >= 0.035
                ? "Direction mismatch"
                : "Slope mismatch",
        });
    }
  return { links, invalid };
}
export function validate(track) {
  const { links, invalid } = connectionGraph(track.pieces),
    seen = new Set();
  if (track.pieces.length) {
    const visit = [track.startId || track.pieces[0].id];
    while (visit.length) {
      let id = visit.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      for (const l of links) {
        if (l.from === id) visit.push(l.to);
        if (l.to === id) visit.push(l.from);
      }
    }
  }
  return {
    links,
    invalid,
    disconnected: track.pieces.filter((p) => !seen.has(p.id)),
    openEnds: track.pieces.filter((p) => !links.some((l) => l.from === p.id)),
    missingStart: !track.pieces.some((p) => p.id === track.startId),
    missingFinish: !track.pieces.some((p) => p.type === "finish"),
  };
}
export function snapCandidate(piece, pieces, threshold = 3) {
  let best = null;
  for (const other of pieces) {
    if (other.id === piece.id) continue;
    const end = endpoint(other),
      d = distance(end, piece);
    if (d < threshold && (!best || d < best.d))
      best = {
        d,
        piece: { ...piece, x: end.x, y: end.y, z: end.z, yaw: end.heading },
        target: other.id,
      };
  }
  return best;
}
