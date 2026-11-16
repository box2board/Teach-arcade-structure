import { mountGame } from './game.js';

const root = document.querySelector('#game');
const client = window.Colyseus ? new window.Colyseus.Client(location.origin) : undefined;
mountGame(root, { client });
