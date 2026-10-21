// Report missing scripts and startup errors instead of leaving a blank picker.
(() => {
  const status = document.getElementById('startupStatus');
  function reportStartupFailure() {
    if (document.documentElement.dataset.colonyReady === 'true') return;
    status.hidden = false;
    status.textContent = 'The game could not load. Refresh this page in Safari or Chrome to try again.';
  }
  window.addEventListener('error', reportStartupFailure, true);
  window.addEventListener('unhandledrejection', reportStartupFailure);
})();
