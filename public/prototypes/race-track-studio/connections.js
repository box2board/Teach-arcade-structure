import { asset, isScenery } from "./catalog.js";
import { endpoint } from "./geometry.js";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const angle = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
function pitchMatches(from, to, end, start) {
  // Launch lips and landing faces deliberately change pitch at their sockets.
  return asset(from.type).kind === "ramp" || asset(to.type).kind === "landing" || Math.abs(end.pitch - start.pitch) < 0.08;
}
export function connectionGraph(pieces) {
  pieces = pieces.filter((piece) => !isScenery(piece));
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
        pitchMatches(a, b, end, start)
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
  for (const p of pieces) {
    const outgoing = links.filter((l) => l.from === p.id),
      incoming = links.filter((l) => l.to === p.id);
    if (outgoing.length > 1 || incoming.length > 1)
      invalid.push({
        from: p.id,
        to: p.id,
        reason: "Occupied connection: multiple pieces share a socket",
      });
  }
  for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){if(distance(endpoint(pieces[i],0),endpoint(pieces[j],0))<.12)invalid.push({from:pieces[i].id,to:pieces[j].id,reason:'Entry occupied: two pieces share a socket'});}
  return { links, invalid };
}
export function validate(track) {
  const pieces = track.pieces.filter((piece) => !isScenery(piece));
  const { links, invalid } = connectionGraph(pieces),
    seen = new Set();
  const jump = track.jumpChallenge;
  const launch = pieces.find((p) => p.id === jump?.launchId);
  const landing = pieces.find((p) => p.id === jump?.landingId);
  const markedJump = asset(launch?.type)?.kind === "ramp" &&
    asset(landing?.type)?.kind === "landing" &&
    distance(endpoint(launch), endpoint(landing, 0)) > 1.25;
  if (pieces.length) {
    const visit = [track.startId || pieces[0].id];
    while (visit.length) {
      let id = visit.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      if (markedJump && id === launch.id) visit.push(landing.id);
      for (const l of links) {
        if (l.from === id) visit.push(l.to);
        if (l.to === id) visit.push(l.from);
      }
    }
  }
  return {
    links,
    markedJump,
    invalid,
    disconnected: pieces.filter((p) => !seen.has(p.id)),
    openEnds: pieces.filter((p) => !links.some((l) => l.from === p.id)),
    missingStart: !pieces.some((p) => p.id === track.startId),
    missingFinish: !pieces.some((p) => p.type === "finish"),
  };
}
export function snapCandidate(piece, pieces, threshold = 3, measure = (exit) => distance(exit, piece)) {
  if (isScenery(piece)) return null;
  pieces = pieces.filter((other) => !isScenery(other));
  let best = null;
  const starts = pieces.map((p) => ({ id: p.id, point: endpoint(p, 0) }));
  const entry = endpoint(piece, 0);
  for (const other of pieces) {
    if (other.id === piece.id) continue;
    const exitPoint = endpoint(other);
    if (
      starts.some(
        (p) =>
          p.id !== piece.id &&
          p.id !== other.id &&
          distance(exitPoint, p.point) < 0.12,
      )
    )
      continue;
    const end = exitPoint,
      d = measure(end, other);
    if (d < threshold && (!best || d < best.d))
      best = {
        d,
        piece: { ...piece, x: end.x, y: end.y, z: end.z, yaw: end.heading },
        target: other.id,
        valid: pitchMatches(other, piece, end, entry),
        reason:
          pitchMatches(other, piece, end, entry)
            ? ""
            : "Slope mismatch: choose a transition piece",
      };
  }
  return best;
}

export function placementIssue(piece, pieces, ignoredIds = new Set()) {
  if (isScenery(piece)) return null;
  const others = pieces.filter(
      (p) => !isScenery(p) && p.id !== piece.id && !ignoredIds.has(p.id),
    ),
    start = endpoint(piece, 0),
    end = endpoint(piece);
  for (const other of others) {
    if (distance(start, endpoint(other, 0)) < 0.12)
      return "Entry occupied: another piece starts here";
    if (distance(end, endpoint(other)) < 0.12)
      return "Exit occupied: another piece ends here";
    const joint = endpoint(other);
    if (
      distance(start, joint) < 0.12 &&
      (angle(start.heading, joint.heading) > 0.035 ||
        !pitchMatches(other, piece, joint, start))
    )
      return "Invalid connection: direction or slope mismatch";
  }
  return null;
}
export function connectedIds(pieces, id) {
  const { links } = connectionGraph(pieces),
    seen = new Set(),
    queue = [id];
  while (queue.length) {
    const current = queue.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    for (const l of links) {
      if (l.from === current) queue.push(l.to);
      if (l.to === current) queue.push(l.from);
    }
  }
  return seen;
}
