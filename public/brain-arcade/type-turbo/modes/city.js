(() => {
  const CityMode = {
    container: null,
    skyline: null,
    buildings: [],

    init(containerEl) {
      this.container = containerEl;
      this.container.innerHTML = `
        <div class="mode-city">
          <div class="city-sky"></div>
          <div class="city-ground"></div>
          <div class="city-skyline" id="citySkyline" aria-hidden="true"></div>
        </div>
      `;
      this.skyline = this.container.querySelector('#citySkyline');
      this.buildings = [];
    },

    reset() {
      if (!this.skyline) return;
      this.skyline.innerHTML = '';
      this.buildings = [];
    },

    handleEvent(eventName, payload = {}) {
      if (!this.container) return;
      if (eventName === 'onCorrect') {
        this.addOrGrowBuilding(payload.combo || 0);
      }
      if (eventName === 'onMistake' || eventName === 'onTimeout') {
        this.crackNewest();
      }
      if (eventName === 'onEnd') {
        this.container.classList.add('mode-rest');
      }
      if (eventName === 'onStart') {
        this.container.classList.remove('mode-rest');
      }
    },

    addOrGrowBuilding(combo) {
      if (!this.skyline) return;
      const needsNew = this.buildings.length === 0 || this.buildings[this.buildings.length - 1].offsetHeight > 170;
      let building = this.buildings[this.buildings.length - 1];

      if (needsNew) {
        building = document.createElement('div');
        building.className = 'city-building';
        building.style.height = `${35 + Math.floor(Math.random() * 25)}px`;
        building.style.width = `${30 + Math.floor(Math.random() * 24)}px`;
        this.skyline.appendChild(building);
        this.buildings.push(building);
      } else {
        const nextHeight = Math.min(220, building.offsetHeight + 16);
        building.style.height = `${nextHeight}px`;
      }

      if (combo >= 4) building.classList.add('combo-glow');
      if (combo >= 8) building.classList.add('combo-neon');
    },

    crackNewest() {
      const latest = this.buildings[this.buildings.length - 1];
      if (!latest) return;
      latest.classList.add('cracked');
      setTimeout(() => latest.classList.remove('cracked'), 280);
    },

    destroy() {
      if (this.container) this.container.innerHTML = '';
      this.container = null;
      this.skyline = null;
      this.buildings = [];
    }
  };

  window.TypeTurboModes = window.TypeTurboModes || {};
  window.TypeTurboModes.City = CityMode;
})();
