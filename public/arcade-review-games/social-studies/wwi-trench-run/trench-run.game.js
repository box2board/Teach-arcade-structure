(function () {
  const UI = window.TrenchRunUI;

  function pickRandomQuestions(bank, count) {
    const shuffled = bank.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ---------- Local “Best Score” ----------
  const BEST_KEY = "ta_trenchrun_best_v2";
  function readBest() {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) ? v : 0;
  }
  function writeBest(v) {
    localStorage.setItem(BEST_KEY, String(v));
  }

  // ---------- Minimal WebAudio SFX ----------
  class BeepSFX {
    constructor() { this.ctx = null; this.gain = null; }
    ensure() {
      if (this.ctx) return true;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.12;
        this.gain.connect(this.ctx.destination);
        return true;
      } catch { return false; }
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

  // --- Core dimensions (kept “arcade fixed”, scaled to device with FIT) ---
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

  const ENEMIES = [
    { x: 820,  minX: 820,  maxX: 950,  speed: 70,  hop:false },
    { x: 1500, minX: 1450, maxX: 1600, speed: 85,  hop:true  },
    { x: 2150, minX: 2100, maxX: 2250, speed: 75,  hop:false },
    { x: 2900, minX: 2850, maxX: 3000, speed: 92,  hop:true  }
  ];

  const END_X = WORLD_W - 160;

  // “Mario feel” tuned
  const ACCEL = 2100;
  const DRAG = 1800;
  const MAX_VX = 320;
  const GRAVITY = 1300;
  const JUMP_VY = 560;

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

      this.sfx = new BeepSFX();
    }

    preload() {
      // No external assets required.
      // We generate simple pixel textures so sprites are REAL (not null/green boxes).
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

      UI.setHud({ score: 0, best: this.best, answered: 0, total: this.totalQuestions, status: "Running" });

      // Questions
      this.questions = pickRandomQuestions(window.WWI_QUESTION_BANK || [], this.totalQuestions);

      // World bounds + camera
      this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
      this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);
      this.cameras.main.setBackgroundColor("#0b1020");

      // Generate textures once
      this.makeTextures();

      // Background (simple layered rectangles)
      this.bg = this.add.graphics();
      this.drawBackground(0);

      // Ground as static bodies
      this.groundGroup = this.physics.add.staticGroup();
      this.drawGroundSegments();

      // Platforms as static sprites
      this.platformGroup = this.physics.add.staticGroup();
      for (const p of PLATFORMS) {
        const plat = this.platformGroup.create(p.x + p.w/2, p.y + p.h/2, "plat");
        plat.displayWidth = p.w;
        plat.displayHeight = p.h;
        plat.refreshBody();
      }

      // End marker
      this.add.rectangle(END_X, GROUND_Y - 40, 4, 80, 0xf5f5f5).setOrigin(0.5);
      this.add.rectangle(END_X + 18, GROUND_Y - 72, 36, 18, 0xff3657).setOrigin(0.5);

      // Player = REAL sprite with texture
      this.player = this.physics.add.sprite(80, 180, "player");
      this.player.setCollideWorldBounds(true);
      this.player.setGravityY(GRAVITY);
      this.player.setDragX(DRAG);
      this.player.setMaxVelocity(MAX_VX, 760);
      this.player.body.setSize(22, 34, true);

      // Enemies
      this.enemyGroup = this.physics.add.group({ allowGravity: true });
      for (const e of ENEMIES) {
        const s = this.enemyGroup.create(e.x, GROUND_Y - 16, "rat");
        s.setBounce(0);
        s.body.setSize(26, 14, true);
        s.setVelocityX(e.speed);
        s._minX = e.minX;
        s._maxX = e.maxX;
        s._speed = e.speed;
        s._hop = !!e.hop;
        s._hopT = 0;
      }

      // Question blocks:
      // IMPORTANT FIX: use DYNAMIC immovable bodies (not staticGroup) so moving blocks behave correctly.
      this.blockGroup = this.physics.add.group({ allowGravity: false, immovable: true });
      this.qBlocks = [];

      const spacing = (WORLD_W - 800) / this.totalQuestions;
      const baseX = 260;

      for (let i = 0; i < this.totalQuestions; i++) {
        const wx = baseX + spacing * i;

        let y = (i % 3 === 0) ? (GROUND_Y - 90) : (i % 3 === 1 ? 210 : 170);
        const plat = PLATFORMS.find(p => wx >= p.x - 40 && wx <= p.x + p.w + 40);
        if (plat && i % 4 === 0) y = plat.y - 40;

        const isBonus = (i % 5 === 4);
        const isMoving = (i % 6 === 5);

        const tex = isBonus ? "blockBonus" : "block";
        const bSpr = this.blockGroup.create(wx + 16, y + 16, tex);
        bSpr.setCollideWorldBounds(false);
        bSpr.body.setSize(32, 32, true);

        this.qBlocks.push({
          id: i + 1,
          qIndex: i,
          spr: bSpr,
          completed: false,
          firstTry: true,
          bonus: isBonus,
          moving: isMoving,
          baseX: bSpr.x,
          dir: 1,
          speed: 26 + (i % 3) * 10
        });
      }

      // Colliders
      this.physics.add.collider(this.player, this.groundGroup, () => this.updateSafe());
      this.physics.add.collider(this.player, this.platformGroup, () => this.updateSafe());
      this.physics.add.collider(this.enemyGroup, this.groundGroup);
      this.physics.add.collider(this.enemyGroup, this.platformGroup);

      // Overlaps
      this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => this.handleEnemyHit(enemy));
      this.physics.add.overlap(this.player, this.blockGroup, (player, blockSprite) => this.tryOpenBlock(blockSprite));

      // Input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        W: Phaser.Input.Keyboard.KeyCodes.W,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
      });

      // Touch input from UI.js
      this.touch = window.TrenchRunInput || { left:false, right:false, jump:false };

      // Camera follow
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

      if (!this.questions.length) UI.setHud({ status: "Missing question bank (check trench-run.questions.js)" });
    }

    update(time, delta) {
      const dt = delta / 1000;

      // Keep background stable with camera scroll
      this.drawBackground(this.cameras.main.scrollX);

      // Move “moving blocks”
      this.updateMovingBlocks(dt);

      if (this.inQuestion || this.levelComplete) return;

      this.hitCooldown = Math.max(0, this.hitCooldown - dt);

      // Enemy patrol + hop
      this.enemyGroup.getChildren().forEach((e) => {
        if (e.x < e._minX) { e.x = e._minX; e.setVelocityX(Math.abs(e._speed)); }
        if (e.x > e._maxX) { e.x = e._maxX; e.setVelocityX(-Math.abs(e._speed)); }

        if (e._hop) {
          e._hopT -= dt;
          if (e._hopT <= 0) {
            e._hopT = 0.9 + Math.random() * 0.7;
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
      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.W) ||
        Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        !!this.touch.jump;

      if (jumpPressed) {
        this.touch.jump = false;
        this.jumpBufferTimer = JUMP_BUFFER;
      } else {
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      }

      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.player.setVelocityY(-JUMP_VY);
        this.sfx.jump();
      }

      // Pit / fall
      if (this.player.y > GAME_H + 60) {
        this.respawn("-20 | Fell in a shell hole");
      }

      // End condition
      if (this.answered === this.totalQuestions && this.player.x > END_X) {
        this.triggerEnd();
      }
    }

    // ---------- Texture generation (the “clean fix”) ----------
    makeTextures() {
      const make = (key, w, h, drawFn) => {
        if (this.textures.exists(key)) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.clear();
        drawFn(g);
        g.generateTexture(key, w, h);
        g.destroy();
      };

      // Player (simple pixel soldier)
      make("player", 32, 40, (g) => {
        g.fillStyle(0x2f3b2f, 1); // helmet
        g.fillRect(6, 2, 20, 10);
        g.fillStyle(0xd9b382, 1); // face
        g.fillRect(10, 12, 12, 10);
        g.fillStyle(0x3b2a1f, 1); // coat
        g.fillRect(8, 22, 16, 14);
        g.fillStyle(0x1b1b1b, 1); // boots
        g.fillRect(8, 36, 7, 4);
        g.fillRect(17, 36, 7, 4);
      });

      // Rat
      make("rat", 32, 16, (g) => {
        g.fillStyle(0x2a2a35, 1);
        g.fillRect(2, 6, 26, 8);
        g.fillRect(6, 2, 16, 6);
        g.fillStyle(0xff4b4b, 1);
        g.fillRect(22, 4, 2, 2);
      });

      // Normal question block
      make("block", 32, 32, (g) => {
        g.fillStyle(0xc59c3e, 1);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x000000, 0.35);
        g.strokeRect(1, 1, 30, 30);
        g.fillStyle(0x2b210f, 1);
        g.fillRect(14, 10, 4, 12);
        g.fillRect(10, 8, 12, 4);
      });

      // Bonus block
      make("blockBonus", 32, 32, (g) => {
        g.fillStyle(0x60a5fa, 1);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x000000, 0.35);
        g.strokeRect(1, 1, 30, 30);
        g.fillStyle(0x0b1b3a, 1);
        g.fillRect(14, 10, 4, 12);
        g.fillRect(10, 8, 12, 4);
        g.fillStyle(0xffffff, 1);
        g.fillRect(24, 6, 2, 2);
      });

      // Platform texture (stretches)
      make("plat", 64, 16, (g) => {
        g.fillStyle(0x7b5a38, 1);
        g.fillRect(0, 0, 64, 16);
        g.fillStyle(0x5c4128, 1);
        g.fillRect(0, 12, 64, 4);
      });
    }

    // ---------- Blocks ----------
    updateMovingBlocks(dt) {
      for (const b of this.qBlocks) {
        if (!b.moving || b.completed) continue;

        const maxOffset = 50;
        b.spr.x += b.dir * b.speed * dt;

        if (b.spr.x > b.baseX + maxOffset) { b.spr.x = b.baseX + maxOffset; b.dir = -1; }
        if (b.spr.x < b.baseX - maxOffset) { b.spr.x = b.baseX - maxOffset; b.dir =  1; }
      }
    }

    tryOpenBlock(blockSprite) {
      if (this.levelComplete || this.inQuestion) return;
      const block = this.qBlocks.find(b => b.spr === blockSprite);
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

            let add = block.firstTry ? 25 : 10;
            if (block.bonus) { add += 10; this.sfx.bonus(); }

            this.score += add;
            if (block.firstTry) this.firstTryCorrect++;

            block.completed = true;
            block.spr.setTexture("plat"); // visual “used” look without needing a new asset
            block.spr.setTint(0x2f3b2f);
            block.spr.displayWidth = 32;
            block.spr.displayHeight = 14;

            this.answered = this.qBlocks.filter(b => b.completed).length;

            if (this.score > this.best) { this.best = this.score; writeBest(this.best); }

            UI.setHud({
              score: this.score,
              best: this.best,
              answered: this.answered,
              total: this.totalQuestions,
              status: `Question ${this.answered}/${this.totalQuestions} (+${add})`
            });

            setTimeout(() => {
              UI.hideQuestionOverlay();
              this.inQuestion = false;
              UI.setHud({ status: "Running" });
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

      const stomping = p.velocity.y > 0 && (p.bottom - e.top) < 10;

      if (stomping) {
        this.sfx.stomp();
        enemy.destroy();
        this.score += 10;

        if (this.score > this.best) { this.best = this.score; writeBest(this.best); }

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

    // ---------- Safe + respawn ----------
    updateSafe() {
      const overPit = PITS.some(p => this.player.x > p.x && this.player.x < p.x + p.w);
      if (!overPit) {
        this.lastSafe.x = this.player.x;
        this.lastSafe.y = this.player.y;
      }
    }

    respawn(statusText) {
      this.score -= 20;
      if (this.score > this.best) { this.best = this.score; writeBest(this.best); }

      this.player.setPosition(this.lastSafe.x, this.lastSafe.y);
      this.player.setVelocity(0, 0);

      UI.setHud({ score: this.score, best: this.best, answered: this.answered, total: this.totalQuestions, status: statusText });
      this.cameras.main.shake(180, 0.008);
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

    // ---------- World ground ----------
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

      const wx = -(scrollX * 0.65) % 30;
      this.bg.lineStyle(2, 0x9da2b1, 0.85);
      this.bg.beginPath();
      for (let x = -60; x <= GAME_W + 60; x += 18) {
        const wiggle = Math.sin((x + scrollX) * 0.02) * 5;
        this.bg.lineTo(x + wx, 230 + wiggle);
      }
      this.bg.strokePath();

      this.bg.fillStyle(0xffffff, 0.06);
      this.bg.fillRect(0, 165, GAME_W, 40);
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "phaserMount",
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: "#0b1020",

    // IMPORTANT: THIS fixes tiny play window + weird scaling on iPad/mobile.
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_W,
      height: GAME_H
    },

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },

    scene: [TrenchRunScene]
  };

  new Phaser.Game(config);
})();
