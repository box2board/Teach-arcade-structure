import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Client } from 'colyseus.js';
import { ROOM_TYPE } from './room.mjs';
import { start } from './server.mjs';

const count = Number(process.env.RLGL_TEST_CLIENTS ?? 2);
assert(Number.isInteger(count) && count >= 2 && count <= 40, 'Use 2 to 40 test clients.');
const local = process.env.RLGL_TEST_ENDPOINT ? null : await start(0);
const endpoint = process.env.RLGL_TEST_ENDPOINT ?? 'ws://127.0.0.1:' + local.http.address().port;
const clients = [];
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function until(test, reason, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (test()) return;
    await wait(35);
  }
  throw Error('Timed out: ' + reason);
}
const watchdog = setTimeout(() => { console.error('Network test exceeded its time budget.'); process.exit(1); }, 60000);
const seqs = new Map();
let inputs;

function send(room, z) {
  const seq = (seqs.get(room.sessionId) ?? 0) + 1;
  seqs.set(room.sessionId, seq);
  room.send('input', { x: 0, z, phaseId: room.state.phaseId, roundId: room.state.roundId,
    sample: room.state.now, seq });
}
const position = (room, id) => room.state?.players?.get(id);

try {
  const a = await new Client(endpoint).create(ROOM_TYPE, {
    name: 'Host', hostKey: randomBytes(16).toString('hex'), characterId: 'reef'
  });
  clients.push(a);
  const joins = await Promise.allSettled(Array.from({ length: count - 1 }, (_, index) =>
    new Client(endpoint).joinById(a.roomId, { name: 'Runner ' + (index + 2), characterId: 'reef' })));
  for (const result of joins) if (result.status === 'fulfilled') clients.push(result.value);
  assert.equal(clients.length, count, joins.find(result => result.status === 'rejected')?.reason?.message);
  const b = clients[1];
  await until(() => clients.every(room => room.state?.players?.size === count), 'joint roster');
  assert.equal(a.state.hostId, a.sessionId);
  assert(clients.every(room => room.roomId === a.roomId));
  for (const player of a.state.players.values()) assert.equal(player.characterId, 'reef');
  assert.equal(new Set(Array.from(a.state.players.values(), p => p.color)).size, count);
  b.send('start', {});
  await wait(250);
  assert.equal(a.state.phase, 'lobby');
  a.send('start', { greenMin: 2300, greenMax: 2300, redMin: 2400, redMax: 2400 });
  await until(() => clients.every(room => room.state.phase === 'countdown'), 'host starts countdown');
  let late;
  if (count < 40) {
    late = await new Client(endpoint).joinById(a.roomId, { name: 'Late' });
    clients.push(late);
    await until(() => position(a, late.sessionId)?.status === 'waiting', 'late entry spectates');
  }
  const racers = () => clients.slice(0, count);
  let holdRed = false;
  inputs = setInterval(() => {
    for (const room of racers()) {
      if (room.state.phase === 'green') send(room, 1);
      if (room.state.phase === 'red') send(room, holdRed ? 1 : 0);
    }
  }, 55);
  await until(() => racers().every(room => room.state.phase === 'green'), 'shared green light');
  await until(() => racers().every(room => position(room, a.sessionId)?.z > 1 &&
    position(room, b.sessionId)?.z > 1), 'movement visible to peers');
  await until(() => racers().every(room => room.state.phase === 'red'), 'shared first red');
  await wait(850);
  assert(racers().every(room => position(a, room.sessionId)?.status === 'racing'));
  const id = b.sessionId, token = b.reconnectionToken;
  clearInterval(inputs);
  b.connection.close();
  await until(() => position(a, id)?.connected === false, 'presence on disconnect');
  const returned = await new Client(endpoint).reconnect(token);
  clients[1] = returned;
  assert.equal(returned.sessionId, id);
  await until(() => position(a, id)?.connected === true, 'same seat reconnects');
  await until(() => racers().every(room => room.state.phase === 'green'), 'shared second green');
  holdRed = true;
  inputs = setInterval(() => {
    for (const room of racers()) if (room.state.phase === 'red') send(room, 1);
  }, 55);
  await until(() => clients.every(room => room.state.phase === 'results'), 'shared results');
  assert.equal(a.state.reason, 'no-winner');
  assert(racers().every(room => position(a, room.sessionId)?.status === 'out'));
  if (late) {
    a.send('start', {});
    await until(() => position(a, late.sessionId)?.status === 'racing', 'late join participates in rematch');
  }
  console.log('PASS · ' + count + ' WebSocket racers. This harness does not render a browser.');
} finally {
  clearTimeout(watchdog);
  clearInterval(inputs);
  await Promise.allSettled(clients.map(room => room.leave()));
  if (local) await local.server.gracefullyShutdown(false);
}
