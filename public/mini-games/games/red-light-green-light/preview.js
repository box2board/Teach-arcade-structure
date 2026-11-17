import { mountGame } from './game.js';

const root = document.querySelector('#game');
const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
const endpoint = localHost ? location.origin : root.dataset.multiplayerServer;
const sdkUrl = new URL('/mini-games/games/red-light-green-light/sdk.js', endpoint);

function loadSdk() {
  if (window.Colyseus) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl.href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Multiplayer client could not load.'));
    document.head.append(script);
  });
}

loadSdk().then(() => {
  const client = window.Colyseus ? new window.Colyseus.Client(endpoint) : undefined;
  mountGame(root, { client });
}).catch(() => {
  const status = root.querySelector('#connection');
  status.hidden = false;
  status.textContent = 'The multiplayer service is unavailable right now. Please try again shortly.';
});
