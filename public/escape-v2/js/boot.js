(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('room') || 'prototype';
  const roomId = /^[a-z0-9-]+$/i.test(requested) ? requested : 'prototype';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = false;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function boot() {
    try {
      await loadScript(`/escape-v2/rooms/${roomId}/data.js`);
    } catch (error) {
      if (roomId !== 'prototype') {
        console.warn(`Escape Room V2 room pack “${roomId}” could not be loaded. Falling back to prototype.`);
        await loadScript('/escape-v2/rooms/prototype/data.js');
      } else {
        throw error;
      }
    }

    await loadScript('/escape-v2/js/engine.js');
  }

  boot().catch((error) => {
    console.error('Escape Room V2 failed to start.', error);
    const title = document.getElementById('storyTitle');
    const copy = document.getElementById('storyCopy');
    const start = document.getElementById('startBtn');
    if (title) title.textContent = 'This escape room could not be loaded.';
    if (copy) copy.textContent = 'The room package is unavailable. Return to the Escape Rooms page and try again.';
    if (start) start.hidden = true;
  });
})();
