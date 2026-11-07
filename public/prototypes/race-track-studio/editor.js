import { connectedIds, placementIssue } from "./connections.js";
import { asset } from "./catalog.js";
import { newTrack } from "./storage.js";
import { endpoint } from "./geometry.js";
export function piece(type, x = 0, y = 0, z = 0, yaw = 0) {
  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    z,
    yaw,
    length: 1,
    color: asset(type).color,
  };
}
export function starter() {
  const t = newTrack();
  t.name = "Garden Circuit";
  let cursor = { x: -23, y: 0, z: -18, heading: 0 };
  for (let type of [
    "start",
    "long",
    "right",
    "rise",
    "bridge",
    "fall",
    "right",
    "boost",
    "long",
    "right",
    "straight",
    "long",
    "right",
    "finish",
  ]) {
    let p = piece(type, cursor.x, cursor.y, cursor.z, cursor.heading);
    t.pieces.push(p);
    cursor = endpoint(p);
  }
  t.startId = t.pieces[0].id;
  return t;
}
export class Editor {
  constructor(track, onChange) {
    this.track = track;
    this.selected = null;
    this.undoStack = [];
    this.redoStack = [];
    this.onChange = onChange;
  }
  checkpoint() {
    this.undoStack.push(JSON.stringify(this.track));
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack = [];
  }
  change(fn) {
    this.checkpoint();
    fn(this.track);
    this.onChange();
  }
  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify(this.track));
    this.track = JSON.parse(this.undoStack.pop());
    this.selected = null;
    this.onChange();
  }
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(this.track));
    this.track = JSON.parse(this.redoStack.pop());
    this.selected = null;
    this.onChange();
  }
  get selection() {
    return this.track.pieces.find((p) => p.id === this.selected);
  }
  replace(track) {
    this.change(() => {
      this.track = track;
      this.selected = null;
    });
  }
}

export function transformedSection(track, id, changes, connected = false) {
  const pivot = track.pieces.find((p) => p.id === id);
  if (!pivot) throw Error("Select a piece first");
  const ids = connected ? connectedIds(track.pieces, id) : new Set([id]);
  const deltaYaw = (changes.yaw ?? pivot.yaw) - pivot.yaw,
    dx = (changes.x ?? pivot.x) - pivot.x,
    dy = (changes.y ?? pivot.y) - pivot.y,
    dz = (changes.z ?? pivot.z) - pivot.z,
    c = Math.cos(deltaYaw),
    s = Math.sin(deltaYaw);
  const result = track.pieces.map((p) => {
    if (!ids.has(p.id)) return p;
    const x = p.x - pivot.x,
      z = p.z - pivot.z;
    return {
      ...p,
      x: pivot.x + x * c - z * s + dx,
      y: p.y + dy,
      z: pivot.z + x * s + z * c + dz,
      yaw: p.yaw + deltaYaw,
    };
  });
  for (const p of result.filter((p) => ids.has(p.id))) {
    if (
      Math.abs(p.x) > 500 ||
      Math.abs(p.z) > 500 ||
      p.y < 0 ||
      p.y > 40 ||
      p.y + Math.min(0, asset(p.type).rise || 0) < 0
    )
      throw Error("Section would exceed build bounds or go below the floor");
    const issue = placementIssue(p, result);
    if (issue) throw Error(issue);
  }
  return { pieces: result, count: ids.size };
}

export function loopPlayground() {
  const t = newTrack();
  t.name = "Loop Launch!";
  let cursor = { x: -28, y: 0, z: -8, heading: 0 };
  for (const type of ["start", "boost", "vertical-loop", "long", "finish"]) {
    const p = piece(type, cursor.x, cursor.y, cursor.z, cursor.heading);
    t.pieces.push(p);
    cursor = endpoint(p);
  }
  t.startId = t.pieces[0].id;
  return t;
}
