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
