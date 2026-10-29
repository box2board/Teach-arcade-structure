export const SESSION_PHASES = Object.freeze({
  LOBBY: 'lobby',
  QUESTION: 'question',
  REVEAL: 'reveal',
  LEADERBOARD: 'leaderboard',
  RESULTS: 'results'
});

export class LocalClassicSession {
  constructor({ sessionId = 'classic-local', joinCode = '482913' } = {}) {
    this.sessionId = sessionId;
    this.joinCode = joinCode;
    this.phase = SESSION_PHASES.LOBBY;
    this.players = [];
    this.round = null;
    this.answers = new Map();
    this.listeners = new Set();
    this.updatedAt = Date.now();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  emit(type, detail = {}) {
    this.updatedAt = Date.now();
    const event = { type, detail, snapshot: this.snapshot() };
    for (const listener of this.listeners) listener(event);
    return event;
  }

  resetPlayers(playerSeeds = []) {
    this.players = playerSeeds.map((seed, index) => ({
      id: seed.id ?? index,
      name: seed.name ?? `Player ${index + 1}`,
      connected: seed.connected ?? true,
      score: seed.score ?? 0,
      streak: seed.streak ?? 0,
      longestStreak: seed.longestStreak ?? 0,
      correct: seed.correct ?? 0,
      answered: seed.answered ?? 0,
      skill: seed.skill,
      speed: seed.speed,
      metadata: seed.metadata ?? {}
    }));
    this.answers.clear();
    this.emit('players:reset');
    return this.players;
  }

  addPlayer(player) {
    const existing = this.players.find(p => p.id === player.id);
    if (existing) {
      Object.assign(existing, player, { connected: true });
      this.emit('player:rejoined', { playerId: existing.id });
      return existing;
    }
    const created = {
      id: player.id,
      name: player.name,
      connected: true,
      score: 0,
      streak: 0,
      longestStreak: 0,
      correct: 0,
      answered: 0,
      metadata: player.metadata ?? {}
    };
    this.players.push(created);
    this.emit('player:joined', { playerId: created.id });
    return created;
  }

  setConnection(playerId, connected) {
    const player = this.getPlayer(playerId);
    if (!player) return null;
    player.connected = Boolean(connected);
    this.emit(connected ? 'player:rejoined' : 'player:disconnected', { playerId });
    return player;
  }

  setPhase(phase) {
    if (!Object.values(SESSION_PHASES).includes(phase)) {
      throw new Error(`Unsupported Classic Live session phase: ${phase}`);
    }
    this.phase = phase;
    this.emit('phase:changed', { phase });
  }

  beginRound(round) {
    this.round = {
      id: round.id,
      index: round.index,
      questionId: round.questionId,
      redemption: Boolean(round.redemption),
      event: round.event ?? null,
      startedAt: round.startedAt ?? Date.now(),
      deadlineAt: round.deadlineAt ?? null,
      paused: false
    };
    this.answers = new Map();
    this.setPhase(SESSION_PHASES.QUESTION);
    this.emit('round:started', { round: this.round });
  }

  setRoundPaused(paused) {
    if (!this.round) return;
    this.round.paused = Boolean(paused);
    this.emit(paused ? 'round:paused' : 'round:resumed');
  }

  submitAnswer({ playerId, choice, correct, elapsedMs }) {
    if (this.phase !== SESSION_PHASES.QUESTION || !this.round || this.round.paused) return false;
    if (this.answers.has(playerId)) return false;
    const player = this.getPlayer(playerId);
    if (!player || !player.connected) return false;
    this.answers.set(playerId, {
      playerId,
      choice,
      correct: Boolean(correct),
      elapsedMs,
      submittedAt: Date.now()
    });
    this.emit('answer:submitted', { playerId });
    return true;
  }

  applyPlayerResult(playerId, { correct, scoreDelta = 0, streak, longestStreak }) {
    const player = this.getPlayer(playerId);
    if (!player) return null;
    player.answered += 1;
    if (correct) player.correct += 1;
    player.score += scoreDelta;
    if (Number.isFinite(streak)) player.streak = streak;
    if (Number.isFinite(longestStreak)) player.longestStreak = longestStreak;
    this.emit('player:scored', { playerId, scoreDelta, correct: Boolean(correct) });
    return player;
  }

  closeRound() {
    if (!this.round) return;
    this.emit('round:closed', { roundId: this.round.id });
  }

  getPlayer(playerId) {
    return this.players.find(player => player.id === playerId) ?? null;
  }

  getPlayers() {
    return this.players;
  }

  getConnectedPlayers() {
    return this.players.filter(player => player.connected);
  }

  getRankedPlayers() {
    return [...this.players].sort((a, b) =>
      b.score - a.score ||
      b.correct - a.correct ||
      a.name.localeCompare(b.name)
    );
  }

  allConnectedPlayersAnswered() {
    const connected = this.getConnectedPlayers();
    return connected.length > 0 && connected.every(player => this.answers.has(player.id));
  }

  snapshot() {
    return {
      sessionId: this.sessionId,
      joinCode: this.joinCode,
      phase: this.phase,
      round: this.round ? { ...this.round } : null,
      players: this.players.map(player => ({ ...player })),
      answers: [...this.answers.values()].map(answer => ({ ...answer })),
      updatedAt: this.updatedAt
    };
  }

  exportResults(extra = {}) {
    return {
      schemaVersion: 1,
      mode: 'classic-live',
      sessionId: this.sessionId,
      joinCode: this.joinCode,
      completedAt: new Date().toISOString(),
      players: this.getRankedPlayers().map(player => ({
        id: player.id,
        name: player.name,
        score: Math.round(player.score),
        correct: player.correct,
        answered: player.answered,
        accuracy: player.answered ? player.correct / player.answered : 0,
        longestStreak: player.longestStreak
      })),
      ...extra
    };
  }
}

export function createLocalClassicSession(options) {
  return new LocalClassicSession(options);
}
