// Report missing scripts and startup errors instead of leaving a blank picker.
(() => {
  const status = document.getElementById('startupStatus');
  function reportStartupFailure() {
    if (document.documentElement.dataset.colonyReady === 'true') return;
    status.hidden = false;
    status.textContent = 'The game could not load. Reopen the complete playable web preview in Safari or Chrome.';
  }
  window.addEventListener('error', reportStartupFailure, true);
  window.addEventListener('unhandledrejection', reportStartupFailure);
})();
