import { PlayFlow } from "./play-flow.js";
export class GameFeel {
  constructor(actions) {
    this.actions = actions;
    this.flow = new PlayFlow();
    this.sound = false;
    this.driving = false;
    this.lastCue = "";
    const layer = document.createElement("div");
    layer.id = "game-layer";
    layer.innerHTML = `
 <div id="game-menu" class="game-overlay"><div class="game-card start-card"><span class="game-kicker">TEACH ARCADE • CREATIVE PLAYGROUND</span><div class="toy-car" aria-hidden="true"><i></i></div><h1>BIG TRACKS.<br><em>WILD RIDES.</em></h1><p>Snap it. Build it. Send it!</p><button id="game-build" class="game-primary">✦ Let's build!</button><button id="game-demo">🏁 Try the loop track</button><button id="game-saves">★ My tracks</button><small>Your current creation stays safe.</small></div></div>
 <div id="game-hud" hidden><div class="hud-chip"><small>SPEED</small><b id="game-speed">0</b><span>km/h</span></div><div class="hud-chip"><small>TIME</small><b id="game-time">0.0</b><span>seconds</span></div></div>
 <div id="game-countdown" role="status" aria-live="polite"></div>
 <div id="game-finish" class="game-overlay" hidden><div class="game-card"><div class="finish-stars" aria-hidden="true">★ ★ ★</div><h2>WHAT A RIDE!</h2><p id="finish-summary"></p><button id="game-again" class="game-primary">↻ Race again</button><button id="game-back">🔧 Keep building</button></div></div>
 `;
    document.body.append(layer);
    document.getElementById("game-build").onclick = () => {
      this.unlock();
      this.menu(false);
      actions.build();
    };
    document.getElementById("game-demo").onclick = () => {
      this.unlock();
      this.menu(false);
      actions.demo();
    };
    document.getElementById("game-saves").onclick = () => {
      this.menu(false);
      actions.saves();
    };
    document.getElementById("game-again").onclick = () => actions.again();
    document.getElementById("game-back").onclick = () => actions.edit();
    this.soundButton = document.createElement("button");
    this.soundButton.id = "game-sound";
    this.soundButton.textContent = "♪ Sound off";
    this.soundButton.setAttribute("aria-pressed", "false");
    this.soundButton.onclick = () => {
      this.sound = !this.sound;
      this.soundButton.textContent = this.sound ? "♪ Sound on" : "♪ Sound off";
      this.soundButton.setAttribute("aria-pressed", String(this.sound));
      if (this.sound) {
        this.unlock();
        this.tone(660, 0.07);
      }
    };
    document.querySelector(".top-actions").prepend(this.soundButton);
  }
  menu(show = true) {
    if (this.driving) return;
    document.getElementById("game-menu").hidden = !show;
    if (show) document.getElementById("game-build").focus();
  }
  unlock() {
    if (!this.sound) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      this.audio.resume().catch(() => {});
    } catch {}
  }
  tone(freq, duration = 0.08) {
    if (!this.sound || !this.audio) return;
    try {
      const osc = this.audio.createOscillator(),
        gain = this.audio.createGain(),
        now = this.audio.currentTime;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.audio.destination);
      osc.start();
      osc.stop(now + duration);
    } catch {}
  }
  start() {
    this.unlock();
    this.flow.reset();
    this.driving = true;
    this.lastCue = "";
    document.body.classList.add("playing");
    document.getElementById("game-menu").hidden = true;
    document.getElementById("game-finish").hidden = true;
    document.getElementById("game-hud").hidden = false;
    document.getElementById("game-countdown").textContent = "3";
    document.getElementById("game-time").textContent = "0.0";
    document.getElementById("game-speed").textContent = "0";
  }
  stop() {
    this.driving = false;
    document.body.classList.remove("playing");
    document.getElementById("game-finish").hidden = true;
    document.getElementById("game-hud").hidden = true;
    document.getElementById("game-countdown").textContent = "";
  }
  tick(dt, speed, paused) {
    this.flow.paused = paused;
    const simulate = this.flow.tick(dt, speed);
    const label = this.flow.label;
    document.getElementById("game-countdown").textContent = label;
    if (label && label !== this.lastCue && !paused) {
      this.tone(label === "GO!" ? 880 : 440, 0.1);
      this.lastCue = label;
    }
    document.getElementById("game-speed").textContent = Math.round(speed * 3.6);
    document.getElementById("game-time").textContent =
      this.flow.time.toFixed(1);
    return simulate;
  }
  finish(time) {
    if (!this.flow.finish(time)) return;
    document.getElementById("game-countdown").textContent = "";
    document.getElementById("finish-summary").textContent =
      `${time.toFixed(2)} seconds • Top speed ${Math.round(this.flow.peak * 3.6)} km/h`;
    document.getElementById("game-finish").hidden = false;
    document.getElementById("game-again").focus();
    this.tone(1046, 0.3);
  }
  snap() {
    this.unlock();
    this.tone(740, 0.055);
  }
}
