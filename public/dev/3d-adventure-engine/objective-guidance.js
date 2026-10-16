// Navigation is derived from progression state, never from displayed objective copy.
export function exteriorTarget(config, progress) {
  if (!progress) return null;
  const exterior = config.exterior || {};
  if (!progress.hasCell) return { point: exterior.energyCell, radius: exterior.interactionRadius?.energyCell ?? 2 };
  if (!progress.terminalPowered) return { point: exterior.terminal, radius: exterior.interactionRadius?.terminal ?? 2.2 };
  if (!progress.gateOpen) return { point: exterior.switch, radius: exterior.interactionRadius?.switch ?? 2 };
  return { point: exterior.missionEntry, radius: 1, entrance: true };
}

export function navigationHint(position, forward, target) {
  if (!target?.point) return '';
  const dx = target.point.x - position.x;
  const dz = target.point.z - position.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= target.radius) return target.entrance ? 'Continue through the entrance' : 'Nearby · Press E or tap ACTION';
  // Positive signed angle means right of the current camera view.
  const angle = Math.atan2(dx * -forward.z + dz * forward.x, dx * forward.x + dz * forward.z);
  const direction = Math.abs(angle) <= Math.PI / 4 ? 'Ahead' : Math.abs(angle) >= Math.PI * 3 / 4 ? 'Behind' : angle > 0 ? 'Right' : 'Left';
  return `${Math.ceil(distance)} m · ${direction}`;
}

export function installObjectiveGuidance(engine, config) {
  const card = document.querySelector('.objective-card');
  if (!card) return;
  const hint = document.createElement('span');
  hint.className = 'objective-navigation';
  hint.setAttribute('aria-live', 'off');
  card.appendChild(hint);
  let elapsed = 1;
  const forward = engine.player.position.clone();
  engine.onUpdate(dt => {
    elapsed += dt;
    if (elapsed < .2) return;
    elapsed = 0;
    const mission = window.TA3DMission || window.TA3DMissionV6;
    const progress = window.TA3DExteriorProgression;
    hint.hidden = Boolean(mission?.started || mission?.finished || progress?.questionActive);
    if (hint.hidden) return;
    engine.camera.getWorldDirection(forward);
    const text = navigationHint(engine.player.position, forward, exteriorTarget(config, progress));
    if (hint.textContent !== text) hint.textContent = text;
  });
}
