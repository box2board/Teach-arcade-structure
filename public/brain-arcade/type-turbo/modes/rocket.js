(() => {
  const RocketMode = {
    container: null,
    altitudeFill: null,
    altitudeLabel: null,
    rocket: null,

    init(containerEl) {
      this.container = containerEl;
      this.container.innerHTML = `
        <div class="mode-rocket">
          <div class="rocket-sky"></div>
          <div class="rocket-altitude">
            <span>Altitude</span>
            <div class="meter"><div class="fill" id="rocketAltitudeFill"></div></div>
            <strong id="rocketAltitudeLabel">0 m</strong>
          </div>
          <div class="rocket-craft" id="rocketCraft" aria-hidden="true">
            <div class="flame"></div>
          </div>
        </div>
      `;
      this.altitudeFill = this.container.querySelector('#rocketAltitudeFill');
      this.altitudeLabel = this.container.querySelector('#rocketAltitudeLabel');
      this.rocket = this.container.querySelector('#rocketCraft');
      this.reset();
    },

    reset() {
      if (!this.container) return;
      this.container.classList.remove('mode-mistake', 'mode-correct');
      this.updateAltitude(0, 0);
    },

    handleEvent(eventName, payload = {}) {
      if (!this.container) return;
      if (eventName === 'onCorrect') {
        this.bumpClass('mode-correct', 180);
      }
      if (eventName === 'onMistake' || eventName === 'onTimeout') {
        this.bumpClass('mode-mistake', 220);
      }
      if (eventName === 'onStatsUpdate') {
        this.updateAltitude(payload.correctItems || 0, payload.combo || 0);
      }
      if (eventName === 'onEnd') {
        this.bumpClass('mode-mistake', 260);
      }
    },

    updateAltitude(correctItems, combo) {
      const altitude = Math.min(100, correctItems * 3 + combo * 2);
      if (this.altitudeFill) this.altitudeFill.style.height = `${altitude}%`;
      if (this.altitudeLabel) this.altitudeLabel.textContent = `${Math.round(altitude * 12)} m`;
      if (this.rocket) {
        this.rocket.style.transform = `translate(-50%, ${-altitude}%) scale(${1 + Math.min(combo, 10) * 0.015})`;
      }
    },

    bumpClass(className, duration) {
      this.container.classList.remove(className);
      requestAnimationFrame(() => this.container.classList.add(className));
      setTimeout(() => this.container && this.container.classList.remove(className), duration);
    },

    destroy() {
      if (this.container) this.container.innerHTML = '';
      this.container = null;
    }
  };

  window.TypeTurboModes = window.TypeTurboModes || {};
  window.TypeTurboModes.Rocket = RocketMode;
})();
