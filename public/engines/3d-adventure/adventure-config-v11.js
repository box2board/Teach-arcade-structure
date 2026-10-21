import "./adventure-config-v10.js";

const base = window.TA3DAdventureConfig;
const names = base.exterior?.objects || {};

const tree = (x, z, treeScale = 1) => ({ type: "tree", x, z, treeScale });
const rock = (x, z, rockScale = 1) => ({ type: "rock", x, y: .45 * rockScale, z, rockScale });

window.TA3DAdventureConfig = Object.freeze({
  ...base,
  version: "1.1",
  world: Object.freeze({
    bounds: Object.freeze({ minX: -23, maxX: 23, minZ: -23, maxZ: 23 }),
    scene: Object.freeze({
      background: 0x9bc8e5,
      fog: Object.freeze({ color: 0x9bc8e5, near: 32, far: 72 }),
    }),
    camera: Object.freeze({ fov: 58, near: .1, far: 120, pitch: .28, distance: 7.5, minDistance: 4.5, maxDistance: 10.5 }),
    renderer: Object.freeze({ dprCap: 1.5, shadows: true }),
    lighting: Object.freeze({
      hemisphere: Object.freeze({ sky: 0xe7f6ff, ground: 0x35513f, intensity: 1.65 }),
      directional: Object.freeze([
        Object.freeze({ color: 0xfff4d8, intensity: 2.15, x: 16, y: 22, z: 12, castShadow: true, shadowMapSize: 1024 }),
      ]),
      point: Object.freeze([
        Object.freeze({ color: 0x67e8f9, intensity: .8, distance: 7, x: -6.3, y: 2.2, z: 5.2 }),
        Object.freeze({ color: 0x5eead4, intensity: .45, distance: 8, x: 0, y: 3.2, z: -7 }),
      ]),
    }),
    elements: Object.freeze([
      Object.freeze({ type: "plane", name: "world-ground", w: 70, h: 70, y: 0, rotation: [-Math.PI / 2, 0, 0], material: { color: 0x5f8f65, roughness: .95 }, castShadow: false }),
      Object.freeze({ type: "plane", name: "approach-path", w: 6, h: 34, x: 0, y: .012, z: -1, rotation: [-Math.PI / 2, 0, 0], material: { color: 0xa8a08d, roughness: 1 }, castShadow: false }),
      Object.freeze({ type: "box", name: "facility-pad", x: 0, y: .25, z: -14, w: 16, h: .5, d: 13, material: { color: 0x566678, roughness: .82 } }),
      Object.freeze({ type: "box", x: -5.2, y: 3.2, z: -8, w: 5.6, h: 6.4, d: .7, material: { color: 0x44556a }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 5.2, y: 3.2, z: -8, w: 5.6, h: 6.4, d: .7, material: { color: 0x44556a }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: -7.65, y: 3.2, z: -14, w: .7, h: 6.4, d: 12.7, material: { color: 0x3e4d61 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 7.65, y: 3.2, z: -14, w: .7, h: 6.4, d: 12.7, material: { color: 0x3e4d61 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 0, y: 3.2, z: -20, w: 16, h: 6.4, d: .7, material: { color: 0x3e4d61 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 0, y: 6.35, z: -14, w: 16, h: .55, d: 13, material: { color: 0x314055 }, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.gateDoor || "exterior-gate-door", x: 0, y: 2.25, z: -7.86, w: 4.4, h: 4.5, d: .48, material: { color: 0x26384d, roughness: .55, metalness: .2 }, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.gateStripe || "exterior-gate-stripe", x: 0, y: 2.25, z: -7.59, w: 3.6, h: .13, d: .52, material: { color: 0x5eead4, roughness: .4, metalness: .35, emissive: 0x0f766e, emissiveIntensity: .7 } }),
      Object.freeze({ type: "cylinder", name: "facility-beacon", x: 0, y: .6, z: -16.4, radius: .52, h: 1.15, segments: 14, material: { color: 0x67e8f9, roughness: .35, metalness: .15, emissive: 0x0891b2, emissiveIntensity: 1.25 } }),
      Object.freeze({ type: "torus", name: "facility-beacon-ring", x: 0, y: .18, z: -16.4, radius: 1.15, tube: .07, rotation: [Math.PI / 2, 0, 0], material: { color: 0x67e8f9, roughness: .25, metalness: .2, emissive: 0x0891b2, emissiveIntensity: 1.8 }, animation: { type: "spin", axis: "z", speed: .75 } }),
      Object.freeze({ type: "box", x: 6.35, y: .7, z: -3.6, w: 1.7, h: 1.4, d: 1.2, material: { color: 0x25364b }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.terminalGlow || "exterior-terminal-glow", x: 6.35, y: .9, z: -2.96, w: 1.2, h: .63, d: .08, rotation: [-.12, 0, 0], material: { color: 0x233349, roughness: .35, metalness: .15, emissive: 0x172033, emissiveIntensity: .5 } }),
      Object.freeze({ type: "box", x: 2.8, y: .75, z: -6.35, w: 1.05, h: 1.5, d: .72, material: { color: 0x2d3d50 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.switchGlow || "exterior-switch-glow", x: 2.8, y: .9, z: -5.94, w: .5, h: .5, d: .12, material: { color: 0xef4444, roughness: .3, metalness: .1, emissive: 0x7f1d1d, emissiveIntensity: 1 } }),
      Object.freeze({ type: "cylinder", name: names.energyCell || "exterior-energy-cell", x: -6.3, y: .85, z: 5.2, radius: .35, h: 1.05, segments: 12, rotation: [0, 0, Math.PI / 2], material: { color: 0x38bdf8, roughness: .22, metalness: .4, emissive: 0x0284c7, emissiveIntensity: 1.8 }, animation: { type: "bobSpin", baseY: .85, amplitude: .15, frequency: 2.4, xSpeed: .72, ySpeed: 1.14 } }),
      Object.freeze({ type: "torus", name: names.energyCellRing || "exterior-energy-cell-ring", x: -6.3, y: .12, z: 5.2, radius: .74, tube: .055, rotation: [Math.PI / 2, 0, 0], material: { color: 0x7dd3fc, roughness: .25, metalness: .2, emissive: 0x0284c7, emissiveIntensity: 1.5 }, animation: { type: "spin", axis: "z", speed: 1.1 } }),
      Object.freeze({ type: "box", x: -10.5, y: .65, z: -5.1, w: 2.0, h: 1.3, d: 1.4, material: { color: 0x475569, roughness: .8 }, collider: true }),
      Object.freeze({ type: "box", x: 10.4, y: .5, z: 1.8, w: 1.6, h: 1.0, d: 1.6, material: { color: 0x4b5563, roughness: .82 }, collider: true }),
      ...[
        [-12,8,1.15],[-15,0,.9],[-12,-7,1.05],[12,8,1.1],[15,1,.95],[12,-7,1.05],[-18,12,1.15],[18,12,1.2],[-18,-13,1],[18,-13,1.05],
      ].map(([x,z,s]) => Object.freeze(tree(x,z,s))),
      ...[
        [-10,3,.8],[10,4,.7],[-11,-2,.9],[11,-1,.65],[-4,10,.55],[5,11,.7],
      ].map(([x,z,s]) => Object.freeze(rock(x,z,s))),
    ]),
  }),
});
