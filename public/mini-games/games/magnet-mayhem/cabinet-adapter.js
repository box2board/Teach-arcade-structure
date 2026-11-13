const params = new URLSearchParams(location.search);
const attempt = params.get('attempt');
const origin = location.origin;
const seed = Number(params.get('seed'));
export const embedded = parent !== window && params.get('mode') === 'classroom-arcade'
  && Boolean(attempt) && params.get('parentOrigin') === origin
  && params.has('seed') && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;

let randomState = seed;
export const attemptRandom = embedded ? () => {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 4294967296;
} : Math.random;

const checkpoint = 'arcade.trace.' + attempt;
const trace = [];
const maxInputs = 26000;
function save() {
  try { sessionStorage.setItem(checkpoint, JSON.stringify(trace)); } catch {}
}

export function recordMagnet(engine) {
  if (!embedded) return engine;
  let held, savedAt = 0;
  function apply(input) {
    if (!Array.isArray(input) || engine.s?.phase !== 'playing') return false;
    const [method, x, y] = input;
    if (method === 'aim' && input.length === 3 && Number.isFinite(x) && Number.isFinite(y)) engine.aim(x, y);
    else if (method === 'hold' && input.length === 2 && typeof x === 'boolean') {
      engine.hold(x);
      held = x;
    } else if (method === 'tick' && input.length === 2 && Number.isFinite(x) && x > 0 && x <= .075) engine.tick(x);
    else return false;
    if (method === 'aim' && trace.at(-1)?.[0] === 'aim') trace[trace.length - 1] = input;
    else trace.push(input);
    return true;
  }
  addEventListener('pagehide', save);
  return {
    get s() { return engine.s; },
    start() {
      trace.length = 0;
      held = undefined;
      randomState = seed;
      engine.start();
      try {
        const saved = JSON.parse(sessionStorage.getItem(checkpoint));
        if (Array.isArray(saved) && saved.length <= maxInputs) {
          for (const input of saved) if (!apply(input)) break;
        }
      } catch {}
    },
    aim(x, y) {
      if (trace.length < maxInputs) apply(['aim', x, y]);
    },
    hold(value) {
      if (held !== value && trace.length < maxInputs) apply(['hold', value]);
    },
    tick(dt) {
      if (trace.length < maxInputs && apply(['tick', dt]) && performance.now() - savedAt >= 1500) {
        savedAt = performance.now();
        save();
      }
    },
    pause: engine.pause,
    resume: engine.resume
  };
}

export function connectMagnet(root, start) {
  if (!embedded) return;
  root.querySelectorAll('a, #pause, #start').forEach(control => { control.style.display = 'none'; });
  root.querySelector('#score').previousElementSibling.textContent = 'POINTS';
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
    parent.postMessage({type: 'arcade:finish', attempt, inputs: trace}, origin);
  }, {once: true});
  parent.postMessage({type: 'arcade:ready', attempt}, origin);
}
