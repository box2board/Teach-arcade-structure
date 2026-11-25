// Recovery reads never repeat a movement or a one-time boost. A room snapshot
// can replace a delayed reply once the room has applied that player's packet.
function canResume(state, request) {
  if (request.action === 'state' || state.phase !== 'mini' || state.since !== request.since) return true;
  const arena = state.minigame;
  const actors = arena?.players ?? arena?.boats;
  const player = actors?.find(actor => actor.id === state.player?.miniPlayerId);
  if (!player) return false;
  if (player.seq >= request.packet.seq) return true;
  // In these games a new steering sample supersedes an older direction.
  // Both engines reject out-of-order sequences. Boosts and RLGL presses
  // have one-time effects, so wait for their sequence acknowledgment.
  return (state.game === 'spotlight-sneak' || state.game === 'bumper-boats') && !request.packet.boost;
}

export async function readDuringSlowPoll(call, request, {delay = 650, onSnapshot} = {}) {
  const controller = new AbortController();
  const {signal} = controller;
  let timer;
  const original = call(request, signal);
  const recovery = new Promise(resolve => {
    async function read() {
      try {
        const reply = await call({action:'state'}, signal);
        if (signal.aborted) return;
        if (reply.status === 200 && reply.state) {
          if (canResume(reply.state, request)) {
            resolve(reply);
            return;
          }
          onSnapshot?.(reply.state);
        }
      } catch {
        // The primary request still owns error reporting and backoff.
      }
      if (!signal.aborted) timer = setTimeout(read, delay);
    }
    timer = setTimeout(read, delay);
  });
  try {
    return await Promise.race([original, recovery]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
