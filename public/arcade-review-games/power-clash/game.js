(() => {
  "use strict";

  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const topics = window.POWER_CLASH_TOPICS || [];
  const keys = new Set();
  const state = { mode: "welcome", topic: topics[0], sound: false, roundQuestion: 0, usedQuestions: [], activePlayer: 1, questionMode: "opening", feedbackLock: false, lastTime: 0, toastTimer: 0, winner: 0 };
  const fighters = [
    null,
    { id: 1, x: 245, y: 326, vx: 0, vy: 0, w: 58, h: 112, face: 1, hp: 100, juice: 0, color: "#57d7ff", dark: "#17688b", attack: 0, invuln: 0, grounded: false },
    { id: 2, x: 655, y: 326, vx: 0, vy: 0, w: 58, h: 112, face: -1, hp: 100, juice: 0, color: "#ff7099", dark: "#91385f", attack: 0, invuln: 0, grounded: false }
  ];
  const floorY = 438;
  const GRAVITY = 1900;
  const config = {
    1: { left: ["KeyA"], right: ["KeyD"], jump: ["KeyW"], punch: ["KeyF"], kick: ["KeyG"], dash: ["KeyQ"] },
    2: { left: ["ArrowLeft"], right: ["ArrowRight"], jump: ["ArrowUp"], punch: ["Slash"], kick: ["Period"], dash: ["ShiftRight", "ShiftLeft"] }
  };

  function init() {
    if (!topics.length) return;
    const select = $("topic-select");
    topics.forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.title;
      select.append(option);
    });
    select.addEventListener("change", () => { state.topic = topics.find((topic) => topic.id === select.value) || topics[0]; });
    $("start-button").addEventListener("click", startGame);
    $("rematch-button").addEventListener("click", startGame);
    $("change-topic-button").addEventListener("click", () => showScreen("welcome-screen"));
    $("sound-toggle").addEventListener("click", toggleSound);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", (event) => keys.delete(event.code));
    window.addEventListener("blur", () => keys.clear());
    requestAnimationFrame(frame);
  }

  function startGame() {
    state.topic = topics.find((topic) => topic.id === $("topic-select").value) || topics[0];
    state.mode = "opening";
    state.roundQuestion = 0;
    state.usedQuestions = [];
    state.winner = 0;
    for (const player of fighters.slice(1)) Object.assign(player, { x: player.id === 1 ? 245 : 655, y: floorY - 112, vx: 0, vy: 0, face: player.id === 1 ? 1 : -1, hp: 100, juice: 0, attack: 0, invuln: 0, grounded: true });
    $("topic-label").textContent = state.topic.shortTitle;
    applyArenaTheme();
    $("hud").hidden = false;
    $("controls-bar").hidden = false;
    showScreen("question-screen");
    askOpeningQuestion();
    syncHud();
  }

  function applyArenaTheme() {
    document.documentElement.style.setProperty("--arena-sky", state.topic.arena.sky);
    document.documentElement.style.setProperty("--arena-glow", state.topic.arena.glow);
    document.documentElement.style.setProperty("--arena-floor", state.topic.arena.floor);
    document.documentElement.style.setProperty("--arena-accent", state.topic.arena.accent);
  }

  function showScreen(id) {
    for (const screen of ["welcome-screen", "question-screen", "end-screen"]) $(screen).hidden = screen !== id;
    if (id === "welcome-screen") { $("hud").hidden = true; $("controls-bar").hidden = true; state.mode = "welcome"; }
  }

  function askOpeningQuestion() {
    if (state.roundQuestion >= 10) {
      state.mode = "fight";
      showScreen("");
      $("round-state").textContent = "FIGHT!";
      toast("Power up complete — fight!");
      syncHud();
      return;
    }
    state.activePlayer = state.roundQuestion % 2 === 0 ? 1 : 2;
    state.questionMode = "opening";
    presentQuestion();
  }

  function askRecharge(playerId) {
    if (state.mode === "end") return;
    state.mode = "recharge";
    state.questionMode = "recharge";
    state.activePlayer = playerId;
    $("round-state").textContent = "RECHARGE";
    showScreen("question-screen");
    presentQuestion();
  }

  function pickQuestion() {
    const list = state.topic.questions;
    if (!list.length) return null;
    let available = list.map((_, index) => index).filter((index) => !state.usedQuestions.includes(index));
    if (!available.length) { state.usedQuestions = []; available = list.map((_, index) => index); }
    const index = available[Math.floor(Math.random() * available.length)];
    state.usedQuestions.push(index);
    return list[index];
  }

  function presentQuestion() {
    state.currentQuestion = pickQuestion();
    if (!state.currentQuestion) return;
    state.feedbackLock = false;
    const p = fighters[state.activePlayer];
    $("question-phase").textContent = state.questionMode === "opening" ? "POWER ROUND" : "JUICE RECHARGE";
    $("question-count").textContent = state.questionMode === "opening" ? `QUESTION ${state.roundQuestion + 1} OF 10` : "ANSWER CORRECTLY TO RECHARGE";
    $("question-player").textContent = `PLAYER ${p.id}, ${state.questionMode === "opening" ? "ANSWER TO EARN JUICE" : "ANSWER TO GET BACK IN THE FIGHT"}`;
    $("question-prompt").textContent = state.currentQuestion.prompt;
    $("question-feedback").textContent = "";
    const grid = $("answer-grid");
    grid.replaceChildren();
    state.currentQuestion.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
      button.addEventListener("click", () => answerQuestion(index, button));
      grid.append(button);
    });
  }

  function answerQuestion(index, selectedButton) {
    if (state.feedbackLock) return;
    state.feedbackLock = true;
    const correct = index === state.currentQuestion.answer;
    const buttons = [...$("answer-grid").querySelectorAll("button")];
    buttons.forEach((button, i) => {
      button.disabled = true;
      if (i === state.currentQuestion.answer) button.classList.add("correct");
    });
    if (!correct) selectedButton.classList.add("incorrect");
    const player = fighters[state.activePlayer];
    if (correct) {
      player.juice = Math.min(100, player.juice + (state.questionMode === "opening" ? 20 : 25));
      $("question-feedback").textContent = `Correct! +${state.questionMode === "opening" ? 20 : 25} juice. ${state.currentQuestion.explanation}`;
      playTone(660);
    } else {
      $("question-feedback").textContent = `Not quite. ${state.currentQuestion.explanation}`;
      playTone(220);
    }
    syncHud();
    window.setTimeout(() => {
      if (state.questionMode === "opening") { state.roundQuestion += 1; askOpeningQuestion(); }
      else if (correct) { state.mode = "fight"; showScreen(""); $("round-state").textContent = "FIGHT!"; toast(`PLAYER ${player.id} recharged +25`); }
      else presentQuestion();
    }, 1050);
  }

  function onKeyDown(event) {
    const code = event.code;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) event.preventDefault();
    if (state.mode !== "fight") return;
    if (keys.has(code)) return;
    keys.add(code);
    for (let id = 1; id <= 2; id++) {
      const c = config[id];
      if (c.punch.includes(code)) attack(fighters[id], "punch");
      if (c.kick.includes(code)) attack(fighters[id], "kick");
      if (c.dash.includes(code)) dash(fighters[id]);
      if (c.jump.includes(code) && fighters[id].grounded && spend(fighters[id], 4, "jump")) { fighters[id].vy = -690; fighters[id].grounded = false; }
    }
  }

  function spend(player, amount, action) {
    if (player.juice < amount) { toast(`PLAYER ${player.id} needs juice for ${action}`); askRecharge(player.id); return false; }
    player.juice = Math.max(0, player.juice - amount);
    syncHud();
    return true;
  }

  function attack(player, kind) {
    if (state.mode !== "fight") return;
    const cost = kind === "punch" ? 8 : 15;
    if (!spend(player, cost, kind)) return;
    player.attack = kind === "punch" ? .2 : .3;
    const opponent = fighters[player.id === 1 ? 2 : 1];
    const reach = kind === "punch" ? 88 : 105;
    const verticalReach = kind === "punch" ? 68 : 90;
    const distance = (opponent.x + opponent.w / 2) - (player.x + player.w / 2);
    if (Math.abs(distance) < reach && Math.abs((opponent.y + opponent.h / 2) - (player.y + player.h / 2)) < verticalReach && Math.sign(distance) === player.face && opponent.invuln <= 0) {
      const damage = kind === "punch" ? 9 : 14;
      opponent.hp = Math.max(0, opponent.hp - damage);
      opponent.vx = player.face * (kind === "punch" ? 310 : 430);
      opponent.vy = kind === "punch" ? -125 : -225;
      opponent.grounded = false;
      opponent.invuln = .38;
      toast(`${kind === "punch" ? "Punch" : "Kick"} connected! -${damage} HP`);
      playTone(kind === "punch" ? 340 : 480);
      if (!opponent.hp) finishGame(player.id);
    }
    if (player.juice === 0 && state.mode === "fight") window.setTimeout(() => { if (state.mode === "fight" && player.juice === 0) askRecharge(player.id); }, 220);
  }

  function dash(player) {
    if (state.mode !== "fight" || !spend(player, 6, "dash")) return;
    player.vx = player.face * 540;
    player.invuln = .13;
    if (player.juice === 0) window.setTimeout(() => { if (state.mode === "fight" && player.juice === 0) askRecharge(player.id); }, 180);
  }

  function finishGame(winnerId) {
    state.mode = "end";
    state.winner = winnerId;
    $("round-state").textContent = "MATCH OVER";
    $("winner-heading").textContent = `PLAYER ${winnerId} WINS!`;
    $("winner-copy").textContent = `Player ${winnerId} used knowledge, timing, and energy to take the match.`;
    showScreen("end-screen");
    playTone(820);
  }

  function update(dt) {
    if (state.mode !== "fight") return;
    const p1 = fighters[1], p2 = fighters[2];
    let energyChanged = false;
    let depletedPlayer = 0;
    p1.face = p2.x >= p1.x ? 1 : -1;
    p2.face = p1.x >= p2.x ? 1 : -1;
    for (const p of [p1, p2]) {
      const c = config[p.id];
      let direction = 0;
      if (c.left.some((key) => keys.has(key))) direction -= 1;
      if (c.right.some((key) => keys.has(key))) direction += 1;
      if (direction && p.juice > 0) {
        p.vx = direction * 245;
        p.juice = Math.max(0, p.juice - 4 * dt);
        energyChanged = true;
        if (p.juice === 0 && !depletedPlayer) depletedPlayer = p.id;
      }
      else if (direction && p.juice <= 0) { p.vx = 0; if (!depletedPlayer) depletedPlayer = p.id; }
      else if (p.grounded) p.vx *= Math.pow(.0008, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      if (p.y + p.h >= floorY) { p.y = floorY - p.h; p.vy = 0; p.grounded = true; }
      p.x = Math.max(26, Math.min(canvas.width - p.w - 26, p.x));
      p.attack = Math.max(0, p.attack - dt);
      p.invuln = Math.max(0, p.invuln - dt);
    }
    if (energyChanged) syncHud();
    if (depletedPlayer && state.mode === "fight") askRecharge(depletedPlayer);
  }

  function frame(time) {
    const dt = Math.min(.032, state.lastTime ? (time - state.lastTime) / 1000 : .016);
    state.lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function draw() {
    const theme = state.topic ? state.topic.arena : { sky: "#1d3452", glow: "#c99a65", floor: "#554638", accent: "#e1b46a" };
    const w = canvas.width, h = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, theme.sky); sky.addColorStop(.7, "#26314b"); sky.addColorStop(1, "#10192a");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = .24; ctx.fillStyle = theme.glow; ctx.beginPath(); ctx.arc(480, 175, 93, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawStars();
    drawRidge(theme.accent);
    ctx.fillStyle = "rgba(5,10,20,.2)"; ctx.fillRect(0, floorY, w, h - floorY);
    ctx.fillStyle = theme.floor; ctx.fillRect(0, floorY, w, 18);
    ctx.fillStyle = theme.accent; ctx.globalAlpha = .7; ctx.fillRect(0, floorY, w, 3); ctx.globalAlpha = 1;
    for (const p of fighters.slice(1)) drawFighter(p);
    if (state.mode === "welcome") drawWelcomeDecor();
  }

  function drawStars() {
    ctx.fillStyle = "rgba(255,255,255,.52)";
    for (let i = 0; i < 44; i++) { const x = (i * 193 + 53) % 960, y = (i * 79 + 21) % 245; ctx.globalAlpha = .3 + ((i * 7) % 7) / 14; ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2); }
    ctx.globalAlpha = 1;
  }

  function drawRidge(color) {
    ctx.fillStyle = "rgba(7,13,25,.32)"; ctx.beginPath(); ctx.moveTo(0, 359);
    for (let x = 0; x <= 960; x += 80) ctx.lineTo(x, 285 + Math.sin(x * .018) * 38 + Math.cos(x * .041) * 16);
    ctx.lineTo(960, floorY); ctx.lineTo(0, floorY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.globalAlpha = .15; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 365); ctx.lineTo(960, 365); ctx.stroke(); ctx.globalAlpha = 1;
  }

  function drawFighter(p) {
    const cx = p.x + p.w / 2, y = p.y, facing = p.face;
    ctx.save();
    if (p.invuln > 0 && Math.floor(performance.now() / 60) % 2) ctx.globalAlpha = .45;
    ctx.fillStyle = "rgba(0,0,0,.26)"; ctx.beginPath(); ctx.ellipse(cx, floorY + 7, 43, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(cx, 0); ctx.scale(facing, 1); ctx.translate(-cx, 0);
    const punchActive = p.attack > .1;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Original, simple training-bot silhouette: no weapons or injury detail.
    ctx.strokeStyle = p.dark; ctx.lineWidth = 17;
    ctx.beginPath(); ctx.moveTo(cx - 12, y + 76); ctx.lineTo(cx - 18, y + 101); ctx.lineTo(cx - 27, y + 108); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 12, y + 76); ctx.lineTo(cx + 18, y + 99); ctx.lineTo(cx + 27, y + 105); ctx.stroke();
    ctx.fillStyle = p.color; roundedRect(cx - 23, y + 39, 46, 47, 13); ctx.fill();
    ctx.fillStyle = p.dark; roundedRect(cx - 25, y + 78, 50, 9, 4); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(cx, y + 23, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#13243b"; roundedRect(cx - 16, y + 17, 33, 12, 6); ctx.fill();
    ctx.fillStyle = "#eaf8ff"; ctx.fillRect(cx + 5, y + 20, 5, 4); ctx.fillRect(cx - 8, y + 20, 5, 4);
    ctx.strokeStyle = p.dark; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(cx - 18, y + 49); ctx.lineTo(cx - 31, y + 69); ctx.stroke();
    const armEndX = punchActive ? cx + 47 : cx + 27, armEndY = punchActive ? y + 55 : y + 70;
    ctx.beginPath(); ctx.moveTo(cx + 18, y + 49); ctx.lineTo(armEndX, armEndY); ctx.stroke();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(armEndX, armEndY, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.font = "800 10px Inter"; ctx.textAlign = "center"; ctx.fillText(`P${p.id}`, cx, y + 66);
    ctx.restore();
  }

  function roundedRect(x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
  function drawWelcomeDecor() { ctx.globalAlpha = .16; drawFighter(fighters[1]); drawFighter(fighters[2]); ctx.globalAlpha = 1; }

  function syncHud() {
    for (const p of fighters.slice(1)) {
      $(`p${p.id}-health`).style.width = `${p.hp}%`;
      $(`p${p.id}-energy`).style.width = `${p.juice}%`;
      $(`p${p.id}-health-label`).textContent = `${p.hp} HP`;
      $(`p${p.id}-energy-label`).textContent = `${Math.floor(p.juice)} / 100`;
    }
  }

  function toast(message) {
    const node = $("toast"); node.textContent = message; node.classList.add("visible");
    window.clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(() => node.classList.remove("visible"), 1400);
  }

  function toggleSound() {
    state.sound = !state.sound;
    $("sound-toggle").textContent = state.sound ? "Sound on" : "Sound off";
    $("sound-toggle").setAttribute("aria-pressed", String(state.sound));
    if (state.sound) playTone(520);
  }

  function playTone(frequency) {
    if (!state.sound) return;
    try { const audio = new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audio.createOscillator(); const gain = audio.createGain(); oscillator.frequency.value = frequency; oscillator.type = "sine"; gain.gain.setValueAtTime(.06, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12); oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .12); oscillator.onended = () => audio.close(); } catch (_) { /* Sound is optional. */ }
  }

  init();
})();
