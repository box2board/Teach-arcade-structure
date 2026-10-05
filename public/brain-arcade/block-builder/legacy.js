import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";
const geometryCache = new Map();
export const legacyTypes = [
  { type: "Cube", category: "Structural", size: [1, 1, 1], shape: "box" },
  { type: "Slab", category: "Structural", size: [2, 0.5, 2], shape: "box" },
  { type: "Wall", category: "Structural", size: [2, 2, 1], shape: "box" },
  { type: "Ramp", category: "Structural", size: [2, 1, 1], shape: "wedge" },
  { type: "Node", category: "Connector", size: [1, 1, 1], shape: "sphere" },
  { type: "Bridge", category: "Connector", size: [2, 0.5, 1], shape: "box" },
  { type: "Decision Diamond", category: "Logic", size: [1, 1, 1], shape: "diamond" },
  { type: "Splitter", category: "Logic", size: [1, 1, 1], shape: "splitter" },
  { type: "Battery", category: "Resource", size: [1, 1, 1], shape: "capsule" },
  { type: "Canister", category: "Resource", size: [1, 2, 1], shape: "cylinder" },
  { type: "Control Core", category: "System", size: [2, 1, 2], shape: "box" },
  { type: "Arrow Prism", category: "Timeline", size: [2, 1, 1], shape: "arrow" },
  { type: "Barrier", category: "Constraint", size: [2, 2, 1], shape: "box" },
  { type: "Burst", category: "Event", size: [1, 1, 1], shape: "burst" },
];

export function legacyGeometry(def) {
  if (geometryCache.has(def.type)) return geometryCache.get(def.type);

  const [sx, sy, sz] = def.size;
  let g;

  if (def.shape === "box") g = new THREE.BoxGeometry(sx, sy, sz);
  else if (def.shape === "sphere") g = new THREE.SphereGeometry(0.55, 20, 20);
  else if (def.shape === "diamond") g = new THREE.OctahedronGeometry(0.7);
  else if (def.shape === "cylinder") g = new THREE.CylinderGeometry(0.45, 0.45, 2, 20);
  else if (def.shape === "capsule") g = new THREE.CapsuleGeometry(0.32, 0.5, 6, 12);
  else if (def.shape === "burst") g = new THREE.IcosahedronGeometry(0.75, 0);
  else if (def.shape === "wedge") {
    g = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -1, -0.5, -0.5,
       1, -0.5, -0.5,
       1, -0.5,  0.5,
      -1, -0.5,  0.5,
      -1,  0.5, -0.5,
       1,  0.5, -0.5,
    ]);
    const idx = [0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1, 1, 5, 2, 0, 3, 4, 3, 2, 5, 3, 5, 4];
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.scale(sx / 2, sy, sz);
  } else if (def.shape === "arrow") {
    g = new THREE.ConeGeometry(0.6, 1.2, 4);
    g.rotateZ(-Math.PI / 2);
    g.scale(1.2, 0.8, 0.8);
  } else if (def.shape === "splitter") {
    g = new THREE.BoxGeometry(1, 1, 1);
  } else {
    g = new THREE.BoxGeometry(sx, sy, sz);
  }

  geometryCache.set(def.type, g);
  return g;
}

