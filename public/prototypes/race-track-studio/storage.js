import { asset } from "./catalog.js";
import { connectionGraph } from "./connections.js";
export const SCHEMA = 1;
const KEY = "teacharcade.racestudio.v1";
export function newTrack() {
  return {
    version: SCHEMA,
    id: crypto.randomUUID(),
    name: "Untitled Track",
    environment: "circuit-garden",
    pieces: [],
    startId: null,
    vehicle: { color: "#f37752" },
  };
}
export function serialize(track) {
  return {
    ...structuredClone(track),
    version: SCHEMA,
    connections: connectionGraph(track.pieces).links,
    updatedAt: new Date().toISOString(),
  };
}
export function parseTrack(raw) {
  if (!raw || raw.version !== 1)
    throw Error("Unsupported track version. This studio reads version 1.");
  if (!Array.isArray(raw.pieces) || raw.pieces.length > 250)
    throw Error("Track must contain 0–250 pieces.");
  let ids = new Set();
  for (const p of raw.pieces) {
    if (!asset(p.type) || typeof p.id !== "string" || ids.has(p.id))
      throw Error("Unknown component or duplicate identifier.");
    ids.add(p.id);
    if (!["x", "y", "z", "yaw", "length"].every((k) => Number.isFinite(p[k])))
      throw Error("Invalid piece coordinates.");
    if (
      Math.abs(p.x) > 500 ||
      Math.abs(p.z) > 500 ||
      p.y < 0 ||
      p.y > 40 ||
      p.length < 0.5 ||
      p.length > 2
    )
      throw Error("Piece exceeds supported build bounds.");
    if (p.color && !/^#[0-9a-f]{6}$/i.test(p.color))
      throw Error("Invalid track color.");
  }
  return {
    ...newTrack(),
    ...raw,
    name: String(raw.name || "Imported track").slice(0, 60),
    pieces: structuredClone(raw.pieces),
    startId: ids.has(raw.startId) ? raw.startId : raw.pieces[0]?.id || null,
  };
}
export function listSaves() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
export function saveTrack(t) {
  const all = listSaves();
  all[t.id] = serialize(t);
  localStorage.setItem(KEY, JSON.stringify(all));
}
export function deleteSave(id) {
  const all = listSaves();
  delete all[id];
  localStorage.setItem(KEY, JSON.stringify(all));
}
