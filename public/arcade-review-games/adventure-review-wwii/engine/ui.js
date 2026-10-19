export function createUI({
  onStart,
  onFinish,
  onSecrets,
  onReplay,
  onResume,
  onMuteToggle
}) {
  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start-button");
  const questionModal = document.getElementById("question-modal");
  const questionText = document.getElementById("question-text");
  const questionChoices = document.getElementById("question-choices");
  const questionFeedback = document.getElementById("question-feedback");
  const questionExplanation = document.getElementById("question-explanation");
  const completionOverlay = document.getElementById("completion-overlay");
  const pauseOverlay = document.getElementById("pause-overlay");
  const resultsScreen = document.getElementById("results-screen");
  const muteToggle = document.getElementById("mute-toggle");

  const hud = {
    chestCount: document.getElementById("chest-count"),
    timer: document.getElementById("timer"),
    score: document.getElementById("score"),
    secretCount: document.getElementById("secret-count"),
    bonusHud: document.getElementById("bonus-hud")
  };

  const completion = {
    coreTime: document.getElementById("core-time"),
    correct: document.getElementById("core-correct"),
    score: document.getElementById("core-score"),
    finishBtn: document.getElementById("finish-button"),
    secretsBtn: document.getElementById("secrets-button")
  };

  const results = {
    correct: document.getElementById("results-correct"),
    time: document.getElementById("results-time"),
    timeBonus: document.getElementById("results-time-bonus"),
    coreScore: document.getElementById("results-core-score"),
    secret: document.getElementById("results-secret"),
    bonusScore: document.getElementById("results-bonus-score"),
    total: document.getElementById("results-total"),
    replay: document.getElementById("replay-button")
  };

  let focusTrapHandler = null;

  function setOverlayActive(el, active) {
    if (active) {
      el.classList.add("active");
      el.setAttribute("aria-hidden", "false");
    } else {
      el.classList.remove("active");
      el.setAttribute("aria-hidden", "true");
    }
  }

  function trapFocus(container) {
    const focusable = Array.from(container.querySelectorAll("button, [href], input, select, textarea"))
      .filter((el) => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    focusTrapHandler = (event) => {
      if (event.key !== "Tab") return;
      const available = [...container.querySelectorAll("button, [href], input, select, textarea")].filter(el => !el.disabled);
      const first = available[0];
      const last = available[available.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener("keydown", focusTrapHandler);
  }

  function releaseFocus(container) {
    if (focusTrapHandler) {
      container.removeEventListener("keydown", focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  function renderChoices(choices, onSelect) {
    questionChoices.innerHTML = "";
    choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => onSelect(index, btn));
      btn.addEventListener("keydown", (event) => {
        const buttons = [...questionChoices.querySelectorAll("button:not(:disabled)")];
        const current = buttons.indexOf(btn);
        const direction = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1}[event.key];
        if (direction) {
          event.preventDefault();
          buttons[(current + direction + buttons.length) % buttons.length]?.focus();
        }
      });
      questionChoices.appendChild(btn);
    });
  }

  function showQuestion({ text, choices, onSelect }) {
    questionText.textContent = text;
    questionFeedback.textContent = "";
    questionExplanation.textContent = "";
    renderChoices(choices, onSelect);
    setOverlayActive(questionModal, true);
    trapFocus(questionModal);
  }

  function updateQuestionFeedback(message, isCorrect) {
    questionFeedback.textContent = message;
    questionFeedback.style.color = isCorrect ? "#4ade80" : "#ff8b8b";
  }

  function showExplanation(text) {
    questionExplanation.textContent = text;
  }

  function markChoice(btn, isCorrect) {
    btn.classList.add(isCorrect ? "correct" : "wrong");
    btn.disabled = true;
    questionChoices.querySelector("button:not(:disabled)")?.focus();
  }

  function closeQuestion() {
    setOverlayActive(questionModal, false);
    releaseFocus(questionModal);
    document.getElementById("game-canvas").focus({preventScroll: true});
  }

  function showCompletion({ time, correct, score }) {
    completion.coreTime.textContent = time;
    completion.correct.textContent = `${correct}/15`;
    completion.score.textContent = score;
    setOverlayActive(completionOverlay, true);
    trapFocus(completionOverlay);
  }

  function hideCompletion() {
    setOverlayActive(completionOverlay, false);
    releaseFocus(completionOverlay);
  }

  function showResults({ correct, time, timeBonus, coreScore, secret, bonusScore, total }) {
    results.correct.textContent = `${correct}/15`;
    results.time.textContent = time;
    results.timeBonus.textContent = timeBonus;
    results.coreScore.textContent = coreScore;
    results.secret.textContent = `${secret}/2`;
    results.bonusScore.textContent = bonusScore;
    results.total.textContent = total;
    resultsScreen.classList.add("active");
    resultsScreen.setAttribute("aria-hidden", "false");
    trapFocus(resultsScreen);
  }

  function hideResults() {
    resultsScreen.classList.remove("active");
    resultsScreen.setAttribute("aria-hidden", "true");
    releaseFocus(resultsScreen);
  }

  function setPaused(active) {
    setOverlayActive(pauseOverlay, active);
    if (active) {
      trapFocus(pauseOverlay);
    } else {
      releaseFocus(pauseOverlay);
    }
  }

  function updateHud({ chestCount, time, score, secretCount, bonusMode }) {
    hud.chestCount.textContent = chestCount;
    hud.timer.textContent = time;
    hud.score.textContent = score;
    hud.secretCount.textContent = secretCount;
    hud.bonusHud.hidden = !bonusMode;
  }

  function updateMuteLabel(muted) {
    muteToggle.textContent = muted ? "Mute: On" : "Mute: Off";
    muteToggle.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function hideStart() {
    if (!startScreen) return;
    startScreen.style.display = "none";
  }

  function showStart() {
    if (!startScreen) return;
    startScreen.style.display = "flex";
  }

  let hasStarted = false;

  function startOnce(event) {
    if (hasStarted) return;
    hasStarted = true;
    if (event?.cancelable) {
      event.preventDefault();
    }
    hideStart();
    onStart();
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      if (!canvas.hasAttribute("tabindex")) {
        canvas.setAttribute("tabindex", "-1");
      }
      if (typeof canvas.focus === "function") {
        canvas.focus({ preventScroll: true });
      }
    }
  }

  startButton.addEventListener("click", startOnce);

  completion.finishBtn.addEventListener("click", () => {
    hideCompletion();
    onFinish();
  });
  completion.secretsBtn.addEventListener("click", () => {
    hideCompletion();
    onSecrets();
  });
  results.replay.addEventListener("click", () => {
    hideResults();
    onReplay();
  });
  document.getElementById("resume-button").addEventListener("click", onResume);
  muteToggle.addEventListener("click", onMuteToggle);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && questionModal.classList.contains("active")) {
      event.preventDefault();
    }
  });

  return {
    hideStart,
    showStart,
    showQuestion,
    closeQuestion,
    updateQuestionFeedback,
    showExplanation,
    awaitContinue(callback) {
      questionChoices.querySelectorAll("button").forEach(button => { button.disabled = true; });
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = "Continue exploring";
      button.addEventListener("click", callback, { once: true });
      questionChoices.appendChild(button);
      button.focus();
    },
    markChoice,
    showCompletion,
    updateHud,
    setPaused,
    showResults,
    updateMuteLabel
  };
}
