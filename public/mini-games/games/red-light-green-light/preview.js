import { mountGame } from './game.js';

const root = document.querySelector('#game');
const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
const endpoint = localHost ? location.origin : root.dataset.multiplayerServer;
const sdkUrl = new URL('/mini-games/games/red-light-green-light/sdk.js', endpoint);
const sdkRetryDelays = [0, 750, 1500, 2500, 4000];

function loadSdkAttempt(attempt = 0) {
  if (window.Colyseus) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const url = new URL(sdkUrl);
    // A unique URL makes the browser retry after an edge or cold-start failure.
    url.searchParams.set('retry', String(attempt) + '-' + Date.now());
    script.src = url.href;
    script.onload = () => {
      script.remove();
      if (window.Colyseus) resolve();
      else reject(new Error('Multiplayer client did not initialize.'));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Multiplayer client could not load.'));
    };
    document.head.append(script);
  }).catch(error => {
    if (attempt + 1 >= sdkRetryDelays.length) throw error;
    return new Promise(resolve => setTimeout(resolve, sdkRetryDelays[attempt + 1]))
      .then(() => loadSdkAttempt(attempt + 1));
  });
}

loadSdkAttempt().then(() => {
  const client = new window.Colyseus.Client(endpoint);
  mountGame(root, { client });
}).catch(() => {
  const status = root.querySelector('#connection');
  status.hidden = false;
  status.textContent = 'The multiplayer service is unavailable right now. Please try again shortly.';
});
