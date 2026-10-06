(() => {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const CANVAS_SIZE = 600;
  const CENTER = CANVAS_SIZE / 2;
  const RADIUS = 282;

  const $ = (id) => document.getElementById(id);
  const statusEl = $('status');
  const canvas = $('wheelCanvas');
  const ctx = canvas?.getContext('2d');
  const textarea = $('items');
  const resultEl = $('result');
  const spinBtn = $('spin');
  const clearBtn = $('clear');
  const shuffleBtn = $('shuffle');
  const resetRemovedBtn = $('resetRemoved');
  const removeAfter = $('removeAfter');
  const soundToggle = $('sound');
  const confettiToggle = $('confetti');
  const confettiLayer = $('confettiLayer');
  const paletteSel = $('palette');
  const darkToggle = $('darkToggle');
  const projectorBtn = $('projectorMode');
  const entryCountEl = $('entryCount');
  const removedCountEl = $('removedCount');
  const overlay = $('overlay');
  const overlayWinner = $('overlayWinner');
  const overlayClose = $('overlayClose');
  const overlaySpinAgain = $('overlaySpinAgain');
  const listNameInput = $('listName');
  const savedListsSelect = $('savedLists');
  const saveListBtn = $('saveList');
  const loadListBtn = $('loadList');
  const deleteListBtn = $('deleteList');

  if (!canvas || !ctx || !textarea || !spinBtn) return;

  const LISTS_KEY = 'ta-wheel-saved-lists-v1';
  const LEGACY_STORAGE_KEY = 'ta-wheel-v2';
  const THEME_KEY = 'ta-wheel-theme';
  const PALETTE_KEY = 'ta-wheel-palette';
  const SOUND_KEY = 'ta-wheel-sound';
  const CONFETTI_KEY = 'ta-wheel-confetti';
  const REMOVE_KEY = 'ta-wheel-remove-after';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const PALETTES = {
    vibrant: [
      { fill: '#2563eb', text: '#ffffff' },
      { fill: '#db2777', text: '#ffffff' },
      { fill: '#0f766e', text: '#ffffff' },
      { fill: '#7c3aed', text: '#ffffff' },
      { fill: '#c2410c', text: '#ffffff' },
      { fill: '#047857', text: '#ffffff' },
      { fill: '#be123c', text: '#ffffff' },
      { fill: '#4338ca', text: '#ffffff' }
    ],
    classroom: [
      { fill: '#1d4ed8', text: '#ffffff' },
      { fill: '#15803d', text: '#ffffff' },
      { fill: '#b45309', text: '#ffffff' },
      { fill: '#6d28d9', text: '#ffffff' },
      { fill: '#0e7490', text: '#ffffff' },
      { fill: '#b91c1c', text: '#ffffff' }
    ],
    pastel: [
      { fill: '#bfdbfe', text: '#172554' },
      { fill: '#fbcfe8', text: '#500724' },
      { fill: '#bbf7d0', text: '#052e16' },
      { fill: '#ddd6fe', text: '#2e1065' },
      { fill: '#fed7aa', text: '#431407' },
      { fill: '#a5f3fc', text: '#083344' }
    ],
    mono: [
      { fill: '#0f3d70', text: '#ffffff' },
      { fill: '#164e8a', text: '#ffffff' },
      { fill: '#1d5fa3', text: '#ffffff' },
      { fill: '#256fbc', text: '#ffffff' },
      { fill: '#3b82c4', text: '#ffffff' },
      { fill: '#5a96cf', text: '#0f172a' }
    ]
  };

  let items = [];
  let roundSource = [];
  let startAngle = -Math.PI / 2;
  let arc = 0;
  let isSpinning = false;
  let lastTickIndex = -1;
  let needsRedrawAfterDialog = false;
  let lastFocusedElement = null;
  let audioContext = null;

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = message;
  };

  const parseEntries = (value) => String(value || '')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

  const normalizeAngle = (angle) => {
    const normalized = angle % TWO_PI;
    return normalized < 0 ? normalized + TWO_PI : normalized;
  };

  function randomUint32() {
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0];
    }
    return Math.floor(Math.random() * 0x100000000);
  }

  function secureRandomIndex(length) {
    if (!Number.isInteger(length) || length <= 0) return -1;
    if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * length);

    const range = 0x100000000;
    const limit = Math.floor(range / length) * length;
    let value;
    do {
      value = randomUint32();
    } while (value >= limit);
    return value % length;
  }

  function secureRandomUnit() {
    return randomUint32() / 0x100000000;
  }

  function shuffleArray(values) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = secureRandomIndex(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getRemovedCount() {
    return Math.max(0, roundSource.length - items.length);
  }

  function updateCounts() {
    const removed = getRemovedCount();
    entryCountEl.textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
    removedCountEl.textContent = `${removed} removed this round`;
    removedCountEl.hidden = removed === 0;
    resetRemovedBtn.disabled = removed === 0 || isSpinning;
    spinBtn.disabled = items.length === 0 || isSpinning;
    shuffleBtn.disabled = items.length < 2 || isSpinning;
    clearBtn.disabled = items.length === 0 && roundSource.length === 0;
  }

  function syncTextareaFromItems() {
    textarea.value = items.join('\n');
  }

  function setEntries(entries, { resetRound = true } = {}) {
    items = entries.slice();
    if (resetRound) roundSource = entries.slice();
    syncTextareaFromItems();
    resultEl.textContent = '';
    drawWheel();
    updateCounts();
  }

  function ellipsize(text, maxWidth, font) {
    ctx.font = font;
    if (ctx.measureText(text).width <= maxWidth) return text;
    let output = String(text);
    while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) {
      output = output.slice(0, -1);
    }
    return `${output}…`;
  }

  function drawEmptyWheel() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, TWO_PI);
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#263449' : '#e2e8f0';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#475569' : '#cbd5e1';
    ctx.stroke();
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#dbeafe' : '#334155';
    ctx.font = '700 22px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paste a list to begin', CENTER, CENTER - 54);
  }

  function drawSliceLabel(sliceCenterAngle, label, paletteText) {
    const segmentHeight = Math.max(8, arc * 205);
    const fontSize = clamp(segmentHeight * 0.48, 9, 18);
    const font = `700 ${fontSize}px Nunito, sans-serif`;
    const maxWidth = 160;
    const text = ellipsize(label, maxWidth, font);

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(sliceCenterAngle);
    ctx.font = font;
    ctx.fillStyle = paletteText;
    ctx.textBaseline = 'middle';

    const normalized = normalizeAngle(sliceCenterAngle);
    if (normalized > Math.PI / 2 && normalized < (Math.PI * 3) / 2) {
      ctx.rotate(Math.PI);
      ctx.textAlign = 'left';
      ctx.fillText(text, -(RADIUS - 30), 0, maxWidth);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(text, RADIUS - 30, 0, maxWidth);
    }
    ctx.restore();
  }

  function drawWheel() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (!items.length) {
      drawEmptyWheel();
      return;
    }

    arc = TWO_PI / items.length;
    const palette = PALETTES[paletteSel.value] || PALETTES.vibrant;

    for (let i = 0; i < items.length; i += 1) {
      const angle = startAngle + (i * arc);
      const colors = palette[i % palette.length];

      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, RADIUS, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.lineWidth = items.length > 40 ? 1 : 2;
      ctx.strokeStyle = 'rgba(255,255,255,.72)';
      ctx.stroke();

      drawSliceLabel(angle + (arc / 2), items[i], colors.text);
    }

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, TWO_PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a';
    ctx.stroke();
  }

  function indexUnderPointer() {
    if (!items.length || !arc) return -1;
    const pointerAngle = -Math.PI / 2;
    const relative = normalizeAngle(pointerAngle - startAngle);
    return Math.floor(relative / arc) % items.length;
  }

  function getAudioContext() {
    if (!soundToggle.checked) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume?.();
    return audioContext;
  }

  function clickTick() {
    const audio = getAudioContext();
    if (!audio) return;
    const t = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1650, t);
    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.04);
  }

  function celebrateSound() {
    const audio = getAudioContext();
    if (!audio) return;
    const now = audio.currentTime;
    [659, 784, 988].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = now + (index * 0.055);
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
    });
  }

  function fireConfetti() {
    if (!confettiLayer || !confettiToggle.checked || reduceMotion.matches) return;
    confettiLayer.replaceChildren();
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];
    for (let i = 0; i < 60; i += 1) {
      const piece = document.createElement('span');
      piece.style.left = `${secureRandomUnit() * 100}%`;
      piece.style.top = `${secureRandomUnit() * 8}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${secureRandomUnit() * 0.28}s`;
      confettiLayer.appendChild(piece);
    }
    window.setTimeout(() => confettiLayer.replaceChildren(), 1250);
  }

  function closeOverlay({ returnFocus = true } = {}) {
    overlay.classList.remove('show');
    if (needsRedrawAfterDialog) {
      needsRedrawAfterDialog = false;
      drawWheel();
    }
    if (returnFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }

  function showOverlay(name) {
    lastFocusedElement = document.activeElement;
    overlayWinner.textContent = name;
    overlay.classList.add('show');
    overlaySpinAgain.disabled = items.length === 0;
    overlaySpinAgain.focus();
  }

  function finishSpin(winnerIndex) {
    startAngle = normalizeAngle(startAngle);
    drawWheel();

    const winner = items[winnerIndex];
    if (winner == null) {
      isSpinning = false;
      setStatus('Ready');
      updateCounts();
      return;
    }

    resultEl.textContent = `Selected: ${winner}`;
    setStatus('Selection complete');
    celebrateSound();
    fireConfetti();

    if (removeAfter.checked) {
      items.splice(winnerIndex, 1);
      syncTextareaFromItems();
      needsRedrawAfterDialog = true;
    }

    isSpinning = false;
    updateCounts();
    showOverlay(winner);
  }

  function spin() {
    if (isSpinning) return;
    if (!items.length) {
      setStatus('Add at least one entry to spin.');
      textarea.focus();
      return;
    }

    isSpinning = true;
    resultEl.textContent = '';
    setStatus('Spinning…');
    updateCounts();
    getAudioContext();

    arc = TWO_PI / items.length;
    const winnerIndex = secureRandomIndex(items.length);
    const targetAngle = normalizeAngle((-Math.PI / 2) - ((winnerIndex + 0.5) * arc));
    const currentAngle = normalizeAngle(startAngle);
    const alignmentDelta = normalizeAngle(targetAngle - currentAngle);

    if (reduceMotion.matches) {
      startAngle = currentAngle + alignmentDelta;
      drawWheel();
      window.setTimeout(() => finishSpin(winnerIndex), 40);
      return;
    }

    const extraTurns = 5 + secureRandomIndex(3);
    const totalRotation = (extraTurns * TWO_PI) + alignmentDelta;
    const fromAngle = startAngle;
    const toAngle = fromAngle + totalRotation;
    const duration = 2800 + Math.floor(secureRandomUnit() * 450);
    const startedAt = performance.now();
    lastTickIndex = indexUnderPointer();

    const easeInOutCubic = (progress) => (
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (Math.pow(-2 * progress + 2, 3) / 2)
    );

    const animate = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = easeInOutCubic(progress);
      startAngle = fromAngle + (totalRotation * eased);
      drawWheel();

      const currentIndex = indexUnderPointer();
      if (currentIndex !== lastTickIndex) {
        lastTickIndex = currentIndex;
        clickTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        startAngle = toAngle;
        drawWheel();
        finishSpin(winnerIndex);
      }
    };

    requestAnimationFrame(animate);
  }

  function resetRemoved() {
    if (!roundSource.length) return;
    items = roundSource.slice();
    syncTextareaFromItems();
    resultEl.textContent = '';
    needsRedrawAfterDialog = false;
    drawWheel();
    updateCounts();
    setStatus('Full list restored');
  }

  function readSavedLists() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LISTS_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeSavedLists(lists) {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  }

  function refreshSavedListOptions(selectedName = '') {
    const lists = readSavedLists();
    savedListsSelect.innerHTML = '<option value="">Choose a saved list…</option>';
    Object.keys(lists)
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        savedListsSelect.appendChild(option);
      });
    if (selectedName && Object.prototype.hasOwnProperty.call(lists, selectedName)) {
      savedListsSelect.value = selectedName;
    }
  }

  function migrateLegacySavedList() {
    const existing = readSavedLists();
    if (Object.keys(existing).length) return;
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || 'null');
      const legacyEntries = parseEntries(legacy?.items || '');
      if (!legacyEntries.length) return;
      existing['Saved wheel'] = legacyEntries.join('\n');
      writeSavedLists(existing);
    } catch (_) {}
  }

  function saveCurrentList() {
    const source = roundSource.length ? roundSource : parseEntries(textarea.value);
    if (!source.length) {
      setStatus('Add entries before saving a list.');
      textarea.focus();
      return;
    }

    const lists = readSavedLists();
    const fallbackNumber = Object.keys(lists).length + 1;
    const name = (listNameInput.value.trim() || `Saved list ${fallbackNumber}`).slice(0, 60);
    lists[name] = source.join('\n');
    writeSavedLists(lists);
    listNameInput.value = '';
    refreshSavedListOptions(name);
    setStatus(`Saved “${name}” on this device`);
  }

  function loadSelectedList() {
    const name = savedListsSelect.value;
    if (!name) {
      setStatus('Choose a saved list first.');
      savedListsSelect.focus();
      return;
    }
    const lists = readSavedLists();
    const entries = parseEntries(lists[name] || '');
    setEntries(entries, { resetRound: true });
    setStatus(`Loaded “${name}”`);
  }

  function deleteSelectedList() {
    const name = savedListsSelect.value;
    if (!name) {
      setStatus('Choose a saved list first.');
      savedListsSelect.focus();
      return;
    }
    const lists = readSavedLists();
    delete lists[name];
    writeSavedLists(lists);
    refreshSavedListOptions();
    setStatus(`Deleted saved list “${name}”`);
  }

  function updateThemeButton() {
    const dark = document.documentElement.classList.contains('dark');
    darkToggle.setAttribute('aria-pressed', String(dark));
    darkToggle.textContent = dark ? 'Light mode' : 'Dark mode';
  }

  function setProjectorState(active) {
    document.body.classList.toggle('projector-mode', active);
    projectorBtn.setAttribute('aria-pressed', String(active));
    projectorBtn.textContent = active ? 'Exit projector' : 'Projector mode';
  }

  async function toggleProjectorMode() {
    const turningOn = !document.body.classList.contains('projector-mode');
    if (turningOn) {
      setProjectorState(true);
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (_) {
        // The layout-only projector mode remains active when fullscreen is unavailable.
      }
    } else {
      setProjectorState(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      } catch (_) {}
    }
  }

  textarea.addEventListener('input', () => {
    if (isSpinning) return;
    const entries = parseEntries(textarea.value);
    items = entries.slice();
    roundSource = entries.slice();
    resultEl.textContent = '';
    drawWheel();
    updateCounts();
    setStatus(items.length ? 'Ready' : 'Add a list to begin');
  });

  spinBtn.addEventListener('click', spin);

  clearBtn.addEventListener('click', () => {
    if (isSpinning) return;
    items = [];
    roundSource = [];
    textarea.value = '';
    resultEl.textContent = '';
    drawWheel();
    updateCounts();
    setStatus('List cleared');
    textarea.focus();
  });

  shuffleBtn.addEventListener('click', () => {
    if (isSpinning || items.length < 2) return;
    items = shuffleArray(items);
    if (getRemovedCount() === 0) roundSource = items.slice();
    syncTextareaFromItems();
    drawWheel();
    updateCounts();
    setStatus('List shuffled');
  });

  resetRemovedBtn.addEventListener('click', resetRemoved);

  removeAfter.addEventListener('change', () => {
    localStorage.setItem(REMOVE_KEY, removeAfter.checked ? '1' : '0');
  });

  soundToggle.addEventListener('change', () => {
    localStorage.setItem(SOUND_KEY, soundToggle.checked ? '1' : '0');
  });

  confettiToggle.addEventListener('change', () => {
    localStorage.setItem(CONFETTI_KEY, confettiToggle.checked ? '1' : '0');
  });

  paletteSel.addEventListener('change', () => {
    localStorage.setItem(PALETTE_KEY, paletteSel.value);
    drawWheel();
  });

  darkToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
    drawWheel();
  });

  projectorBtn.addEventListener('click', toggleProjectorMode);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('projector-mode')) {
      setProjectorState(false);
    }
  });

  saveListBtn.addEventListener('click', saveCurrentList);
  loadListBtn.addEventListener('click', loadSelectedList);
  deleteListBtn.addEventListener('click', deleteSelectedList);

  overlayClose.addEventListener('click', () => closeOverlay());
  overlaySpinAgain.addEventListener('click', () => {
    if (!items.length || isSpinning) return;
    closeOverlay({ returnFocus: false });
    spinBtn.focus();
    spin();
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('show')) {
      event.preventDefault();
      closeOverlay();
      return;
    }

    if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (overlay.classList.contains('show')) return;

    const target = event.target;
    const tag = target?.tagName?.toLowerCase();
    const isEditing = tag === 'textarea' || tag === 'input' || tag === 'select' || target?.isContentEditable;
    const isButtonOrLink = tag === 'button' || tag === 'a' || tag === 'summary';
    if (isEditing || isButtonOrLink) return;

    event.preventDefault();
    spin();
  });

  // Keep focus inside the winner dialog while it is open.
  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [overlaySpinAgain, overlayClose].filter((element) => !element.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function init() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
    updateThemeButton();

    const storedPalette = localStorage.getItem(PALETTE_KEY);
    if (storedPalette && PALETTES[storedPalette]) paletteSel.value = storedPalette;

    removeAfter.checked = localStorage.getItem(REMOVE_KEY) === '1';
    soundToggle.checked = localStorage.getItem(SOUND_KEY) === '1';
    const storedConfetti = localStorage.getItem(CONFETTI_KEY);
    confettiToggle.checked = storedConfetti == null ? true : storedConfetti === '1';

    migrateLegacySavedList();
    refreshSavedListOptions();

    items = parseEntries(textarea.value);
    roundSource = items.slice();
    drawWheel();
    updateCounts();
    setStatus(items.length ? 'Ready' : 'Paste or type a list to begin');
  }

  init();
})();
