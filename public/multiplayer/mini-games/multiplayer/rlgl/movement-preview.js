import { advanceMovement, FIELD } from './rules.js';

// This pose is visual only. It never enters scoring or server input packets.
export function createMovementPreview() {
  let pose, roundId, phaseId, lastFrame = 0;
  return {
    sample(player, state, input, now, stateAge) {
      const snap = !pose || roundId !== state.roundId || phaseId !== state.phaseId ||
        !['green', 'red'].includes(state.phase) || player.status !== 'racing' || !player.connected || stateAge > 250;
      const dt = Math.max(0, Math.min(.05, (now - lastFrame) / 1000));
      lastFrame = now;
      roundId = state.roundId;
      phaseId = state.phaseId;
      if (snap) pose = { ...player };
      else {
        advanceMovement(pose, input, dt);
        const dx = pose.x - player.x, dz = pose.z - player.z;
        const distance = Math.hypot(dx, dz);
        const limit = FIELD.speed * .15;
        if (distance > limit) {
          pose.x = player.x + dx / distance * limit;
          pose.z = player.z + dz / distance * limit;
        }
        const correction = 1 - Math.exp(-dt * 5);
        pose.x += (player.x - pose.x) * correction;
        pose.z += (player.z - pose.z) * correction;
      }
      return { ...player, x: pose.x, z: pose.z, facing: pose.facing, motion: pose.motion };
    },
    reset() { pose = undefined; lastFrame = 0; }
  };
}
