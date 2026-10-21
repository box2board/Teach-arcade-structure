import "../adventure-config-v11.js";
import "./config.js";

const base = window.TA3DAdventureConfig;
const names = base.exterior?.objects || {};
const prism = Object.freeze({ x: -10.8, z: 5.8 });
const terminal = Object.freeze({ x: 9.4, z: 1.4 });
const gateSwitch = Object.freeze({ x: 4.25, z: -6.3 });

const pylon = (x, z) => Object.freeze({
  type: "group", x, z,
  children: Object.freeze([
    Object.freeze({ type: "box", y: 2.1, w: .95, h: 4.2, d: .95, material: { color: 0x9b7650, roughness: .95 }, collider: true, cameraBlock: true }),
    Object.freeze({ type: "octahedron", y: 4.55, radius: .62, rotation: [0, Math.PI / 4, 0], material: { color: 0x9a7440, roughness: .45, metalness: .5 } }),
  ]),
});

window.TA3DAdventureConfig = Object.freeze({
  ...base,
  version: "1.1-world-test",
  player: Object.freeze({
    ...base.player,
    start: Object.freeze({ x: 0, y: 0, z: 17.5, yaw: 0 }),
  }),
  exterior: Object.freeze({
    ...base.exterior,
    start: Object.freeze({ x: 0, z: 17.5 }),
    energyCell: prism,
    terminal,
    terminalWait: Object.freeze({ x: 8.0, z: 3.0 }),
    switch: gateSwitch,
    switchWait: Object.freeze({ x: 4.25, z: -4.65 }),
    gateCheckpoint: Object.freeze({ x: 0, z: -6.25 }),
    missionEntry: Object.freeze({ x: 0, z: -9.4 }),
    entryTrigger: Object.freeze({ maxAbsX: 7.8, zLessThan: -9.0 }),
    gateBlocker: Object.freeze({ minX: -2.35, maxX: 2.35, minZ: -8.12, maxZ: -7.58 }),
  }),
  world: Object.freeze({
    bounds: Object.freeze({ minX: -28, maxX: 28, minZ: -24, maxZ: 27 }),
    scene: Object.freeze({
      background: 0x22243f,
      fog: Object.freeze({ color: 0x40354a, near: 36, far: 86 }),
    }),
    camera: Object.freeze({ fov: 58, near: .1, far: 135, pitch: .3, distance: 8.1, minDistance: 4.8, maxDistance: 11.5 }),
    renderer: Object.freeze({ dprCap: 1.45, shadows: true }),
    lighting: Object.freeze({
      hemisphere: Object.freeze({ sky: 0x8798cf, ground: 0x60432e, intensity: 1.3 }),
      directional: Object.freeze([
        Object.freeze({ color: 0xffd3a1, intensity: 1.7, x: 14, y: 21, z: 10, castShadow: true, shadowMapSize: 1024, shadowLeft: -32, shadowRight: 32, shadowTop: 32, shadowBottom: -32 }),
      ]),
      point: Object.freeze([
        Object.freeze({ color: 0x80dfff, intensity: 1.0, distance: 8, x: prism.x, y: 2.0, z: prism.z }),
        Object.freeze({ color: 0xb18cff, intensity: .65, distance: 10, x: 0, y: 3.2, z: -7.1 }),
      ]),
    }),
    elements: Object.freeze([
      Object.freeze({ type: "plane", name: "observatory-desert", w: 82, h: 82, y: 0, rotation: [-Math.PI / 2, 0, 0], material: { color: 0xb98b58, roughness: 1 }, castShadow: false }),
      Object.freeze({ type: "plane", name: "observatory-main-walk", w: 7.5, h: 42, x: 0, y: .012, z: 1.2, rotation: [-Math.PI / 2, 0, 0], material: { color: 0x806a58, roughness: 1 }, castShadow: false }),
      Object.freeze({ type: "plane", name: "observatory-cross-walk", w: 27, h: 4.5, x: 0, y: .014, z: 3.5, rotation: [-Math.PI / 2, 0, Math.PI / 2], material: { color: 0x8d735b, roughness: 1 }, castShadow: false }),
      Object.freeze({ type: "box", name: "observatory-platform", x: 0, y: .25, z: -13.4, w: 20, h: .5, d: 12, material: { color: 0x735f4c, roughness: .93 } }),
      Object.freeze({ type: "box", x: -6.6, y: 3.2, z: -7.9, w: 8.1, h: 6.4, d: .72, material: { color: 0x846b50, roughness: .88 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 6.6, y: 3.2, z: -7.9, w: 8.1, h: 6.4, d: .72, material: { color: 0x846b50, roughness: .88 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: -9.65, y: 3.2, z: -13.5, w: .72, h: 6.4, d: 11.8, material: { color: 0x6d5948, roughness: .92 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 9.65, y: 3.2, z: -13.5, w: .72, h: 6.4, d: 11.8, material: { color: 0x6d5948, roughness: .92 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 0, y: 3.2, z: -19.05, w: 20, h: 6.4, d: .72, material: { color: 0x66513f, roughness: .92 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", x: 0, y: 6.35, z: -13.5, w: 20, h: .55, d: 11.8, material: { color: 0x4d423e, roughness: .88 }, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.gateDoor || "exterior-gate-door", x: 0, y: 2.25, z: -7.86, w: 4.7, h: 4.5, d: .48, material: { color: 0x65513f, roughness: .52, metalness: .24 }, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.gateStripe || "exterior-gate-stripe", x: 0, y: 2.25, z: -7.59, w: 3.9, h: .13, d: .52, material: { color: 0xb18cff, roughness: .35, metalness: .3, emissive: 0x5b21b6, emissiveIntensity: 1.0 } }),
      Object.freeze({ type: "box", x: terminal.x, y: .75, z: terminal.z, w: 1.9, h: 1.5, d: 1.25, material: { color: 0x5d4d40, roughness: .8 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.terminalGlow || "exterior-terminal-glow", x: terminal.x, y: .97, z: terminal.z + .665, w: 1.25, h: .66, d: .08, rotation: [-.12, 0, 0], material: { color: 0x233349, roughness: .35, metalness: .15, emissive: 0x172033, emissiveIntensity: .5 } }),
      Object.freeze({ type: "box", x: gateSwitch.x, y: .78, z: gateSwitch.z, w: 1.05, h: 1.55, d: .75, material: { color: 0x5a493c, roughness: .8 }, collider: true, cameraBlock: true }),
      Object.freeze({ type: "box", name: names.switchGlow || "exterior-switch-glow", x: gateSwitch.x, y: .94, z: gateSwitch.z + .43, w: .5, h: .5, d: .12, material: { color: 0xef4444, roughness: .3, metalness: .1, emissive: 0x7f1d1d, emissiveIntensity: 1 } }),
      Object.freeze({ type: "octahedron", name: names.energyCell || "exterior-energy-cell", x: prism.x, y: .9, z: prism.z, radius: .58, rotation: [0, Math.PI / 4, 0], material: { color: 0x80dfff, roughness: .2, metalness: .3, emissive: 0x2386a8, emissiveIntensity: 2.0 }, animation: { type: "bobSpin", baseY: .9, amplitude: .18, frequency: 2.1, ySpeed: 1.25, xSpeed: .2 } }),
      Object.freeze({ type: "torus", name: names.energyCellRing || "exterior-energy-cell-ring", x: prism.x, y: .16, z: prism.z, radius: .9, tube: .06, rotation: [Math.PI / 2, 0, 0], material: { color: 0x80dfff, roughness: .2, metalness: .2, emissive: 0x2386a8, emissiveIntensity: 1.7 }, animation: { type: "spin", axis: "z", speed: 1.0 } }),
      pylon(-6.2, -6.8),
      pylon(6.2, -6.8),
      Object.freeze({ type: "group", x: -13.2, z: 1.8, children: Object.freeze([
        Object.freeze({ type: "cylinder", y: .7, radiusTop: 1.05, radiusBottom: 1.35, h: 1.4, segments: 10, material: { color: 0x51463f, roughness: .92 }, collider: true }),
        Object.freeze({ type: "cylinder", x: .45, y: 2.6, radiusTop: .28, radiusBottom: .34, h: 3.7, segments: 10, rotation: [0, 0, -.62], material: { color: 0x9a7440, roughness: .45, metalness: .5 } }),
        Object.freeze({ type: "cylinder", x: 1.65, y: 3.72, radiusTop: 1.45, radiusBottom: .22, h: .34, segments: 20, rotation: [0, 0, Math.PI / 2 - .62], material: { color: 0x9b7650, roughness: .92 } }),
        Object.freeze({ type: "sphere", x: 2.55, y: 4.28, radius: .22, material: { color: 0x80dfff, roughness: .2, emissive: 0x2386a8, emissiveIntensity: 1.8 } }),
      ]) }),
      ...[[-16,10,1.0],[16,10,1.0],[-17,-3,.92],[17,-3,1.08]].map(([x,z,s], index) => Object.freeze({ type: "group", x, z, rotation: [0,index*.42,0], children: Object.freeze([
        Object.freeze({ type: "box", y: 1.25, w: .65, h: 2.5*s, d: .65, material: { color: 0x9b7650, roughness: .95 }, collider: true }),
        Object.freeze({ type: "torus", y: 2.78*s, radius: .65, tube: .06, rotation: [Math.PI/2,0,0], material: { color: 0x80dfff, emissive: 0x2386a8, emissiveIntensity: 1.4 }, animation: { type: "spin", axis: "z", speed: .35 } }),
      ]) })),
      ...[[-21,16,5.4,1.0,3.2],[20,16,6,1.05,3.6],[-21,-10,5.5,.9,3.2],[20,-11,6.2,1.1,3.6],[-10,22,4.4,.8,2.8],[10,22,4.8,.82,3]].map(([x,z,sx,sy,sz]) => Object.freeze({ type: "sphere", x, y: -.3, z, radius: 1, scale: [sx,sy,sz], material: { color: 0xc4935d, roughness: 1 }, castShadow: false })),
      Object.freeze({ type: "starfield", count: 54, radius: 28, radiusBands: 9, radiusStep: 2.8, y: 13, z: -4, heightBands: 10, heightStep: 1.2, starSize: .055, color: 0xd7f4ff }),
    ]),
  }),
});
