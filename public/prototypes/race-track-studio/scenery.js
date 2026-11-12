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
  }
  return group;
}
