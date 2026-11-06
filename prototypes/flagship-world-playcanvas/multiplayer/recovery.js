export const STALE_MS = 500;
export function canSendInput(pendingCount, lastStateAt, now) {
  return lastStateAt > 0 && now - lastStateAt <= STALE_MS && pendingCount < 12;
}
// Do not animate through a backlog of snapshots delivered together after a gap.
export function receiveSnapshot(remote, sample, now) {
  const gap = remote.lastReceived === undefined ? 0 : now - remote.lastReceived;
  if (gap > STALE_MS) { remote.samples.length = 0; remote.recoverUntil = now + 180; }
  const last = remote.samples.at(-1);
  const next = { ...sample, time: now };
  if (last && now - last.time < 8) remote.samples[remote.samples.length - 1] = next;
  else remote.samples.push(next);
  if (remote.samples.length > 10) remote.samples.shift();
  remote.lastReceived = now;
  return gap > STALE_MS;
}
export function sampleRemote(remote, now) {
  const samples = remote.samples;
  if (!samples.length) return null;
  const t = now - 100;
  while (samples.length > 2 && samples[1].time <= t) samples.shift();
  const a = samples[0], b = samples[1] || a;
  const alpha = b.time === a.time ? 1 : Math.max(0, Math.min(1, (t - a.time) / (b.time - a.time)));
  const lerp = (x, y) => x + (y - x) * alpha;
  const rotationDelta = ((b.rotation - a.rotation + 540) % 360) - 180;
  return { x: lerp(a.x,b.x), y: lerp(a.y,b.y), z: lerp(a.z,b.z), rotation: a.rotation+rotationDelta*alpha };
}
export function recoveryBlend(dt) { return 1-Math.exp(-Math.max(0,Math.min(dt,.05))*20); }
