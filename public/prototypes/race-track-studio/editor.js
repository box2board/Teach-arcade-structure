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
    color: "#23ada7",
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
