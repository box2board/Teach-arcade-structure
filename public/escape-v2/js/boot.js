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

  function tuneFrenchRevolutionViewer() {
    if (window.__TA_FRENCH_REVOLUTION_VIEW_TUNED__) return;
    if (!window.pannellum || typeof window.pannellum.viewer !== 'function') return;

    const originalViewer = window.pannellum.viewer;
    window.pannellum.viewer = function tunedViewer(container, config = {}) {
      const panoramaEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;
      const width = panoramaEl?.clientWidth || window.innerWidth || 1024;
      const height = panoramaEl?.clientHeight || window.innerHeight || 768;
      const aspect = width / Math.max(1, height);

      // Pannellum's old 110° view becomes extremely fisheye-like in the
      // nearly-square mobile viewer. Use a more natural perspective while
      // keeping a little more breadth on wide laptop / desktop screens.
      const responsiveHfov = aspect < 1.18 ? 80 : aspect < 1.55 ? 88 : 94;
      const requestedHfov = Number.isFinite(config.hfov) ? config.hfov : responsiveHfov;
      const hfov = Math.min(requestedHfov, responsiveHfov);

      const tunedConfig = {
        ...config,
        hfov,
        minHfov: Math.min(Number.isFinite(config.minHfov) ? config.minHfov : hfov - 8, hfov),
        maxHfov: Math.max(hfov, Math.min(Number.isFinite(config.maxHfov) ? config.maxHfov : hfov + 8, hfov + 10)),
        // Keep players away from the equirectangular poles, where a 360 image
        // naturally pinches into the funnel distortion seen on phones.
        minPitch: -64,
        maxPitch: 68
      };

      return originalViewer.call(window.pannellum, container, tunedConfig);
    };

    window.__TA_FRENCH_REVOLUTION_VIEW_TUNED__ = true;
  }

  async function boot() {
    await loadScript(`/escape-v2/rooms/${roomId}/data.js`);

    if (roomId === 'french-revolution') {
      const art = await window.ESCAPE_V2_ART.frenchRevolution();
      const cell = window.ESCAPE_V2_DATA.rooms.find((room) => room.id === 'cell');
      if (cell) cell.panorama = art.bastilleCell;
      tuneFrenchRevolutionViewer();
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