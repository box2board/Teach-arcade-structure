import * as T from "../../assets/vendor/three-0.162.0/three.module.js";
import { asset, WIDTH } from "./catalog.js";
export function localPoint(a, t, scale = 1) {
  let x,
    z,
    y = 0,
    heading = 0;
  if (a.kind === "curve") {
    let r = a.radius * scale,
      ang = a.angle * t,
      s = Math.sign(a.angle);
    x = r * Math.sin(Math.abs(ang));
    z = s * r * (1 - Math.cos(ang));
    heading = ang;
  } else {
    x = a.length * scale * t;
    z = 0;
    if (a.kind === "slope") y = a.rise * (t * t * (3 - 2 * t));
    if (a.kind === "ramp") y = a.rise * t * t;
    if (a.kind === "landing") y = a.rise * (2 * t - t * t);
  }
  if (a.kind === "loop") {
    const theta = 2 * Math.PI * t;
    x = scale * (a.radius * Math.sin(theta) + a.lead * t);
    y = a.radius * scale * (1 - Math.cos(theta));
    z = 4 * scale * t * t * (3 - 2 * t);
  }
  if (a.kind === "wave")
    y = a.amplitude * Math.pow(Math.sin(Math.PI * (a.waves || 1) * t), 2);
  if (a.kind === "chicane") {
    z = (a.amplitude * (1 - Math.cos(2 * Math.PI * (a.waves || 1) * t))) / 2;
    heading = Math.atan2(
      a.amplitude *
        Math.PI *
        (a.waves || 1) *
        Math.sin(2 * Math.PI * (a.waves || 1) * t),
      a.length * scale,
    );
  }
  return { x, y, z, heading, bank: (a.bank || 0) * Math.sin(Math.PI * t) };
}
export function sample(piece, t) {
  const a = asset(piece.type),
    p = localPoint(a, t, piece.length || 1),
    c = Math.cos(piece.yaw),
    s = Math.sin(piece.yaw);
  return {
    x: piece.x + p.x * c - p.z * s,
    y: piece.y + p.y,
    z: piece.z + p.x * s + p.z * c,
    heading: piece.yaw + p.heading,
    bank: p.bank,
  };
}
export function endpoint(piece, end = 1) {
  const p = sample(piece, end),
    a = sample(piece, end === 1 ? 0.999 : 0),
    b = sample(piece, end === 1 ? 1 : 0.001);
  return {
    ...p,
    pitch: Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)),
  };
}
export function makePiece(piece, selected = false, ghost = false) {
  const a = asset(piece.type),
    g = new T.Group();
  g.userData.pieceId = piece.id;
  const n = Math.max(
      12,
      Math.ceil(a.dimensions.length * (piece.length || 1) * 3),
    ),
    verts = [],
    indices = [];
  for (let i = 0; i <= n; i++) {
    const p = sample(piece, i / n),
      nx = -Math.sin(p.heading),
      nz = Math.cos(p.heading);
    for (let side of [-1, 1])
      verts.push(
        p.x + ((nx * WIDTH) / 2) * side,
        p.y - ((Math.sin(p.bank) * WIDTH) / 2) * side + 0.32,
        p.z + ((nz * WIDTH) / 2) * side,
      );
  }
  for (let i = 0; i < n; i++) {
    let j = i * 2;
    indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({
    color: selected ? "#ffd173" : piece.color || a.color,
    roughness: 0.48,
    metalness: 0.15,
    side: T.DoubleSide,
    transparent: ghost,
    opacity: ghost ? 0.58 : 1,
  });
  const mesh = new T.Mesh(geo, mat);
  mesh.receiveShadow = true;
  g.add(mesh);
  // Thick toy-track shoulders and a contrasting inset driving surface.
  const laneVertices=[],wallVertices=[],wallIndices=[];
  for(let i=0;i<=n;i++){
    const q=sample(piece,i/n),nx=-Math.sin(q.heading),nz=Math.cos(q.heading);
    for(const side of [-1,1])laneVertices.push(q.x+nx*1.12*side,q.y+.342-Math.sin(q.bank)*1.12*side,q.z+nz*1.12*side);
    for(const side of [-1,1])for(const drop of [0,.30])wallVertices.push(q.x+nx*WIDTH/2*side,q.y+.32-drop-Math.sin(q.bank)*WIDTH/2*side,q.z+nz*WIDTH/2*side);
  }
  for(let i=0;i<n;i++)for(let side=0;side<2;side++){const j=i*4+side*2;wallIndices.push(j,j+1,j+4,j+1,j+5,j+4);}
  function detailMesh(vertices,index,color){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geom.setIndex(index);geom.computeVertexNormals();const mesh=new T.Mesh(geom,new T.MeshStandardMaterial({color,roughness:.62,metalness:.06,side:T.DoubleSide,transparent:ghost,opacity:ghost?.58:1}));mesh.receiveShadow=true;g.add(mesh);}
  detailMesh(laneVertices,indices,selected?'#6e4191':'#302254');
  detailMesh(wallVertices,wallIndices,a.kind==='loop'?'#ffae13':'#5325a6');
  // Molded connector clips outside the driving lane, with visible silver pins.
  if(!ghost){for(const t of [.015,.985]){const q=sample(piece,t);for(const side of [-1,1]){const clip=new T.Mesh(new T.BoxGeometry(.5,.24,.38),new T.MeshStandardMaterial({color:'#ffce24',roughness:.5}));clip.position.set(q.x-Math.sin(q.heading)*1.58*side,q.y+.33-Math.sin(q.bank)*1.58*side,q.z+Math.cos(q.heading)*1.58*side);clip.rotation.y=-q.heading;g.add(clip);const pin=new T.Mesh(new T.SphereGeometry(.075,6,4),new T.MeshStandardMaterial({color:'#ffffff',metalness:.5,roughness:.3}));pin.position.copy(clip.position);pin.position.y+=.13;g.add(pin);}}}
  // Engineered raised edge rails, center markings and ribbed support legs.
  for (let side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      let p = sample(piece, i / n);
      pts.push(
        new T.Vector3(
          p.x - ((Math.sin(p.heading) * WIDTH) / 2) * side,
          p.y + 0.43 - ((Math.sin(p.bank) * WIDTH) / 2) * side,
          p.z + ((Math.cos(p.heading) * WIDTH) / 2) * side,
        ),
      );
    }
    const curve = new T.CatmullRomCurve3(pts);
    const rail = new T.Mesh(
      new T.TubeGeometry(curve, n, 0.085, 4, false),
      new T.MeshStandardMaterial({
        color: ghost ? "#c3fff3" : "#ffffff",
        roughness: 0.6,
        transparent: ghost,
        opacity: ghost ? 0.6 : 1,
      }),
    );
    g.add(rail);
  }
  if (!ghost) {
    for (let i = 0; i <= n; i += Math.max(2, Math.round(n / 4))) {
      let p = sample(piece, i / n),
        height = p.y + 0.2;
      if (height > 0.6) {
        for (let side of [-1, 1]) {
          const leg = new T.Mesh(
            new T.CylinderGeometry(0.13, 0.24, height, 5),
            new T.MeshStandardMaterial({ color: "#365bff", roughness: 0.9 }),
          );
          leg.position.set(
            p.x - Math.sin(p.heading) * (a.kind === "loop" ? 2.2 : 1.25) * side,
            height / 2,
            p.z + Math.cos(p.heading) * (a.kind === "loop" ? 2.2 : 1.25) * side,
          );
          g.add(leg);
          const foot = new T.Mesh(
            new T.CylinderGeometry(0.4, 0.44, 0.12, 6),
            new T.MeshStandardMaterial({ color: "#ffb515" }),
          );
          foot.position.set(leg.position.x, 0.06, leg.position.z);
          g.add(foot);
        }
      }
    }
    for (let t = 0.12; t < 1; t += 0.16) {
      let p = sample(piece, t);
      const dash = new T.Mesh(
        new T.BoxGeometry(0.6, 0.025, 0.06),
        new T.MeshStandardMaterial({ color: "#ffffff" }),
      );
      dash.position.set(p.x, p.y + 0.36, p.z);
      dash.rotation.y = -p.heading;
      g.add(dash);
    }
    if (a.interaction) {
      const color = a.interaction === "boost" ? "#ffd271" : "#f9f6df";
      for (let t = 0.3; a.interaction !== "finish" && t <= 0.7; t += 0.2) {
        let p = sample(piece, t);
        const strip = new T.Mesh(
          new T.BoxGeometry(0.22, 0.035, 3.1),
          new T.MeshStandardMaterial({
            color,
            emissive: a.interaction === "boost" ? "#b46d0a" : "#000000",
            emissiveIntensity: 0.3,
          }),
        );
        strip.position.set(p.x, p.y + 0.35, p.z);
        strip.rotation.y = -p.heading;
        g.add(strip);
      }
      if (a.interaction === "start" || a.interaction === "finish") {
        let p = sample(piece, 0.5);
        const arch = new T.Group(),
          m = new T.MeshStandardMaterial({
            color: a.interaction === "start" ? "#562aff" : "#ffce00",
          });
        for (let z of [-2, 2]) {
          let post = new T.Mesh(new T.BoxGeometry(0.22, 3.2, 0.22), m);
          post.position.set(0, 1.9, z);
          arch.add(post);
        }
        let cross = new T.Mesh(new T.BoxGeometry(0.28, 0.45, 4.3), m);
        cross.position.y = 3.35;
        arch.add(cross);
        if (a.interaction === "finish") {
          const light = new T.MeshStandardMaterial({ color: "#fff9e7" });
          const dark = new T.MeshStandardMaterial({ color: "#292044" });
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 8; col++) {
              const material = (row + col) % 2 ? light : dark;
              const tile = new T.Mesh(new T.BoxGeometry(0.29, 0.026, 0.4), material);
              tile.position.set((row - 0.5) * 0.29, 0.365, (col - 3.5) * 0.4);
              arch.add(tile);
              const bannerTile = new T.Mesh(new T.BoxGeometry(0.035, 0.19, 0.5), material);
              bannerTile.position.set(-0.145, 3.35 + (row - 0.5) * 0.19, (col - 3.5) * 0.5);
              arch.add(bannerTile);
            }
          }
        } else {
          for (const [index, color] of ["#ff453a", "#ffce00", "#30e190"].entries()) {
            const lamp = new T.Mesh(new T.SphereGeometry(0.16, 8, 6),
              new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45 }));
            lamp.position.set(-0.19, 3.35, (index - 1) * 0.52);
            arch.add(lamp);
          }
        }
        arch.position.set(p.x, p.y, p.z);
        arch.rotation.y = -p.heading;
        g.add(arch);
      }
    }
  }
  if (a.tunnel) {
    for (let t = 0.05; t < 1; t += 0.18) {
      const p = sample(piece, t),
        arch = new T.Group(),
        mat = new T.MeshStandardMaterial({ color: "#ffcf00", roughness: 0.5 });
      for (const side of [-1, 1]) {
        const post = new T.Mesh(new T.BoxGeometry(0.2, 3.4, 0.25), mat);
        post.position.set(0, 2, side * 1.95);
        arch.add(post);
      }
      const roof = new T.Mesh(new T.BoxGeometry(0.3, 0.25, 4.15), mat);
      roof.position.y = 3.7;
      arch.add(roof);
      arch.position.set(p.x, p.y, p.z);
      arch.rotation.y = -p.heading;
      g.add(arch);
    }
  }
  if(!ghost&&(a.interaction==='boost'||a.interaction==='brake')){
    for(const t of [.24,.4,.56,.72]){const q=sample(piece,t);for(const side of [-1,1]){const arrow=new T.Mesh(new T.BoxGeometry(.8,.035,.16),new T.MeshStandardMaterial({color:a.interaction==='boost'?'#19fff1':'#ffcc00',emissive:a.interaction==='boost'?'#04a7a7':'#a66c00',emissiveIntensity:.4}));arrow.position.set(q.x-Math.sin(q.heading)*side*.3,q.y+.39,q.z+Math.cos(q.heading)*side*.3);arrow.rotation.y=-q.heading+side*.6;g.add(arrow);}}
  }
  if(!ghost&&(a.kind==='ramp'||a.kind==='landing')){for(const t of [.78,.84,.9]){const q=sample(piece,t);for(const side of [-1,1]){const stripe=new T.Mesh(new T.BoxGeometry(.23,.03,.36),new T.MeshStandardMaterial({color:'#302254'}));stripe.position.set(q.x-Math.sin(q.heading)*1.4*side,q.y+.36,q.z+Math.cos(q.heading)*1.4*side);stripe.rotation.y=-q.heading-.5;g.add(stripe);}}}
  if (!ghost) batchPiece(g);
  return g;
}
export function disposeGroup(g) {
  g.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.dispose();
    }
  });
}

function batchPiece(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material,
      key = [
        m.color.getHex(),
        m.roughness,
        m.metalness,
        m.emissive.getHex(),
        m.emissiveIntensity,
        m.side,
      ].join(":");
    if (!buckets.has(key))
      buckets.set(key, { material: m.clone(), positions: [], normals: [] });
    const b = buckets.get(key),
      geometry = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
    geometry.applyMatrix4(o.matrixWorld);
    b.positions.push(...geometry.attributes.position.array);
    b.normals.push(...geometry.attributes.normal.array);
    geometry.dispose();
  });
  disposeGroup(group);
  group.clear();
  for (const b of buckets.values()) {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(b.positions, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(b.normals, 3));
    const m = new T.Mesh(g, b.material);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
}
