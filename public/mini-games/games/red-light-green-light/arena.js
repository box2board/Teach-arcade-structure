import * as THREE from '../../vendor/three.module.js';
import { FIELD } from './rules.js';
import { makeMidwayAvatar } from './midway-avatar.js';

export function createArena(canvas, { makeAvatar = makeMidwayAvatar } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7dfda);
  scene.fog = new THREE.Fog(0xb7dfda, 88, 215);
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
  const half = FIELD.width / 2, finish = FIELD.finish;
  const navy = 0x13304d, ivory = 0xffedc5, teal = 0x1b9d94, gold = 0xffb941;
  const pennants = [0xff8163, 0xffcc59, 0x56e4ce, 0xa59bff];
  scene.add(new THREE.HemisphereLight(0xdff5ff, 0xa4aab8, 1.85));
  const sun = new THREE.DirectionalLight(0xffe2ad, 1.95);
  sun.position.set(-28, 36, 9);
  scene.add(sun);

  box(0x47896c, 0, -.56, 48, 250, 1, 240);
  box(0x235552, 0, -.16, 40, 77, .29, 112);
  box(0xd49659, 0, -.07, finish + 6, 72, .18, 11);
  for (const side of [-1, 1]) {
    const inside = side * (half + .38), rail = side * (half + 1.52);
    box(navy, inside, .32, 42, .62, .66, 106);
    box(gold, inside, .68, 42, .69, .14, 106);
    box(0x717c8b, side * (half + 2.1), -.02, 42, 2.8, .13, 106);
    for (let i = 0; i < 23; i++) {
      const z = i * 4.7 - 9;
      box(ivory, inside, .35, z, .64, .18, 2.25);
      box(navy, rail, 1.08, z, .18, 2.12, .18);
      if (i % 3 === 0) {
        box(gold, rail, 2.19, z, .31, .17, .31);
        const banner = box(pennants[(i / 3) % pennants.length], rail + side * .38, 1.65, z, .79, .66, .065);
        banner.rotation.y = side * .36;
      }
    }
    box(navy, rail, 1.2, 42, .14, .17, 106);
    box(0x8bafb1, rail, 1.82, 42, .13, .12, 106);
    for (let i = 0; i < 13; i++) {
      const z = i * 10 + (i % 2) * 2 - 13;
      const x = side * (half + 20 + (i % 3) * 6);
      shape(scene, 2, 0x996344, x, 1.34, z, .7, 2.7, .7);
      shape(scene, 1, i % 2 ? 0x248065 : 0x319778, x, 3.8, z, 5.8, 5.3, 5.8);
      shape(scene, 1, 0x60aa7c, x + side * .85, 4.65, z - .7, 4.1, 4, 4.4);
    }
    for (const [section, z] of [24, 67].entries()) {
      const x = side * (half + 12);
      box(navy, x, .26, z, 11, .52, 29);
      for (let i = 0; i < 5; i++) {
        const y = .44 + i * .65, row = x + side * (i - 2) * 1.55;
        box(0x25546c, row, y / 2, z, 1.55, y, 27);
        box(pennants[(i + section * 2) % pennants.length], row, y, z, 1.49, .2, 27);
        for (let seat = 0; seat < 17; seat++) {
          if ((seat + i * 2 + section) % 5 > 1) continue;
          const along = z + (seat - 8) * 1.44 + (i % 2) * .29;
          const color = pennants[(seat + i + section) % pennants.length];
          shape(scene, 1, color, row, y + .39, along, .48, .63, .48);
          shape(scene, 1, 0xffdab1, row - side * .09, y + .78, along, .38, .39, .38);
        }
      }
      for (const offset of [-13, 13]) box(navy, x + side * 4.1, 3.1, z + offset, .39, 6.2, .39);
      const roof = box(section ? teal : 0xcc6159, x, 6.2, z, 11.5, .36, 29);
      roof.rotation.z = side * -.11;
      box(ivory, x - side * 5.5, 5.58, z, .22, .35, 29);
    }
    for (const [index, z] of [-3, 46, 100].entries()) {
      const x = side * (half + 7.2);
      const canopy = pennants[(index + (side > 0 ? 1 : 0)) % pennants.length];
      box(navy, x, 1, z, 4.6, 2, 4.3);
      box(ivory, x - side * 2.31, 1.43, z, .12, .62, 3.6);
      shape(scene, 3, canopy, x, 2.8, z, 6.9, 2.1, 6.9);
      box(canopy, x, 2.12, z, 5.3, .48, 5.2);
    }
  }

  for (let i = 0; i < 13; i++) {
    const x = (i - 6) * 23, y = i % 3;
    shape(scene, 1, 0x648fa8, x, 1, 165 + (i % 2) * 10, 67, 27 + y * 12, 49);
    shape(scene, 1, 0x3e8b7c, x + 7, -.4, 130 + ((i + 1) % 3) * 9, 48, 14 + y * 5, 36);
    if (i % 2 === 0) {
      const cloudY = 30 + y * 7, z = 155 + y * 8;
      shape(scene, 1, 0xf5faf4, x, cloudY, z, 25, 3.6, 7);
      shape(scene, 1, 0xf5faf4, x - 4, cloudY + 1.3, z, 11, 6.2, 7.5);
      shape(scene, 1, 0xf5faf4, x + 4, cloudY + 2.1, z, 12, 6.3, 8);
    }
  }

  for (const side of [-1, 1]) {
    const x = side * (half + 1);
    box(navy, x, 4.7, finish, 2, 9.4, 1.85);
    box(gold, x, .65, finish, 2.9, 1.3, 2.45);
    box(teal, x, 5.24, finish - .97, 1.53, 5.8, .24);
    for (let i = 0; i < 5; i++) box(ivory, x, 3 + i * .9, finish - 1.11, 1.18, .27, .1);
    for (let i = 0; i < 4; i++) {
      const sx = side * (11.45 + i * .95);
      box(i % 2 ? ivory : gold, sx, 9.33, finish - .98, .55, 1.47, .12).rotation.z = -.26;
    }
  }
  box(navy, 0, 9.35, finish, FIELD.width + 3.8, 2.3, 1.9);
  box(gold, 0, 10.56, finish, FIELD.width + 3.8, .24, 2);
  box(teal, 0, 8.18, finish, FIELD.width + 3.8, .22, 2);
  box(navy, 0, 13.22, finish + .04, 9.4, 4.2, 2.35);
  box(gold, 0, 15.37, finish + .04, 9.6, .22, 2.44);
  for (const x of [-2.15, 2.15]) shape(scene, 1, 0x29465a, x, 13.2, finish - 1.18, 3.53, 3.53, .47);

  const sceneryMaterial = batchScenery(scene);
  const sky = createSky(scene);
  const surface = createCourse(scene, half, finish, renderer.capabilities.getMaxAnisotropy());
  const sign = label('FINISH', '#fff0d2', '#12324c', 15.7, 2.85, '#ffc75b');
  const startSign = label('START', '#fff0d2', '#12324c', 6, 1.4, '#ffc75b');
  sign.position.set(0, 9.35, finish - 1.14);
  startSign.position.set(-half + 2.8, .96, -1.6);
  scene.add(sign, startSign);
  const redLamp = new THREE.MeshBasicMaterial({ color: 0x63313c });
  const greenLamp = new THREE.MeshBasicMaterial({ color: 0x276050 });
  for (const [i, lamp] of [redLamp, greenLamp].entries()) {
    const lens = new THREE.Mesh(geometry[1], lamp);
    lens.position.set(i === 0 ? -2.15 : 2.15, 13.2, finish - 1.47);
    lens.scale.set(2.77, 2.77, .65);
    scene.add(lens);
  }
  const phaseIndicator = new THREE.MeshBasicMaterial({ color: 0xffc557 });
  const runway = new THREE.InstancedMesh(geometry[0], phaseIndicator, 52);
  const marker = new THREE.Object3D();
  for (let i = 0; i < runway.count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    marker.position.set(side * (half - .42), .05, Math.floor(i / 2) * 3.46 + 1.7);
    marker.scale.set(.4, .055, 1.55);
    marker.updateMatrix();
    runway.setMatrixAt(i, marker.matrix);
  }
  scene.add(runway);
  const shadowTexture = radialTexture();
  const dot = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.1), new THREE.MeshBasicMaterial({
    color: 0x112d3d, map: shadowTexture, transparent: true, depthWrite: false, opacity: .58
  }));
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = -.055;
  const runnerRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 36), new THREE.MeshBasicMaterial({
    color: 0xffd267, transparent: true, opacity: .93, depthWrite: false, side: THREE.DoubleSide
  }));
  runnerRing.rotation.x = -Math.PI / 2;
  runnerRing.position.y = .048;
  runnerRing.visible = false;
  scene.add(runnerRing);
  const targetCamera = new THREE.Vector3(), gaze = new THREE.Vector3(), aim = new THREE.Vector3();
  const resolutionCap = Math.min(devicePixelRatio || 1, 1.35);
  const performanceStats = { fps: 0, pixelRatio: resolutionCap, avatars: 0, drawCalls: 0, triangles: 0 };
  let sampleStarted = 0, sampleFrames = 0, lastAdjustment = 0;
  let round = -1, focus = '', previous = 0, width = 0, height = 0;

  function render(state, id, now, localPose) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (w !== width || h !== height) {
      width = w; height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (!document.hidden) {
      if (!sampleStarted) sampleStarted = now;
      sampleFrames++;
      if (now - sampleStarted >= 3000) {
        performanceStats.fps = Math.round(sampleFrames * 1000 / (now - sampleStarted));
        const current = renderer.getPixelRatio();
        if (now - lastAdjustment > 6000 && performanceStats.fps < 36 && current > .8) {
          renderer.setPixelRatio(Math.max(.8, current - .25));
          width = 0;
          lastAdjustment = now;
        } else if (now - lastAdjustment > 18000 && performanceStats.fps > 56 && current < resolutionCap) {
          renderer.setPixelRatio(Math.min(resolutionCap, current + .15));
          width = 0;
          lastAdjustment = now;
        }
        sampleStarted = now;
        sampleFrames = 0;
        performanceStats.pixelRatio = renderer.getPixelRatio();
      }
    } else {
      sampleStarted = 0;
      sampleFrames = 0;
    }
    const dt = Math.min(.06, (now - previous) / 1000);
    previous = now;
    const follow = views.get(id);
    const snap = round !== state?.roundId || focus !== id;
    const seen = new Set();
    const me = state?.players.get(id);
    for (const [key, source] of state?.players ?? []) {
      const player = key === id && localPose ? localPose : source;
      if (player.status === 'waiting') continue;
      seen.add(key);
      let view = views.get(key);
      if (view?.characterId !== player.characterId) {
        if (view) remove(key, view);
        const tint = new THREE.Color().setHSL((player.color * .618034) % 1, .72, .54);
        const track = dot.clone(), shell = new THREE.Group(), actor = makeAvatar(player, shape, tint);
        const name = label(player.name, '#ffffff', '#142c45', 2.95, .64, '#' + tint.getHexString());
        shell.add(actor.root, name, track);
        name.position.y = actor.labelHeight ?? 3.5;
        scene.add(shell);
        view = { shell, actor, name, characterId: player.characterId, status: '', changed: now, posedAt: 0 };
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
      if (key === id || distance < 24 || now - view.posedAt >= 100 || snap) {
        actor.update(player, now / 1000, (now - view.changed) / 1000, reduced || distance > 50, distance);
        view.posedAt = now;
      }
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
    redLamp.color.setHex(red ? 0xff4a61 : 0x583340);
    greenLamp.color.setHex(green ? 0x57ffb3 : 0x22594c);
    phaseIndicator.color.setHex(red ? 0xff6c76 : green ? 0x75fccc : 0xffc557);
    runnerRing.visible = Boolean(pos && me?.status === 'racing');
    if (pos) {
      runnerRing.position.x = pos.x;
      runnerRing.position.z = pos.z;
    }
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    performanceStats.avatars = views.size;
    performanceStats.drawCalls = renderer.info.render.calls;
    performanceStats.triangles = renderer.info.render.triangles;
  }

  function remove(key, view) {
    scene.remove(view.shell);
    view.name.material.map.dispose();
    view.name.material.dispose();
    view.actor.dispose?.();
    views.delete(key);
  }
  return { render, diagnostics: performanceStats, dispose() {
    for (const [key, view] of views) remove(key, view);
    for (const sprite of [sign, startSign]) {
      sprite.material.map.dispose();
      sprite.material.dispose();
    }
    for (const mat of [sceneryMaterial, redLamp, greenLamp, phaseIndicator, dot.material, runnerRing.material, sky.material, surface.material]) mat.dispose();
    for (const mesh of [dot, runnerRing, sky, surface]) mesh.geometry.dispose();
    for (const texture of [shadowTexture, surface.material.map]) texture.dispose();
    for (const object of scene.children) if (object.isInstancedMesh) object.dispose();
    for (const m of materials.values()) m.dispose();
    for (const g of geometry) g.dispose();
    renderer.dispose();
  } };
}

function batchScenery(scene) {
  const batches = new Map();
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (const mesh of scene.children.filter(node => node.isMesh)) {
    const key = mesh.geometry.id;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  }
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const batch = new THREE.InstancedMesh(meshes[0].geometry, material, meshes.length);
    meshes.forEach((mesh, index) => {
      mesh.updateMatrix();
      batch.setMatrixAt(index, mesh.matrix);
      batch.setColorAt(index, mesh.material.color);
      scene.remove(mesh);
    });
    scene.add(batch);
  }
  return material;
}

function createCourse(scene, half, finish, maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const near = -12, far = 92;
  const x = world => (world + half) / (half * 2) * canvas.width;
  const z = world => (world - near) / (far - near) * canvas.height;
  function stripe(color, fromX, fromZ, toX, toZ) {
    ctx.fillStyle = color;
    ctx.fillRect(x(fromX), z(fromZ), x(toX) - x(fromX), z(toZ) - z(fromZ));
  }
  for (let lane = 0; lane < 10; lane++) {
    const left = -half + lane * 6.6;
    stripe(lane % 2 ? '#228175' : '#287b74', left, near, left + 6.6, far);
    stripe('#1b6e68', left, near, left + .23, far);
    stripe('#7cb3a0', left + .21, -2, left + .31, finish);
    for (const mark of [12, 24, 36, 48, 60, 72, 81]) {
      stripe('#82b3a2', left + 2.63, mark, left + 3.97, mark + .10);
    }
  }
  for (let block = 0; block < 13; block += 2) {
    stripe('#081d3016', -half, near + block * 8, half, near + (block + 1) * 8);
  }
  let seed = 413;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = i % 2 ? '#d4e9cf12' : '#0c403b17';
    ctx.fillRect(random() * canvas.width, random() * canvas.height, 1 + random() * 2, 2 + random() * 3);
  }
  for (const side of [-1, 1]) {
    const edge = side * half;
    stripe('#e3a645', Math.min(edge, edge - side * .28), near, Math.max(edge, edge - side * .28), far);
  }
  stripe('#e4eee1', -half, -.46, half, .03);
  stripe('#92bdac', -half, .21, half, .32);
  stripe('#ffc75b', -half, finish - 1, half, finish - .78);
  for (let i = 0; i < 44; i++) {
    for (let row = 0; row < 2; row++) {
      const left = -half + i * 1.5;
      const line = finish - .78 + row * .78;
      stripe((i + row) % 2 ? '#fff1d2' : '#14324e', left, line, left + 1.5, line + .78);
    }
  }
  stripe('#ffc75b', -half, finish + .78, half, finish + 1);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(4, maxAnisotropy);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, far - near),
    new THREE.MeshBasicMaterial({ map }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, .027, (near + far) / 2);
  scene.add(surface);
  return surface;
}

function createSky(scene) {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      horizon: { value: new THREE.Color(0xcbe9df) },
      top: { value: new THREE.Color(0x64badb) },
      warm: { value: new THREE.Color(0xffdda0) }
    },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 direction;
      uniform vec3 horizon;
      uniform vec3 top;
      uniform vec3 warm;
      void main() {
        vec3 ray = normalize(direction);
        vec3 skyColor = mix(horizon, top, smoothstep(-0.08, 0.52, ray.y));
        float sun = max(0.0, dot(ray, normalize(vec3(-0.54, 0.27, 0.8))));
        skyColor = mix(skyColor, warm, 0.44 * pow(sun, 20.0));
        skyColor = mix(skyColor, vec3(1.0, 0.93, 0.7), smoothstep(0.997, 0.999, sun));
        gl_FragColor = vec4(skyColor, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(216, 16, 12), material);
  sky.renderOrder = -10;
  scene.add(sky);
  return sky;
}

function radialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const fade = ctx.createRadialGradient(32, 32, 5, 32, 32, 31);
  fade.addColorStop(0, '#ffffffff');
  fade.addColorStop(1, '#ffffff00');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function label(value, fg, bg, width, height, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(3, 4, 250, 56, 16);
  ctx.fill();
  if (accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(22, 32, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 37px system-ui';
  ctx.fillText(value, accent ? 136 : 128, 32, accent ? 198 : 224);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true }));
  sprite.scale.set(width, height, 1);
  return sprite;
}
