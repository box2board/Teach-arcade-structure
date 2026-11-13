import { asset, isScenery } from "./catalog.js";
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
    pieces: structuredClone(raw.pieces).map((p) => ({
      ...p,
      color: !p.color || p.color === "#23ada7" ? asset(p.type).color : p.color,
    })),
    startId: (raw.pieces.find((p) => p.id === raw.startId && !isScenery(p)) || raw.pieces.find((p) => !isScenery(p)))?.id || null,
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

const BEST_TIMES = "teacharcade.racestudio.best-times.v1";
export function raceRecordKey(track, mode) {
  const pieces = track.pieces.filter((piece) => !isScenery(piece));
  const start = Math.max(0, pieces.findIndex((piece) => piece.id === track.startId));
  return JSON.stringify([mode, start, pieces.map(({ type, x, y, z, yaw, length }) =>
    [type, x, y, z, yaw, length])]);
}
function raceRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(BEST_TIMES) || "[]");
    return Array.isArray(records) ? records.filter((record) =>
      Array.isArray(record) && typeof record[0] === "string" &&
      Number.isFinite(record[1]) && record[1] > 0) : [];
  } catch {
    return [];
  }
}
export function bestRaceTime(key) {
  return raceRecords().find(([storedKey]) => storedKey === key)?.[1] ?? null;
}
export function saveBestRaceTime(key, time) {
  const records = raceRecords();
  const previous = records.find(([storedKey]) => storedKey === key)?.[1] ?? null;
  if (!Number.isFinite(time) || time <= 0 || (previous !== null && time >= previous))
    return { best: previous, improved: false };
  try {
    const updated = [[key, time], ...records.filter(([storedKey]) => storedKey !== key)].slice(0, 40);
    localStorage.setItem(BEST_TIMES, JSON.stringify(updated));
  } catch {
    return { best: previous, improved: false };
  }
  return { best: time, improved: true };
}
