import { characters as midwayCharacters } from '../../shared/midway-characters/characters.js';

const MIDWAY_IDS = midwayCharacters.map(character => character.id);
export const FIELD = Object.freeze({ width: 66, finish: 89, speed: 11 });
export const STEP_MS = 1000 / 30;
const GRACE = 400;
const FRESH = 180;
const MAX_RED_SAMPLE_AGE = 800;
const HELD_RED = 145;
const DEADZONE = .12;
const LIVE = new Set(['green', 'red']);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const zero = () => ({ x: 0, z: 0, at: -Infinity, first: -Infinity });
const approach = (value, target, change) => value + clamp(target - value, -change, change);

function bounded(value, min, max, fallback) {
  return Number.isFinite(value) ? clamp(Math.round(value), min, max) : fallback;
}

export function settings(options = {}) {
  const greenMin = bounded(options.greenMin, 900, 6000, 1700);
  const redMin = bounded(options.redMin, 850, 4000, 1300);
  return {
    greenMin, redMin,
    greenMax: bounded(options.greenMax, greenMin, 7500, Math.max(greenMin, 4200)),
    redMax: bounded(options.redMax, redMin, 5500, Math.max(redMin, 3200)),
    durationMs: bounded(options.durationMs, 15000, 180000, 65000)
  };
}

export class Race {
  constructor({ random = Math.random, characters = MIDWAY_IDS } = {}) {
    if (!characters.length) throw new Error('At least one character is required.');
    this.characters = characters.slice();
    this.random = random;
    this.players = new Map();
    this.phase = 'lobby';
    this.phaseId = 0;
    this.roundId = 0;
    this.phaseEndsAt = 0;
    this.deadline = 0;
    this.config = settings();
    this.hostId = '';
    this.finishers = 0;
    this.reason = '';
    this.solo = false;
  }

  join(id, { name, characterId, host = false }) {
    const color = Array.from({ length: 40 }, (_, index) => index)
      .find(index => ![...this.players.values()].some(player => player.color === index));
    const participant = { id, name, characterId: this.characters.includes(characterId)
      ? characterId : this.characters[(color ?? 0) % this.characters.length],
    color: color ?? 0, connected: true, status: 'waiting', x: 0, z: 0,
    vx: 0, vz: 0, facing: 0, motion: 'idle', input: zero(), seq: -1, finish: 0, outAt: 0, maxZ: 0, finishMs: 0 };
    this.players.set(id, participant);
    if (host) this.hostId = id;
    return participant;
  }

  assign(id, characterId) {
    const player = this.players.get(id);
    if (player && ['lobby', 'results'].includes(this.phase) && this.characters.includes(characterId)) {
      player.characterId = characterId;
    }
  }

  connect(id, connected) {
    const player = this.players.get(id);
    if (!player) return;
    player.connected = connected;
    player.input = zero();
    player.vx = player.vz = 0;
    player.motion = 'idle';
  }

  leave(id, now) {
    const player = this.players.get(id);
    if (!player) return;
    this.connect(id, false);
    if (player.status === 'racing') this.mark(player, 'left', now);
    if (player.status === 'waiting' || this.phase === 'lobby') this.players.delete(id);
    if (this.hostId === id) {
      this.hostId = [...this.players.values()].find(candidate => candidate.connected)?.id ?? '';
    }
  }

  start(now, options = {}) {
    if (!['lobby', 'results'].includes(this.phase)) return false;
    for (const [id, player] of this.players) if (!player.connected) this.players.delete(id);
    const roster = [...this.players.values()];
    if (!roster.length) return false;
    this.config = settings(options);
    this.roundId++;
    this.finishers = 0;
    this.reason = '';
    this.solo = roster.length === 1;
    this.phase = 'countdown';
    this.phaseId++;
    this.phaseEndsAt = now + 3000;
    this.startedAt = this.phaseEndsAt;
    this.deadline = this.phaseEndsAt + this.config.durationMs;
    roster.forEach((player, index) => {
      const columns = Math.min(10, roster.length);
      Object.assign(player, { x: (index % columns - (columns - 1) / 2) * 5.8,
        z: -.8 - Math.floor(index / columns) * 2.3, vx: 0, vz: 0, facing: 0,
        status: 'racing', finish: 0, outAt: 0, maxZ: 0, finishMs: 0, motion: 'idle', input: zero() });
    });
    return true;
  }

  command(id, packet, now) {
    const player = this.players.get(id);
    if (!player?.connected || player.status !== 'racing' || !LIVE.has(this.phase) ||
      !packet || packet.roundId !== this.roundId || packet.phaseId !== this.phaseId ||
      !Number.isSafeInteger(packet.seq) || packet.seq <= player.seq ||
      !Number.isFinite(packet.x) || !Number.isFinite(packet.z) ||
      Math.abs(packet.x) > 1 || Math.abs(packet.z) > 1) return false;
    const length = Math.hypot(packet.x, packet.z);
    const moving = length > DEADZONE;
    if (moving && this.phase === 'red' && (
      now >= Math.min(this.phaseEndsAt, this.deadline) ||
      !Number.isFinite(packet.sample) || packet.sample < this.redGraceEnd ||
      packet.sample > now || now - packet.sample > MAX_RED_SAMPLE_AGE
    )) return false;
    const previous = player.input;
    const continuous = now - previous.at <= FRESH && Number.isFinite(previous.first);
    player.seq = packet.seq;
    if (this.phase === 'red' && moving && packet.press === true) {
      this.mark(player, 'out', now);
      return true;
    }
    player.input = moving
      ? { x: packet.x / Math.max(length, 1), z: packet.z / Math.max(length, 1),
          at: now, first: continuous ? previous.first : now }
      : { ...zero(), at: now };
    return true;
  }

  light(phase, now) {
    this.phase = phase;
    this.phaseId++;
    const min = this.config[phase + 'Min'];
    const max = this.config[phase + 'Max'];
    this.phaseEndsAt = now + min + this.random() * (max - min);
    this.redGraceEnd = now + GRACE;
    for (const player of this.players.values()) {
      player.input = zero();
      player.vx = player.vz = 0;
      player.motion = 'idle';
    }
  }

  mark(player, status, now) {
    if (player.status !== 'racing') return;
    player.maxZ = Math.max(player.maxZ, player.z);
    if (status === 'finished') player.finishMs = Math.max(0, now - this.startedAt);
    player.status = status;
    player.motion = 'idle';
    if (status === 'finished' || status === 'survivor') player.finish = ++this.finishers;
    if (status === 'out' || status === 'left') player.outAt = now;
  }

  end(reason) {
    this.phase = 'results';
    this.phaseId++;
    this.phaseEndsAt = 0;
    this.reason = reason;
    for (const player of this.players.values()) {
      if (player.status === 'racing') player.status = 'time';
      player.motion = 'idle';
    }
  }

  settle(now, allowSurvivor) {
    const active = [...this.players.values()].filter(player => player.status === 'racing');
    if (!active.length) {
      this.end(this.finishers ? 'complete' : 'no-winner');
      return true;
    }
    if (allowSurvivor && !this.solo && active.length === 1 && active[0].connected) {
      this.mark(active[0], 'survivor', now);
      this.end('complete');
      return true;
    }
    return false;
  }

  step(now, dt = STEP_MS / 1000) {
    if (this.phase === 'countdown' && now >= this.phaseEndsAt) this.light('green', now);
    if (!LIVE.has(this.phase)) return;
    if (now >= this.deadline) {
      if (!this.settle(now, true)) this.end('time');
      return;
    }
    if (now >= this.phaseEndsAt) {
      if (this.phase === 'red' && this.settle(now, true)) return;
      this.light(this.phase === 'red' ? 'green' : 'red', now);
    }
    dt = clamp(dt, 0, .05);
    const finishBatch = [];
    for (const player of this.players.values()) {
      if (!player.connected || player.status !== 'racing') continue;
      const input = now - player.input.at <= FRESH ? player.input : zero();
      if (this.phase === 'red') {
        // Movement must arrive in a current-phase stream and persist after the grace.
        // A queued old packet or a delayed burst cannot supply elapsed server time.
        if (Number.isFinite(input.first) && now >= this.redGraceEnd &&
          input.at - Math.max(input.first, this.redGraceEnd) >= HELD_RED) {
          this.mark(player, 'out', now);
        }
        continue;
      }
      const before = player.z;
      advanceMovement(player, input, dt);
      player.maxZ = Math.max(player.maxZ, player.z);
      if (player.z >= FIELD.finish && before < FIELD.finish) {
        const travelled = player.vz * dt;
        finishBatch.push({ player, fraction: clamp((FIELD.finish - before) / travelled, 0, 1) });
      }
    }
    finishBatch.sort((a, b) => a.fraction - b.fraction);
    for (const { player, fraction } of finishBatch) {
      this.mark(player, 'finished', Math.max(this.startedAt, now - dt * 1000 * (1 - fraction)));
    }
    this.settle(now, this.phase === 'green');
  }

  snapshot(now) {
    return {
      phase: this.phase, phaseId: this.phaseId, roundId: this.roundId,
      phaseEndsAt: ['countdown', 'red'].includes(this.phase)
        ? (this.phase === 'red' ? this.redGraceEnd : this.phaseEndsAt) : 0,
      deadline: this.deadline, now, hostId: this.hostId, reason: this.reason,
      players: [...this.players.values()].map(player => {
        const { id, name, characterId, color, connected, status, x, z, facing, motion,
          finish, outAt, vx, vz, seq, finishMs } = player;
        const distance = clamp(Math.max(player.maxZ, z), 0, FIELD.finish);
        return { id, name, characterId, color, connected, status,
          x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100,
          vx, vz, seq, facing: Math.round(facing * 1000) / 1000,
          motion, finish, outAt, finishMs: Math.round(finishMs),
          distance: Math.round(distance * 100) / 100,
          ...scorePlayer(player, this.config.durationMs) };
      })
    };
  }
}

// Shared motion keeps local visual prediction aligned with server acceleration.
export function advanceMovement(player, input, dt) {
  dt = clamp(dt, 0, .05);
  let x = input.x, z = input.z;
  const length = Math.hypot(x, z);
  if (length > 1) { x /= length; z /= length; }
  player.vx = approach(player.vx, x * FIELD.speed, 42 * dt);
  player.vz = approach(player.vz, z * FIELD.speed, 42 * dt);
  player.x = clamp(player.x + player.vx * dt, -FIELD.width / 2 + .6, FIELD.width / 2 - .6);
  player.z = clamp(player.z + player.vz * dt, -10, FIELD.finish);
  player.motion = Math.hypot(player.vx, player.vz) > .4 ? 'run' : 'idle';
  if (player.motion === 'run') player.facing = Math.atan2(player.vx, player.vz);
}

export function scorePlayer(player, durationMs) {
  const distance = clamp(Math.max(player.maxZ ?? player.z, player.z), 0, FIELD.finish);
  const distancePoints = Math.floor(distance / FIELD.finish * 1000);
  const finishBonus = player.status === 'finished' ? 500 : 0;
  const speedBonus = player.status === 'finished'
    ? Math.floor(500 * clamp(1 - player.finishMs / durationMs, 0, 1)) : 0;
  const survivalBonus = player.status === 'survivor' ? 250 : 0;
  return { distancePoints, finishBonus, speedBonus, survivalBonus,
    points: distancePoints + finishBonus + speedBonus + survivalBonus };
}

export function standings(players) {
  const ranked = players.filter(player => player.status !== 'waiting')
    .map(player => ({ ...player, points: player.points ?? scorePlayer(player, 65000).points }))
    .sort((a, b) => b.points - a.points ||
      (a.status === 'finished' ? a.finishMs : Infinity) - (b.status === 'finished' ? b.finishMs : Infinity) ||
      (b.distance ?? b.z) - (a.distance ?? a.z));
  let last;
  return ranked.map((player, index) => {
    const tied = last && last.points === player.points &&
      (last.status === 'finished' ? last.finishMs : 0) === (player.status === 'finished' ? player.finishMs : 0) &&
      (last.distance ?? last.z) === (player.distance ?? player.z);
    const place = tied ? last.place : index + 1;
    last = { ...player, place };
    return last;
  });
}
