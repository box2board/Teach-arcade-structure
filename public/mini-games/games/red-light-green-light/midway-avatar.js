import * as THREE from '../../vendor/three.module.js';
import { avatar, disposeAvatar } from '../../shared/midway-characters/avatar-models.js';
import { poseCharacter } from '../../shared/midway-characters/character-pose.js';

// Midway articulates rigid meshes using group pivots. Bind their vertices to
// those same pivots so a crowded race renders one model draw per player.
const models = new Map();
let material;

export function makeMidwayAvatar(player, shape, tint) {
  const root = new THREE.Group();
  const model = avatar(player.characterId);
  const { head, legs, arms, ears, eyes, eyelids, tail, wings } = model.userData;
  const pivots = [...new Set([model, head, tail, ...[legs, arms, ears, eyes, eyelids, wings].flatMap(list => list ?? [])].filter(Boolean))];
  model.updateMatrixWorld(true);
  let entry = models.get(player.characterId);
  if (!entry) {
    entry = bakeModel(model, pivots);
    models.set(player.characterId, entry);
  }
  entry.users++;
  const offsets = pivots.map(pivot => pivot.matrixWorld.clone().invert());
  disposeAvatar(model);
  model.traverse(node => {
    if (node.isMesh) {
      node.geometry = null;
      node.material = null;
    }
  });
  material ??= new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .7 });
  const visible = new THREE.SkinnedMesh(entry.geometry, material);
  const bones = pivots.map(() => {
    const bone = new THREE.Bone();
    bone.matrixAutoUpdate = false;
    visible.add(bone);
    return bone;
  });
  const skeleton = new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4()));
  visible.bind(skeleton, new THREE.Matrix4());
  visible.boundingSphere = entry.geometry.boundingSphere.clone();
  visible.boundingSphere.radius += .65;
  root.add(visible);
  const badge = shape(root, 0, tint.getHex(), 0, 1.34, -.72, .54, .28, .06);

  return {
    root,
    labelHeight: entry.height + .42,
    update(info, time, age, reduced) {
      const won = info.status === 'finished' || info.status === 'survivor';
      const out = info.status === 'out' || info.status === 'left';
      const walking = info.motion === 'run' && !reduced;
      poseCharacter(model, { time: reduced ? 0 : time, walking, celebrating: won });
      model.updateMatrixWorld(true);
      for (let i = 0; i < bones.length; i++) {
        bones[i].matrix.multiplyMatrices(pivots[i].matrixWorld, offsets[i]);
        bones[i].matrixWorldNeedsUpdate = true;
      }
      root.rotation.z = out ? Math.min(1.15, age * (reduced ? 20 : 5)) : 0;
      visible.rotation.x = walking ? .12 : 0;
      visible.position.y = won && !reduced ? Math.max(0, Math.sin(time * 10)) * .25 : 0;
      badge.position.y = 1.34 + visible.position.y;
    },
    dispose() {
      skeleton.dispose();
      if (--entry.users === 0) {
        entry.geometry.dispose();
        models.delete(player.characterId);
      }
      if (models.size === 0) {
        material.dispose();
        material = undefined;
      }
    }
  };
}

function bakeModel(model, pivots) {
  const indices = [], positions = [], normals = [], colors = [], joints = [], weights = [];
  const position = new THREE.Vector3(), normal = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
  const pivotIndices = new Map(pivots.map((pivot, index) => [pivot, index]));
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    let pivot = mesh;
    while (!pivotIndices.has(pivot)) pivot = pivot.parent;
    const joint = pivotIndices.get(pivot);
    const geometry = mesh.geometry;
    const input = geometry.attributes;
    const groups = Array.isArray(mesh.material) ? geometry.groups :
      [{ start: 0, count: geometry.index?.count ?? input.position.count, materialIndex: 0 }];
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    for (const { start, count, materialIndex } of groups) {
      const rgb = (Array.isArray(mesh.material) ? mesh.material[materialIndex] : mesh.material).color;
      const vertices = new Map();
      for (let i = start; i < start + count; i++) {
        const source = geometry.index ? geometry.index.getX(i) : i;
        if (!vertices.has(source)) {
          vertices.set(source, positions.length / 3);
          position.fromBufferAttribute(input.position, source).applyMatrix4(mesh.matrixWorld);
          normal.fromBufferAttribute(input.normal, source).applyNormalMatrix(normalMatrix);
          positions.push(position.x, position.y, position.z);
          normals.push(normal.x, normal.y, normal.z);
          colors.push(rgb.r, rgb.g, rgb.b);
          joints.push(joint, 0, 0, 0);
          weights.push(1, 0, 0, 0);
        }
        indices.push(vertices.get(source));
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return { geometry, height: geometry.boundingBox.max.y, users: 0 };
}
