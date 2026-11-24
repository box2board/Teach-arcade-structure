import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {lobby} from '../server/lobby.js';
import {api} from '../server/room.js';
import {questionIndex} from '../game/mayhem/rules.js';
import {characters} from '../game/lib/characters.js';
import * as bumperBoats from '../game/mini-games/multiplayer/bumper-boats/engine.js';

// Place in tests/ in the multiplayer repository and run with Node 24.
const sql = new DatabaseSync(':memory:');
for (const name of ['0000_mayhem', '0001_lobby_codes']) {
  sql.exec(readFileSync(new URL('../drizzle/' + name + '.sql', import.meta.url), 'utf8'));
}
const db = {
  prepare(query) {
    const statement = sql.prepare(query);
    return {
      bind(...args) {
        return {
          first: async () => statement.get(...args),
          run: async () => ({meta: statement.run(...args)})
        };
      }
    };
  }
};
const originalNow = Date.now;
let now = 1800000000000;
Date.now = () => now;

async function request(handler, input, expectedStatus = 200) {
  const response = await handler(new Request('https://test.invalid/api', {
    method: 'POST', body: JSON.stringify(input)
  }), db);
  const result = await response.json();
  assert.equal(response.status, expectedStatus, result.error);
  return result;
}

try {
  const created = await request(lobby, {
    action: 'create', game: 'midway-mayhem', teams: 4, rounds: 3
  }, 201);
  const code = created.state.code;
  const host = created.token;
  const room = () => JSON.parse(sql.prepare(
    'SELECT state FROM mayhem_rooms WHERE code=?'
  ).get(code).state);
  assert.ok(room().miniPool.includes(bumperBoats.id));
  sql.prepare('UPDATE mayhem_rooms SET state=? WHERE code=?')
    .run(JSON.stringify({...room(), miniPool: [bumperBoats.id]}), code);

  const players = [];
  for (let i = 0; i < 12; i++) {
    const characterId = characters[(i * 7) % characters.length].id;
    const name = 'Player ' + i;
    const joined = await request(lobby, {
      action: 'join', code, joinId: crypto.randomUUID(), name, characterId
    });
    players.push({token: joined.token, name, characterId});
  }
  await request(lobby, {action: 'start', code, token: host});
  assert.deepEqual(room().teams.map((_, i) => room().players.filter(p => p.team === i).length), [3, 3, 3, 3]);

  let rounds = 0;
  const snapshot = async () => (await request(api, {action: 'state', code, token: host})).state;
  for (let step = 0; step < 150 && room().phase !== 'finished'; step++) {
    const phase = room();
    if (phase.phase === 'qualifier') {
      for (const student of players) {
        for (let i = 0; i < 3; i++) {
          const current = room();
          const player = current.players.find(p => p.id === student.token);
          const answer = current.questions[questionIndex(current, player)][2];
          await request(api, {
            action: 'answer', code, token: student.token, phase: 'qualifier',
            since: current.since, sequence: player.answers, choice: answer, choices: answer
          });
        }
      }
      continue;
    }
    if (phase.phase === 'mini') {
      rounds++;
      assert.equal(phase.game, bumperBoats.id);
      let state = await snapshot();
      const start = new Map(state.minigame.boats.map(boat => [boat.id, boat]));
      assert.equal(start.size, 12);
      for (const student of players) {
        assert.equal(state.minigame.boats.find(boat => boat.name === student.name)?.characterId, student.characterId);
        assert.ok(!JSON.stringify(state).includes(student.token));
      }
      assert.ok(!JSON.stringify(state).includes(host));
      now = phase.since + 1000;
      for (const [index, student] of players.entries()) {
        await request(api, {
          action: 'mini-input', code, token: student.token, phase: 'mini', since: phase.since,
          packet: {seq: 0, x: index % 2 ? 1 : -1, y: 0, boost: index % 3 === 0}
        });
      }
      for (let second = 2; second <= 45 && state.phase === 'mini'; second++) {
        now = phase.since + second * 1000;
        state = await snapshot();
      }
      assert.equal(state.minigame.phase, 'finished');
      assert.equal(state.minigame.boats.length, 12);
      assert.ok(state.minigame.boats.some(boat => {
        const previous = start.get(boat.id);
        return previous && Math.hypot(boat.x - previous.x, boat.y - previous.y) > 2;
      }));
    }
    now = room().deadline + 1;
    await snapshot();
  }
  assert.equal(rounds, 3);
  assert.equal(room().phase, 'finished');
} finally {
  Date.now = originalNow;
  sql.close();
}
