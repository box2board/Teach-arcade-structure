// /assets/scripts/flashcards.js
(function () {
  // Elements
  const rawTextarea   = document.getElementById('cards-raw');
  const frontInput    = document.getElementById('front-input');
  const backInput     = document.getElementById('back-input');
  const btnAddCard    = document.getElementById('btn-add-card');
  const btnClearAll   = document.getElementById('btn-clear-all');
  const btnUseCards   = document.getElementById('btn-use-cards');

  const flashcardEl   = document.getElementById('flashcard');
  const metaEl        = document.getElementById('card-meta');
  const knownListEl   = document.getElementById('known-list');

  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const btnFlip       = document.getElementById('btn-flip');
  const btnMarkKnown  = document.getElementById('btn-mark-known');
  const btnResetProg  = document.getElementById('btn-reset-progress');
  const btnProjector  = document.getElementById('btn-projector');

  if (!rawTextarea || !flashcardEl) return; // safety

  // Deck state
  let deck = [];          // [{front, back, known}]
  let index = 0;          // current card index
  let showingFront = true;

  // ---------- Helpers ----------
  function parseDeck(text) {
    const lines = (text || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const cards = [];
    for (const line of lines) {
      const parts = line.split('|');
      const front = (parts[0] || '').trim();
      const back  = (parts[1] || '').trim();
      if (!front && !back) continue;
      cards.push({ front, back, known: false });
    }
    return cards;
  }

  function renderCard() {
    if (!deck.length) {
      flashcardEl.textContent = 'No cards loaded yet.';
      metaEl.textContent = '0 / 0 cards • 0 known';
      knownListEl.innerHTML = '';
      return;
    }
    const card = deck[index];
    flashcardEl.textContent = showingFront ? (card.front || '—') : (card.back || '—');

    const knownCount = deck.filter(c => c.known).length;
    metaEl.textContent = `${index + 1} / ${deck.length} cards • ${knownCount} known`;
    renderKnownList();
  }

  function renderKnownList() {
    if (!deck.length) {
      knownListEl.innerHTML = '';
      return;
    }
    const known = deck
      .map((c, i) => ({ ...c, idx: i }))
      .filter(c => c.known);

    if (!known.length) {
      knownListEl.innerHTML = '<li><span>None marked known yet.</span></li>';
      return;
    }

    knownListEl.innerHTML = known
      .map(c => `<li><span>#${c.idx + 1}</span><span>${c.front || '(no front)'}</span></li>`)
      .join('');
  }

  function ensureDeckOrWarn() {
    if (!deck.length) {
      alert('No cards loaded yet. Add some cards and click "Use These Cards" first.');
      return false;
    }
    return true;
  }

  // ---------- Quick Add Card ----------
  if (btnAddCard) {
    btnAddCard.addEventListener('click', () => {
      const front = (frontInput.value || '').trim();
      const back  = (backInput.value || '').trim();

      if (!front && !back) {
        alert('Please enter at least something on the front or back.');
        return;
      }

      const line = `${front} | ${back}`;
      const existing = rawTextarea.value.trim();
      rawTextarea.value = existing ? `${existing}\n${line}` : line;

      // Clear quick-add fields
      frontInput.value = '';
      backInput.value  = '';
      frontInput.focus();
    });
  }

  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (!rawTextarea.value.trim()) return;
      if (!confirm('Clear all cards from the editor? This will not affect anything you copied elsewhere.')) return;
      rawTextarea.value = '';
    });
  }

  // ---------- Build deck from textarea ----------
  if (btnUseCards) {
    btnUseCards.addEventListener('click', () => {
      const text = rawTextarea.value || '';
      const cards = parseDeck(text);
      if (!cards.length) {
        alert('No valid cards found. Use "Front | Back" format or the Quick Add Card section.');
        return;
      }
      deck = cards;
      index = 0;
      showingFront = true;
      renderCard();
    });
  }

  // ---------- Viewer controls ----------
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (!ensureDeckOrWarn()) return;
      index = (index - 1 + deck.length) % deck.length;
      showingFront = true;
      renderCard();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (!ensureDeckOrWarn()) return;
      index = (index + 1) % deck.length;
      showingFront = true;
      renderCard();
    });
  }

  if (btnFlip) {
    btnFlip.addEventListener('click', () => {
      if (!ensureDeckOrWarn()) return;
      showingFront = !showingFront;
      renderCard();
    });
  }

  if (btnMarkKnown) {
    btnMarkKnown.addEventListener('click', () => {
      if (!ensureDeckOrWarn()) return;
      deck[index].known = !deck[index].known;
      renderCard();
    });
  }

  if (btnResetProg) {
    btnResetProg.addEventListener('click', () => {
      if (!ensureDeckOrWarn()) return;
      if (!confirm('Reset known/unknown status for all cards this session?')) return;
      deck.forEach(c => { c.known = false; });
      renderCard();
    });
  }

  // ---------- Projector View ----------
  if (btnProjector) {
    btnProjector.addEventListener('click', () => {
      const isOn = document.body.classList.toggle('fc-projector');
      btnProjector.textContent = isOn ? 'Exit Projector View' : 'Projector View';
    });
  }

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight') {
      btnNext?.click();
    } else if (e.key === 'ArrowLeft') {
      btnPrev?.click();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      btnFlip?.click();
    } else if (e.key.toLowerCase() === 'k') {
      btnMarkKnown?.click();
    } else if (e.key.toLowerCase() === 'p') {
      btnProjector?.click();
    }
  });

  // Initial render
  renderCard();
})();
