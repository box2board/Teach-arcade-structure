import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

function mat(color, roughness = .85, metalness = .05, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

function addMesh(scene, geometry, material, x, y, z, scale = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function buildObservatoryLandmarks(scene) {
  const sandstone = mat(0x9b7650, .95);
  const darkStone = mat(0x51463f, .92);
  const brass = mat(0x9a7440, .45, .5);
  const starGlow = mat(0x80dfff, .28, .1, 0x2386a8, 1.6);

  // Entry pylons visually separate this adventure from Lost Facility without
  // adding gameplay collision to the shared controller.
  [-5.9, 5.9].forEach((x) => {
    addMesh(scene, new THREE.BoxGeometry(.9, 4.2, .9), sandstone, x, 2.1, -6.8);
    const cap = addMesh(scene, new THREE.OctahedronGeometry(.62, 0), brass, x, 4.55, -6.8);
    cap.rotation.y = Math.PI / 4;
  });

  // Telescope landmark on the west side of the courtyard.
  const telescope = new THREE.Group();
  telescope.position.set(-12.5, 0, 2.5);
  scene.add(telescope);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 1.4, 10), darkStone);
  pedestal.position.y = .7;
  telescope.add(pedestal);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, 3.6, 10), brass);
  arm.position.set(0, 2.55, 0);
  arm.rotation.z = -.62;
  telescope.add(arm);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.45, .22, .34, 20, 1, false), sandstone);
  dish.position.set(1.15, 3.58, 0);
  dish.rotation.z = Math.PI / 2 - .62;
  telescope.add(dish);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), starGlow);
  lens.position.set(2.05, 4.22, 0);
  telescope.add(lens);

  // Stone observation markers around the courtyard.
  [[-15,10],[15,10],[-16,-5],[16,-5]].forEach(([x,z], index) => {
    const marker = addMesh(scene, new THREE.BoxGeometry(.6, 2.4 + (index % 2) * .45, .6), sandstone, x, 1.2, z);
    marker.rotation.y = index * .42;
    const ring = addMesh(scene, new THREE.TorusGeometry(.62, .06, 8, 24), starGlow, x, 2.65 + (index % 2) * .45, z);
    ring.rotation.x = Math.PI / 2;
  });

  // Low dunes cover the old grassy perimeter and give the map a desert silhouette.
  const duneMaterial = mat(0xb98b58, 1);
  [[-19,15,5,1.1,3],[18,15,5.5,1.0,3.4],[-20,-11,5.2,.9,3],[19,-12,6,1.1,3.5],[-10,19,4,.75,2.5],[10,20,4.5,.8,2.7]].forEach(([x,z,sx,sy,sz]) => {
    const dune = addMesh(scene, new THREE.SphereGeometry(1, 16, 10), duneMaterial, x, -.18, z, [sx, sy, sz]);
    dune.castShadow = false;
  });

  // A sparse star field provides a strong visual identity without expensive particles.
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xd7f4ff });
  for (let i = 0; i < 46; i += 1) {
    const angle = i * 2.399963;
    const radius = 24 + (i % 8) * 2.7;
    const star = new THREE.Mesh(new THREE.SphereGeometry(.055 + (i % 3) * .018, 5, 4), starMaterial);
    star.position.set(Math.cos(angle) * radius, 12 + (i % 9) * 1.25, Math.sin(angle) * radius - 4);
    scene.add(star);
  }
}

function applyTheme(engine) {
  const { scene } = engine;
  scene.background = new THREE.Color(0x292a46);
  scene.fog = new THREE.Fog(0x40354a, 34, 78);

  const recolor = new Map([
    [0x5f8f65, 0xb98b58],
    [0xa8a08d, 0x806a58],
    [0x566678, 0x735f4c],
    [0x44556a, 0x846b50],
    [0x3e4d61, 0x6d5948],
    [0x314055, 0x4d423e],
    [0x26384d, 0x65513f],
    [0x25364b, 0x5d4d40],
    [0x2d3d50, 0x5a493c],
    [0x708090, 0x92704f],
  ]);

  scene.traverse((object) => {
    if (object.isMesh && object.material?.color) {
      const current = object.material.color.getHex();
      if (current === 0x6b4f36 || current === 0x3f7f5a) {
        object.visible = false;
        return;
      }
      const replacement = recolor.get(current);
      if (replacement !== undefined) object.material.color.setHex(replacement);
    }
    if (object.isHemisphereLight) {
      object.color.setHex(0x8798cf);
      object.groundColor.setHex(0x60432e);
      object.intensity = 1.3;
    }
    if (object.isDirectionalLight) {
      object.color.setHex(0xffd3a1);
      object.intensity = 1.7;
    }
  });

  buildObservatoryLandmarks(scene);
}

window.addEventListener("ta3d:engine-ready", (event) => applyTheme(event.detail), { once: true });
if (window.TA3DEngine) applyTheme(window.TA3DEngine);
