// /assets/scripts/flashcards.js
(function () {
  const textarea      = document.getElementById('cards-input');
  const btnBuild      = document.getElementById('btn-build-deck');
  const btnShuffle    = document.getElementById('btn-shuffle');
  const btnClear      = document.getElementById('btn-clear-cards');

  const flashcardEl   = document.getElementById('flashcard');
  const sideLabelEl   = document.getElementById('side-label');
  const positionEl    = document.getElementById('card-position');
  const knownCountEl  = document.getElementById('known-count');
  const countsEl      = document.getElementById('deck-counts');

  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const btnFlip       = document.getElementById('btn-flip');
  const btnMarkKnown  = document.getElementById('btn-mark-known');
  const btnResetProg  = document.getElementById('btn-reset-progress');

  if (!textarea || !flashcardEl) return; // safety

  let deck = [];          // [{front, back, known}]
  let index = 0;          // current card index
  let showFront = true;   // true = showing front, false = back

  // ---------- helpers ----------
  function parseCards(text) {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('::');
        if (parts.length >= 2) {
          return {
            front: parts[0].trim(),
            back: parts.slice(1).join('::').trim(),
            known: false
          };
        }
        // If no "::", treat whole line as front with blank back
        return { front: line, back: '', known: false };
      });
  }

  function renderCounts() {
    if (!deck.length) {
      countsEl.textContent = 'No cards loaded yet.';
      positionEl.textContent = 'Card 0 of 0';
      knownCountEl.textContent = 'Known: 0';
      return;
    }
    const known = deck.filter(c => c.known).length;
    countsEl.textContent = `${deck.length} cards loaded • ${known} marked known`;
    positionEl.textContent = `Card ${index + 1} of ${deck.length}`;
    knownCountEl.textContent = `Known: ${known}`;
  }

  function renderCard() {
    if (!deck.length) {
      flashcardEl.textContent = 'Click “Use This List” to load your cards.';
      sideLabelEl.textContent = 'Front';
      flashcardEl.classList.remove('flashcard-back');
      return;
    }

    const card = deck[index];
    const text = showFront ? card.front : (card.back || '—');
    flashcardEl.textContent = text || '—';
    sideLabelEl.textContent = showFront ? 'Front' : 'Back';

    if (showFront) {
      flashcardEl.classList.remove('flashcard-back');
    } else {
      flashcardEl.classList.add('flashcard-back');
    }

    renderCounts();
  }

  function ensureIndexInRange() {
    if (!deck.length) {
      index = 0;
      return;
    }
    if (index < 0) index = 0;
    if (index >= deck.length) index = deck.length - 1;
  }

  function goNext() {
    if (!deck.length) return;
    if (index < deck.length - 1) {
      index++;
    } else {
      index = 0; // loop around
    }
    showFront = true;
    renderCard();
  }

  function goPrev() {
    if (!deck.length) return;
    if (index > 0) {
      index--;
    } else {
      index = deck.length - 1; // loop around
    }
    showFront = true;
    renderCard();
  }

  function flipCard() {
    if (!deck.length) return;
    showFront = !showFront;
    renderCard();
  }

  // ---------- event handlers ----------
  btnBuild.addEventListener('click', () => {
    const text = textarea.value || '';
    const cards = parseCards(text);
    if (!cards.length) {
      alert('Please enter at least one card. Use "Front :: Back" format, one per line.');
      return;
    }
    deck = cards;
    index = 0;
    showFront = true;
    renderCard();
  });

  btnShuffle.addEventListener('click', () => {
    if (!deck.length) {
      alert('No cards loaded to shuffle. Click "Use This List" first.');
      return;
    }
    // Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    index = 0;
    showFront = true;
    renderCard();
  });

  btnClear.addEventListener('click', () => {
    textarea.value = '';
    deck = [];
    index = 0;
    showFront = true;
    renderCard();
  });

  btnPrev.addEventListener('click', goPrev);
  btnNext.addEventListener('click', goNext);
  btnFlip.addEventListener('click', flipCard);

  btnMarkKnown.addEventListener('click', () => {
    if (!deck.length) return;
    deck[index].known = !deck[index].known;
    renderCounts();
  });

  btnResetProg.addEventListener('click', () => {
    if (!deck.length) return;
    deck.forEach(c => { c.known = false; });
    renderCounts();
  });

  flashcardEl.addEventListener('click', flipCard);

  // Keyboard: space = flip, arrows = prev/next
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;

    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      flipCard();
    } else if (e.key === 'ArrowRight') {
      goNext();
    } else if (e.key === 'ArrowLeft') {
      goPrev();
    }
  });

  // initial paint
  renderCard();
})();
