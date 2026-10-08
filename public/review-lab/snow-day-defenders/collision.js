// Earliest contact along a moving projectile's full path, including height.
// Returns null on a miss, otherwise a fraction from 0 to 1 along the segment.
export function segmentSphereHit(start, end, center, radius) {
  const dx=end.x-start.x, dy=end.y-start.y, dz=end.z-start.z;
  const ox=start.x-center.x, oy=start.y-center.y, oz=start.z-center.z;
  const c=ox*ox+oy*oy+oz*oz-radius*radius;
  if(c<=0)return 0;
  const a=dx*dx+dy*dy+dz*dz;
  if(a===0)return null;
  const b=ox*dx+oy*dy+oz*dz, discriminant=b*b-a*c;
  if(discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/a;
  return t>=0&&t<=1?t:null;
}
