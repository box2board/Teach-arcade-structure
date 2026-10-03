import * as THREE from '../../assets/vendor/three-0.162.0/three.module.js';

// Keep logical dimensions unchanged: rounding is visual, not a save-format change.
export function roundedBlockGeometry(size) {
  const half = size.map((n, i) => (n - (i === 1 ? .025 : .035)) / 2);
  const radius = Math.min(.09, half[1] * .42);
  const core = half.map(n => n - radius);
  const result = new THREE.BoxGeometry(...half.map(n => n * 2), 6, 6, 6);
  const positions = result.attributes.position;
  const point = new THREE.Vector3(), nearest = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    nearest.set(...point.toArray().map((n, axis) => THREE.MathUtils.clamp(n, -core[axis], core[axis])));
    point.sub(nearest).normalize().multiplyScalar(radius).add(nearest);
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  result.computeVertexNormals();
  return result;
}

// One quiet rounded-rectangle connection outline, never a field of raised pegs.
export function connectionOutline(size) {
  const x = size[0] / 2 - .22, z = size[2] / 2 - .22;
  const radius = Math.min(.16, x, z), points = [];
  for (const [cx, cz, start] of [[x-radius,z-radius,0],[-x+radius,z-radius,90],[-x+radius,-z+radius,180],[x-radius,-z+radius,270]]) {
    for (let i = 0; i <= 8; i++) {
      const angle = (start + i * 90 / 8) * Math.PI / 180;
      points.push(new THREE.Vector3(cx + radius * Math.cos(angle), size[1]/2-.011, cz + radius * Math.sin(angle)));
    }
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function partGeometry(part) {
  const [w,h,d]=part.size;
  if(part.shape==='box') return roundedBlockGeometry(part.size);
  if(part.shape==='cylinder') return new THREE.CylinderGeometry(w/2-.018,w/2-.018,h-.025,32);
  const shape=new THREE.Shape();
  const span=part.shape==='roof'?w:d;
  shape.moveTo(-span/2+.018,-h/2+.0125);
  shape.lineTo(span/2-.018,-h/2+.0125);
  shape.lineTo(part.shape==='roof'?0:span/2-.018,h/2-.0125);
  shape.closePath();
  const depth=part.shape==='roof'?d:w;
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:depth-.035,bevelEnabled:false,steps:1});
  geometry.translate(0,0,-(depth-.035)/2);
  if(part.shape==='slope') geometry.rotateY(Math.PI/2);
  return geometry;
}

function roundedPath(path, half, r) {
  path.moveTo(-half+r,-half);
  path.lineTo(half-r,-half);path.quadraticCurveTo(half,-half,half,-half+r);
  path.lineTo(half,half-r);path.quadraticCurveTo(half,half,half-r,half);
  path.lineTo(-half+r,half);path.quadraticCurveTo(-half,half,-half,half-r);
  path.lineTo(-half,-half+r);path.quadraticCurveTo(-half,-half,-half+r,-half);
  path.closePath();
}
export function connectorGeometry() {
  const shape=new THREE.Shape(),hole=new THREE.Path();
  roundedPath(shape,.25,.085);roundedPath(hole,.135,.045);shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:4});
  geometry.rotateX(-Math.PI/2);
  return geometry;
}
