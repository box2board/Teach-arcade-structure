import {boards} from '../lib/catalog.js';
export const board = boards[0];
export const nodes = board.create();
export const seconds = round => [60,45,30,25][round-1] ?? 20;
export const randomIndex = (random, length) => Math.floor(random()*length);
