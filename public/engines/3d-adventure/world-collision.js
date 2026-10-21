import { Box3 } from "../../assets/vendor/three-0.162.0/three.module.js";

// Conservative horizontal footprints, including every ancestor transform.
// This retains the engine's ground-plane movement model; it is not platform physics.
export function createWorldCollider(object) {
  const box = new Box3();
  return {
    bounds() {
      object.updateWorldMatrix(true, false);
      return box.setFromObject(object);
    },
  };
}
