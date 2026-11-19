import { mountGame } from './game.js?v=20261119-5';

const root = document.querySelector('#game');
const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
const endpoint = localHost ? location.origin : root.dataset.multiplayerServer;
const sdkUrls = [
  new URL('https://cdn.jsdelivr.net/npm/colyseus.js@0.16.22/dist/colyseus.js'),
  new URL('/mini-games/games/red-light-green-light/sdk.js', endpoint)
];
const clientRetries = [0, 750, 1500, 2500, 4000];

function loadSdkFrom(sdkUrl, retries) {
  function attempt(index = 0) {
    if (window.Colyseus) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const url = new URL(sdkUrl);
      if (index) url.searchParams.set('retry', String(Date.now()));
      script.src = url.href;
      const timeout = setTimeout(() => finish(new Error('Multiplayer client timed out.')), 6000);
      function finish(error) {
        clearTimeout(timeout);
        script.remove();
        if (error) reject(error);
        else resolve();
      }
      script.onload = () => window.Colyseus
        ? finish()
        : finish(new Error('Multiplayer client did not initialize.'));
      script.onerror = () => finish(new Error('Multiplayer client could not load.'));
      document.head.append(script);
    }).catch(error => {
      if (index + 1 >= retries.length) throw error;
      return new Promise(resolve => setTimeout(resolve, retries[index + 1]))
        .then(() => attempt(index + 1));
    });
  }
  return attempt();
}

loadSdkFrom(sdkUrls[0], [0, 750])
  .catch(() => loadSdkFrom(sdkUrls[1], clientRetries))
  .then(() => {
    const client = new window.Colyseus.Client(endpoint);
    const onTeachArcade = ['teacharcade.com', 'www.teacharcade.com'].includes(location.hostname);
    const healthUrl = onTeachArcade
      ? '/mini-games/games/red-light-green-light/service-health'
      : new URL('/health', endpoint).href;
    mountGame(root, { client, healthUrl });
  })
  .catch(() => {
    const status = root.querySelector('#connection');
    status.hidden = false;
    status.textContent = 'The multiplayer service is unavailable right now. Please try again shortly.';
  });
