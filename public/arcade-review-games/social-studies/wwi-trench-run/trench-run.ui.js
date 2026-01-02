(function () {
  const els = {
    hudScore: document.getElementById("hudScore"),
    hudBest: document.getElementById("hudBest"),
    hudQuestions: document.getElementById("hudQuestions"),
    hudStatus: document.getElementById("hudStatus"),
    btnMute: document.getElementById("btnMute"),

    qOverlay: document.getElementById("questionOverlay"),
    qTitle: document.getElementById("qTitle"),
    qText: document.getElementById("qText"),
    qChoices: document.getElementById("choicesContainer"),
    qFeedback: document.getElementById("qFeedback"),
    qCloseBtn: document.getElementById("qCloseBtn"),

    endOverlay: document.getElementById("endOverlay"),
    endSummary: document.getElementById("endSummary"),
    replayBtn: document.getElementById("replayBtn"),
    topicBtn: document.getElementById("topicBtn"),

    btnLeft: document.getElementById("btnLeft"),
    btnRight: document.getElementById("btnRight"),
    btnJump: document.getElementById("btnJump")
  };

  // Touch input shared with Phaser scene
  const input = window.TrenchRunInput = { left:false, right:false, jump:false };

  // Simple SFX toggle state (scene reads this)
  const sfx = window.TrenchRunSFX = { enabled: true };

  if (els.btnMute) {
    els.btnMute.addEventListener("click", () => {
      sfx.enabled = !sfx.enabled;
      els.btnMute.textContent = sfx.enabled ? "SFX: ON" : "SFX: OFF";
    });
  }

  function setHud({ score, best, answered, total, status }) {
    if (typeof score === "number") els.hudScore.textContent = `Score: ${score}`;
    if (typeof best === "number" && els.hudBest) els.hudBest.textContent = `Best: ${best}`;
    if (typeof answered === "number") els.hudQuestions.textContent = `Questions: ${answered} / ${total}`;
    if (status) els.hudStatus.textContent = `Status: ${status}`;
  }

  function showQuestionOverlay({ number, question, onAnswer, onResume, lockResume }) {
    els.qTitle.textContent = `Question ${number}`;
    els.qText.textContent = question.text;
    els.qFeedback.textContent = "";
    els.qChoices.innerHTML = "";

    question.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = `${String.fromCharCode(65 + idx)}) ${choice}`;
      btn.addEventListener("click", () => onAnswer(idx, btn));
      els.qChoices.appendChild(btn);
    });

    els.qCloseBtn.disabled = !!lockResume;
    els.qCloseBtn.style.opacity = lockResume ? "0.55" : "1";

    els.qCloseBtn.onclick = () => {
      if (lockResume) {
        els.qFeedback.textContent = "Answer correctly to continue.";
        return;
      }
      hideQuestionOverlay();
      onResume && onResume();
    };

    els.qOverlay.classList.remove("hidden");
  }

  function markChoice(btn, kind) { btn.classList.add(kind); }
  function setFeedback(text) { els.qFeedback.textContent = text; }
  function hideQuestionOverlay() { els.qOverlay.classList.add("hidden"); }

  function showEndOverlay({ summary, onReplay, onMoreGames }) {
    els.endSummary.textContent = summary;
    els.endOverlay.classList.remove("hidden");
    els.replayBtn.onclick = onReplay;
    els.topicBtn.onclick = onMoreGames;
  }
  function hideEndOverlay() { els.endOverlay.classList.add("hidden"); }

  function bindHold(btn, key) {
    if (!btn) return;
    const down = (e) => { e.preventDefault(); input[key] = true; };
    const up = (e) => { e.preventDefault(); input[key] = false; };
    btn.addEventListener("touchstart", down, { passive:false });
    btn.addEventListener("touchend", up, { passive:false });
    btn.addEventListener("touchcancel", up, { passive:false });
    btn.addEventListener("mousedown", down);
    btn.addEventListener("mouseup", up);
    btn.addEventListener("mouseleave", up);
  }

  bindHold(els.btnLeft, "left");
  bindHold(els.btnRight, "right");

  if (els.btnJump) {
    const press = (e) => { e.preventDefault(); input.jump = true; };
    els.btnJump.addEventListener("touchstart", press, { passive:false });
    els.btnJump.addEventListener("mousedown", press);
  }

  window.TrenchRunUI = {
    setHud,
    showQuestionOverlay,
    hideQuestionOverlay,
    markChoice,
    setFeedback,
    showEndOverlay,
    hideEndOverlay
  };
})();
