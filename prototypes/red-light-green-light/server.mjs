import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { registerRedLight } from './room.mjs';

const MINI_GAMES = '../../public/mini-games';
const root = '/mini-games/games/red-light-green-light/';
const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

export async function start(port = Number(process.env.PORT) || 2567, gameConfig) {
  const app = express();
  const http = createServer(app);
  app.get('/', (_, response) => response.redirect(root));
  app.get('/health', (_, response) => response.json({ ok: true }));
  app.use(root, express.static(fromHere(MINI_GAMES + '/games/red-light-green-light/')));
  app.use('/mini-games/vendor', express.static(fromHere(MINI_GAMES + '/vendor/')));
  app.get(root + 'sdk.js', (_, response) =>
    response.sendFile(fromHere('./node_modules/colyseus.js/dist/colyseus.js')));
  const server = new Server({ transport: new WebSocketTransport({ server: http, maxPayload: 4096 }) });
  registerRedLight(server, gameConfig);
  await server.listen(port);
  return { server, http };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { http } = await start();
  console.log('Red Light, Green Light preview at http://localhost:' + http.address().port);
}
