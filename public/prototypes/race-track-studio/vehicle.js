import * as T from "../../assets/vendor/three-0.162.0/three.module.js";
import { sample } from "./geometry.js";
import { asset, WIDTH } from "./catalog.js";
export function buildCar() {
  const g = new T.Group(),
    wheels = [];
  function box(w, h, d, color, x, y, z) {
    const m = new T.Mesh(
      new T.BoxGeometry(w, h, d),
      new T.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  }
  function sculpt(points, depth, color) {
    const shape = new T.Shape();
    points.forEach(([x, y], i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.05,
    });
    geometry.translate(0, 0, -depth / 2);
    const mesh = new T.Mesh(
      geometry,
      new T.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.32 }),
    );
    mesh.castShadow = true;
    g.add(mesh);
  }
  sculpt(
    [
      [-1, 0.35],
      [-1.06, 0.58],
      [-0.77, 0.68],
      [0.65, 0.65],
      [1.12, 0.48],
      [1.04, 0.35],
    ],
    1.05,
    "#ff3b18",
  );
  sculpt(
    [
      [-0.62, 0.68],
      [-0.42, 1.03],
      [0.12, 1.06],
      [0.52, 0.68],
    ],
    0.76,
    "#152fff",
  );
  box(0.1, 0.06, 1.2, "#152fff", -0.9, 0.85, 0);
  for (let z of [-0.36, 0.36]) box(0.08, 0.12, 0.22, "#fff3b0", 1.04, 0.57, z);
  box(1.8, 0.06, 0.09, "#fff0d1", 0.1, 0.69, 0);
  for (let x of [-0.65, 0.65])
    for (let z of [-0.64, 0.64]) {
      const wheel = new T.Mesh(
        new T.CylinderGeometry(0.29, 0.29, 0.18, 12),
        new T.MeshStandardMaterial({ color: "#263e46", roughness: 0.85 }),
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.29, z);
      g.add(wheel);
      wheels.push(wheel);
      let hub = new T.Mesh(
        new T.CylinderGeometry(0.15, 0.15, 0.19, 8),
        new T.MeshStandardMaterial({
          color: "#dfdfc5",
          metalness: 0.7,
          roughness: 0.3,
        }),
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(wheel.position);
      g.add(hub);
    }
  g.userData.wheels = wheels;
  return g;
}
export class Vehicle {
  constructor(track, mode = "auto") {
    this.track = track;
    this.mode = mode;
    this.mesh = buildCar();
    this.keys = new Set();
    this.paused = false;
    this.elapsed = 0;
    this.finished = false;
    this.buildSurfaces();
    this.reset();
  }
  buildSurfaces() {
    this.surfaces = [];
    for (const p of this.track.pieces) {
      const count = Math.ceil(asset(p.type).dimensions.length * p.length * 4);
      let prev = sample(p, 0);
      for (let i = 1; i <= count; i++) {
        const next = sample(p, i / count);
        this.surfaces.push({ a: prev, b: next, piece: p });
        prev = next;
      }
    }
  }
  reset() {
    const start =
      this.track.pieces.find((p) => p.id === this.track.startId) ||
      this.track.pieces[0];
    const p = start ? sample(start, 0.08) : { x: 0, y: 0, z: 0, heading: 0 };
    this.pos = new T.Vector3(p.x, p.y + 0.32, p.z);
    this.velocity = new T.Vector3();
    this.yaw = p.heading;
    this.grounded = true;
    this.speed = 0;
    this.elapsed = 0;
    this.finished = false;
    this.airtime = 0;
    this.applyMesh(0);
  }
  nearest() {
    let best = null;
    for (const s of this.surfaces) {
      const dx = s.b.x - s.a.x,
        dz = s.b.z - s.a.z,
        len2 = dx * dx + dz * dz;
      if (!len2) continue;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((this.pos.x - s.a.x) * dx + (this.pos.z - s.a.z) * dz) / len2,
        ),
      );
      const x = s.a.x + dx * t,
        z = s.a.z + dz * t,
        y = s.a.y + (s.b.y - s.a.y) * t + 0.32;
      const dist = Math.hypot(this.pos.x - x, this.pos.z - z);
      if (dist > WIDTH / 2 + 0.1 || Math.abs(this.pos.y - y) > 1.3) continue;
      const score = dist + Math.abs(this.pos.y - y) * 2;
      if (!best || score < best.score)
        best = {
          ...s,
          t,
          x,
          y,
          z,
          dist,
          score,
          heading: Math.atan2(dz, dx),
          slope: (s.b.y - s.a.y) / Math.sqrt(len2),
          bank: s.a.bank || 0,
        };
    }
    return best;
  }
  step(dt) {
    if (this.paused) return;
    this.elapsed += dt;
    const surf = this.nearest(),
      up = this.keys.has("ArrowUp") || this.keys.has("w"),
      down = this.keys.has("ArrowDown") || this.keys.has("s");
    let steering =
      (this.keys.has("ArrowRight") || this.keys.has("d") ? 1 : 0) -
      (this.keys.has("ArrowLeft") || this.keys.has("a") ? 1 : 0);
    let attached =
      surf &&
      this.velocity.y <= 3 &&
      this.pos.y >= surf.y - 0.9 &&
      this.pos.y <= surf.y + 0.6;
    if (attached) {
      this.grounded = true;
      this.airtime = 0;
      this.pos.y = surf.y;
      let forward =
        this.velocity.x * Math.cos(this.yaw) +
        this.velocity.z * Math.sin(this.yaw);
      let accel = this.mode === "auto" ? 6 : up ? 10 : 0;
      if (down) accel = forward > 1 ? -18 : -5;
      if (asset(surf.piece.type).interaction === "boost") accel += 20;
      if (asset(surf.piece.type).interaction === "brake" && forward > 6)
        accel = Math.min(accel, -16);
      forward += (accel - 9.81 * surf.slope - 0.065 * forward) * dt;
      forward = Math.max(-7, Math.min(32, forward));
      if (this.mode === "auto") {
        const d = Math.atan2(
          Math.sin(surf.heading - this.yaw),
          Math.cos(surf.heading - this.yaw),
        );
        this.yaw += d * Math.min(1, dt * 12);
        let cross =
          (this.pos.x - surf.x) * -Math.sin(surf.heading) +
          (this.pos.z - surf.z) * Math.cos(surf.heading);
        this.pos.x += Math.sin(surf.heading) * cross * Math.min(1, dt * 5);
        this.pos.z -= Math.cos(surf.heading) * cross * Math.min(1, dt * 5);
      } else {
        this.yaw += steering * forward * 0.075 * dt;
      }
      this.velocity.set(
        Math.cos(this.yaw) * forward,
        surf.slope * Math.abs(forward),
        Math.sin(this.yaw) * forward,
      );
      let lateral =
        (this.pos.x - surf.x) * -Math.sin(surf.heading) +
        (this.pos.z - surf.z) * Math.cos(surf.heading);
      if (Math.abs(lateral) > WIDTH / 2 - 0.6) {
        const correction =
          Math.sign(lateral) * (Math.abs(lateral) - (WIDTH / 2 - 0.6));
        this.pos.x += Math.sin(surf.heading) * correction;
        this.pos.z -= Math.cos(surf.heading) * correction;
        this.velocity.multiplyScalar(0.98);
      }
      this.pitch = Math.atan(surf.slope);
      this.bank = surf.bank;
      if (surf.piece.type === "finish" && !this.finished) {
        this.finished = true;
        this.finishTime = this.elapsed;
      }
    } else {
      this.grounded = false;
      this.airtime += dt;
      this.velocity.y -= 9.81 * dt;
      this.pitch = (this.pitch || 0) * 0.99;
      this.bank = (this.bank || 0) * 0.98;
    }
    this.pos.addScaledVector(this.velocity, dt);
    if (this.pos.y < 0.03) {
      this.pos.y = 0.03;
      this.velocity.y = 0;
      this.velocity.x *= Math.max(0, 1 - dt * 1.5);
      this.velocity.z *= Math.max(0, 1 - dt * 1.5);
      if (this.mode === "manual") {
        this.yaw += steering * dt * 1.5;
        let f = up ? 5 : down ? -3 : 0;
        this.velocity.x += Math.cos(this.yaw) * f * dt;
        this.velocity.z += Math.sin(this.yaw) * f * dt;
      }
    }
    this.speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.applyMesh(dt);
  }
  applyMesh(dt) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(0, -this.yaw, 0);
    this.mesh.rotateZ(this.pitch || 0);
    this.mesh.rotateX(-(this.bank || 0));
    for (const w of this.mesh.userData.wheels)
      w.rotateY((this.speed * dt) / 0.29);
  }
}
