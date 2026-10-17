(() => {
  'use strict';

  if (!window.pannellum?.viewer) {
    console.error('Escape Room V2 cubemap adapter: Pannellum is unavailable.');
    return;
  }

  const originalViewer = window.pannellum.viewer.bind(window.pannellum);

  function hardenCubemapHotspots(hotSpots = []) {
    return hotSpots.map((hotSpot) => {
      const activate = hotSpot.clickHandlerFunc;
      const activateArgs = hotSpot.clickHandlerArgs;
      const originalTooltip = hotSpot.createTooltipFunc;
      const originalTooltipArgs = hotSpot.createTooltipArgs;
      const label = originalTooltipArgs?.title || hotSpot.text || 'Clue';

      const hardened = {
        ...hotSpot,
        // We attach activation directly to the rendered hotspot below. This is
        // more reliable on iPad / touch browsers than relying on Pannellum's
        // mouse-oriented click bridge while a draggable cubemap is active.
        clickHandlerFunc: undefined,
        createTooltipFunc(div, args) {
          if (typeof originalTooltip === 'function') {
            originalTooltip(div, args);
          }

          div.dataset.clueLabel = label;
          div.classList.add('ta-touch-ready');
          div.style.pointerEvents = 'auto';

          const activateClue = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (typeof activate === 'function') {
              activate(event, activateArgs);
            } else if (typeof args?.open === 'function') {
              args.open();
            }
          };

          div.addEventListener('click', activateClue);
        },
        createTooltipArgs: originalTooltipArgs
      };

      return hardened;
    });
  }

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

      config.hotSpots = hardenCubemapHotspots(config.hotSpots);

      // Cubemap faces do not have equirectangular poles, so students can look
      // naturally up and down without the funnel / whirlpool distortion.
      config.hfov = 90;
      config.minHfov = 82;
      config.maxHfov = 98;
      config.minPitch = -72;
      config.maxPitch = 72;
      config.mouseZoom = false;
      config.keyboardZoom = false;
      config.doubleClickZoom = false;
    }

    const viewer = originalViewer(container, config);

    if (Array.isArray(config.cubeMap) && typeof viewer?.on === 'function') {
      viewer.on('load', () => {
        const panorama = typeof container === 'string'
          ? document.getElementById(container)
          : container;
        panorama?.classList.add('ta-scene-ready');
      });
    }

    return viewer;
  };
})();
