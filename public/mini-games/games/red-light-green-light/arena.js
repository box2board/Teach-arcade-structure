import * as THREE from '../../vendor/three.module.js';
import { FIELD } from './rules.js';

import { makeMidwayAvatar } from './midway-avatar.js';

export function createArena(canvas, { makeAvatar = makeMidwayAvatar } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x93ddff);
  scene.fog = new THREE.Fog(0x93ddff, 85, 200);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 230);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = new Map(), materials = new Map(), geometry = [
    new THREE.BoxGeometry(1, 1, 1), new THREE.SphereGeometry(.5, 12, 9),
    new THREE.CylinderGeometry(.5, .5, 1, 12), new THREE.ConeGeometry(.5, 1, 9)
  ];
  const material = color => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color);
  };
  function shape(parent, kind, color, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(geometry[kind], material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }
  const box = (...args) => shape(scene, 0, ...args);
  scene.add(new THREE.HemisphereLight(0xeafaff, 0x8fae72, 2.2));
  const sun = new THREE.DirectionalLight(0xffe9ba, 1.6);
  sun.position.set(-28, 36, 9);
  scene.add(sun);

  box(0x73bf66, 0, -.53, 48, 200, 1, 220);
  const half = FIELD.width / 2;
  for (let lane = 0; lane < 10; lane++) {
    const x = (lane - 4.5) * 6.6;
    box(lane % 2 ? 0x35a98e : 0x3db69a, x, -.06, 39.5, 6.6, .16, 103);
    if (lane > 0) box(0xb5e5c8, x - 3.3, .03, 44.4, .09, .025, 89);
    for (const z of [14, 32, 50, 68, 81]) box(0xc1e8c3, x, .035, z, .99, .02, .1);
  }
  box(0xf8fcf1, 0, .07, 0, FIELD.width, .05, .8);
  const finish = FIELD.finish;
  for (let i = 0; i < 44; i++) {
    for (let row = 0; row < 2; row++) {
      box((i + row) % 2 ? 0xf8fcf1 : 0x243d60, -half + (i + .5) * 1.5,
        .08, finish - .38 + row * .76, 1.5, .05, .76);
    }
  }
  box(0xe6c67e, 0, .03, 98, 76, .16, 14);
  for (const side of [-1, 1]) {
    box(0xfcd47b, side * (half + .32), .52, 43, .46, 1, 112);
    box(0xf17e57, side * (half + 1.9), .08, 43, 2.35, .18, 112);
    for (let i = 0; i < 11; i++) {
      const z = i * 11 - 9;
      const x = side * (half + 1.8);
      box(0x2b4769, x, 2, z, .18, 4, .18);
      const banner = box([0xff745d, 0xffc950, 0x6c79df][i % 3], x + side * .54, 3.6, z, 1.1, .9, .08);
      banner.rotation.y = side * .25;
      const treeX = side * (half + 11 + (i % 3) * 4.7);
      shape(scene, 2, 0x976c48, treeX, 1.5, z + 3, .72, 3, .72);
      shape(scene, 3, i % 2 ? 0x31a27b : 0x3fae72, treeX, 4, z + 3, 5, 5.2, 5);
    }
    for (let i = 0; i < 3; i++) {
      box(0x437d9b, side * (half + 7 + i * 1.2), .5 + i * .48, 47, 1.28, .55 + i * .96, 22);
      box(0xfea755, side * (half + 7 + i * 1.2), .82 + i * .94, 47, 1.28, .15, 22);
    }
    for (const [index, z] of [11, 69, 102].entries()) {
      const x = side * (half + 5.5);
      const canopy = [0xff8472, 0x7775e8, 0x268ab9][index];
      box(0xf6dfae, x, 1.05, z, 4, 2.1, 4);
      shape(scene, 3, canopy, x, 3.4, z, 6.7, 3, 6.7);
      box(canopy, x, 2.4, z, 4.8, .6, 4.8);
      box(0x6b4a56, x - side * 2.02, 1.08, z, .15, 1.56, 1.8);
    }
  }
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 22;
    shape(scene, 1, 0x60bc8a, x, -.1, 137 + (i % 2) * 8, 49, 14 + (i % 3) * 4, 35);
    if (i % 2 === 0) {
      const y = 21 + (i % 3) * 6, z = 113 + (i % 3) * 8;
      shape(scene, 1, 0xf1fbff, x, y, z, 21, 3.5, 6);
      shape(scene, 1, 0xf1fbff, x - 3.5, y + 1.3, z, 10, 5.4, 5.8);
      shape(scene, 1, 0xf1fbff, x + 2.2, y + 2.1, z, 11, 5.8, 6.3);
    }
  }

  for (const x of [-half - 1, half + 1]) {
    box(0x2d4d74, x, 4.5, finish, 1.3, 9, 1.15);
    box(0xf6bc55, x, .68, finish, 2.1, 1.36, 2.1);
    for (const y of [2.1, 4.1, 6.1]) box(0x7acdb2, x, y, finish, 1.36, .32, 1.22);
  }
  box(0x2d4d74, 0, 8.8, finish, FIELD.width + 3, 1.18, 1.15);
  box(0xffca65, 0, 9.3, finish, FIELD.width + 3, .16, 1.26);
  const sign = label('FINISH', '#243d60', '#fff1c4', 9.5, 1.6);
  sign.position.set(0, 8.7, finish - .68);
  scene.add(sign);
  box(0x263f60, 0, 12.6, finish + 2, 6, 4.8, 2.1);
  batchScenery(scene);
  const signal = new THREE.Mesh(geometry[1], new THREE.MeshBasicMaterial({ color: 0xffce76 }));
  signal.position.set(0, 12.6, finish + .88);
  signal.scale.set(3.4, 3.4, .7);
  scene.add(signal);
  const runway = new THREE.InstancedMesh(geometry[0], signal.material, 36);
  const marker = new THREE.Object3D();
  for (let i = 0; i < runway.count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    marker.position.set(side * (half - .3), .095, Math.floor(i / 2) * 5 + 1.5);
    marker.scale.set(.25, .08, .92);
    marker.updateMatrix();
    runway.setMatrixAt(i, marker.matrix);
  }
  scene.add(runway);
  const dot = new THREE.Mesh(geometry[1], new THREE.MeshBasicMaterial({ color: 0x18394b, transparent: true, opacity: .22 }));
  dot.scale.set(1.8, .03, 1.3);
  const targetCamera = new THREE.Vector3(), gaze = new THREE.Vector3(), aim = new THREE.Vector3();
  let round = -1, focus = '', previous = 0, width = 0, height = 0;

  function render(state, id, now) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (w !== width || h !== height) {
      width = w; height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const dt = Math.min(.06, (now - previous) / 1000);
    previous = now;
    const follow = views.get(id);
    const snap = round !== state?.roundId || focus !== id;
    const seen = new Set();
    const me = state?.players.get(id);
    for (const [key, player] of state?.players ?? []) {
      if (player.status === 'waiting') continue;
      seen.add(key);
      let view = views.get(key);
      if (view?.characterId !== player.characterId) {
        if (view) remove(key, view);
        const tint = new THREE.Color().setHSL((player.color * .618034) % 1, .72, .54);
        const track = dot.clone(), shell = new THREE.Group(), actor = makeAvatar(player, shape, tint);
        const name = label(player.name, '#ffffff', '#' + tint.getHexString(), 2.8, .57);
        shell.add(actor.root, name, track);
        name.position.y = actor.labelHeight ?? 3.5;
        scene.add(shell);
        view = { shell, actor, name, characterId: player.characterId, status: '', changed: now };
        views.set(key, view);
        view.shell.position.set(player.x, .09, player.z);
      }
      if (view.status !== player.status) {
        view.changed = now;
        view.status = player.status;
      }
      const smooth = snap ? 1 : 1 - Math.exp(-dt * (key === id ? 21 : 13));
      const { shell, actor } = view;
      shell.position.x += (player.x - shell.position.x) * smooth;
      shell.position.z += (player.z - shell.position.z) * smooth;
      const angle = Math.atan2(Math.sin(player.facing - actor.root.rotation.y), Math.cos(player.facing - actor.root.rotation.y));
      actor.root.rotation.y += angle * smooth;
      shell.visible = player.connected || player.status === 'out';
      const distance = Math.hypot(player.x - (me?.x ?? 0), player.z - (me?.z ?? 0));
      view.name.visible = distance < 26 || key === id;
      actor.update(player, now / 1000, (now - view.changed) / 1000, reduced || distance > 50);
    }
    for (const [key, view] of views) if (!seen.has(key)) remove(key, view);

    round = state?.roundId;
    focus = id;
    const pos = (views.get(id) ?? follow)?.shell.position;
    targetCamera.set(pos?.x ?? 0, pos ? (w < 560 ? 6.4 : 5.3) : 12, (pos?.z ?? 0) - (pos ? 9.5 : 16));
    aim.set(pos?.x ?? 0, pos ? 2.35 : 4.6, (pos?.z ?? 0) + 17);
    const followAmount = snap ? 1 : 1 - Math.exp(-dt * 8);
    camera.position.lerp(targetCamera, followAmount);
    gaze.lerp(aim, followAmount);
    camera.lookAt(gaze);
    const red = state?.phase === 'red', green = state?.phase === 'green';
    signal.material.color.setHex(red ? 0xff413a : green ? 0x58ff9f : 0xffce76);
    signal.scale.setScalar(reduced ? 3.15 : 3.15 + Math.sin(now / 135) * .2);
    signal.scale.z = .7;
    renderer.render(scene, camera);
  }

  function remove(key, view) {
    scene.remove(view.shell);
    view.name.material.map.dispose();
    view.name.material.dispose();
    view.actor.dispose?.();
    views.delete(key);
  }
  return { render, dispose() {
    for (const [key, view] of views) remove(key, view);
    sign.material.map.dispose();
    sign.material.dispose();
    signal.material.dispose();
    dot.material.dispose();
    for (const object of scene.children) if (object.isInstancedMesh) object.dispose();
    for (const m of materials.values()) m.dispose();
    for (const g of geometry) g.dispose();
    renderer.dispose();
  } };
}

function batchScenery(scene) {
  const batches = new Map();
  for (const mesh of scene.children.filter(node => node.isMesh)) {
    const key = mesh.geometry.id + ':' + mesh.material.id;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  }
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const batch = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    meshes.forEach((mesh, index) => {
      mesh.updateMatrix();
      batch.setMatrixAt(index, mesh.matrix);
      scene.remove(mesh);
    });
    scene.add(batch);
  }
}

function label(value, fg, bg, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(3, 4, 250, 56, 16);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 37px system-ui';
  ctx.fillText(value, 128, 32, 224);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true }));
  sprite.scale.set(width, height, 1);
  return sprite;
}
