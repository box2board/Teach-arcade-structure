const params = new URLSearchParams(location.search);
const attempt = params.get('attempt') || '';
const seed = Number(params.get('seed'));
const mode = params.get('mode');
let parentOrigin = '';

try {
  const candidate = new URL(params.get('parentOrigin') || '');
  if (candidate.origin === candidate.href.replace(/\/$/, '')) parentOrigin = candidate.origin;
} catch {}

export const embedded = mode === 'classroom-arcade'
  && /^[a-zA-Z0-9-]{8,80}$/.test(attempt)
  && Number.isInteger(seed)
  && seed >= 0
  && Boolean(parentOrigin)
  && parent !== window;

export const random = embedded ? seeded(seed) : Math.random;
const inputs = [];
const checkpoint = 'arcade.trace.' + attempt;
let savedAt = 0;

function seeded(value) {
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function saveTrace() {
  if (!embedded || !inputs.length) return;
  try { sessionStorage.setItem(checkpoint, JSON.stringify(inputs)); } catch {}
}

function send(type, extra = {}) {
  if (embedded) parent.postMessage({type, attempt, ...extra}, parentOrigin);
}

export function record(engine) {
  if (!embedded) return engine;
  const originals = {};
  for (const name of ['tick', 'begin', 'release', 'cancel']) {
    if (!engine[name]) continue;
    const original = originals[name] = engine[name];
    engine[name] = (...args) => {
      if ((name !== 'tick' || args[0] > 0) && inputs.length < 26000) inputs.push([name, ...args]);
      const result = original(...args);
      if (name === 'tick' && performance.now() - savedAt > 1600) {
        savedAt = performance.now();
        saveTrace();
      }
      return result;
    };
  }
  const start = engine.start;
  engine.start = (...args) => {
    inputs.length = 0;
    const result = start(...args);
    try {
      const saved = JSON.parse(sessionStorage.getItem(checkpoint));
      if (Array.isArray(saved) && saved.length < 26000) {
        for (const input of saved) {
          const [method, ...methodArgs] = input;
          if (!originals[method]) break;
          inputs.push(input);
          originals[method](...methodArgs);
        }
      }
    } catch {}
    return result;
  };
  addEventListener('pagehide', saveTrace);
  return engine;
}

export function connect(start) {
  if (!embedded) return;
  document.querySelectorAll('a, #pause, #start').forEach(element => { element.hidden = true; });
  let launched = false;
  addEventListener('message', event => {
    if (event.origin !== parentOrigin
      || event.source !== parent
      || event.data?.attempt !== attempt
      || event.data.type !== 'arcade:go'
      || launched) return;
    launched = true;
    start();
  });
  addEventListener('sparks:minigame-complete', () => {
    saveTrace();
    send('arcade:finish', {inputs});
  }, {once: true});
  send('arcade:ready');
}
