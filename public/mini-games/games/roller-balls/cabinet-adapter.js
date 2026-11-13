const params = new URLSearchParams(location.search);
const attempt = params.get('attempt');
const origin = location.origin;
const seed = Number(params.get('seed'));
export const embedded = parent !== window && params.get('mode') === 'classroom-arcade'
  && params.get('parentOrigin') === origin && Boolean(attempt)
  && params.has('seed') && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;

let randomState = seed;
const random = embedded ? () => {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 4294967296;
} : Math.random;
const checkpoint = 'arcade.trace.' + attempt;
const inputs = [];
const maxInputs = 26000;
const save = () => {
  try { sessionStorage.setItem(checkpoint, JSON.stringify(inputs)); } catch {}
};

export function recordRoller(createRoller, onEvent) {
  if (!embedded) return createRoller(onEvent);
  const engine = createRoller(onEvent, random);
  let lastX = 0, lastZ = 0, savedAt = 0;
  function apply(input, restoring = false) {
    if (!Array.isArray(input) || inputs.length >= maxInputs) return false;
    const [method, a, b] = input;
    if (method === 'tick' && input.length === 2 && Number.isFinite(a) && a > 0 && a <= .075) engine.tick(a);
    else if (method === 'input' && input.length === 3 && Number.isFinite(a) && Number.isFinite(b)
      && Math.abs(a) <= 2 && Math.abs(b) <= 2) { engine.setInput(a, b); lastX = a; lastZ = b; }
    else if (method === 'dash' && input.length === 1) engine.dash();
    else return false;
    inputs.push(input);
    if (!restoring && performance.now() - savedAt >= 1500) { savedAt = performance.now(); save(); }
    return true;
  }
  addEventListener('pagehide', save);
  return {
    get state() { return engine.state; },
    start() {
      inputs.length = 0; randomState = seed; lastX = 0; lastZ = 0; engine.start();
      try {
        const saved = JSON.parse(sessionStorage.getItem(checkpoint));
        if (Array.isArray(saved) && saved.length <= maxInputs) {
          for (const input of saved) if (!apply(input, true) || engine.state.phase === 'finished') break;
        }
      } catch {}
    },
    setInput(x, z) {
      if (!Number.isFinite(x) || !Number.isFinite(z)) return;
      if (Math.abs(x - lastX) > .015 || Math.abs(z - lastZ) > .015) apply(['input', x, z]);
    },
    dash() { apply(['dash']); save(); },
    tick(dt) { apply(['tick', dt]); },
    pause() {},
    resume() {}
  };
}

export function connectRoller(start) {
  if (!embedded) return;
  document.querySelectorAll('header a, #pause, #start, #download').forEach(control => { control.hidden = true; });
  let started = false;
  addEventListener('message', event => {
    if (started || event.source !== parent || event.origin !== origin
      || event.data?.type !== 'arcade:go' || event.data.attempt !== attempt) return;
    started = true;
    start();
  });
  addEventListener('sparks:minigame-complete', () => {
    if (!started) return;
    save();
    parent.postMessage({type: 'arcade:finish', attempt, inputs}, origin);
  }, {once: true});
  parent.postMessage({type: 'arcade:ready', attempt}, origin);
}
