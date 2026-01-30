import { resolveMovement, rectsOverlap } from "./collision.js";
import { shuffle } from "./rng.js";
import { SCORING, getTimeBonus } from "./scoring.js";

const INTERACT_RANGE = 64;
const BASE_SPEED = 220;

export function createGame({ mapData, questionBank, renderer, input, ui, audio }) {
  const player = {
    x: mapData.spawn.x,
    y: mapData.spawn.y,
    width: 36,
    height: 36
  };

  const chests = buildChests(mapData, questionBank);

  let lastTime = 0;
  let timerRunning = false;
  let paused = false;
  let mode = "start";
  let previousMode = "start";

  const stats = {
    chestOpened: 0,
    correct: 0,
    coreScore: 0,
    coreTime: 0,
    timeBonusLabel: "Low",
    timeBonusPoints: 0,
    bonusScore: 0,
    secretFound: 0
  };

  function resetState() {
    player.x = mapData.spawn.x;
    player.y = mapData.spawn.y;
    stats.chestOpened = 0;
    stats.correct = 0;
    stats.coreScore = 0;
    stats.coreTime = 0;
    stats.timeBonusLabel = "Low";
    stats.timeBonusPoints = 0;
    stats.bonusScore = 0;
    stats.secretFound = 0;
    timerRunning = false;
    paused = false;
    mode = "start";
    chests.forEach((chest) => {
      chest.opened = false;
      chest.locked = chest.type === "secret";
      chest.inactive = false;
      chest.attempts = 0;
      chest.resolving = false;
    });
    input.reset();
    ui.showStart();
    ui.updateHud({
      chestCount: stats.chestOpened,
      time: formatTime(stats.coreTime),
      score: stats.coreScore,
      secretCount: stats.secretFound,
      bonusMode: false
    });
  }

  function buildChests(mapData, questionBank) {
    const shuffled = shuffle(questionBank);
    const standardQuestions = shuffled.slice(0, SCORING.STANDARD_COUNT);
    const secretQuestions = shuffled.slice(SCORING.STANDARD_COUNT, SCORING.STANDARD_COUNT + SCORING.SECRET_COUNT);

    const chests = mapData.chests.map((chest, index) => ({
      ...chest,
      size: 36,
      type: "standard",
      opened: false,
      locked: false,
      inactive: false,
      attempts: 0,
      question: standardQuestions[index]
    }));

    mapData.secretChests.forEach((chest, index) => {
      chests.push({
        ...chest,
        size: 38,
        type: "secret",
        opened: false,
        locked: true,
        inactive: false,
        attempts: 0,
        question: secretQuestions[index]
      });
    });

    return chests;
  }

  function start() {
    ui.hideStart();
    mode = "playing";
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    if (!paused && mode !== "start") {
      update(delta);
      renderer.updateCamera(player);
      renderer.render({ player, chests });
    }

    requestAnimationFrame(loop);
  }

  function update(delta) {
    const vector = input.getVector();

    if (mode === "playing" || mode === "bonus") {
      if (!timerRunning && vector.moving) {
        timerRunning = true;
      }

      if (timerRunning && mode === "playing") {
        stats.coreTime += delta;
      }
    }

    const slowFactor = getSlowFactor();
    if ((mode === "playing" || mode === "bonus") && !paused) {
      const speed = BASE_SPEED * slowFactor;
      const dx = vector.x * speed * delta;
      const dy = vector.y * speed * delta;
      const next = resolveMovement(player, dx, dy, mapData.walls, {
        x: 0,
        y: 0,
        width: mapData.width,
        height: mapData.height
      });
      player.x = next.x;
      player.y = next.y;
    }

    const nearbyChest = findNearbyChest();
    const interactable = isChestInteractable(nearbyChest);
    updateInteractionHint(nearbyChest, interactable);

    if ((mode === "playing" || mode === "bonus") && interactable && input.consumeInteract()) {
      handleChest(nearbyChest);
    }

    ui.updateHud({
      chestCount: stats.chestOpened,
      time: formatTime(stats.coreTime),
      score: stats.coreScore + stats.bonusScore,
      secretCount: stats.secretFound,
      bonusMode: mode === "bonus"
    });
  }

  function getSlowFactor() {
    for (const zone of mapData.slowZones) {
      if (rectsOverlap(player, zone)) {
        return zone.modifier || 0.6;
      }
    }
    return 1;
  }

  function findNearbyChest() {
    return chests.find((chest) => {
      if (chest.opened || chest.inactive) return false;
      const dx = player.x - chest.x;
      const dy = player.y - chest.y;
      return Math.hypot(dx, dy) <= INTERACT_RANGE;
    });
  }

  function isChestInteractable(chest) {
    if (!chest) return false;
    if (chest.type === "secret" && chest.locked) return false;
    return true;
  }

  function updateInteractionHint(chest, interactable) {
    const hint = document.getElementById("interaction-hint");
    const interactBtn = document.getElementById("interact-btn");

    if (!chest) {
      hint.textContent = "";
      interactBtn.disabled = true;
      return;
    }

    if (chest.type === "secret" && chest.locked) {
      hint.textContent = "Secret chest locked. Finish all 15 chests first.";
      interactBtn.disabled = true;
      return;
    }

    hint.textContent = "Press E / Enter or tap Open to unlock this chest.";
    interactBtn.disabled = !interactable;
  }

  function handleChest(chest) {
    previousMode = mode;
    mode = "question";
    input.reset();
    presentQuestion(chest);
  }

  function presentQuestion(chest) {
    const shuffledChoices = shuffleChoices(chest.question);

    ui.showQuestion({
      text: chest.question.prompt,
      choices: shuffledChoices.choices,
      onSelect: (index, button) => {
        const isCorrect = index === shuffledChoices.correctIndex;
        ui.markChoice(button, isCorrect);
        handleAnswer({ chest, isCorrect, shuffledChoices });
      }
    });
  }

  function handleAnswer({ chest, isCorrect, shuffledChoices }) {
    if (chest.resolving) return;
    chest.attempts += 1;
    if (chest.type === "standard" && chest.attempts > 2) return;
    if (chest.type === "secret") {
      resolveSecretChest(chest, isCorrect, shuffledChoices);
      return;
    }

    if (isCorrect) {
      const points = chest.attempts === 1 ? SCORING.POINTS_FIRST_TRY : SCORING.POINTS_SECOND_TRY;
      stats.coreScore += points;
      stats.correct += 1;
      finalizeChest(chest, true, `Correct! +${points}`);
      return;
    }

    if (chest.attempts < 2) {
      ui.updateQuestionFeedback("Not quite. Try again.", false);
      return;
    }

    ui.updateQuestionFeedback(`The correct answer is: ${shuffledChoices.correct}`, false);
    ui.showExplanation(chest.question.explanation);
    finalizeChest(chest, false);
  }

  function resolveSecretChest(chest, isCorrect, shuffledChoices) {
    chest.resolving = true;
    if (isCorrect) {
      stats.bonusScore += SCORING.SECRET_BONUS;
      stats.secretFound += 1;
      ui.updateQuestionFeedback(`Secret unlocked! +${SCORING.SECRET_BONUS}`, true);
    } else {
      ui.updateQuestionFeedback(`The correct answer was: ${shuffledChoices.correct}`, false);
      ui.showExplanation(chest.question.explanation);
      chest.inactive = true;
    }
    chest.opened = true;
    closeQuestionAfterDelay();
  }

  function finalizeChest(chest, wasCorrect, message) {
    chest.resolving = true;
    chest.opened = true;
    stats.chestOpened += 1;
    if (message) {
      ui.updateQuestionFeedback(message, wasCorrect);
    }

    if (stats.chestOpened >= SCORING.STANDARD_COUNT) {
      timerRunning = false;
      const timeBonus = getTimeBonus(stats.coreTime);
      stats.timeBonusLabel = timeBonus.label;
      stats.timeBonusPoints = timeBonus.points;
      stats.coreScore += SCORING.COMPLETION_BONUS + stats.timeBonusPoints;
      closeQuestionAfterDelay(() => {
        ui.showCompletion({
          time: formatTime(stats.coreTime),
          correct: stats.correct,
          score: stats.coreScore
        });
        mode = "complete";
      });
      return;
    }

    closeQuestionAfterDelay(() => {
      mode = "playing";
    });
  }

  function closeQuestionAfterDelay(callback) {
    setTimeout(() => {
      ui.closeQuestion();
      if (callback) callback();
      if (!callback) {
        mode = previousMode === "bonus" ? "bonus" : "playing";
      }
    }, 700);
  }

  function enterBonusMode() {
    mode = "bonus";
    chests.forEach((chest) => {
      if (chest.type === "secret") {
        chest.locked = false;
      }
    });
  }

  function finishRun() {
    mode = "results";
    ui.showResults({
      correct: stats.correct,
      time: formatTime(stats.coreTime),
      timeBonus: stats.timeBonusLabel,
      coreScore: stats.coreScore,
      secret: stats.secretFound,
      bonusScore: stats.bonusScore,
      total: stats.coreScore + stats.bonusScore
    });
  }

  function replay() {
    resetState();
    ui.hideStart();
    mode = "playing";
  }

  function handlePause(active) {
    paused = active;
    ui.setPaused(active);
  }

  function shuffleChoices(question) {
    const options = question.choices.map((choice, index) => ({ choice, index }));
    const mixed = shuffle(options);
    const choices = mixed.map((item) => item.choice);
    const correctIndex = mixed.findIndex((item) => item.index === question.correctIndex);
    return {
      choices,
      correctIndex,
      correct: question.choices[question.correctIndex]
    };
  }

  function formatTime(time) {
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (mode === "playing" || mode === "bonus")) {
      handlePause(true);
    }
  });

  return {
    start,
    resetState,
    enterBonusMode,
    finishRun,
    replay,
    handlePause,
    audio
  };
}
