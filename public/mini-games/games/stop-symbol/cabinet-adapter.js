import {DURATION} from './engine.js';
import {advanceSymbol,SYMBOL_STEP_MS} from './cabinet-clock.js';

const params = new URLSearchParams(location.search);
const attempt = params.get('attempt');
const origin = location.origin;
const seed = Number(params.get('seed'));
export const embedded = parent !== window && params.get('mode') === 'classroom-arcade'
  && params.get('parentOrigin') === origin && Boolean(attempt)
  && params.has('seed') && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;

const roundMs = (DURATION + 3) * 1000;
const finishAt = roundMs + SYMBOL_STEP_MS;
const checkpoint = 'arcade.trace.' + attempt;
const stops = [];
const save = () => {
  try { sessionStorage.setItem(checkpoint, JSON.stringify(stops)); } catch {}
};

export function recordSymbol(createSymbol, onEvent) {
  if (!embedded) return createSymbol(onEvent);
  let randomState = seed;
  let base = 0;
  let simulated = 0;
  let started = false;
  const engine = createSymbol(onEvent, () => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 4294967296;
  });
  function advance(at) {
    if (at <= simulated) return;
    advanceSymbol(engine, simulated, at);
    simulated = at;
  }
  function sync() {
    if (!started || engine.state.phase === 'finished') return;
    const elapsed = Math.floor((performance.now() - base) / SYMBOL_STEP_MS) * SYMBOL_STEP_MS;
    advance(Math.min(finishAt, elapsed));
  }
  return {
    get state() { return engine.state; },
    start(elapsed) {
      started = true;
      randomState = seed;
      simulated = 0;
      stops.length = 0;
      engine.start();
      try {
        const saved = JSON.parse(sessionStorage.getItem(checkpoint));
        if (Array.isArray(saved) && saved.length <= 32) {
          for (const at of saved) {
            if (!Number.isInteger(at) || at % SYMBOL_STEP_MS || at <= simulated || at >= roundMs) break;
            advance(at);
            if (!engine.stop()) break;
            stops.push(at);
          }
        }
      } catch {}
      base = performance.now() - Math.max(simulated, Math.max(0, Number(elapsed) || 0) * 1000);
    },
    tick: sync,
    stop() {
      sync();
      if (simulated >= roundMs || !engine.stop()) return false;
      stops.push(simulated);
      save();
      return true;
    },
    pause() {},
    resume() {}
  };
}

export function connectSymbol(start) {
  if (!embedded) return;
  document.querySelectorAll('header a, #overlay a, #pause, #start, #download, .footer')
    .forEach(control => { control.style.display = 'none'; });
  let started = false;
  addEventListener('message', event => {
    if (started || event.source !== parent || event.origin !== origin
      || event.data?.type !== 'arcade:go' || event.data.attempt !== attempt) return;
    started = true;
    start(event.data.elapsed);
  });
  addEventListener('sparks:minigame-complete', () => {
    if (started) parent.postMessage({type: 'arcade:finish', attempt, inputs: stops}, origin);
  });
  parent.postMessage({type: 'arcade:ready', attempt}, origin);
}
