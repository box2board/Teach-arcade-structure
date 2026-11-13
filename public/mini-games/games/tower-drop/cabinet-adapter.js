const params = new URLSearchParams(location.search);
const attempt = params.get('attempt');
export const embedded = parent !== window && params.get('mode') === 'classroom-arcade'
  && Boolean(attempt) && params.get('parentOrigin') === location.origin;
const checkpoint = 'arcade.trace.' + attempt;
const inputs = [];
const active = engine => ['playing', 'final'].includes(engine.s.phase);

export function recordTower(engine) {
  if (!embedded) return engine;
  let savedAt = 0;
  const save = () => {
    try { sessionStorage.setItem(checkpoint, JSON.stringify(inputs)); } catch {}
  };
  addEventListener('pagehide', save);
  return {
    ...engine,
    start() {
      engine.start();
      try {
        const saved = JSON.parse(sessionStorage.getItem(checkpoint));
        if (!Array.isArray(saved)) return;
        for (const input of saved.slice(0, 26000)) {
          if (!active(engine) || !Array.isArray(input)) break;
          const [method, duration] = input;
          if (method === 'tick' && input.length === 2 && Number.isFinite(duration) && duration > 0 && duration <= 1) engine.tick(duration);
          else if (method === 'drop' && input.length === 1) engine.drop();
          else break;
          inputs.push(input);
        }
      } catch {}
    },
    tick(duration) {
      while (duration > 0 && active(engine)) {
        const step = Math.min(duration, 1);
        inputs.push(['tick', step]);
        engine.tick(step);
        duration -= step;
      }
      if (performance.now() - savedAt > 1500) {
        savedAt = performance.now();
        save();
      }
    },
    drop() {
      if (!active(engine)) return false;
      inputs.push(['drop']);
      const result = engine.drop();
      save();
      return result;
    }
  };
}

export function connectTower(start) {
  if (!embedded) return;
  document.querySelectorAll('header a, #pause, #start').forEach(control => { control.hidden = true; });
  let started = false;
  addEventListener('message', event => {
    if (started || event.source !== parent || event.origin !== location.origin
      || event.data?.type !== 'arcade:go' || event.data.attempt !== attempt) return;
    started = true;
    start();
  });
  addEventListener('sparks:minigame-complete', () => {
    if (started) parent.postMessage({type: 'arcade:finish', attempt, inputs}, location.origin);
  }, {once: true});
  parent.postMessage({type: 'arcade:ready', attempt}, location.origin);
}
