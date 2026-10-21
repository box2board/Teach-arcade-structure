import "./config-v11.js";

const base = window.TA3DAdventureConfig;

window.TA3DAdventureConfig = Object.freeze({
  ...base,
  version: "1.2-visual-slice",
  world: Object.freeze({
    ...base.world,
    scene: Object.freeze({
      ...base.world.scene,
      background: 0x11152f,
      fog: Object.freeze({ color: 0x392f47, near: 31, far: 82 }),
    }),
    lighting: Object.freeze({
      hemisphere: Object.freeze({ sky: 0x6d82b8, ground: 0x513a2d, intensity: 1.05 }),
      directional: Object.freeze([
        Object.freeze({ color: 0xa8c9ff, intensity: 1.28, x: -16, y: 24, z: 14, castShadow: true, shadowMapSize: 1024, shadowLeft: -33, shadowRight: 33, shadowTop: 33, shadowBottom: -33 }),
        Object.freeze({ color: 0xffb86c, intensity: .48, x: 18, y: 12, z: -8, castShadow: false }),
      ]),
      point: Object.freeze([
        Object.freeze({ color: 0x80dfff, intensity: 1.15, distance: 8, x: base.exterior.energyCell.x, y: 2.0, z: base.exterior.energyCell.z }),
        Object.freeze({ color: 0xb18cff, intensity: .55, distance: 9, x: 0, y: 3.4, z: -7.1 }),
        Object.freeze({ color: 0xffb86c, intensity: .35, distance: 10, x: -8, y: 2.2, z: -11 }),
        Object.freeze({ color: 0xffb86c, intensity: .35, distance: 10, x: 8, y: 2.2, z: -11 }),
      ]),
    }),
  }),
  visual: Object.freeze({
    enabled: true,
    sky: Object.freeze({
      radius: 112,
      top: 0x070b1d,
      horizon: 0x5a3a58,
      bottom: 0x251b27,
      exponent: .82,
      offset: .035,
    }),
    celestial: Object.freeze({
      position: Object.freeze([37, 29, -58]),
      radius: 4.25,
      color: 0xf5e8cf,
      halo: 0xa7c9ff,
      haloOpacity: .12,
    }),
    terrainScatter: Object.freeze({
      count: 58,
      seed: 412,
      color: 0x6c503c,
      minRadius: 17,
      maxRadius: 36,
      minScale: .22,
      maxScale: 1.08,
      z: 1.5,
      y: -.22,
    }),
    dust: Object.freeze({
      count: 86,
      seed: 193,
      width: 54,
      depth: 54,
      height: 5.6,
      z: 2,
      color: 0xeac28d,
      size: .052,
      opacity: .27,
      speed: .055,
    }),
    architecture: Object.freeze({
      stone: 0x8f6d52,
      trim: 0xc09355,
      dark: 0x2a2934,
      glow: 0x80dfff,
      domes: Object.freeze([
        Object.freeze([-5.4, 7.0, -13.3, 2.75]),
        Object.freeze([5.4, 7.0, -13.3, 2.75]),
      ]),
      centerDome: Object.freeze([0, 7.4, -16.0, 3.35]),
      armillary: Object.freeze({ x: 0, y: .15, z: 8.0 }),
    }),
    pathLights: Object.freeze({
      color: 0x80dfff,
      metal: 0x6e523c,
      intensity: .4,
      distance: 4.4,
      lightEvery: 3,
      positions: Object.freeze([
        Object.freeze([-2.7,15]),Object.freeze([2.7,15]),
        Object.freeze([-2.7,11.5]),Object.freeze([2.7,11.5]),
        Object.freeze([-2.7,8]),Object.freeze([2.7,8]),
        Object.freeze([-2.7,4.5]),Object.freeze([2.7,4.5]),
        Object.freeze([-2.7,1]),Object.freeze([2.7,1]),
        Object.freeze([-2.7,-2.5]),Object.freeze([2.7,-2.5]),
      ]),
    }),
    prism: Object.freeze({ color: 0x80dfff, lightIntensity: 1.25, lightDistance: 6.5 }),
    terminal: Object.freeze({ frame: 0xb88a52, glow: 0x80dfff }),
    gate: Object.freeze({ trim: 0xc09355, glow: 0xb18cff }),
    player: Object.freeze({ dark: 0x17202c, trim: 0xb98a50, glow: 0x80dfff }),
    hud: Object.freeze({ accent: "#80dfff", accentHex: 0x80dfff }),
  }),
});
