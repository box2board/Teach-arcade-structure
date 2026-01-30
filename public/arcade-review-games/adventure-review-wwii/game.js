import { createRenderer } from "./engine/renderer.js";
import { createInput } from "./engine/input.js";
import { createAudio } from "./engine/audio.js";
import { createUI } from "./engine/ui.js";
import { createGame } from "./engine/core.js";

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function init() {
  const canvas = document.getElementById("game-canvas");
  const canvasShell = document.querySelector(".canvas-shell");
  if (!canvas.getContext) {
    canvasShell.classList.add("no-canvas");
    return;
  }

  const packs = await loadJSON("./content/packs.json");
  const pack = packs.packs[0];
  const [mapData, theme, questions] = await Promise.all([
    loadJSON(`./content/${pack.mapPack}/map.json`),
    loadJSON(`./content/${pack.mapPack}/theme.json`),
    loadJSON(`./content/${pack.questionPack}/questions.json`)
  ]);

  const audio = createAudio();
  const input = createInput({
    dpadButtons: document.querySelectorAll(".control-btn[data-dir]"),
    interactButton: document.getElementById("interact-btn")
  });
  const renderer = createRenderer({ canvas, mapData, theme });

  const ui = createUI({
    onStart: () => game.start(),
    onFinish: () => game.finishRun(),
    onSecrets: () => game.enterBonusMode(),
    onReplay: () => game.replay(),
    onResume: () => game.handlePause(false),
    onMuteToggle: () => {
      const muted = audio.toggle();
      ui.updateMuteLabel(muted);
    }
  });

  const game = createGame({ mapData, questionBank: questions.questions, renderer, input, ui, audio });

  ui.updateMuteLabel(audio.isMuted());
  game.resetState();
}

init();
