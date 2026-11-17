import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from '../../public/mini-games/vendor/three.module.js';
import { characters } from '../../public/mini-games/shared/midway-characters/characters.js';
import { makeMidwayAvatar } from '../../public/mini-games/games/red-light-green-light/midway-avatar.js';

test('all 20 Midway characters animate and duplicates share baked geometry', () => {
  const tint = new THREE.Color('cyan');
  const shape = parent => {
    const badge = new THREE.Object3D();
    parent.add(badge);
    return badge;
  };
  assert.equal(characters.length, 20);
  const actors = characters.flatMap(({ id }) => [1, 2].map(() =>
    makeMidwayAvatar({ characterId: id }, shape, tint)));
  const visibleMesh = actor => actor.root.children.find(child => child.isSkinnedMesh);
  try {
    for (const [index, actor] of actors.entries()) {
      const mesh = visibleMesh(actor);
      assert.equal(mesh.geometry, visibleMesh(actors[index ^ 1]).geometry);
      assert(mesh.geometry.index.count > 0);
      assert(actor.labelHeight > 2);
      const position = mesh.geometry.attributes.position;
      const point = new THREE.Vector3();
      let totalMovement = 0;
      actor.root.position.set(3, 0, 9);
      actor.update({ motion: 'run', status: 'racing' }, .33, .33, false);
      actor.root.updateMatrixWorld(true);
      for (let i = 0; i < position.count; i += 5) {
        point.fromBufferAttribute(position, i);
        const baseline = point.clone();
        mesh.applyBoneTransform(i, point);
        assert(Number.isFinite(point.length()));
        totalMovement += point.distanceTo(baseline);
      }
      assert(totalMovement > 0);
      const nearTriangles = mesh.geometry.index.count;
      actor.update({ motion: 'run', status: 'racing' }, .4, .4, false, 40);
      assert(mesh.geometry.index.count < nearTriangles, 'Distant model must use fewer triangles');
      actor.root.updateMatrixWorld(true);
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 7) {
        point.fromBufferAttribute(mesh.geometry.attributes.position, i);
        mesh.applyBoneTransform(i, point);
        assert(Number.isFinite(point.length()));
      }
      actor.update({ motion: 'idle', status: 'racing' }, .5, .5, false, 0);
      assert.equal(mesh.geometry.index.count, nearTriangles);

    }
  } finally {
    for (const actor of actors) actor.dispose();
  }
});
