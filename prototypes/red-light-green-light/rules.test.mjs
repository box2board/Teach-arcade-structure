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

test('rejects stale green inputs and allows red grace input without elimination', () => {
  const { race, start, red, signal, to } = fixture(2);
  start();
  const green = race.phaseId;
  red();
  const base = race.redGraceEnd;
  to(base + 15);
  assert.equal(signal('1', 1, { phaseId: green }), false);
  assert(signal('1', 1, { sample: base - .25 }));
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

test('a fresh tap after red grace eliminates the runner without advancing them', () => {
  const { race, start, red, signal, to } = fixture(2);
  start();
  red();
  const base = race.redGraceEnd;
  const runner = race.players.get('0');
  const position = runner.z;
  to(base - 50);
  assert(signal('0', 1, { press: true }));
  assert.equal(runner.status, 'racing');
  to(base + 50);
  assert(signal('0', 1, { press: true, sample: base - 10 }));
  assert(signal('0', 1, { press: true }));
  const eliminatedPosition = runner.z;
  assert(eliminatedPosition >= position);
  assert.equal(runner.status, 'out');
  assert.equal(race.phase, 'red');
  assert(signal('1', 1, { press: true }));
  to(base + 100);
  assert.equal(race.reason, 'no-winner');
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

test('five finishers earn more for faster finishes and preserve distance credit after elimination', () => {
  const { race, start, now } = fixture(7);
  start();
  for (let i = 0; i < 5; i++) {
    const player = race.players.get(String(i));
    player.z = FIELD.finish;
    race.mark(player, 'finished', race.startedAt + 15000 + i * 5000);
  }
  const eliminated = race.players.get('5');
  eliminated.z = FIELD.finish * .75;
  race.mark(eliminated, 'out', now());
  const waiting = race.players.get('6');
  waiting.z = FIELD.finish * .35;
  race.end('time');
  const rows = standings(race.snapshot(now()).players);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.slice(0, 5).map(player => player.id), ['0', '1', '2', '3', '4']);
  for (let i = 0; i < 4; i++) assert(rows[i].points > rows[i + 1].points);
  assert.equal(rows[5].distancePoints, 750);
  assert.equal(rows[5].points, 750);
  assert.equal(rows[6].points, 350);
  assert.equal(rows[0].finishBonus, 500);
  assert.equal(rows[0].speedBonus, Math.floor(500 * (1 - 15000 / race.config.durationMs)));
  const original = rows[0].points;
  race.mark(race.players.get('0'), 'finished', race.startedAt + 1);
  assert.equal(race.snapshot(now()).players[0].points, original);
});

test('distance keeps the farthest legal position without awarding repeated travel or client points', () => {
  const { race, start, signal, to, now } = fixture(2);
  start();
  const runner = race.players.get('0');
  race.phaseEndsAt = now() + 3000;
  for (let i = 0; i < 7; i++) { signal('0', 1, {points: 99999}); to(now() + 55); }
  const best = runner.maxZ;
  for (let i = 0; i < 14; i++) { signal('0', -1); to(now() + 55); }
  const row = race.snapshot(now()).players[0];
  assert(runner.z < best);
  assert.equal(row.distancePoints, Math.floor(runner.maxZ / FIELD.finish * 1000));
  assert.equal(row.points, row.distancePoints);
  assert(row.points < 1000);
  race.mark(runner, 'out', now());
  const points = race.snapshot(now()).players[0].points;
  assert.equal(signal('0', 1, {points: 99999}), false);
  to(now() + 55);
  assert.equal(race.snapshot(now()).players[0].points, points);
});

test('survival bonus rewards the last runner while every actual finisher scores higher', () => {
  const { race, start, now } = fixture(3);
  start();
  const finisher = race.players.get('0');
  finisher.z = FIELD.finish;
  race.mark(finisher, 'finished', race.deadline);
  race.players.get('1').z = FIELD.finish * .6;
  race.mark(race.players.get('2'), 'out', now());
  race.settle(now(), true);
  const rows = standings(race.snapshot(now()).players);
  assert.equal(rows[0].points, 1500);
  assert.equal(rows[1].survivalBonus, 250);
  assert.equal(rows[1].points, 850);
  assert.equal(rows[1].finishBonus, 0);
  assert.equal(rows[1].speedBonus, 0);
});

test('red release stays safe with delayed green packets and a 600ms round trip', () => {
  const { race, start, red, signal, to } = fixture(2);
  start();
  const oldPhase = race.phaseId;
  red();
  const grace = race.redGraceEnd;
  race.phaseEndsAt = grace + 1600;
  to(grace + 400);
  assert.equal(signal('0', 1, {phaseId: oldPhase, sample: grace - 100}), false);
  assert(signal('0', 1, {sample: grace - 40}));
  assert(signal('0', 1, {sample: grace + 20}));
  to(grace + 480);
  assert(signal('0', 0, {sample: grace + 80}));
  to(grace + 740);
  assert.equal(race.players.get('0').status, 'racing');
  assert(signal('1', 1, {sample: grace + 180, press: true}));
  assert.equal(race.players.get('1').status, 'out');
});

test('red keeps movement and animation, provides 300ms grace, and eliminates a held control afterward', () => {
  const { race, start, signal, to, now, hold } = fixture(2);
  start();
  for (let i = 0; i < 6; i++) { signal('0', 1); to(now() + 50); }
  const runner = race.players.get('0');
  const velocity = runner.vz;
  race.light('red', now());
  assert.equal(race.redGraceEnd - now(), 300);
  assert.equal(runner.vz, velocity);
  assert.equal(runner.motion, 'run');
  const began = now(), z = runner.z;
  hold(['0'], began + 250);
  assert.equal(runner.status, 'racing');
  assert(runner.z > z);
  assert.equal(runner.motion, 'run');
  hold(['0'], began + 600);
  assert.equal(runner.status, 'out');
  assert(runner.z > z + 3);
  const stopped = runner.z;
  to(now() + 50);
  assert.equal(runner.z, stopped);
});

test('releasing during red grace stops normally and a finish during grace is eligible', () => {
  const { race, start, signal, to, now } = fixture(2);
  start();
  const runner = race.players.get('0');
  runner.vz = FIELD.speed;
  signal('0', 1);
  race.light('red', now());
  const began = now();
  signal('0', 0);
  to(began + 350);
  const stopped = runner.z;
  assert.equal(runner.vz, 0);
  to(began + 700);
  assert.equal(runner.z, stopped);
  assert.equal(runner.status, 'racing');
  race.light('green', now());
  runner.z = FIELD.finish - .3;
  runner.vz = FIELD.speed;
  signal('0', 1);
  race.light('red', now());
  signal('0', 1);
  to(now() + 34);
  assert.equal(runner.status, 'finished');
});

test('crossing after red grace cannot collect a finish bonus', () => {
  const { race, start, signal, to, now } = fixture(2);
  start();
  race.light('red', now());
  to(race.redGraceEnd + 25);
  const runner = race.players.get('0');
  runner.z = FIELD.finish - .05;
  runner.vz = FIELD.speed;
  signal('0', 1);
  to(now() + 34);
  assert.equal(runner.status, 'racing');
  assert.equal(race.snapshot(now()).players[0].finishBonus, 0);
});
