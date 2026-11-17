import { Room, ServerError } from '@colyseus/core';
import { MapSchema, Schema, defineTypes } from '@colyseus/schema';
import { performance } from 'node:perf_hooks';
import { Race, STEP_MS } from '../../public/mini-games/games/red-light-green-light/rules.js';

class Racer extends Schema {}
defineTypes(Racer, {
  id: 'string', name: 'string', characterId: 'string', color: 'number',
  connected: 'boolean', status: 'string', x: 'number', z: 'number',
  facing: 'number', motion: 'string', finish: 'number', outAt: 'number',
  vx: 'number', vz: 'number', seq: 'number', finishMs: 'number', distance: 'number',
  points: 'number', distancePoints: 'number', finishBonus: 'number',
  speedBonus: 'number', survivalBonus: 'number'
});

class RaceState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}
defineTypes(RaceState, {
  players: { map: Racer }, phase: 'string', phaseId: 'number', roundId: 'number',
  phaseEndsAt: 'number', deadline: 'number', now: 'number', hostId: 'string', reason: 'string'
});

export const ROOM_TYPE = 'red-light-green-light';

export function registerRedLight(game, config = {}) {
  return game.define(ROOM_TYPE, class extends RedLightRoom {
    get gameConfig() { return config; }
  });
}

class RedLightRoom extends Room {
  onCreate(options) {
    if (typeof options.hostKey !== 'string' || !/^[a-f0-9]{32}$/.test(options.hostKey)) {
      throw new ServerError(400, 'Create the room from the game page.');
    }
    const { capacity = 40, characters } = this.gameConfig;
    this.maxClients = Math.max(2, Math.min(40, Math.floor(capacity) || 40));
    this.hostKey = options.hostKey;
    this.race = new Race({ characters });
    this.lastInput = new Map();
    this.setState(new RaceState());
    this.setPrivate(true);
    this.setPatchRate(50);
    this.publish(performance.now());
    this.onMessage('input', (client, input) => {
      const now = performance.now();
      const redPress = this.race.phase === 'red' && input?.press === true;
      const stopping = input?.x === 0 && input?.z === 0;
      if (!redPress && !stopping && now - (this.lastInput.get(client.sessionId) ?? -Infinity) < 16) return;
      this.lastInput.set(client.sessionId, now);
      this.race.command(client.sessionId, input, now);
    });
    this.onMessage('ping', (client, sent) => {
      if (Number.isFinite(sent)) client.send('pong', sent);
    });
    this.onMessage('character', (client, id) => this.race.assign(client.sessionId, id));
    this.onMessage('start', (client, options) => {
      if (client.sessionId === this.race.hostId && options && typeof options === 'object') {
        this.race.start(performance.now(), options);
      }
    });
    this.setSimulationInterval(delta => {
      const now = performance.now();
      this.race.step(now, delta / 1000);
      this.publish(now);
    }, STEP_MS);
    // Clear abandoned and forgotten preview rooms.
    this.clock.setTimeout(() => this.disconnect(), 60 * 60 * 1000);
  }

  onJoin(client, options) {
    const host = this.hostKey !== null && options.hostKey === this.hostKey;
    if (host) this.hostKey = null;
    const name = typeof options.name === 'string'
      ? options.name.normalize('NFKC').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 20) : '';
    this.race.join(client.sessionId, {
      host, name: name || 'Runner ' + (this.race.players.size + 1), characterId: options.characterId
    });
    this.publish(performance.now());
  }

  async onLeave(client, consented) {
    const id = client.sessionId;
    this.race.connect(id, false);
    this.lastInput.delete(id);
    if (!consented) {
      try {
        await this.allowReconnection(client, 12);
        this.race.connect(id, true);
        return;
      } catch {
        // The reservation expired.
      }
    }
    this.race.leave(id, performance.now());
  }

  publish(now) {
    const { players, ...state } = this.race.snapshot(now);
    Object.assign(this.state, state);
    const current = new Set();
    for (const player of players) {
      const view = this.state.players.get(player.id);
      if (view) Object.assign(view, player);
      else this.state.players.set(player.id, Object.assign(new Racer(), player));
      current.add(player.id);
    }
    for (const id of this.state.players.keys()) if (!current.has(id)) this.state.players.delete(id);
  }
}
