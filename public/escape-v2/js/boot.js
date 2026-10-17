(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('room') || 'french-revolution';
  const normalized = requested === 'prototype' ? 'french-revolution' : requested;
  const roomId = /^[a-z0-9-]+$/i.test(normalized) ? normalized : 'french-revolution';

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
    await loadScript(`/escape-v2/rooms/${roomId}/data.js`);

    if (roomId === 'french-revolution') {
      const art = await window.ESCAPE_V2_ART.frenchRevolution();
      const cell = window.ESCAPE_V2_DATA.rooms.find((room) => room.id === 'cell');
      if (cell) cell.panorama = art.bastilleCell;
    }

    await loadScript('/escape-v2/js/engine.js');
  }

  boot().catch((error) => {
    console.error('Escape Room V2 failed to start.', error);
    const title = document.getElementById('storyTitle');
    const copy = document.getElementById('storyCopy');
    const start = document.getElementById('startBtn');
    if (title) title.textContent = 'This escape room could not be loaded.';
    if (copy) copy.textContent = 'The room package or panorama asset is unavailable. Refresh the preview and try again.';
    if (start) start.hidden = true;
  });
})();
