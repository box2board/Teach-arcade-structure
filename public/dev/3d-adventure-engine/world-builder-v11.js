import * as THREE from "/assets/vendor/three-0.162.0/three.module.js";

// v1.1 declarative world/layout builder.
// Adventure packages describe the scene; the engine supplies scene/collision hooks.

function makeMaterial(spec = {}) {
  return new THREE.MeshStandardMaterial({
    color: spec.color ?? 0x64748b,
    roughness: spec.roughness ?? .75,
    metalness: spec.metalness ?? .05,
    emissive: spec.emissive ?? 0x000000,
    emissiveIntensity: spec.emissiveIntensity ?? 0,
    transparent: Boolean(spec.transparent),
    opacity: spec.opacity ?? 1,
    depthWrite: spec.depthWrite ?? true,
  });
}

function geometryFor(def) {
  switch (def.type) {
    case "box": return new THREE.BoxGeometry(def.w ?? 1, def.h ?? 1, def.d ?? 1);
    case "plane": return new THREE.PlaneGeometry(def.w ?? 1, def.h ?? 1);
    case "cylinder": return new THREE.CylinderGeometry(def.radiusTop ?? def.radius ?? .5, def.radiusBottom ?? def.radius ?? .5, def.h ?? 1, def.segments ?? 12, def.heightSegments ?? 1, Boolean(def.openEnded));
    case "torus": return new THREE.TorusGeometry(def.radius ?? .5, def.tube ?? .08, def.radialSegments ?? 8, def.tubularSegments ?? 24);
    case "sphere": return new THREE.SphereGeometry(def.radius ?? .5, def.widthSegments ?? 12, def.heightSegments ?? 8);
    case "icosahedron": return new THREE.IcosahedronGeometry(def.radius ?? .5, def.detail ?? 0);
    case "dodecahedron": return new THREE.DodecahedronGeometry(def.radius ?? .5, def.detail ?? 0);
    case "octahedron": return new THREE.OctahedronGeometry(def.radius ?? .5, def.detail ?? 0);
    case "cone": return new THREE.ConeGeometry(def.radius ?? .5, def.h ?? 1, def.segments ?? 8);
    default: return null;
  }
}

function applyTransform(object, def = {}) {
  object.position.set(def.x ?? 0, def.y ?? 0, def.z ?? 0);
  if (def.rotation) object.rotation.set(def.rotation[0] ?? 0, def.rotation[1] ?? 0, def.rotation[2] ?? 0);
  if (def.scale) object.scale.set(def.scale[0] ?? 1, def.scale[1] ?? 1, def.scale[2] ?? 1);
  if (def.name) object.name = def.name;
  object.visible = def.visible !== false;
}

function registerRuntimeFeatures(mesh, def, context) {
  if (def.collider) context.registerCollider(mesh);
  if (def.cameraBlock) context.addCameraObstacle(mesh);
  if (def.animation) context.registerAnimation({ mesh, ...def.animation, baseY: def.animation.baseY ?? mesh.position.y });
}

function addTree(def, parent, context) {
  const group = new THREE.Group();
  applyTransform(group, def);
  parent.add(group);
  const scale = def.treeScale ?? 1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.26 * scale, .34 * scale, 2.2 * scale, 7), makeMaterial(def.trunkMaterial || { color: 0x6b4f36, roughness: .9 }));
  trunk.position.y = 1.1 * scale;
  trunk.castShadow = def.castShadow !== false;
  group.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * scale, 1), makeMaterial(def.crownMaterial || { color: 0x3f7f5a, roughness: .9 }));
  crown.position.y = 2.65 * scale;
  crown.scale.y = 1.18;
  crown.castShadow = def.castShadow !== false;
  group.add(crown);
  return group;
}

function addRock(def, parent) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(.65 * (def.rockScale ?? 1), 0), makeMaterial(def.material || { color: 0x708090, roughness: .95 }));
  applyTransform(mesh, def);
  if (!def.scale) mesh.scale.set(1.25, .75, 1);
  if (!def.rotation) mesh.rotation.set(.2, .5, .1);
  mesh.castShadow = def.castShadow !== false;
  mesh.receiveShadow = def.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function addStarfield(def, parent) {
  const material = new THREE.MeshBasicMaterial({ color: def.color ?? 0xd7f4ff });
  const count = def.count ?? 40;
  for (let i = 0; i < count; i += 1) {
    const angle = i * (def.angleStep ?? 2.399963);
    const radius = (def.radius ?? 24) + (i % (def.radiusBands ?? 8)) * (def.radiusStep ?? 2.7);
    const star = new THREE.Mesh(new THREE.SphereGeometry((def.starSize ?? .055) + (i % 3) * .018, 5, 4), material);
    star.position.set(
      (def.x ?? 0) + Math.cos(angle) * radius,
      (def.y ?? 12) + (i % (def.heightBands ?? 9)) * (def.heightStep ?? 1.25),
      (def.z ?? 0) + Math.sin(angle) * radius,
    );
    parent.add(star);
  }
}

function addElement(def, parent, context) {
  if (!def || def.enabled === false) return null;
  if (def.type === "group") {
    const group = new THREE.Group();
    applyTransform(group, def);
    parent.add(group);
    for (const child of def.children || []) addElement(child, group, context);
    return group;
  }
  if (def.type === "tree") return addTree(def, parent, context);
  if (def.type === "rock") return addRock(def, parent);
  if (def.type === "starfield") return addStarfield(def, parent);

  const geometry = geometryFor(def);
  if (!geometry) return null;
  const mesh = new THREE.Mesh(geometry, makeMaterial(def.material));
  applyTransform(mesh, def);
  mesh.castShadow = def.castShadow !== false && def.type !== "plane";
  mesh.receiveShadow = def.receiveShadow !== false;
  parent.add(mesh);
  registerRuntimeFeatures(mesh, def, context);
  return mesh;
}

function addLights(scene, world) {
  const lighting = world.lighting || {};
  if (lighting.hemisphere !== false) {
    const h = lighting.hemisphere || {};
    scene.add(new THREE.HemisphereLight(h.sky ?? 0xe7f6ff, h.ground ?? 0x35513f, h.intensity ?? 1.65));
  }
  for (const def of lighting.directional || []) {
    const light = new THREE.DirectionalLight(def.color ?? 0xfff4d8, def.intensity ?? 2.15);
    light.position.set(def.x ?? 16, def.y ?? 22, def.z ?? 12);
    light.castShadow = def.castShadow !== false;
    if (light.castShadow) {
      const size = def.shadowMapSize ?? 1024;
      light.shadow.mapSize.set(size, size);
      light.shadow.camera.left = def.shadowLeft ?? -28;
      light.shadow.camera.right = def.shadowRight ?? 28;
      light.shadow.camera.top = def.shadowTop ?? 28;
      light.shadow.camera.bottom = def.shadowBottom ?? -28;
    }
    scene.add(light);
  }
  for (const def of lighting.point || []) {
    const light = new THREE.PointLight(def.color ?? 0xffffff, def.intensity ?? 1, def.distance ?? 8, def.decay ?? 2);
    light.position.set(def.x ?? 0, def.y ?? 2, def.z ?? 0);
    scene.add(light);
  }
}

function buildWorld(context) {
  const config = window.TA3DAdventure?.config || window.TA3DAdventureConfig || {};
  const world = config.world || {};
  const scene = context.scene;

  const sceneDef = world.scene || {};
  scene.background = new THREE.Color(sceneDef.background ?? 0x9bc8e5);
  if (sceneDef.fog) scene.fog = new THREE.Fog(sceneDef.fog.color ?? sceneDef.background ?? 0x9bc8e5, sceneDef.fog.near ?? 32, sceneDef.fog.far ?? 72);
  else scene.fog = null;

  addLights(scene, world);

  const root = new THREE.Group();
  root.name = `world-${config.id || "adventure"}`;
  scene.add(root);
  for (const def of world.elements || []) addElement(def, root, context);

  window.TA3DWorld = Object.freeze({
    id: config.id,
    root,
    bounds: world.bounds || { minX: -23, maxX: 23, minZ: -23, maxZ: 23 },
    elementCount: (world.elements || []).length,
  });
  window.dispatchEvent(new CustomEvent("ta3d:world-ready", { detail: window.TA3DWorld }));
  return window.TA3DWorld;
}

window.TA3DWorldBuilder = Object.freeze({ build: buildWorld });
