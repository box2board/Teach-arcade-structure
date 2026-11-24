// Recovery reads never repeat a movement or a one-time boost. A room snapshot
// can replace a delayed reply once the room has applied that player's packet.
function confirmsInput(state, request) {
  if (request.action === 'state' || state.phase !== 'mini' || state.since !== request.since) return true;
  const arena = state.minigame;
  const actors = arena?.players ?? arena?.boats;
  const player = actors?.find(actor => actor.id === state.player?.miniPlayerId);
  return player?.seq >= request.packet.seq;
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
          if (confirmsInput(reply.state, request)) {
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
