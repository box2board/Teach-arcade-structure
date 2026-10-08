import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

let enhanced = false;
let worldScene = null;
let player = null;
let shards = [];
let shardCount = 0;
let animationStarted = false;

function makeMaterial(color, roughness = 0.82, metalness = 0.04, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function addMesh(scene, geometry, material, position, rotation = null, scale = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addFlatPatch(scene, x, z, width, depth, color, rotationY = 0, opacity = 1) {
  const mat = makeMaterial(color, 1, 0, { transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = rotationY;
  patch.position.set(x, 0.018, z);
  patch.receiveShadow = true;
  scene.add(patch);
  return patch;
}

function addRockCluster(scene, x, z, count = 4, radius = 2.6, scale = 1) {
  const rockMat = makeMaterial(0x66717e, .98, 0);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + (x * .17 + z * .09);
    const dist = radius * (.55 + ((i * 37) % 10) / 20);
    const s = scale * (.65 + ((i * 19) % 10) / 18);
    const rock = addMesh(
      scene,
      new THREE.DodecahedronGeometry(.72 * s, 0),
      rockMat,
      [x + Math.cos(angle) * dist, .38 * s, z + Math.sin(angle) * dist],
      [.12 * i, .41 * i, .08 * i],
      [1.35, .78, 1]
    );
    rock.castShadow = true;
  }
}

function addGrassTuft(scene, x, z, scale = 1) {
  const mat = makeMaterial(0x436f4c, 1, 0, { side: THREE.DoubleSide });
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(.18 * scale, .72 * scale), mat);
    blade.position.y = .36 * scale;
    blade.rotation.y = (Math.PI / 3) * i;
    group.add(blade);
  }
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function addLamp(scene, x, z, height = 3.7, lightColor = 0x6ee7f9) {
  const dark = makeMaterial(0x243243, .58, .25);
  const glow = makeMaterial(lightColor, .28, .2, { emissive: lightColor, emissiveIntensity: 1.75 });
  addMesh(scene, new THREE.CylinderGeometry(.09, .12, height, 8), dark, [x, height / 2, z]);
  const head = addMesh(scene, new THREE.BoxGeometry(.48, .15, .32), dark, [x, height - .1, z]);
  const lens = addMesh(scene, new THREE.BoxGeometry(.31, .05, .21), glow, [x, height - .19, z]);
  lens.rotation.x = .08;
  const light = new THREE.PointLight(lightColor, 3.3, 9, 2);
  light.position.set(x, height - .3, z);
  scene.add(light);
  return { head, lens, light };
}

function addFacilityDetail(scene) {
  const dark = makeMaterial(0x27384b, .62, .25);
  const steel = makeMaterial(0x607285, .58, .22);
  const blue = makeMaterial(0x63d7ef, .3, .25, { emissive: 0x0e7490, emissiveIntensity: 1.3 });
  const warning = makeMaterial(0xeab308, .7, .08);

  // Front facade frames make the building read as a facility rather than one large box.
  [-7.25, -3.05, 3.05, 7.25].forEach((x) => {
    addMesh(scene, new THREE.BoxGeometry(.28, 5.3, .34), steel, [x, 3.0, -7.58]);
  });
  addMesh(scene, new THREE.BoxGeometry(15.2, .3, .36), steel, [0, 5.55, -7.58]);
  addMesh(scene, new THREE.BoxGeometry(5.15, .22, .37), warning, [0, 4.78, -7.54]);

  // Windows / status panels.
  [-5.15, 5.15].forEach((x) => {
    addMesh(scene, new THREE.BoxGeometry(2.45, .65, .08), blue, [x, 3.75, -7.58]);
    addMesh(scene, new THREE.BoxGeometry(1.55, .14, .09), dark, [x, 2.72, -7.57]);
  });

  // Exterior utility pipes on the west wall.
  const pipeMat = makeMaterial(0x526372, .5, .38);
  [-12.1, -15.2].forEach((z) => {
    const pipe = addMesh(scene, new THREE.CylinderGeometry(.16, .16, 4.3, 10), pipeMat, [-8.06, 2.2, z], [0, 0, Math.PI / 2]);
    pipe.rotation.z = Math.PI / 2;
  });
  addMesh(scene, new THREE.TorusGeometry(.52, .15, 8, 18, Math.PI), pipeMat, [-8.05, 4.28, -13.65], [0, Math.PI / 2, Math.PI / 2]);

  // Roof communications array.
  addMesh(scene, new THREE.CylinderGeometry(.11, .14, 3.2, 8), steel, [3.8, 8.1, -14.1]);
  const dish = addMesh(scene, new THREE.CylinderGeometry(.12, 1.05, .42, 18, 1, false), steel, [3.8, 9.25, -14.1], [Math.PI / 2.8, 0, 0]);
  dish.scale.z = .38;
  addMesh(scene, new THREE.SphereGeometry(.13, 10, 8), blue, [3.8, 9.55, -13.77]);

  // Entrance strips and overhead lamp.
  addMesh(scene, new THREE.BoxGeometry(.16, 3.75, .11), blue, [-2.42, 2.35, -7.57]);
  addMesh(scene, new THREE.BoxGeometry(.16, 3.75, .11), blue, [2.42, 2.35, -7.57]);
  const entranceLight = new THREE.PointLight(0x5eead4, 3, 8, 2);
  entranceLight.position.set(0, 4.8, -6.75);
  scene.add(entranceLight);
}

function addPerimeter(scene) {
  const ridgeMat = makeMaterial(0x657367, 1, 0);
  const mountainMat = makeMaterial(0x718294, 1, 0);

  // Low inaccessible rocky rim just outside the controller clamp gives the space a contained valley feel.
  const rimPoints = [
    [-25, -18], [-25, -7], [-25, 5], [-25, 17],
    [25, -18], [25, -7], [25, 6], [25, 18],
    [-18, -25], [-7, -25], [7, -25], [18, -25],
    [-18, 25], [-6, 25], [7, 25], [18, 25]
  ];
  rimPoints.forEach(([x, z], index) => {
    const s = 2.1 + (index % 4) * .28;
    addMesh(scene, new THREE.DodecahedronGeometry(1.25, 0), ridgeMat, [x, .75 * s, z], [.1, index * .37, .05], [s * 1.35, s * .72, s]);
  });

  // Distant low-poly mountains beyond the playable area.
  const mountains = [
    [-36, -34, 9], [-18, -42, 11], [4, -45, 8], [29, -39, 12],
    [39, -18, 10], [43, 12, 9], [30, 39, 11], [-3, 44, 8], [-32, 36, 10], [-43, 8, 11]
  ];
  mountains.forEach(([x, z, h], i) => {
    const mountain = addMesh(scene, new THREE.ConeGeometry(h * .7, h, 5), mountainMat, [x, h / 2 - .2, z], [0, i * .53, 0], [1.25, 1, 1]);
    mountain.castShadow = false;
  });
}

function addPathsAndGround(scene) {
  // Side paths make the objective objects feel deliberately placed in the world.
  addFlatPatch(scene, -3.65, 4.7, 2.2, 8.4, 0x8e8a78, -.67);
  addFlatPatch(scene, 3.8, -1.3, 2.1, 8.2, 0x8e8a78, .57);
  addFlatPatch(scene, 10.4, 8.8, 6.8, 6.8, 0x526b61, 0);

  // Landing pad / old service platform.
  const pad = new THREE.Mesh(new THREE.CircleGeometry(3.1, 32), makeMaterial(0x4d5a61, .95, .05));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(11.5, .025, 9.2);
  pad.receiveShadow = true;
  scene.add(pad);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.42, 32), makeMaterial(0xe2b640, .8, .04));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(11.5, .034, 9.2);
  scene.add(ring);

  // Shallow puddles add visual breakup without introducing terrain collision complexity yet.
  [[-9.2, 10.2, 1.35, .7], [8.5, 3.8, 1.1, .55], [-11.7, -5.4, 1.5, .62]].forEach(([x, z, sx, sz]) => {
    const puddle = addMesh(
      scene,
      new THREE.CircleGeometry(1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x74a9b4, roughness: .22, metalness: .05, transparent: true, opacity: .52 }),
      [x, .028, z],
      [-Math.PI / 2, 0, 0],
      [sx, sz, 1]
    );
    puddle.castShadow = false;
  });
}

function addSetDressing(scene) {
  // Lamps reinforce the primary path and establish scale.
  addLamp(scene, -3.9, 7.3);
  addLamp(scene, 3.9, 1.2);
  addLamp(scene, -4.4, -5.4);

  // Crate / equipment clusters kept off the main travel lane.
  const crateMat = makeMaterial(0x75563b, .9, .02);
  const metal = makeMaterial(0x40515e, .62, .22);
  [
    [-10.7, 7.0, .9], [-11.8, 6.2, .65], [10.8, -3.7, .8], [11.8, -4.4, .62]
  ].forEach(([x, z, s], i) => {
    const crate = addMesh(scene, new THREE.BoxGeometry(1.1 * s, .9 * s, 1.05 * s), i % 2 ? metal : crateMat, [x, .45 * s, z], [0, i * .23, 0]);
    crate.castShadow = true;
  });

  // Rock pockets and scrub around the edges of the playable space.
  addRockCluster(scene, -17, 14, 5, 2.7, .8);
  addRockCluster(scene, 17, 14, 5, 2.5, .78);
  addRockCluster(scene, -17, -10, 5, 2.6, .72);
  addRockCluster(scene, 17, -10, 5, 2.6, .72);

  [
    [-8, 14], [-10, 12], [-13, 10], [8, 15], [13, 12], [16, 9],
    [-13, 2], [-15, 5], [14, 3], [17, 5], [-10, -10], [10, -11],
    [-18, 1], [18, -2], [-6, 17], [7, 18]
  ].forEach(([x, z], i) => addGrassTuft(scene, x, z, .8 + (i % 3) * .18));

  // A power relay on the landing pad provides another visual landmark.
  addMesh(scene, new THREE.CylinderGeometry(.42, .55, 2.1, 10), metal, [11.5, 1.05, 9.2]);
  const relayGlow = makeMaterial(0x60a5fa, .28, .2, { emissive: 0x1d4ed8, emissiveIntensity: 1.5 });
  addMesh(scene, new THREE.TorusGeometry(.66, .08, 8, 24), relayGlow, [11.5, 1.5, 9.2], [Math.PI / 2, 0, 0]);
}

function addObjectiveAtmosphere(scene) {
  const blueGlow = makeMaterial(0x38bdf8, .25, .1, { emissive: 0x0284c7, emissiveIntensity: 1.8, transparent: true, opacity: .35 });
  const beam = addMesh(scene, new THREE.CylinderGeometry(.18, .45, 4.6, 16, 1, true), blueGlow, [-6.3, 2.3, 5.2]);
  beam.castShadow = false;
  beam.material.depthWrite = false;

  // Thin floating rings around the terminal location.
  [1.25, 1.55].forEach((r, i) => {
    const ring = addMesh(scene, new THREE.TorusGeometry(r, .035, 6, 28), blueGlow, [6.35, .35 + i * .25, -3.6], [Math.PI / 2, 0, 0]);
    ring.userData.v3Spin = .005 + i * .003;
  });
}

function ensureShardStatus() {
  const status = document.querySelector(".status-card");
  if (!status || document.getElementById("shardStatus")) return;
  const line = document.createElement("span");
  line.innerHTML = '<b>Shards</b> <span id="shardStatus">0 / 3</span>';
  status.appendChild(line);
}

function addShard(scene, x, z, phase = 0) {
  const group = new THREE.Group();
  const crystalMat = makeMaterial(0xc084fc, .2, .25, { emissive: 0x7e22ce, emissiveIntensity: 1.65 });
  const ringMat = makeMaterial(0xe9d5ff, .25, .12, { emissive: 0x9333ea, emissiveIntensity: 1.1, transparent: true, opacity: .8 });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.32, 0), crystalMat);
  crystal.scale.y = 1.5;
  crystal.castShadow = true;
  group.add(crystal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .035, 7, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -.35;
  group.add(ring);
  group.position.set(x, .85, z);
  group.userData.phase = phase;
  group.userData.collected = false;
  scene.add(group);
  shards.push(group);
}

function addShards(scene) {
  ensureShardStatus();
  addShard(scene, -14.4, 8.8, .3);
  addShard(scene, 13.2, 7.2, 1.4);
  addShard(scene, -13.6, -4.2, 2.5);
}

function addAmbientParticles(scene) {
  const count = 150;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - .5) * 48;
    positions[i * 3 + 1] = .4 + Math.random() * 6.5;
    positions[i * 3 + 2] = (Math.random() - .5) * 48;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xdbeafe, size: .045, transparent: true, opacity: .45, depthWrite: false })
  );
  particles.name = "v3-ambient-particles";
  scene.add(particles);
}

function enhanceWorld(scene) {
  if (enhanced) return;
  enhanced = true;
  worldScene = scene;

  scene.fog.near = 34;
  scene.fog.far = 78;

  addPerimeter(scene);
  addPathsAndGround(scene);
  addFacilityDetail(scene);
  addSetDressing(scene);
  addObjectiveAtmosphere(scene);
  addShards(scene);
  addAmbientParticles(scene);
}

function updateExtras(time) {
  if (!worldScene || !player) return;

  const particleField = worldScene.getObjectByName("v3-ambient-particles");
  if (particleField) particleField.rotation.y = time * .008;

  worldScene.traverse((object) => {
    if (object.userData?.v3Spin) object.rotation.z += object.userData.v3Spin;
  });

  shards.forEach((shard) => {
    if (shard.userData.collected) return;
    shard.position.y = .85 + Math.sin(time * 2.2 + shard.userData.phase) * .16;
    shard.rotation.y += .015;
    const distance = Math.hypot(player.position.x - shard.position.x, player.position.z - shard.position.z);
    if (distance < 1.15) {
      shard.userData.collected = true;
      shard.visible = false;
      shardCount += 1;
      const status = document.getElementById("shardStatus");
      if (status) status.textContent = `${shardCount} / 3`;
      const subtext = document.getElementById("objectiveSubtext");
      if (subtext) {
        subtext.textContent = shardCount === 3
          ? "All optional data shards recovered."
          : `Optional data shard recovered (${shardCount}/3).`;
      }
    }
  });
}

function startAnimation() {
  if (animationStarted) return;
  animationStarted = true;
  const loop = () => {
    updateExtras(performance.now() / 1000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  const result = originalSceneAdd.apply(this, objects);
  for (const object of objects) {
    if (object?.name === "player-controller") {
      player = object;
      enhanceWorld(this);
      startAnimation();
    }
  }
  return result;
};
