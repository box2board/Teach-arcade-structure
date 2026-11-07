import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { CATALOG } from "../../public/prototypes/race-track-studio/catalog.js";
import {
  piece,
  starter,
  Editor,
} from "../../public/prototypes/race-track-studio/editor.js";
import {
  endpoint,
  makePiece,
  disposeGroup,
} from "../../public/prototypes/race-track-studio/geometry.js";
import {
  validate,
  snapCandidate,
  placementIssue,
} from "../../public/prototypes/race-track-studio/connections.js";
import {
  serialize,
  parseTrack,
  newTrack,
  saveTrack,
  listSaves,
} from "../../public/prototypes/race-track-studio/storage.js";
import { Vehicle } from "../../public/prototypes/race-track-studio/vehicle.js";
function chain(types) {
  let t = newTrack(),
    end = { x: 0, y: 0, z: 0, heading: 0 };
  for (let type of types) {
    let p = piece(type, end.x, end.y, end.z, end.heading);
    t.pieces.push(p);
    end = endpoint(p);
  }
  t.startId = t.pieces[0]?.id;
  return t;
}
function simulate(t, seconds, mode = "auto") {
  let v = new Vehicle(t, mode);
  for (let i = 0; i < seconds * 120; i++) v.step(1 / 120);
  return v;
}
test("all 61 assets produce finite smooth geometry and exact snap endpoints", () => {
  assert.equal(CATALOG.length, 61);
  for (let a of CATALOG) {
    let p = piece(a.id, 0, 5);
    const g = makePiece(p);
    g.traverse((o) => {
      if (o.geometry?.attributes.position)
        for (const n of o.geometry.attributes.position.array)
          assert.ok(Number.isFinite(n));
    });
    disposeGroup(g);
    let end = endpoint(p),
      q = piece("straight", end.x + 0.3, end.y, end.z);
    const snapped = snapCandidate(q, [p]);
    assert.ok(snapped);
    assert.ok(
      Math.hypot(snapped.piece.x - end.x, snapped.piece.z - end.z) < 1e-10,
    );
  }
});
test("connections, disconnected islands and invalid orientation are distinguished", () => {
  let t = chain(["straight", "left", "rise"]);
  assert.equal(validate(t).links.length, 2);
  assert.equal(validate(t).disconnected.length, 0);
  t.pieces[1].yaw += 0.5;
  assert.ok(validate(t).invalid.length > 0);
  assert.ok(validate(t).disconnected.length > 0);
});
test("delete undo redo restores geometry and links", () => {
  let e = new Editor(chain(["straight", "right", "straight"]), () => {}),
    before = JSON.stringify(e.track);
  e.change((t) => t.pieces.splice(1, 1));
  assert.equal(e.track.pieces.length, 2);
  e.undo();
  assert.equal(JSON.stringify(e.track), before);
  assert.equal(validate(e.track).links.length, 2);
  e.redo();
  assert.equal(e.track.pieces.length, 2);
});
test("save/load and JSON preserve all pieces, properties and connections", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
  let t = starter();
  t.pieces[3].color = "#ff8844";
  t.pieces[3].length = 1.4;
  saveTrack(t);
  let restored = parseTrack(JSON.parse(JSON.stringify(listSaves()[t.id])));
  assert.deepEqual(restored.pieces, t.pieces);
  assert.deepEqual(serialize(restored).connections, serialize(t).connections);
  assert.equal(restored.startId, t.startId);
  assert.throws(() => parseTrack({ ...t, version: 2 }));
  assert.throws(() =>
    parseTrack({ ...t, pieces: [{ ...t.pieces[0], x: NaN }] }),
  );
});
test("automatic vehicle progresses through straight, curve, incline and descent", () => {
  for (let types of [
    ["start", "long", "finish"],
    ["start", "right", "long", "finish"],
    ["start", "rise", "bridge", "fall", "finish"],
  ]) {
    let t = chain(types),
      v = simulate(t, 10);
    assert.ok(v.finished, `did not finish ${types}: ${JSON.stringify(v.pos)}`);
    assert.ok(Number.isFinite(v.pos.y));
  }
});
test("manual throttle, braking, steering, reset, pause and gravity", () => {
  let t = chain(["start", "long", "long"]);
  let v = new Vehicle(t, "manual");
  v.keys.add("ArrowUp");
  for (let i = 0; i < 200; i++) v.step(1 / 120);
  assert.ok(v.speed > 8);
  let before = v.speed;
  v.keys.clear();
  v.keys.add("ArrowDown");
  for (let i = 0; i < 40; i++) v.step(1 / 120);
  assert.ok(v.speed < before);
  v.keys.clear();
  v.keys.add("ArrowRight");
  let yaw = v.yaw;
  for (let i = 0; i < 20; i++) v.step(1 / 120);
  assert.ok(v.yaw > yaw);
  v.paused = true;
  let pos = v.pos.clone();
  v.step(0.1);
  assert.ok(pos.equals(v.pos));
  v.reset();
  assert.ok(v.pos.x < 1);
  v.paused = false;
  v.pos.y = 10;
  v.velocity.y = 0;
  v.step(1 / 120);
  assert.ok(v.velocity.y < 0);
});
test("ramp launches, gap flight and recovery have finite stable state", () => {
  let t = chain(["start", "boost", "ramp"]);
  let v = new Vehicle(t),
    airborne = false;
  for (let i = 0; i < 1200; i++) {
    v.step(1 / 120);
    if (!v.grounded && v.pos.y > 1) airborne = true;
  }
  assert.ok(airborne);
  assert.ok(v.pos.y >= 0);
  assert.ok(Number.isFinite(v.speed));
  v.reset();
  assert.equal(v.speed, 0);
});
test("250-piece construction validation and simulation performance sample", () => {
  let t = chain(Array(250).fill("short"));
  let start = performance.now();
  const report = validate(t);
  const validationMs = performance.now() - start;
  assert.equal(report.links.length, 249);
  start = performance.now();
  let v = simulate(t, 5);
  const simulationMs = performance.now() - start;
  console.log(
    JSON.stringify({
      pieces: 250,
      validationMs,
      simulation600StepsMs: simulationMs,
      surfaceSegments: v.surfaces.length,
    }),
  );
  assert.ok(Number.isFinite(v.speed));
});

test("expanded profiles connect, serialize and simulate without invalid numbers", () => {
  for (const a of CATALOG) {
    const t = chain(["start", a.id, "finish"]);
    if (a.rise < 0) {
      for (const p of t.pieces) p.y += Math.abs(a.rise);
    }
    const restored = parseTrack(serialize(t));
    assert.equal(restored.pieces[1].type, a.id);
    const v = simulate(t, 4);
    assert.ok(
      [v.pos.x, v.pos.y, v.pos.z, v.speed].every(Number.isFinite),
      a.id,
    );
  }
});
test("brake zone reduces speed without trapping the vehicle", () => {
  let t = chain(["brake"]);
  let v = new Vehicle(t, "manual");
  v.velocity.x = 12;
  for (let i = 0; i < 90; i++) v.step(1 / 120);
  assert.ok(v.speed < 8);
  v.keys.add("ArrowUp");
  for (let i = 0; i < 120; i++) v.step(1 / 120);
  assert.ok(v.pos.x > 8);
});

test("vertical loop carries the vehicle upside down and reconnects to exit in both modes", () => {
  for (const mode of ["auto", "manual"]) {
    const t = chain(["start", "boost", "vertical-loop", "long", "finish"]);
    const v = new Vehicle(t, mode);
    if (mode === "manual") v.keys.add("ArrowUp");
    let inverted = false,
      reachedHeight = false;
    for (let i = 0; i < 2400; i++) {
      v.step(1 / 120);
      if (Math.abs(v.pitch) > 2.8) inverted = true;
      if (v.pos.y > 9) reachedHeight = true;
      if (v.finished) break;
    }
    assert.ok(inverted, mode + " did not invert");
    assert.ok(reachedHeight);
    assert.ok(v.finished, mode + " did not reach finish");
    v.reset();
    assert.equal(v.loopRide, null);
  }
});

test("occupied exits cannot snap and overlapping entry placement is rejected", async () => {
  const { placementIssue } = await import(
    "../../public/prototypes/race-track-studio/connections.js"
  );
  const t = chain(["straight", "straight"]);
  const p = piece("short", 8, 0, 0);
  assert.ok(placementIssue(p, t.pieces)?.includes("occupied"));
  assert.equal(snapCandidate(p, t.pieces, 2), null);
  const end = endpoint(t.pieces[1]);
  p.x = end.x;
  p.z = end.z;
  assert.ok(snapCandidate(p, t.pieces, 2)?.valid);
});
test("connected translate/rotate preserves joints, ignores islands and supports undo redo", async () => {
  const { transformedSection } = await import(
    "../../public/prototypes/race-track-studio/editor.js"
  );
  const t = chain(["straight", "right", "rise"]);
  const island = piece("short", 90, 0, 90);
  t.pieces.push(island);
  const e = new Editor(structuredClone(t), () => {}),
    id = t.pieces[0].id;
  const moved = transformedSection(
    t,
    id,
    { x: 10, y: 4, z: 12, yaw: Math.PI / 2 },
    true,
  );
  assert.equal(moved.count, 3);
  assert.deepEqual(moved.pieces[3], island);
  assert.equal(validate({ ...t, pieces: moved.pieces }).links.length, 2);
  e.change((t) => (t.pieces = moved.pieces));
  e.undo();
  assert.equal(e.track.pieces[0].x, 0);
  e.redo();
  assert.equal(e.track.pieces[0].x, 10);
  assert.throws(() => transformedSection(t, id, { y: -4 }, true));
  assert.equal(t.pieces[0].y, 0);
  const single = transformedSection(t, id, { x: -10 }, false);
  assert.deepEqual(single.pieces[1], t.pieces[1]);
});

test("arcade countdown pauses, starts once, tracks peak speed and resets for replay", async () => {
  const { PlayFlow } = await import(
    "../../public/prototypes/race-track-studio/play-flow.js"
  );
  const f = new PlayFlow();
  assert.equal(f.label, "3");
  assert.equal(f.tick(1), false);
  assert.equal(f.label, "2");
  f.paused = true;
  f.tick(2);
  assert.equal(f.remaining, 2);
  f.paused = false;
  f.tick(2);
  assert.equal(f.label, "GO!");
  assert.equal(f.tick(0.2, 12), true);
  f.tick(0.2, 8);
  assert.equal(f.peak, 12);
  assert.equal(f.finish(4.2), true);
  assert.equal(f.finish(5), false);
  assert.equal(f.tick(1, 30), false);
  assert.equal(f.time, 4.2);
  f.reset();
  assert.equal(f.label, "3");
  assert.equal(f.peak, 0);
  assert.equal(f.finished, false);
});
test("playground demo has connected loop and reaches the finish", async () => {
  const { loopPlayground } = await import(
    "../../public/prototypes/race-track-studio/editor.js"
  );
  const t = loopPlayground();
  assert.equal(validate(t).disconnected.length, 0);
  const v = simulate(t, 16);
  assert.equal(v.finished, true);
});

test('library miniatures use distinct finite geometry for actual profiles',async()=>{
 const {icon}=await import('../../public/prototypes/race-track-studio/piece-preview.js');
 for(const a of CATALOG){const svg=icon(a);assert.ok(svg.includes('<svg'));assert.ok(!/NaN|Infinity|undefined/.test(svg),a.id);}
 const preview=id=>icon(CATALOG.find(a=>a.id===id));
 for(const [a,b] of [['short','long'],['left','right'],['rise','ramp'],['vertical-loop','rolling-hills'],['boost','brake']])assert.notEqual(preview(a),preview(b));
});


test("elevated connector targeting aligns curves and accepts ramp lips", () => {
  const ramp = piece("ramp", 10, 12, 15, Math.PI / 3);
  const far = piece("straight", 60, 0, 60);
  const curve = piece("right");
  const snap = snapCandidate(curve, [far, ramp], 42, (_point, other) =>
    other.id === ramp.id ? 10 : 55,
  );
  assert.equal(snap.target, ramp.id);
  assert.equal(snap.valid, true);
  assert.equal(snap.piece.y, endpoint(ramp).y);
  assert.equal(snap.piece.yaw, endpoint(ramp).heading);
  assert.equal(placementIssue(snap.piece, [ramp]), null);
  assert.equal(validate({ pieces: [ramp, snap.piece] }).links.length, 1);
});
