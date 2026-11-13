const params = new URLSearchParams(location.search);
const attempt = params.get('attempt');
const origin = location.origin;
const seed = Number(params.get('seed'));
export const embedded = parent !== window && params.get('mode') === 'classroom-arcade'
  && params.get('parentOrigin') === origin && Boolean(attempt)
  && params.has('seed') && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;

const checkpoint = 'arcade.trace.' + attempt;
const actions = [];
const save = () => {
  try { sessionStorage.setItem(checkpoint, JSON.stringify(actions)); } catch {}
};

export function recordMemory(createMemory, onEvent) {
  if (!embedded) return createMemory(onEvent);
  let randomState = seed, simulated = 0, base = 0;
  const game = createMemory(onEvent, () => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 4294967296;
  });
  const active = () => ['preview', 'playing'].includes(game.state.phase);
  const advance = at => {
    if (!active() || at <= simulated) return;
    const delta = (at - simulated) / 1000;
    simulated = at;
    actions.push(['tick', at]);
    game.tick(delta);
  };
  addEventListener('pagehide', save);
  return {
    get state() {
      const state = game.state;
      if (!active()) return state;
      const pending = Math.max(0, (performance.now() - base - simulated) / 1000);
      return state.phase === 'preview' ? {...state, preview: Math.max(0, state.preview - pending)}
        : {...state, left: Math.max(0, state.left - pending)};
    },
    start(elapsed) {
      randomState = seed;
      simulated = 0;
      actions.length = 0;
      base = performance.now() - Math.max(0, Number(elapsed) || 0) * 1000;
      game.start();
      try {
        const saved = JSON.parse(sessionStorage.getItem(checkpoint));
        if (Array.isArray(saved) && saved.length <= 300) {
          for (const input of saved) {
            if (!Array.isArray(input)) break;
            const [method, at, card] = input;
            if (!Number.isInteger(at) || at < simulated || at > 63001) break;
            if (method === 'tick' && input.length === 2) advance(at);
            else if (method === 'select' && input.length === 3 && at === simulated
              && Number.isInteger(card) && card >= 0 && card < 24 && game.select(card)) actions.push(input);
            else break;
          }
        }
      } catch {}
      base = Math.min(base, performance.now() - simulated);
    },
    select(card) {
      const at = Math.min(63001, Math.max(simulated, Math.floor(performance.now() - base)));
      const state = game.state;
      const pending = (at - simulated) / 1000;
      if (state.phase !== 'playing' || state.lock > pending
        || state.matched.includes(card) || state.lock === 0 && state.open.includes(card)) return false;
      advance(at);
      if (!game.select(card)) return false;
      actions.push(['select', at, card]);
      save();
      return true;
    },
    tick() {
      if (!active()) return;
      // Advance between selections only when the round or a card reveal can change state.
      const at = Math.min(63001, Math.max(simulated, Math.floor(performance.now() - base)));
      const remaining = (at - simulated) / 1000;
      const state = game.state;
      if (at === 63001 || state.phase === 'preview' && remaining >= state.preview
        || state.lock > 0 && remaining >= state.lock || remaining >= state.left) advance(at);
    },
    pause() {},
    resume() {}
  };
}

export function connectMemory(start) {
  if (!embedded) return;
  document.querySelectorAll('header a, #pause, #start, #download').forEach(control => { control.hidden = true; });
  let started = false;
  addEventListener('message', event => {
    if (started || event.source !== parent || event.origin !== origin
      || event.data?.type !== 'arcade:go' || event.data.attempt !== attempt) return;
    started = true;
    start(event.data.elapsed);
  });
  addEventListener('sparks:minigame-complete', () => {
    if (started) parent.postMessage({type: 'arcade:finish', attempt, inputs: actions}, origin);
  }, {once: true});
  parent.postMessage({type: 'arcade:ready', attempt}, origin);
}
