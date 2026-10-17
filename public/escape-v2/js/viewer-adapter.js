(() => {
  'use strict';

  if (!window.pannellum?.viewer) {
    console.error('Escape Room V2 cubemap adapter: Pannellum is unavailable.');
    return;
  }

  const originalViewer = window.pannellum.viewer.bind(window.pannellum);

  // Escape Room V2 historically passed a single equirectangular URL through the
  // `panorama` field. Room packs may now pass a six-face array instead. Keeping
  // this translation in one adapter lets the shared game engine remain agnostic
  // about the rendering implementation while V2 migrates to true cubemaps.
  window.pannellum.viewer = (container, incomingConfig = {}) => {
    const config = { ...incomingConfig };

    if (Array.isArray(config.panorama) && config.panorama.length === 6) {
      config.type = 'cubemap';
      config.cubeMap = config.panorama;
      delete config.panorama;

      // Cubemap faces do not have equirectangular poles, so students can look
      // naturally up and down without the funnel / whirlpool distortion. We still
      // avoid extreme vertical angles because important clue content lives on the
      // walls rather than directly overhead / underfoot.
      config.hfov = 90;
      config.minHfov = 82;
      config.maxHfov = 98;
      config.minPitch = -72;
      config.maxPitch = 72;
      config.mouseZoom = false;
      config.keyboardZoom = false;
      config.doubleClickZoom = false;
    }

    return originalViewer(container, config);
  };
})();
