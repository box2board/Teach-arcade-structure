import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../public/assets/vendor/three-0.162.0/three.module.js';
import { createWorldCollider } from '../public/engines/3d-adventure/world-collision.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);
const parent = new THREE.Group();
parent.position.set(10, 0, -6);
parent.rotation.y = Math.PI / 2;
parent.scale.set(2, 1, 3);
const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4));
mesh.position.x = 1;
parent.add(mesh);
const collider = createWorldCollider(mesh);
let bounds = collider.bounds();
near(bounds.min.x, 4); near(bounds.max.x, 16);
near(bounds.min.z, -10); near(bounds.max.z, -6);
parent.position.x += 5;
bounds = collider.bounds();
near(bounds.min.x, 9); near(bounds.max.x, 21);

// Exercise the actual builder without WebGL, using the vendored Three.js.
globalThis.window = new EventTarget();
globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options.detail; } };
const builderPath = new URL('../public/engines/3d-adventure/world-builder-v11.js', import.meta.url);
const threeURL = new URL('../public/assets/vendor/three-0.162.0/three.module.js', import.meta.url).href;
const source = (await readFile(builderPath, 'utf8')).replace('/assets/vendor/three-0.162.0/three.module.js', threeURL);
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

for (const file of ['adventure-config-v11.js', 'silent-observatory/config-v12.js']) {
  await import(new URL(`../public/engines/3d-adventure/${file}`, import.meta.url));
  const config = window.TA3DAdventureConfig;
  const scene = new THREE.Scene();
  const colliders = [];
  window.TA3DWorldBuilder.build({ scene, registerCollider: object => colliders.push(createWorldCollider(object)), addCameraObstacle() {}, registerAnimation() {} });
  assert.ok(colliders.length > 0);
  const boxes = colliders.map(c => c.bounds().clone());
  const radius = config.player.radius ?? .52;
  const blocked = (x, z) => boxes.some(b => x + radius > b.min.x && x - radius < b.max.x && z + radius > b.min.z && z - radius < b.max.z);
  assert.equal(blocked(config.player.start.x, config.player.start.z), false, `${config.id}: spawn blocked`);
  if (file.includes('observatory')) {
    assert.equal(blocked(-6.2, -6.8), true, 'translated pylon blocks its visible position');
    assert.equal(blocked(-13.2, 1.8), true, 'cylinder base registers collision');
    assert.equal(blocked(0, 0), false, 'no phantom pylon at origin');
  }
  // Flood-fill with the same player footprint to verify exterior targets remain reachable.
  const { minX, maxX, minZ, maxZ } = config.world.bounds;
  const step = .25;
  const visited = new Set();
  const queue = [[config.player.start.x, config.player.start.z]];
  const key = (x, z) => `${Math.round(x / step)},${Math.round(z / step)}`;
  visited.add(key(...queue[0]));
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const nx = x + dx, nz = z + dz, id = key(nx, nz);
      if (nx < minX || nx > maxX || nz < minZ || nz > maxZ || visited.has(id) || blocked(nx, nz)) continue;
      visited.add(id); queue.push([nx,nz]);
    }
  }
  for (const name of ['energyCell', 'terminal', 'switch', 'missionEntry']) {
    const target = config.exterior[name];
    assert.ok(queue.some(([x,z]) => Math.hypot(x-target.x,z-target.z) < 1.8), `${config.id}: ${name} unreachable with static world colliders`);
  }
  console.log(`${config.id}: ${colliders.length} colliders; spawn and exterior routes pass`);
}
console.log('World collision regression checks passed.');
