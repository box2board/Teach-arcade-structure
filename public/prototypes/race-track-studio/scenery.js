import * as T from "../../assets/vendor/three-0.162.0/three.module.js";

export function makeScenery(piece, definition, selected, ghost) {
  const group = new T.Group();
  group.userData.pieceId = piece.id;
  group.position.set(piece.x, piece.y, piece.z);
  group.rotation.y = -piece.yaw;
  group.scale.setScalar(piece.length || 1);

  const accent = selected ? "#ffd173" : piece.color || definition.color;
  function add(geometry, color, x, y, z) {
    const material = new T.MeshStandardMaterial({
      color, roughness: 0.72, transparent: ghost, opacity: ghost ? 0.6 : 1,
      depthWrite: !ghost,
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = !ghost;
    mesh.receiveShadow = !ghost;
    group.add(mesh);
    return mesh;
  }
  const box = (w, h, d, color, x, y, z) =>
    add(new T.BoxGeometry(w, h, d), color, x, y, z);
  const cone = (top, bottom, h, color, x, y, z, sides = 8) =>
    add(new T.CylinderGeometry(top, bottom, h, sides), color, x, y, z);
  const ball = (r, color, x, y, z) =>
    add(new T.IcosahedronGeometry(r, 1), color, x, y, z);

  switch (piece.type) {
    case "scenery-pine":
      cone(.2, .32, 2.5, "#875332", 0, 1.25, 0);
      for (let level = 0; level < 3; level++)
        cone(0, 1.5 - level * .3, 2.3, accent, 0, 2.1 + level * .85, 0);
      break;
    case "scenery-oak":
      cone(.25, .43, 2.8, "#875332", 0, 1.4, 0);
      ball(1.65, accent, 0, 3.45, 0);
      ball(1.05, "#80d957", -1.15, 3, .2);
      break;
    case "scenery-palm":
      cone(.17, .34, 4, "#b67543", 0, 2, 0);
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const leaf = ball(1, accent, Math.cos(angle) * 1.1, 4, Math.sin(angle) * 1.1);
        leaf.scale.set(1.3, .16, .43);
        leaf.rotation.y = -angle;
      }
      break;
    case "scenery-boulder":
      ball(1.3, accent, 0, .85, 0).scale.set(1.2, .78, .85);
      ball(.7, "#a0a4b8", 1.25, .42, .55);
      ball(.52, "#9695ae", -.85, .35, -.85);
      break;
    case "scenery-flowers":
      box(3.5, .25, 1.7, "#8b5136", 0, .125, 0);
      for (let i = 0; i < 5; i++) {
        cone(.045, .06, .55, "#34a967", (i - 2) * .62, .5, 0);
        ball(.28, i % 2 ? "#ffd02b" : accent, (i - 2) * .62, .8, 0);
      }
      break;
    case "scenery-pond":
      cone(2.65, 2.8, .17, "#91d6bd", 0, .085, 0, 20).scale.z = .72;
      cone(2.32, 2.4, .075, accent, 0, .18, 0, 20).scale.z = .72;
      break;
    case "scenery-banner":
      for (const x of [-1.8, 1.8]) cone(.11, .16, 3.4, "#533575", x, 1.7, 0);
      box(3.75, .85, .12, accent, 0, 2.85, 0);
      for (let i = 0; i < 6; i++)
        box(.52, .32, .04, i % 2 ? "#302254" : "#ffffff", (i - 2.5) * .54, 2.85, .08);
      break;
    case "scenery-stands":
      for (let row = 0; row < 3; row++) {
        const height = .6 + row * .6;
        box(5.8, height, 1, "#293659", 0, height / 2, row - 1);
        box(5.8, .16, .88, accent, 0, height + .08, row - 1);
      }
      break;
    case "scenery-tent":
      for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4])
        cone(.07, .10, 2.25, "#484261", x, 1.125, z);
      cone(0, 2.25, 1.25, accent, 0, 2.875, 0, 4).rotation.y = Math.PI / 4;
      break;
    case "scenery-fence":
      for (const x of [-1.65, 0, 1.65]) box(.18, 1.4, .18, "#46316b", x, .7, 0);
      for (const y of [.52, 1.1]) box(3.6, .2, .14, accent, 0, y, 0);
      break;
    case "scenery-willow":
      cone(.25, .4, 3.2, "#79523e", 0, 1.6, 0);
      ball(1.8, accent, 0, 3.8, 0).scale.y = .7;
      for (const x of [-1.3, 0, 1.3])
        ball(.7, accent, x, 2.6, .8).scale.y = 1.6;
      break;
    case "scenery-birch":
      for (const [x, z, h] of [[-1, .6, 3.5], [.4, -.7, 4.4], [1.1, .8, 2.9]]) {
        cone(.11, .19, h, "#eee9da", x, h / 2, z);
        ball(.95, accent, x, h, z).scale.y = 1.3;
      }
      break;
    case "scenery-cactus":
      cone(.43, .48, 3.2, accent, 0, 1.6, 0);
      for (const side of [-1, 1]) {
        box(.85, .38, .42, accent, side * .62, 1.2, 0);
        cone(.23, .26, 1, accent, side * .98, 1.65, 0);
      }
      break;
    case "scenery-bush":
      ball(1.2, accent, 0, .8, 0);
      for (const x of [-.65, 0, .65]) ball(.16, "#d74678", x, 1.08, .85);
      break;
    case "scenery-hedge":
      box(4.5, 1.45, 1.25, accent, 0, .73, 0);
      for (const x of [-1.7, -.55, .55, 1.7]) ball(.62, accent, x, 1.3, 0);
      break;
    case "scenery-bamboo":
      for (let i = 0; i < 5; i++) {
        const height = 2.4 + (i % 3) * .6;
        cone(.08, .12, height, accent, (i - 2) * .4, height / 2, (i % 2) * .6);
        ball(.52, "#5aa758", (i - 2) * .4, height - .15, (i % 2) * .6).scale.y = .3;
      }
      break;
    case "scenery-mushrooms":
      for (const [x, z, h] of [[-.8, .2, .8], [.3, -.3, 1.1], [1, .45, .55]]) {
        cone(.12, .15, h, "#fff1d3", x, h / 2, z);
        ball(h * .48, accent, x, h, z).scale.y = .48;
      }
      break;
    case "scenery-reeds":
      for (let i = 0; i < 7; i++) {
        const height = .85 + (i % 3) * .3;
        const reed = cone(.018, .06, height, accent, (i - 3) * .22, height / 2, (i % 2) * .38);
        reed.rotation.z = (i - 3) * .06;
      }
      break;
    case "scenery-hill":
    case "scenery-sandbank":
      ball(3, accent, 0, .15, 0).scale.set(1.5, .58, .9);
      break;
    case "scenery-ridge":
      for (const [x, h] of [[-3, 5.8], [0, 8], [3, 4.8]]) {
        cone(0, h * .58, h, accent, x, h / 2, 0, 5);
        cone(0, h * .17, h * .29, "#eef4ff", x, h * .855, 0, 5);
      }
      break;
    case "scenery-cliff":
      for (let i = 0; i < 4; i++)
        box(6 - i * .6, .9, 3.3 - i * .3, i % 2 ? "#df9f74" : accent, i * .18, .45 + i * .9, 0);
      break;
    case "scenery-arch":
      for (const x of [-1.9, 1.9]) box(1.1, 3.4, 1.3, accent, x, 1.7, 0);
      box(5, 1, 1.5, accent, 0, 3.85, 0);
      break;
    case "scenery-waterfall":
      box(4.7, 4.1, 2, "#8d849a", 0, 2.05, 0);
      box(1.8, 4, .12, accent, 0, 2, 1.06);
      for (const x of [-.55, .1, .62]) box(.1, 3.5, .045, "#e5fbff", x, 2, 1.14);
      cone(2, 2.1, .13, accent, 0, .08, 1.65, 16);
      break;
    case "scenery-island":
      cone(2.45, 2.6, .35, "#efcc83", 0, .175, 0, 16);
      cone(2.1, 2.2, .18, accent, 0, .41, 0, 16);
      ball(.62, "#399c75", -.9, .75, .3);
      break;
    case "scenery-cones":
      for (const x of [-1.2, 0, 1.2]) {
        box(.65, .08, .65, "#44304e", x, .04, 0);
        cone(.035, .28, .68, accent, x, .42, 0);
        cone(.13, .18, .13, "#fff5db", x, .43, 0);
      }
      break;
    case "scenery-tires":
      for (const x of [-1, 0, 1]) for (const y of [.15, .45, .75]) {
        const tire = add(new T.TorusGeometry(.37, .12, 6, 12), accent, x, y, 0);
        tire.rotation.x = Math.PI / 2;
      }
      break;
    case "scenery-lamp":
      cone(.1, .19, 4.3, "#514b73", 0, 2.15, 0);
      box(1.75, .32, .55, "#514b73", .45, 4.25, 0);
      box(1.4, .075, .4, accent, .45, 4.06, 0);
      break;
    case "scenery-scoreboard":
      for (const x of [-1.65, 1.65]) box(.18, 3.5, .18, "#504164", x, 1.75, 0);
      box(4.3, 1.5, .35, accent, 0, 3.25, 0);
      for (const x of [-1.05, 0, 1.05]) box(.65, .55, .04, "#d8f7ff", x, 3.25, .195);
      break;
    case "scenery-podium":
      for (const [x, h] of [[-1.4, .8], [0, 1.35], [1.4, .54]]) {
        box(1.36, h, 1.55, accent, x, h / 2, 0);
        box(1.3, .08, 1.49, "#fff4ce", x, h + .04, 0);
      }
      break;
    case "scenery-booth":
      box(2.1, 2.15, 1.8, accent, 0, 1.075, 0);
      box(1.55, .62, .05, "#a9ecff", 0, 1.64, .92);
      box(2.4, .18, 2.1, "#4d386e", 0, 2.23, 0);
      break;
    case "scenery-garage":
    case "scenery-warehouse": {
      const wide = piece.type === "scenery-warehouse";
      box(wide ? 7 : 5.5, 3.1, 3.8, accent, 0, 1.55, 0);
      box(wide ? 7.3 : 5.8, .2, 4.05, "#413759", 0, 3.2, 0);
      for (const x of [-1.35, 1.35]) box(1.95, 2.4, .07, "#374763", x, 1.23, 1.93);
      break;
    }
    case "scenery-pump":
      box(1, 1.8, .65, accent, 0, .9, 0);
      box(.72, .45, .07, "#def2f5", 0, 1.38, .35);
      box(.11, 1.15, .11, "#463b56", .62, .75, .03);
      break;
    case "scenery-barn":
      box(4.4, 2.8, 3.6, accent, 0, 1.4, 0);
      for (const side of [-1, 1]) {
        const roof = box(2.65, .2, 3.95, "#4d335e", side * 1.11, 3.32, 0);
        roof.rotation.z = -side * .46;
      }
      box(1.45, 1.8, .08, "#f6dfc4", 0, .91, 1.84);
      break;
    case "scenery-apartments":
    case "scenery-skyline": {
      const skyline = piece.type === "scenery-skyline";
      const buildings = skyline ? [[-2.6, 4.6], [0, 7.3], [2.6, 5.5]] : [[0, 5.6]];
      for (const [x, height] of buildings) {
        const width = skyline ? 2.4 : 4.4;
        box(width, height, 2.35, accent, x, height / 2, 0);
        for (let y = 1.2; y < height - .3; y += 1.2)
          for (const offset of [-.65, .65]) box(.54, .53, .045, "#bcf3ff", x + offset, y, 1.19);
      }
      break;
    }
    case "scenery-turbine":
      cone(.18, .32, 5.9, "#e6e9f2", 0, 2.95, 0);
      ball(.29, accent, 0, 5.95, .35);
      for (let i = 0; i < 3; i++) {
        const angle = i * Math.PI * 2 / 3;
        const blade = box(.24, 2.05, .1, accent, Math.sin(angle), 5.95 + Math.cos(angle), .41);
        blade.rotation.z = -angle;
      }
      break;
    case "scenery-tower":
      for (const x of [-.95, .95]) for (const z of [-.95, .95])
        cone(.1, .15, 3.85, "#535b80", x, 1.925, z);
      cone(1.45, 1.45, 1.35, accent, 0, 4.2, 0, 14);
      cone(0, 1.52, .55, "#647ec8", 0, 5.12, 0, 14);
      break;
  }
  return group;
}
