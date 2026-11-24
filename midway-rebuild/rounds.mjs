// Authoritative round simulation for the Midway Mayhem rebuild.
const STEP = 1 / 30;
const WIDTH = 600;
const HEIGHT = 400;
const games = {
  'red-light-green-light': {seconds: 45, speed: 125},
  'spotlight-sneak': {seconds: 38, speed: 135},
  'bumper-boats': {seconds: 45, speed: 133}
};
const shelters = [[145, 147, 80, 42], [375, 228, 75, 45], [255, 295, 70, 46]];
const lamps = [[0, 80], [600, 160], [300, 400]];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function random(state) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function changeLights(state) {
  state.nextLight = state.elapsed + 0.8 + random(state) * 2.4;
  if (state.game === 'red-light-green-light') {
    state.red = !state.red;
    state.lightChanged = state.elapsed;
  } else {
    const mask = 1 + Math.floor(random(state) * 7);
    state.beams = lamps.map(([x, y], index) => ({
      x, y, active: Boolean(mask & (1 << index)),
      angle: Math.atan2(200 - y, 300 - x) + random(state) - 0.5,
      speed: (random(state) < 0.5 ? -1 : 1) * (0.35 + random(state) * 0.65)
    }));
  }
}

function spawnTicket(state, value = 1, x = 25 + random(state) * 550, y = 25 + random(state) * 350) {
  if (state.tickets.length < 48) state.tickets.push({id: ++state.ticketId, value, x, y});
}

function blocked(x, y, lamp) {
  // Clip the sightline against each rectangular shelter.
  return shelters.some(([left, top, width, height]) => {
    let enter = 0;
    let exit = 1;
    for (const [a, b, low, high] of [[lamp.x, x, left, left + width], [lamp.y, y, top, top + height]]) {
      if (a === b) {
        if (a < low || a > high) return false;
        continue;
      }
      const first = (low - a) / (b - a);
      const last = (high - a) / (b - a);
      enter = Math.max(enter, Math.min(first, last));
      exit = Math.min(exit, Math.max(first, last));
      if (enter > exit) return false;
    }
    return enter < 1;
  });
}

function step(state) {
  const config = games[state.game];
  state.elapsed += STEP;
  if (state.game !== 'bumper-boats' && state.elapsed >= state.nextLight) changeLights(state);
  if (state.game === 'spotlight-sneak') for (const beam of state.beams) beam.angle += beam.speed * STEP;
  if (state.game === 'bumper-boats') {
    if (state.tickets.length < 18) spawnTicket(state);
    if (!state.gold && state.elapsed >= 15 + (state.startSeed % 14)) {
      spawnTicket(state, 5);
      state.gold = true;
    }
  }

  for (const player of state.players) {
    if (player.done) continue;
    const {x, y} = player.direction;
    if (state.game === 'red-light-green-light' && state.red && state.elapsed - state.lightChanged > 0.2 && (x || y)) {
      player.done = true;
      continue;
    }
    const boat = state.game === 'bumper-boats';
    const speed = config.speed * (boat && state.elapsed < player.boostUntil ? 1.9 : 1);
    player.vx = boat ? player.vx * 0.9 + x * speed * 0.1 : x * speed;
    player.vy = boat ? player.vy * 0.9 + y * speed * 0.1 : y * speed;
    const nextX = clamp(player.x + player.vx * STEP, 12, WIDTH - 12);
    const nextY = clamp(player.y + player.vy * STEP, 12, HEIGHT - 12);
    if (state.game !== 'spotlight-sneak' || !shelters.some(([a, b, w, h]) => nextX > a && nextX < a + w && nextY > b && nextY < b + h)) {
      player.x = nextX;
      player.y = nextY;
    }
    if (state.game === 'spotlight-sneak' && state.elapsed >= 4 && state.beams.some(beam => {
      const offset = Math.atan2(player.y - beam.y, player.x - beam.x) - beam.angle;
      return beam.active && Math.cos(offset) >= Math.cos(0.19) && !blocked(player.x, player.y, beam);
    })) {
      player.y = HEIGHT - 15;
    }
    if (!boat) {
      player.score = Math.max(player.score, Math.floor(HEIGHT - 15 - player.y));
      if (player.y <= 18) {
        player.done = true;
        player.score += Math.ceil(config.seconds - state.elapsed) * 12;
      }
    }
  }

  if (state.game !== 'bumper-boats') return;
  for (const [i, a] of state.players.entries()) {
    for (let j = i + 1; j < state.players.length; j++) {
      const b = state.players[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= 24) continue;
      const nx = distance ? dx / distance : 1;
      const ny = distance ? dy / distance : 0;
      const separation = (24 - distance) / 2;
      a.x = clamp(a.x - nx * separation, 12, WIDTH - 12);
      a.y = clamp(a.y - ny * separation, 12, HEIGHT - 12);
      b.x = clamp(b.x + nx * separation, 12, WIDTH - 12);
      b.y = clamp(b.y + ny * separation, 12, HEIGHT - 12);
      for (const [attacker, target, sign] of [[a, b, 1], [b, a, -1]]) {
        if (state.elapsed >= attacker.boostUntil) continue;
        target.vx += nx * sign * 90;
        target.vy += ny * sign * 90;
        target.markedUntil = state.elapsed + 1.5;
      }
    }
    if (a.markedUntil > state.elapsed && Math.hypot(a.x - 300, a.y - 200) < 44) {
      const spill = Math.min(a.score, 3);
      a.score -= spill;
      a.markedUntil = 0;
      for (let k = 0; k < spill; k++) {
        const angle = random(state) * Math.PI * 2;
        spawnTicket(state, 1, 300 + Math.cos(angle) * 58, 200 + Math.sin(angle) * 58);
      }
    }
  }
  state.tickets = state.tickets.filter(ticket => {
    const winner = state.players
      .map(player => ({player, distance: Math.hypot(player.x - ticket.x, player.y - ticket.y)}))
      .filter(entry => entry.distance <= 16)
      .sort((a, b) => a.distance - b.distance)[0]?.player;
    if (winner) winner.score += ticket.value;
    return !winner;
  });
}

export function createRound(game, roster, now, seed) {
  if (!Object.hasOwn(games, game) || !roster.length || roster.length > 64) throw new Error('Invalid Midway round');
  const boat = game === 'bumper-boats';
  const state = {
    game, tickAt: now, elapsed: 0, seed: seed >>> 0, startSeed: seed >>> 0,
    nextLight: 2.5, red: false, lightChanged: 0, beams: [], tickets: [], ticketId: 0,
    players: roster.map(({id, name, characterId, team}, index) => ({
      id, name, characterId, team,
      x: 25 + (index + 0.5) * 550 / roster.length,
      y: boat ? 75 + (index % 4) * 80 : HEIGHT - 15,
      direction: {x: 0, y: 0}, vx: 0, vy: 0, score: 0, done: false,
      seq: -1, boostUntil: 0, boostReady: 0, markedUntil: 0
    }))
  };
  if (boat) for (let i = 0; i < 18; i++) spawnTicket(state);
  if (game === 'spotlight-sneak') changeLights(state);
  return state;
}

export function roundFinished(state) {
  return state.elapsed + 1e-6 >= games[state.game].seconds || state.players.every(player => player.done);
}

export function advanceRound(state, now) {
  const limit = Math.min(300, Math.floor((now - state.tickAt) / (STEP * 1000) + 1e-6));
  for (let count = 0; count < limit && !roundFinished(state); count++) {
    state.tickAt += STEP * 1000;
    step(state);
  }
}

export function applyRoundInput(state, id, packet) {
  const player = state.players.find(candidate => candidate.id === id);
  if (!player || player.done || roundFinished(state) || !packet) return false;
  const {seq, x, y, boost} = packet;
  if (!Number.isInteger(seq) || seq <= player.seq || ![x, y].every(value => Number.isFinite(value) && Math.abs(value) <= 1)) return false;
  const magnitude = Math.max(1, Math.hypot(x, y));
  player.seq = seq;
  player.direction = {x: x / magnitude, y: y / magnitude};
  if (state.game === 'bumper-boats' && boost === true && state.elapsed >= player.boostReady) {
    player.boostReady = state.elapsed + 2.6;
    player.boostUntil = state.elapsed + 0.45;
  }
  return true;
}

export function roundSnapshot(state) {
  return {
    game: state.game, elapsed: state.elapsed, seconds: games[state.game].seconds,
    finished: roundFinished(state), red: state.red, beams: state.beams,
    shelters: state.game === 'spotlight-sneak' ? shelters : [], tickets: state.tickets,
    players: state.players.map(({id, name, characterId, team, x, y, score, done, seq}) =>
      ({id, name, characterId, team, x, y, score, done, seq}))
  };
}
