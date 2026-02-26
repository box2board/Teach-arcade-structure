(() => {
  const STATES = { IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', ENDED: 'ENDED' };

  const MODE_CONFIG = {
    sprint: { label: 'Sprint', timeLimitMs: 60000, lives: null, targetItems: null },
    endless: { label: 'Endless', timeLimitMs: null, lives: 5, targetItems: null },
    accuracy: { label: 'Accuracy', timeLimitMs: null, lives: null, targetItems: 50 },
    zen: { label: 'Zen', timeLimitMs: null, lives: null, targetItems: null }
  };

  const DIFFICULTY_WINDOWS = {
    easy: [4000, 6000],
    normal: [3000, 5000],
    hard: [2000, 4000],
    pro: [1000, 3000]
  };

  class TypeTurboEngine {
    constructor(config = {}) {
      this.wordlists = config.wordlists || {};
      this.onEvent = config.onEvent || (() => {});
      this.state = STATES.IDLE;
      this.rafId = 0;
      this.run = {};
    }

    getState() {
      return this.state;
    }

    setWordlists(wordlists) {
      this.wordlists = wordlists || {};
    }

    start({ mode, difficulty }) {
      this.stopLoop();
      const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.sprint;
      const now = performance.now();
      this.run = {
        mode,
        difficulty,
        startTs: now,
        lastTick: now,
        pauseStartedAt: 0,
        remainingMs: modeConfig.timeLimitMs,
        lives: modeConfig.lives,
        completedItems: 0,
        correctItems: 0,
        missedItems: 0,
        timeoutCount: 0,
        totalChars: 0,
        correctChars: 0,
        combo: 0,
        streak: 0,
        bestStreak: 0,
        target: '',
        lastTarget: '',
        targetDeadline: 0
      };
      this.state = STATES.RUNNING;
      this.emit('onStart');
      this.nextTarget();
      this.pushStats();
      this.loop();
    }

    pause() {
      if (this.state !== STATES.RUNNING) return;
      this.state = STATES.PAUSED;
      this.run.pauseStartedAt = performance.now();
      this.stopLoop();
      this.emit('onPause');
      this.pushStats();
    }

    resume() {
      if (this.state !== STATES.PAUSED) return;
      const now = performance.now();
      const pausedFor = now - this.run.pauseStartedAt;
      this.run.startTs += pausedFor;
      this.run.lastTick = now;
      if (this.run.remainingMs != null) this.run.remainingMs += pausedFor;
      this.run.targetDeadline += pausedFor;
      this.state = STATES.RUNNING;
      this.emit('onResume');
      this.loop();
      this.pushStats();
    }

    restart(opts) {
      this.state = STATES.IDLE;
      this.stopLoop();
      this.run = {};
      if (opts) this.start(opts);
    }

    submitInput(raw) {
      if (this.state !== STATES.RUNNING) return;
      const target = this.run.target;
      if (!target) return;

      const cappedLen = Math.min(raw.length, target.length);
      this.run.totalChars = this.run.totalChars - (this.run.lastInputLen || 0) + cappedLen;
      this.run.correctChars = this.run.correctChars - (this.run.lastCorrectLen || 0) + this.countCorrectPrefix(raw, target);
      this.run.lastInputLen = cappedLen;
      this.run.lastCorrectLen = this.countCorrectPrefix(raw, target);

      if (raw === target) {
        this.markCorrect();
        return;
      }

      if (raw.length > 0 && !target.startsWith(raw)) {
        this.markMistake('Mistake', false);
      } else {
        this.pushStats();
      }
    }

    countCorrectPrefix(raw, target) {
      let count = 0;
      const max = Math.min(raw.length, target.length);
      while (count < max && raw[count] === target[count]) count += 1;
      return count;
    }

    markCorrect() {
      this.run.correctItems += 1;
      this.run.combo += 1;
      this.run.streak += 1;
      this.run.bestStreak = Math.max(this.run.bestStreak, this.run.streak);
      this.run.completedItems += 1;
      this.emit('onCorrect', { combo: this.run.combo, streak: this.run.streak });
      this.advance();
    }

    markMistake(reason, isTimeout) {
      this.run.combo = 0;
      this.run.streak = 0;
      this.run.missedItems += 1;
      this.run.completedItems += 1;
      if (isTimeout) this.run.timeoutCount += 1;
      this.emit(isTimeout ? 'onTimeout' : 'onMistake', { reason });
      if (this.run.mode === 'endless') {
        this.run.lives -= 1;
        if (this.run.lives <= 0) {
          this.end('Out of lives');
          return;
        }
      }
      this.advance();
    }

    advance() {
      const targetCount = MODE_CONFIG[this.run.mode]?.targetItems || null;
      if (targetCount && this.run.completedItems >= targetCount) {
        this.end('Accuracy set complete');
        return;
      }
      if (this.state === STATES.RUNNING) {
        this.nextTarget();
      }
      this.pushStats();
    }

    nextTarget() {
      const next = this.pickTarget();
      this.run.target = next;
      this.run.lastTarget = next;
      this.run.lastInputLen = 0;
      this.run.lastCorrectLen = 0;
      const [minMs, maxMs] = DIFFICULTY_WINDOWS[this.run.difficulty] || [3000, 5000];
      const limit = Math.floor(minMs + Math.random() * (maxMs - minMs));
      this.run.targetDeadline = performance.now() + limit;
      this.emit('onTargetNew', { targetText: next, timeLimitMs: limit });
    }

    pickTarget() {
      const wl = this.wordlists;
      const d = this.run.difficulty;
      const pools = {
        easy: wl.EASY_WORDS || [],
        normal: wl.NORMAL_WORDS || [],
        hard: wl.HARD_WORDS || [],
        pro: wl.PRO_WORDS || []
      };
      const pool = [...(pools[d] || [])];
      if ((d === 'hard' || d === 'pro') && Math.random() < 0.35) {
        pool.push(...(wl.SHORT_PHRASES || wl.PHRASES || []));
      }
      if (!pool.length) return 'type';
      let next = pool[Math.floor(Math.random() * pool.length)];
      let guard = 0;
      while (next === this.run.lastTarget && guard < 8) {
        next = pool[Math.floor(Math.random() * pool.length)];
        guard += 1;
      }
      return next;
    }

    loop = (now = performance.now()) => {
      if (this.state !== STATES.RUNNING) return;
      const elapsed = now - this.run.lastTick;
      this.run.lastTick = now;

      if (this.run.remainingMs != null) {
        this.run.remainingMs = Math.max(0, this.run.remainingMs - elapsed);
        if (this.run.remainingMs <= 0) {
          this.end('Time up');
          return;
        }
      }

      if (now >= this.run.targetDeadline) {
        this.markMistake('Too slow', true);
        if (this.state !== STATES.RUNNING) return;
      }

      this.pushStats();
      this.rafId = requestAnimationFrame(this.loop);
    };

    end(reason) {
      if (this.state === STATES.ENDED) return;
      this.state = STATES.ENDED;
      this.stopLoop();
      this.emit('onEnd', { reason, stats: this.getStats() });
      this.pushStats();
    }

    stopLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }

    getStats() {
      const runTimeMs = Math.max(performance.now() - (this.run.startTs || performance.now()), 1000 / 60);
      const minutes = runTimeMs / 60000;
      const wpm = ((this.run.correctChars || 0) / 5) / minutes;
      const accuracy = (this.run.totalChars || 0) > 0 ? ((this.run.correctChars || 0) / this.run.totalChars) * 100 : 100;
      return {
        state: this.state,
        mode: this.run.mode,
        difficulty: this.run.difficulty,
        remainingMs: this.run.remainingMs,
        lives: this.run.lives,
        combo: this.run.combo || 0,
        streak: this.run.bestStreak || 0,
        completedItems: this.run.completedItems || 0,
        correctItems: this.run.correctItems || 0,
        missedItems: this.run.missedItems || 0,
        timeoutCount: this.run.timeoutCount || 0,
        wpm: Number.isFinite(wpm) ? wpm : 0,
        accuracy: Number.isFinite(accuracy) ? accuracy : 100
      };
    }

    pushStats() {
      this.emit('onStatsUpdate', this.getStats());
    }

    emit(eventName, payload) {
      this.onEvent(eventName, payload);
    }
  }

  window.TypeTurboEngine = {
    STATES,
    MODE_CONFIG,
    create(config) {
      return new TypeTurboEngine(config);
    }
  };
})();
