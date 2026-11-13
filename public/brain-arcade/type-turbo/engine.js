(() => {
  const STATES = { IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', ENDED: 'ENDED' };

  const MODE_CONFIG = {
    sprint: { label: 'Sprint', timeLimitMs: 60000, lives: null, targetItems: null },
    survival: { label: 'Survival', timeLimitMs: null, lives: 5, targetItems: null },
    accuracy: { label: 'Accuracy Run', timeLimitMs: null, lives: null, targetItems: 50 },
    zen: { label: 'Zen Ride', timeLimitMs: null, lives: null, targetItems: null }
  };

  const DIFFICULTY = {
    easy: { label: 'Easy', timeScale: 1.42 },
    normal: { label: 'Normal', timeScale: 1.18 },
    hard: { label: 'Hard', timeScale: 1 },
    pro: { label: 'Pro', timeScale: 0.86 }
  };

  class TypeTurboEngine {
    constructor({ wordlists = {}, onEvent = () => {} } = {}) {
      this.wordlists = wordlists;
      this.onEvent = onEvent;
      this.state = STATES.IDLE;
      this.rafId = 0;
      this.run = {};
    }

    getState() { return this.state; }

    start({ mode = 'sprint', difficulty = 'easy' } = {}) {
      this.stopLoop();
      const config = MODE_CONFIG[mode] || MODE_CONFIG.sprint;
      const now = performance.now();
      this.run = {
        mode, difficulty, startTs: now, lastTick: now, pauseStartedAt: 0,
        remainingMs: config.timeLimitMs, lives: config.lives,
        completedItems: 0, correctItems: 0, missedItems: 0,
        totalChars: 0, correctChars: 0, combo: 0, bestCombo: 0,
        currentErrors: 0, lastInput: '', target: '', lastTarget: '',
        targetDeadline: Infinity, score: 0
      };
      this.state = STATES.RUNNING;
      this.emit('onStart', { mode, difficulty });
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
      if (Number.isFinite(this.run.targetDeadline)) this.run.targetDeadline += pausedFor;
      this.state = STATES.RUNNING;
      this.emit('onResume');
      this.pushStats();
      this.loop();
    }

    restart() {
      this.stopLoop();
      this.state = STATES.IDLE;
      this.run = {};
    }

    submitInput(raw) {
      if (this.state !== STATES.RUNNING || !this.run.target) return;
      const next = String(raw || '').slice(0, this.run.target.length);
      const added = Math.max(0, next.length - this.run.lastInput.length);
      for (let i = 0; i < added; i += 1) {
        const position = this.run.lastInput.length + i;
        this.run.totalChars += 1;
        if (next[position] === this.run.target[position]) this.run.correctChars += 1;
        else {
          this.run.currentErrors += 1;
          this.emit('onInputError', { position, targetChar: this.run.target[position] });
        }
      }
      this.run.lastInput = next;
      this.emit('onInputChange', {
        value: next,
        targetText: this.run.target,
        errors: this.run.currentErrors
      });
      if (next === this.run.target) {
        this.markCorrect();
      } else {
        this.pushStats();
      }
    }

    markCorrect() {
      const errors = this.run.currentErrors;
      const clean = errors === 0;
      this.run.completedItems += 1;
      this.run.correctItems += 1;
      if (clean) {
        this.run.combo += 1;
        this.run.bestCombo = Math.max(this.run.bestCombo, this.run.combo);
      } else {
        this.run.combo = 0;
      }
      const multiplier = 1 + Math.min(this.run.combo, 10) * 0.12;
      const cleanBonus = clean ? 1.25 : 1;
      const points = Math.round(this.run.target.length * 10 * multiplier * cleanBonus);
      this.run.score += points;
      this.emit('onCorrect', {
        combo: this.run.combo,
        clean,
        points,
        errors,
        targetLength: this.run.target.length
      });
      this.run.lastTarget = this.run.target;
      if (this.run.mode === 'accuracy' && this.run.completedItems >= MODE_CONFIG.accuracy.targetItems) {
        this.end('Accuracy run complete');
        return;
      }
      this.nextTarget();
      this.pushStats();
    }

    markTimeout() {
      if (this.state !== STATES.RUNNING) return;
      this.run.completedItems += 1;
      this.run.missedItems += 1;
      this.run.combo = 0;
      this.run.currentErrors = 0;
      if (this.run.mode === 'survival') {
        this.run.lives -= 1;
        this.emit('onTimeout', { lives: this.run.lives, reason: 'Word timer expired' });
        if (this.run.lives <= 0) {
          this.end('Out of lives');
          return;
        }
      } else {
        this.emit('onTimeout', { reason: 'Word timer expired' });
      }
      this.nextTarget();
      this.pushStats();
    }

    nextTarget() {
      const target = this.pickTarget();
      this.run.target = target;
      this.run.lastInput = '';
      this.run.currentErrors = 0;
      this.run.targetDeadline = this.run.mode === 'survival'
        ? performance.now() + this.getTargetWindow(target)
        : Infinity;
      this.emit('onTargetNew', {
        targetText: target,
        timeLimitMs: Number.isFinite(this.run.targetDeadline)
          ? this.run.targetDeadline - performance.now()
          : null
      });
    }

    getTargetWindow(target) {
      const scale = DIFFICULTY[this.run.difficulty]?.timeScale || 1;
      return Math.round(Math.max(6200, (4800 + target.length * 760) * scale));
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
      const pool = [...(pools[d] || pools.easy || [])];
      if ((d === 'hard' || d === 'pro') && Math.random() < 0.28) {
        pool.push(...(wl.SHORT_PHRASES || wl.PHRASES || []));
      }
      if (!pool.length) return 'turbo';
      let next = pool[Math.floor(Math.random() * pool.length)];
      let guard = 0;
      while (next === this.run.lastTarget && pool.length > 1 && guard < 12) {
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
          this.end('Sprint complete');
          return;
        }
      }
      if (now >= this.run.targetDeadline) {
        this.markTimeout();
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
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    getStats() {
      const now = this.state === STATES.PAUSED ? this.run.pauseStartedAt : performance.now();
      const runTimeMs = Math.max(now - (this.run.startTs || now), 1000 / 60);
      const minutes = runTimeMs / 60000;
      const wpm = ((this.run.correctChars || 0) / 5) / minutes;
      const accuracy = (this.run.totalChars || 0) > 0
        ? ((this.run.correctChars || 0) / this.run.totalChars) * 100
        : 100;
      return {
        state: this.state,
        mode: this.run.mode,
        difficulty: this.run.difficulty,
        remainingMs: this.run.remainingMs,
        targetDeadline: this.run.targetDeadline,
        lives: this.run.lives,
        combo: this.run.combo || 0,
        bestCombo: this.run.bestCombo || 0,
        completedItems: this.run.completedItems || 0,
        correctItems: this.run.correctItems || 0,
        missedItems: this.run.missedItems || 0,
        score: this.run.score || 0,
        wpm: Number.isFinite(wpm) ? wpm : 0,
        accuracy: Number.isFinite(accuracy) ? accuracy : 100
      };
    }

    pushStats() { this.emit('onStatsUpdate', this.getStats()); }
    emit(name, payload = {}) { this.onEvent(name, payload); }
  }

  window.TypeTurboEngine = {
    STATES,
    MODE_CONFIG,
    create(config) { return new TypeTurboEngine(config); }
  };
})();
