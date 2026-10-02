(() => {
  const WORDS = {
    animals: [
      { word: "elephant", clue: "A very large land mammal with a trunk." },
      { word: "penguin", clue: "A flightless bird known for swimming." },
      { word: "giraffe", clue: "The tallest living land animal." },
      { word: "dolphin", clue: "An intelligent marine mammal." },
      { word: "kangaroo", clue: "An Australian animal known for hopping." },
      { word: "octopus", clue: "A sea animal with eight arms." }
    ],
    geography: [
      { word: "mountain", clue: "A landform that rises high above the surrounding area." },
      { word: "peninsula", clue: "Land almost surrounded by water." },
      { word: "equator", clue: "The imaginary line around Earth's middle." },
      { word: "glacier", clue: "A slowly moving mass of ice." },
      { word: "island", clue: "Land completely surrounded by water." },
      { word: "volcano", clue: "A landform that can erupt lava, ash, and gases." }
    ],
    science: [
      { word: "gravity", clue: "The force that pulls objects toward one another." },
      { word: "molecule", clue: "Two or more atoms chemically bonded together." },
      { word: "habitat", clue: "The natural home of an organism." },
      { word: "energy", clue: "The ability to do work or cause change." },
      { word: "planet", clue: "A large object that orbits a star." },
      { word: "oxygen", clue: "A gas humans need for respiration." }
    ],
    school: [
      { word: "backpack", clue: "A bag commonly carried to class." },
      { word: "notebook", clue: "Pages bound together for writing notes." },
      { word: "library", clue: "A place where books and other resources are kept." },
      { word: "pencil", clue: "A writing tool that can usually be erased." },
      { word: "project", clue: "A longer assignment often built over several steps." },
      { word: "schedule", clue: "A plan showing when activities happen." }
    ],
    food: [
      { word: "pancake", clue: "A flat breakfast food often served in a stack." },
      { word: "spaghetti", clue: "Long, thin pasta noodles." },
      { word: "popcorn", clue: "A snack made from heated corn kernels." },
      { word: "sandwich", clue: "Food commonly made with fillings between slices of bread." },
      { word: "avocado", clue: "A green fruit often used in guacamole." },
      { word: "pretzel", clue: "A baked snack often shaped in a knot." }
    ]
  };

  const CATEGORY_NAMES = {
    animals: "Animals",
    geography: "Geography",
    science: "Science",
    school: "School",
    food: "Food"
  };

  const MAX_WRONG = 6;
  const STORAGE_KEY = "teachArcadeWordRescueStreaks";
  const LEGACY_STORAGE_KEY = "teachArcadeHangmanStreaks";

  const els = {
    category: document.getElementById("category-select"),
    surprise: document.getElementById("surprise-category"),
    newWord: document.getElementById("new-word"),
    categoryLabel: document.getElementById("category-label"),
    clueButton: document.getElementById("clue-button"),
    clueText: document.getElementById("clue-text"),
    word: document.getElementById("word-display"),
    feedback: document.getElementById("feedback"),
    keyboard: document.getElementById("keyboard"),
    wrongCount: document.getElementById("wrong-count"),
    wrongLetters: document.getElementById("wrong-letters"),
    currentStreak: document.getElementById("current-streak"),
    bestStreak: document.getElementById("best-streak"),
    endActions: document.getElementById("end-actions"),
    playAgain: document.getElementById("play-again"),
    signalStatus: document.getElementById("signal-status"),
    signalCells: Array.from(document.querySelectorAll(".word-rescue-page__cell")),
    rescueScene: document.getElementById("rescue-scene")
  };

  let activeCategory = "animals";
  let activeEntry = null;
  let guessed = new Set();
  let wrong = [];
  let state = "playing";
  let streaks = loadStreaks();
  let lastWord = "";

  function parseStreaks(raw) {
    try {
      const stored = JSON.parse(raw);
      return {
        current: Number.isFinite(stored?.current) ? Math.max(0, stored.current) : 0,
        best: Number.isFinite(stored?.best) ? Math.max(0, stored.best) : 0
      };
    } catch {
      return null;
    }
  }

  function loadStreaks() {
    try {
      const current = parseStreaks(localStorage.getItem(STORAGE_KEY));
      if (current) return current;
      const legacy = parseStreaks(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        return legacy;
      }
    } catch {}
    return { current: 0, best: 0 };
  }

  function saveStreaks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(streaks)); } catch {}
  }

  function updateStreakDisplay() {
    els.currentStreak.textContent = String(streaks.current);
    els.bestStreak.textContent = String(streaks.best);
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function chooseEntry(category) {
    const choices = WORDS[category];
    const alternatives = choices.filter(item => item.word !== lastWord);
    return randomItem(alternatives.length ? alternatives : choices);
  }

  function startRound(category = els.category.value) {
    activeCategory = category;
    els.category.value = category;
    activeEntry = chooseEntry(category);
    lastWord = activeEntry.word;
    guessed = new Set();
    wrong = [];
    state = "playing";

    els.categoryLabel.textContent = CATEGORY_NAMES[category];
    els.clueText.textContent = activeEntry.clue;
    els.clueText.hidden = true;
    els.clueButton.textContent = "Show Clue";
    els.clueButton.disabled = false;
    els.feedback.textContent = "Pick a letter or type on your keyboard.";
    els.feedback.classList.remove("is-win", "is-loss");
    els.endActions.hidden = true;
    els.rescueScene.classList.remove("is-rescued", "is-offline");

    render();
  }

  function renderWord(revealAll = false) {
    els.word.replaceChildren();
    const words = activeEntry.word.toUpperCase().split(" ");
    words.forEach((word, wordIndex) => {
      const group = document.createElement("span");
      group.className = "word-rescue-page__word-group";
      group.setAttribute("aria-label", `Word ${wordIndex + 1}`);
      [...word].forEach(letter => {
        const slot = document.createElement("span");
        slot.className = "word-rescue-page__slot";
        slot.textContent = revealAll || guessed.has(letter.toLowerCase()) ? letter : "";
        group.appendChild(slot);
      });
      els.word.appendChild(group);
    });
  }

  function renderKeyboard() {
    els.keyboard.replaceChildren();
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].forEach(letter => {
      const lower = letter.toLowerCase();
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-rescue-page__letter";
      button.textContent = letter;
      button.dataset.letter = lower;
      button.setAttribute("aria-label", `Guess ${letter}`);
      if (guessed.has(lower)) {
        button.disabled = true;
        button.classList.add(activeEntry.word.includes(lower) ? "is-correct" : "is-wrong");
      } else if (state !== "playing") {
        button.disabled = true;
      }
      button.addEventListener("click", () => guess(lower));
      els.keyboard.appendChild(button);
    });
  }

  function renderSignal() {
    const remaining = Math.max(0, MAX_WRONG - wrong.length);
    els.signalStatus.textContent = `${remaining} / ${MAX_WRONG}`;
    els.signalCells.forEach((cell, index) => {
      cell.classList.toggle("is-offline", index >= remaining);
    });
    els.wrongCount.textContent = String(wrong.length);
    els.wrongLetters.textContent = wrong.length ? wrong.map(letter => letter.toUpperCase()).join("  ") : "None yet";
  }

  function render() {
    renderWord(state === "lost");
    renderKeyboard();
    renderSignal();
    updateStreakDisplay();
  }

  function isSolved() {
    return [...activeEntry.word.toLowerCase()].every(char => char === " " || guessed.has(char));
  }

  function endRound(result) {
    state = result;
    if (result === "won") {
      streaks.current += 1;
      streaks.best = Math.max(streaks.best, streaks.current);
      els.feedback.textContent = `Rescue complete — ${activeEntry.word.toUpperCase()}! Streak extended.`;
      els.feedback.classList.add("is-win");
      els.rescueScene.classList.add("is-rescued");
    } else {
      streaks.current = 0;
      els.feedback.textContent = `Signal lost. The word was ${activeEntry.word.toUpperCase()}. Start a new mission and try again.`;
      els.feedback.classList.add("is-loss");
      els.rescueScene.classList.add("is-offline");
    }
    saveStreaks();
    els.endActions.hidden = false;
    render();
  }

  function guess(letter) {
    if (state !== "playing" || !/^[a-z]$/.test(letter) || guessed.has(letter)) return;
    guessed.add(letter);

    if (activeEntry.word.includes(letter)) {
      els.feedback.textContent = "Signal holding — good guess.";
    } else {
      wrong.push(letter);
      const remaining = MAX_WRONG - wrong.length;
      els.feedback.textContent = remaining === 1
        ? "Critical signal — one power cell left."
        : `Incorrect guess. ${remaining} signal cell${remaining === 1 ? "" : "s"} remaining.`;
    }

    if (isSolved()) {
      endRound("won");
      return;
    }
    if (wrong.length >= MAX_WRONG) {
      endRound("lost");
      return;
    }
    render();
  }

  function surpriseRound() {
    startRound(randomItem(Object.keys(WORDS)));
  }

  els.newWord.addEventListener("click", () => startRound(els.category.value));
  els.surprise.addEventListener("click", surpriseRound);
  els.playAgain.addEventListener("click", () => startRound(activeCategory));
  els.category.addEventListener("change", () => startRound(els.category.value));
  els.clueButton.addEventListener("click", () => {
    const showing = !els.clueText.hidden;
    els.clueText.hidden = showing;
    els.clueButton.textContent = showing ? "Show Clue" : "Hide Clue";
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (/^[a-z]$/.test(key)) guess(key);
  });

  updateStreakDisplay();
  startRound(activeCategory);
})();