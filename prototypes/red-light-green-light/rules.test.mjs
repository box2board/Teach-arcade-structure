import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIELD, Race, settings, standings } from '../../public/mini-games/games/red-light-green-light/rules.js';

function fixture(count) {
  let now = 0;
  const race = new Race({ random: () => 0 });
  for (let i = 0; i < count; i++) race.join(String(i), { name: 'Runner ' + i, characterId: 'frog', host: i === 0 });
  const seq = new Map();
  const signal = (id, z, overrides = {}) => {
    const number = (seq.get(id) ?? 0) + 1;
    seq.set(id, number);
    return race.command(id, { roundId: race.roundId, phaseId: race.phaseId, seq: number,
      x: 0, z, sample: now, ...overrides }, now);
  };
  function to(time) {
    while (now < time) {
      const delta = Math.min(1000 / 30, time - now);
      now += delta;
      race.step(now, delta / 1000);
    }
  }
  const start = () => {
    assert(race.start(now, { greenMin: 900, redMin: 950 }));
    to(now + 3001);
    assert.equal(race.phase, 'green');
  };
  const red = () => to(race.phaseEndsAt + 1);
  const hold = (ids, until) => {
    while (now < until) {
      for (const id of ids) signal(id, 1);
      to(Math.min(until, now + 55));
    }
  };
  return { race, signal, to, start, red, hold, now: () => now };
}

test('solo starts without an automatic win and can reach the finish using legal inputs', () => {
  const { race, start, signal, to, now } = fixture(1);
  start();
  assert.equal(race.players.get('0').status, 'racing');
  race.players.get('0').z = FIELD.finish - 1;
  for (let i = 0; i < 12; i++) {
    signal('0', 1);
    to(now() + 55);
  }
  assert.equal(race.players.get('0').status, 'finished');
  assert.equal(race.phase, 'results');
});

test('rejects stale green inputs and delayed red movement sampled during grace', () => {
  const { race, start, red, signal, to } = fixture(2);
  start();
  const green = race.phaseId;
  red();
  const base = race.redGraceEnd;
  to(base + 15);
  assert.equal(signal('1', 1, { phaseId: green }), false);
  assert.equal(signal('1', 1, { sample: base - .25 }), false);
  assert.equal(signal('1', 1, { x: 2 }), false);
  assert.equal(signal('1', 1, { sample: base + 200 }), false);
  assert(signal('1', 1));
  assert(signal('1', 0));
  to(base + 390);
  assert.equal(race.players.get('1').status, 'racing');
});

test('red rejects a movement burst and leaves a timely neutral release eligible', () => {
  const { race, start, red, signal, to } = fixture(2);
  start();
  red();
  const base = race.redGraceEnd;
  to(base + 20);
  for (let i = 0; i < 15; i++) assert(signal('0', 1));
  to(base + 80);
  signal('0', 0);
  to(base + 400);
  assert.equal(race.players.get('0').status, 'racing');
});

test('one red phase batches eliminations and can end with zero winners', () => {
  const { race, start, red, hold, to } = fixture(2);
  start();
  red();
  const base = race.redGraceEnd;
  to(base + 5);
  hold(['0'], base + 110);
  hold(['0', '1'], base + 240);
  assert.equal(race.players.get('0').status, 'out');
  assert.equal(race.players.get('1').status, 'racing');
  assert.equal(race.phase, 'red');
  hold(['1'], base + 350);
  assert.equal(race.phase, 'results');
  assert.equal(race.reason, 'no-winner');
  assert.equal(race.finishers, 0);
});

test('forty runners can release on every red light and finish one full race', () => {
  const { race, signal, to, now } = fixture(40);
  assert(race.start(now()));
  while (race.phase !== 'results' && now() < 68000) {
    for (const id of race.players.keys()) signal(id, race.phase === 'green' ? 1 : 0);
    to(now() + 55);
  }
  const players = race.snapshot(now()).players;
  assert.equal(race.phase, 'results');
  assert.equal(race.finishers, 40);
  assert.equal(new Set(players.map(player => player.color)).size, 40);
  assert(players.every(player => player.status === 'finished' || player.status === 'survivor'));
});

test('awards the sole remaining runner when the red phase settles', () => {
  const { race, start, red, hold, to } = fixture(3);
  start();
  red();
  const base = race.redGraceEnd;
  to(base + 5);
  hold(['0', '1'], base + 260);
  assert.equal(race.phase, 'red');
  assert.equal(race.players.get('2').status, 'racing');
  to(race.phaseEndsAt + 1);
  assert.equal(race.players.get('2').status, 'survivor');
});

test('multiple crossings in one tick preserve finish order and award the final runner', () => {
  const { race, start, signal, to, now } = fixture(3);
  start();
  for (const id of ['0', '1']) {
    const player = race.players.get(id);
    player.z = FIELD.finish - (id === '0' ? .19 : .1);
    player.vz = FIELD.speed;
    signal(id, 1);
  }
  to(now() + 34);
  const rows = standings(race.snapshot(now()).players);
  assert.deepEqual(rows.map(({ id, status, place }) => [id, status, place]), [
    ['1', 'finished', 1], ['0', 'finished', 2], ['2', 'survivor', 3]
  ]);
});

test('disconnect reserves the seat, expiration forfeits, and late joins race in the rematch', () => {
  const { race, start, signal, to, now } = fixture(2);
  start();
  race.join('late', { name: 'Late', characterId: 'frog' });
  assert.equal(race.players.get('late').status, 'waiting');
  assert.equal(signal('late', 1), false);
  race.connect('1', false);
  to(now() + 30);
  assert.equal(race.players.get('0').status, 'racing');
  race.connect('1', true);
  assert(signal('1', 1));
  race.leave('1', now());
  to(now() + 30);
  assert.equal(race.players.get('0').status, 'survivor');
  assert(race.start(now()));
  assert.equal(race.players.get('late').status, 'racing');
  assert.equal(race.players.get('late').characterId, race.players.get('0').characterId);
  assert.notEqual(race.players.get('late').color, race.players.get('0').color);
});

test('time ranks unfinished runners by distance with shared places and no finish credit', () => {
  const { race, start, now } = fixture(4);
  start();
  race.players.get('0').z = 45;
  race.players.get('1').z = race.players.get('2').z = 65;
  race.step(race.deadline);
  const rows = standings(race.snapshot(now()).players);
  assert.deepEqual(rows.map(player => player.place), [1, 1, 3, 4]);
  assert.equal(race.finishers, 0);
  assert.equal(race.reason, 'time');
});

test('configuration clamps invalid phase bounds and duration', () => {
  assert.deepEqual(settings({ greenMin: 60000, greenMax: 1, redMin: NaN, durationMs: 0 }), {
    greenMin: 6000, greenMax: 6000, redMin: 1300, redMax: 3200, durationMs: 15000
  });
});
