import { buildScene } from './viewer-3d.js';

window.ESCAPE_V2_VIEWER = {
  create(container, room, callbacks, solvedIds) {
    return buildScene(container, room, callbacks, solvedIds);
  }
};

const params = new URLSearchParams(window.location.search);
const requested = params.get('room') || 'french-revolution';
const roomId = /^[a-z0-9-]+$/i.test(requested) ? requested : 'french-revolution';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load room package: ${src}`));
    document.body.appendChild(script);
  });
}

async function boot() {
  await loadScript(`/escape-v2/rooms/${roomId}/data.js`);
  await loadScript('/escape-v2/js/puzzles.js');
  const puzzleModules = window.ESCAPE_V2_DATA.puzzleModules || [];
  if (!Array.isArray(puzzleModules) || puzzleModules.some((path) => typeof path !== 'string' || !path.startsWith('/escape-v2/'))) {
    throw new Error('Room pack puzzleModules must be an array of /escape-v2/ module paths.');
  }
  for (const path of puzzleModules) await loadScript(path);
  if (!window.ESCAPE_V2_DATA || !Array.isArray(window.ESCAPE_V2_DATA.rooms)) {
    throw new Error('Room pack has no valid room data.');
  }
  await loadScript('/escape-v2/js/engine.js');
}

boot().catch((error) => {
  console.error('Escape Room V2 failed to start.', error);
  const title = document.getElementById('storyTitle');
  const copy = document.getElementById('storyCopy');
  const start = document.getElementById('startBtn');
  if (title) title.textContent = 'This escape room could not be loaded.';
  if (copy) copy.textContent = 'The room package or 3D renderer is unavailable. Refresh the preview and try again.';
  if (start) start.hidden = true;
});
