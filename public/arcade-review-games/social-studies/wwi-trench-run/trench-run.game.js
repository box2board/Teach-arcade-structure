(function () {
  const UI = window.TrenchRunUI;

  function pickRandomQuestions(bank, count) {
    const shuffled = bank.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ---------- Local “Best Score” ----------
  const BEST_KEY = "ta_trenchrun_best_v1";
  function readBest() {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) ? v : 0;
  }
  function writeBest(v) {
    localStorage.setItem(BEST_KEY, String(v));
  }

  // ---------- Minimal WebAudio SFX (no files needed) ----------
  class BeepSFX {
    constructor() {
      this.ctx = null;
      this.gain = null;
    }
    ensure() {
      if (this.ctx) return true;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.12;
        this.gain.connect(this.ctx.destination);
        return true;
      } catch {
        return false;
      }
    }
    play(freq = 440, dur = 0.06, type = "square") {
      const enabled = (window.TrenchRunSFX?.enabled ?? true);
      if (!enabled) return;
      if (!this.ensure()) return;

      if (this.ctx.state === "suspended") this.ctx.resume().catch(()=>{});

      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;

      const g = this.ctx.createGain();
      g.gain.value = 0.0001;

      o.connect(g);
      g.connect(this.gain);

      const now = this.ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      o.start(now);
      o.stop(now + dur + 0.02);
    }
    jump()   { this.play(620, 0.07, "square"); }
    stomp()  { this.play(220, 0.06, "square"); }
    hurt()   { this.play(110, 0.10, "sawtooth"); }
    correct(){ this.play(880, 0.08, "triangle"); this.play(1320, 0.06, "triangle"); }
    wrong()  { this.play(180, 0.10, "square"); }
    bonus()  { this.play(990, 0.06, "triangle"); }
  }

  const GAME_W = 960;
  const GAME_H = 360;

  const WORLD_W = 80 * 48;
  const GROUND_Y = 280;

  const PITS = [
    { x: 900,  w: 90 },
    { x: 1400, w: 110 },
    { x: 1950, w: 110 },
    { x: 2550, w: 130 },
    { x: 3200, w: 110 }
  ];

  const PLATFORMS = [
    { x: 600,  y: 230, w: 130, h: 12 },
    { x: 1000, y: 205, w: 140, h: 12 },
    { x: 1350, y: 190, w: 120, h: 12 },
    { x: 1750, y: 210, w: 130, h: 12 },
    { x: 2100, y: 180, w: 140, h: 12 },
    { x: 2300, y: 150, w: 130, h: 12 },
    { x: 2700, y: 190, w: 160, h: 12 },
    { x: 3100, y: 175, w: 140, h: 12 }
  ];

  // Enemy variants: { hop: true } means occasional little hop
  const ENEMIES = [
    { x: 820,  minX: 820,  maxX: 950,  speed: 70,  hop:false },
    { x: 1500, minX: 1450, maxX: 1600, speed: 85,  hop:true  },
    { x: 2150, minX: 2100, maxX: 2250, speed: 75,  hop:false },
    { x: 2900, minX: 2850, maxX: 3000, speed: 92,  hop:true  }
  ];

  const END_X = WORLD_W - 160;

  // “Mario feel”
  const ACCEL = 1800;
  const DRAG = 1600;
  const MAX_VX = 300;
  const GRAVITY = 1200;
  const JUMP_VY = 520;

  const COYOTE_TIME = 0.10;
  const JUMP_BUFFER = 0.12;

  class TrenchRunScene extends Phaser.Scene {
    constructor() {
      super("TrenchRun");

      this.best = 0;
      this.score = 0;
      this.answered = 0;
      this.firstTryCorrect = 0;
      this.totalQuestions = 20;

      this.inQuestion = false;
      this.levelComplete = false;
      this.hitCooldown = 0;

      this.lastSafe = { x: 80, y: 180 };

      this.questions = [];
      this.qBlocks = [];

      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;

      // Particles (procedural)
      this.puffs = [];

      // SFX
      this.sfx = new BeepSFX();
    }

    create() {
      UI.hideEndOverlay();

      this.best = readBest();
      this.score = 0;
      this.answered = 0;
      this.firstTryCorrect = 0;
      this.levelComplete = false;
      this.inQuestion = false;
      this.hitCooldown = 0;
      this.lastSafe = { x: 80, y: 180 };
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.puffs = [];

      UI.setHud({ score: 0, best: this.best, answered: 0, total: this.totalQuestions, status: "Running" });

      this.questions = pickRandomQuestions(window.WWI_QUESTION_BANK || [], this.totalQuestions);

      this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
      this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);
      this.cameras.main.setBackgroundColor("#0b1020");

      this.bg = this.add.graphics();
      this.drawBackground(0);

      this.groundGroup = this.physics.add.staticGroup();
      this.drawGroundSegments();

      this.platformGroup = this.physics.add.staticGroup();
      for (const p of PLATFORMS) {
        const r = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 0x7b5a38).setOrigin(0.5);
        this.physics.add.existing(r, true);
        this.platformGroup.add(r);
        this.add.rectangle(p.x + p.w / 2, p.y + p.h - 2, p.w, 4, 0x5c4128).setOrigin(0.5);
      }

      this.endPole = this.add.rectangle(END_X, GROUND_Y - 40, 4, 80, 0xf5f5f5).setOrigin(0.5);
      this.endFlag = this.add.rectangle(END_X + 18, GROUND_Y - 72, 36, 18, 0xff3657).setOrigin(0.5);

      this.player = this.physics.add.sprite(80, 180, null);
      this.player.setSize(28, 40);
      this.player.body.setOffset(-14, -20);
      this.player.setCollideWorldBounds(true);
      this.player.setGravityY(GRAVITY);
      this.player.setDragX(DRAG);
      this.player.setMaxVelocity(MAX_VX, 760);

      this.playerGfx = this.add.graphics().setDepth(6);

      // Enemies
      this.enemyGroup = this.physics.add.group();
      for (const e of ENEMIES) {
        const s = this.physics.add.sprite(e.x, GROUND_Y - 16, null);
        s.setSize(26, 16);
        s.body.setOffset(-13, -8);
        s.setVelocityX(e.speed);
        s._minX = e.minX;
        s._maxX = e.maxX;
        s._speed = e.speed;
        s._hop = !!e.hop;
        s._hopT = 0;
        this.enemyGroup.add(s);
      }
      this.enemyGfx = this.add.graphics().setDepth(5);

      // Question blocks (variety)
      this.blockGroup = this.physics.add.staticGroup();
      this.blockGfx = this.add.graphics().setDepth(4);
      this.qBlocks = [];

      const spacing = (WORLD_W - 800) / this.totalQuestions;
      const baseX = 260;

      for (let i = 0; i < this.totalQuestions; i++) {
        const wx = baseX + spacing * i;

        // y variety
        let y = (i % 3 === 0) ? (GROUND_Y - 90) : (i % 3 === 1 ? 210 : 170);
        const plat = PLATFORMS.find(p => wx >= p.x - 40 && wx <= p.x + p.w + 40);
        if (plat && i % 4 === 0) y = plat.y - 40;

        // type variety:
        // - bonus blocks every 5th (extra points)
        // - moving blocks every 6th (horizontal drift)
        const isBonus = (i % 5 === 4);
        const isMoving = (i % 6 === 5);

        const r = this.add.rectangle(wx + 16, y + 16, 32, 32, isBonus ? 0x60a5fa : 0xc59c3e).setOrigin(0.5);
        this.physics.add.existing(r, true);
        this.blockGroup.add(r);

        this.qBlocks.push({
          id: i + 1,
          qIndex: i,
          rect: r,
          completed: false,
          firstTry: true,
          bonus: isBonus,
          moving: isMoving,
          baseX: r.x,
          dir: 1,
          speed: 26 + (i % 3) * 10
        });
      }

      // Colliders
      this.physics.add.collider(this.player, this.groundGroup, () => this.updateSafe());
      this.physics.add.collider(this.player, this.platformGroup, () => this.updateSafe());
      this.physics.add.collider(this.enemyGroup, this.groundGroup);
      this.physics.add.collider(this.enemyGroup, this.platformGroup);

      this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => this.handleEnemyHit(enemy));
      this.physics.add.overlap(this.player, this.blockGroup, (player, rect) => this.tryOpenBlock(rect));

      // Input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        W: Phaser.Input.Keyboard.KeyCodes.W,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
      });

      this.touch = window.TrenchRunInput || { left:false, right:false, jump:false };

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

      this.redrawBlocks();
      this.renderProceduralSprites();

      if (!this.questions.length) UI.setHud({ status: "Missing question bank (check trench-run.questions.js)" });
    }

    update(time, delta) {
      const dt = delta / 1000;

      // Background parallax-ish redraw
      this.drawBackground(this.cameras.main.scrollX);

      // Update puff particles
      this.updatePuffs(dt);

      // Move “moving blocks” (static physics rectangles need re-position and body refresh)
      this.updateMovingBlocks(dt);

      if (this.inQuestion || this.levelComplete) {
        this.renderProceduralSprites();
        this.redrawBlocks();
        return;
      }

      this.hitCooldown = Math.max(0, this.hitCooldown - dt);

      // Enemy patrol + hop variant
      this.enemyGroup.getChildren().forEach((e) => {
        // Reverse at bounds
        if (e.x < e._minX) { e.x = e._minX; e.setVelocityX(Math.abs(e._speed)); }
        if (e.x > e._maxX) { e.x = e._maxX; e.setVelocityX(-Math.abs(e._speed)); }

        // Hop behavior
        if (e._hop) {
          e._hopT -= dt;
          if (e._hopT <= 0) {
            e._hopT = 0.9 + Math.random() * 0.7;
            // tiny hop only if on ground-ish
            if (Math.abs(e.body.velocity.y) < 5) e.setVelocityY(-180);
          }
        }
      });

      // Movement
      const left = this.cursors.left.isDown || this.keys.A.isDown || this.touch.left;
      const right = this.cursors.right.isDown || this.keys.D.isDown || this.touch.right;

      if (left) this.player.setAccelerationX(-ACCEL);
      else if (right) this.player.setAccelerationX(ACCEL);
      else this.player.setAccelerationX(0);

      // Coyote time
      const onGround = this.player.body.blocked.down || this.player.body.touching.down;
      if (onGround) this.coyoteTimer = COYOTE_TIME;
      else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

      // Jump buffer
      const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.W) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
                          !!this.touch.jump;

      if (jumpPressed) {
        this.touch.jump = false;
        this.jumpBufferTimer = JUMP_BUFFER;
      } else {
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      }

      // Execute jump
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.player.setVelocityY(-JUMP_VY);
        this.sfx.jump();
        this.spawnPuff(this.player.x, this.player.y + 18, 10, 0.22);
      }

      // Landing puff (detect transition)
      if (onGround && !this._wasGround) {
        this.spawnPuff(this.player.x, this.player.y + 18, 12, 0.18);
      }
      this._wasGround = onGround;

      // Pit / void fall
      if (this.player.y > GAME_H + 60) {
        this.respawn("-20 | Fell in a shell hole");
      }

      // End
      if (this.answered === this.totalQuestions && this.player.x > END_X) {
        this.triggerEnd();
      }

      // Render
      this.renderProceduralSprites();
      this.redrawBlocks();
    }

    // ---------- Blocks ----------
    updateMovingBlocks(dt) {
      for (const b of this.qBlocks) {
        if (!b.moving || b.completed) continue;

        // oscillate +- 50px from baseX
        const maxOffset = 50;
        b.rect.x += b.dir * b.speed * dt;

        if (b.rect.x > b.baseX + maxOffset) { b.rect.x = b.baseX + maxOffset; b.dir = -1; }
        if (b.rect.x < b.baseX - maxOffset) { b.rect.x = b.baseX - maxOffset; b.dir =  1; }

        // refresh static body position
        b.rect.body.updateFromGameObject();
      }
    }

    redrawBlocks() {
      this.blockGfx.clear();
      const camX = this.cameras.main.scrollX;

      for (const b of this.qBlocks) {
        const r = b.rect;
        const sx = r.x - camX;
        const sy = r.y;

        let fill;
        if (b.completed) fill = 0x3a4b32;
        else if (b.bonus) fill = 0x60a5fa; // blue bonus
        else fill = 0xc59c3e; // gold

        this.blockGfx.fillStyle(fill, 1);
        this.blockGfx.fillRect(sx - 16, sy - 16, 32, 32);

        this.blockGfx.lineStyle(1, 0x000000, 0.55);
        this.blockGfx.strokeRect(sx - 16, sy - 16, 32, 32);

        // little “?” mark (procedural)
        this.blockGfx.fillStyle(0x2b210f, 1);
        this.blockGfx.fillRect(sx - 2, sy - 4, 4, 10);
        this.blockGfx.fillRect(sx - 6, sy - 8, 12, 4);

        // bonus sparkle dot
        if (b.bonus && !b.completed) {
          this.blockGfx.fillStyle(0xffffff, 1);
          this.blockGfx.fillRect(sx + 10, sy - 10, 2, 2);
        }
      }
    }

    tryOpenBlock(rect) {
      if (this.levelComplete || this.inQuestion) return;
      const block = this.qBlocks.find(b => b.rect === rect);
      if (!block || block.completed) return;
      this.openQuestion(block);
    }

    openQuestion(block) {
      this.inQuestion = true;
      UI.setHud({ score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions, status: "Answering" });

      const q = this.questions[block.qIndex];

      UI.showQuestionOverlay({
        number: block.id,
        question: q,
        lockResume: true,
        onResume: () => {
          this.inQuestion = false;
          UI.setHud({ status: "Running" });
        },
        onAnswer: (selectedIndex, btnEl) => {
          const isCorrect = selectedIndex === q.correctIndex;

          if (isCorrect) {
            UI.markChoice(btnEl, "correct");
            UI.setFeedback("Correct!");
            this.sfx.correct();

            // scoring
            let add = block.firstTry ? 25 : 10;

            // BONUS block extra
            if (block.bonus) {
              add += 10;
              this.sfx.bonus();
            }

            this.score += add;

            if (block.firstTry) this.firstTryCorrect++;

            block.completed = true;
            this.answered = this.qBlocks.filter(b => b.completed).length;

            // update best
            if (this.score > this.best) {
              this.best = this.score;
              writeBest(this.best);
            }

            UI.setHud({
              score: this.score,
              best: this.best,
              answered: this.answered,
              total: this.totalQuestions,
              status: `Question ${this.answered} / ${this.totalQuestions} complete (+${add})`
            });

            // Correct sparkle puff
            this.spawnPuff(block.rect.x, block.rect.y, 16, 0.24);

            setTimeout(() => {
              UI.hideQuestionOverlay();
              this.inQuestion = false;
              UI.setHud({ status: "Running" });
              this.redrawBlocks();
            }, 420);
          } else {
            UI.markChoice(btnEl, "wrong");
            UI.setFeedback("Incorrect. Try again.");
            this.sfx.wrong();

            this.score -= 10;
            block.firstTry = false;

            UI.setHud({
              score: this.score,
              best: this.best,
              answered: this.answered,
              total: this.totalQuestions,
              status: "Recheck your notes (-10)"
            });
          }
        }
      });
    }

    // ---------- Enemies ----------
    handleEnemyHit(enemy) {
      if (this.levelComplete || this.inQuestion) return;

      const p = this.player.body;
      const e = enemy.body;

      // stomp check
      const stomping = p.velocity.y > 0 && (p.bottom - e.top) < 10;

      if (stomping) {
        this.sfx.stomp();
        this.spawnPuff(enemy.x, enemy.y, 14, 0.22);

        enemy.destroy();
        this.score += 10;

        if (this.score > this.best) {
          this.best = this.score;
          writeBest(this.best);
        }

        UI.setHud({ score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions, status: "Stomped a rat (+10)" });
        this.player.setVelocityY(-320);
        this.cameras.main.shake(90, 0.004);
        return;
      }

      if (this.hitCooldown <= 0) {
        this.sfx.hurt();
        this.hitCooldown = 1.0;
        this.score -= 15;
        UI.setHud({ score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions, status: "Bitten (-15)" });
        this.cameras.main.shake(140, 0.006);
        this.player.x += (enemy.body.velocity.x >= 0 ? -18 : 18);
      }
    }

    // ---------- Safe position + respawn ----------
    updateSafe() {
      const overPit = PITS.some(p => this.player.x > p.x && this.player.x < p.x + p.w);
      if (!overPit) {
        this.lastSafe.x = this.player.x;
        this.lastSafe.y = this.player.y;
      }
    }

    respawn(statusText) {
      this.score -= 20;

      if (this.score > this.best) {
        this.best = this.score;
        writeBest(this.best);
      }

      this.player.setPosition(this.lastSafe.x, this.lastSafe.y);
      this.player.setVelocity(0, 0);

      UI.setHud({ score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions, status: statusText });
      this.cameras.main.shake(180, 0.008);
      this.spawnPuff(this.player.x, this.player.y + 18, 18, 0.28);
    }

    // ---------- End ----------
    triggerEnd() {
      this.levelComplete = true;

      const accuracy = Math.round((this.firstTryCorrect / this.totalQuestions) * 100);
      const summary =
        `Score: ${this.score} | Best: ${this.best} | First-try accuracy: ${this.firstTryCorrect}/${this.totalQuestions} (${accuracy}%)`;

      UI.setHud({ status: "Complete", score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions });

      UI.showEndOverlay({
        summary,
        onReplay: () => { UI.hideEndOverlay(); this.scene.restart(); },
        onMoreGames: () => { window.location.href = "/arcade-review-games/index.html"; }
      });
    }

    // ---------- Background + world ----------
    drawGroundSegments() {
      const segments = [];
      let cursor = 0;
      const sortedPits = PITS.slice().sort((a,b) => a.x - b.x);

      for (const pit of sortedPits) {
        const segW = pit.x - cursor;
        if (segW > 0) segments.push({ x: cursor, w: segW });
        cursor = pit.x + pit.w;
      }
      if (cursor < WORLD_W) segments.push({ x: cursor, w: WORLD_W - cursor });

      for (const s of segments) {
        const r = this.add.rectangle(s.x + s.w / 2, GROUND_Y + (GAME_H - GROUND_Y) / 2, s.w, (GAME_H - GROUND_Y), 0x5a4334).setOrigin(0.5);
        this.physics.add.existing(r, true);
        this.groundGroup.add(r);

        this.add.rectangle(s.x + s.w / 2, GROUND_Y - 6, s.w, 12, 0x7b5a38).setOrigin(0.5);
      }

      for (const pit of PITS) {
        this.add.rectangle(pit.x + pit.w / 2, GROUND_Y + (GAME_H - GROUND_Y) / 2, pit.w, (GAME_H - GROUND_Y), 0x17131b).setOrigin(0.5);
      }
    }

    drawBackground(scrollX) {
      this.bg.clear();

      this.bg.fillStyle(0x0f1226, 1);
      this.bg.fillRect(0, 0, GAME_W, GAME_H);
      this.bg.fillStyle(0x3b4c8b, 0.85);
      this.bg.fillRect(0, 60, GAME_W, 140);
      this.bg.fillStyle(0x120f18, 0.9);
      this.bg.fillRect(0, 200, GAME_W, 160);

      const ox = -(scrollX * 0.15) % 220;
      this.bg.fillStyle(0x101326, 1);
      for (let x = -240; x < GAME_W + 240; x += 60) {
        const h = 16 + 10 * Math.sin((x + scrollX * 0.02) * 0.02);
        this.bg.fillRect(x + ox, 195 - h, 70, 160);
      }

      const mx = -(scrollX * 0.35) % 240;
      this.bg.fillStyle(0x0c0f1d, 1);
      for (let x = -260; x < GAME_W + 260; x += 220) {
        this.bg.fillRect(x + mx + 30, 205, 50, 36);
        this.bg.fillRect(x + mx + 10, 220, 90, 10);
      }

      const wx = -(scrollX * 0.65) % 30;
      this.bg.lineStyle(2, 0x9da2b1, 0.85);
      this.bg.beginPath();
      for (let x = -60; x <= GAME_W + 60; x += 18) {
        const wiggle = Math.sin((x + scrollX) * 0.02) * 5;
        this.bg.lineTo(x + wx, 230 + wiggle);
      }
      this.bg.strokePath();

      // subtle haze
      this.bg.fillStyle(0xffffff, 0.06);
      this.bg.fillRect(0, 165, GAME_W, 40);
    }

    // ---------- Procedural sprites ----------
    renderProceduralSprites() {
      const camX = this.cameras.main.scrollX;

      // Player
      this.playerGfx.clear();
      const px = this.player.x - camX;
      const py = this.player.y;

      this.playerGfx.fillStyle(0x2a2016, 1);
      this.playerGfx.fillRect(px - 10, py + 12, 8, 10);
      this.playerGfx.fillRect(px + 2,  py + 12, 8, 10);

      this.playerGfx.fillStyle(0xf4c542, 1);
      this.playerGfx.fillRect(px - 12, py - 8, 24, 22);

      this.playerGfx.fillStyle(0xffb300, 1);
      this.playerGfx.fillRect(px - 13, py - 18, 26, 10);
      this.playerGfx.fillStyle(0xd08e18, 1);
      this.playerGfx.fillRect(px - 13, py - 10, 26, 2);

      this.playerGfx.fillStyle(0x111111, 1);
      this.playerGfx.fillRect(px - 6, py - 14, 2, 2);
      this.playerGfx.fillRect(px + 4, py - 14, 2, 2);

      // Enemies
      this.enemyGfx.clear();
      this.enemyGroup.getChildren().forEach((e) => {
        const ex = e.x - camX;
        const ey = e.y;

        this.enemyGfx.fillStyle(0x262635, 1);
        this.enemyGfx.fillRect(ex - 13, ey - 4, 26, 12);
        this.enemyGfx.fillRect(ex - 9,  ey - 10, 18, 6);

        this.enemyGfx.fillStyle(0xff4b4b, 1);
        this.enemyGfx.fillRect(ex + 7, ey - 8, 2, 2);
      });

      // Puffs
      this.drawPuffs(camX);
    }

    // ---------- Particles (code-only puffs) ----------
    spawnPuff(x, y, maxR, life) {
      const count = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        this.puffs.push({
          x: x + (Math.random() * 12 - 6),
          y: y + (Math.random() * 6 - 3),
          vx: (Math.random() * 120 - 60),
          vy: -(40 + Math.random() * 80),
          r: 2 + Math.random() * 2,
          maxR,
          life,
          t: life
        });
      }
    }

    updatePuffs(dt) {
      for (let i = this.puffs.length - 1; i >= 0; i--) {
        const p = this.puffs[i];
        p.t -= dt;
        if (p.t <= 0) {
          this.puffs.splice(i, 1);
          continue;
        }
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    drawPuffs(camX) {
      if (!this.puffs.length) return;

      // reuse enemyGfx or playerGfx? keep separate draw into playerGfx for simplicity:
      // (already called per frame, so it's fine)
      for (const p of this.puffs) {
        const alpha = Math.max(0, p.t / p.life);
        const r = p.r + (p.maxR * (1 - alpha)) * 0.10;

        this.playerGfx.fillStyle(0xffffff, 0.12 * alpha);
        this.playerGfx.fillCircle(p.x - camX, p.y, r + 3);

        this.playerGfx.fillStyle(0xe5e7eb, 0.22 * alpha);
        this.playerGfx.fillCircle(p.x - camX, p.y, r);
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "phaserMount",
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: "#0b1020",
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [TrenchRunScene]
  };

  new Phaser.Game(config);
})();
