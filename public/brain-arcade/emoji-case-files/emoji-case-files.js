const PROGRESS_KEY = 'ecfiles_progress_v1';
const SETTINGS_KEY = 'ecfiles_settings_v1';

const fileNames = { 1: 'OPEN & SHUT', 2: 'MOVING LEADS', 3: 'COLD CASES' };
const rankBands = [
  { min: 41, name: 'Chief Detective' },
  { min: 26, name: 'Inspector' },
  { min: 16, name: 'Analyst' },
  { min: 6, name: 'Investigator' },
  { min: 0, name: 'Trainee' }
];

const state = {
  cases: [],
  files: new Map(),
  currentFile: 1,
  currentCaseIndex: 0,
  currentCase: null,
  integrity: 100,
  moves: 0,
  selectedSlotId: null,
  placements: {},
  history: [],
  removedDecoys: new Set(),
  shuffledOnce: false,
  screen: 'start',
  helperText: '',
  progress: loadProgress(),
  settings: loadSettings()
};

const app = document.getElementById('app');

init();

async function init() {
  const response = await fetch('/brain-arcade/emoji-case-files/data/cases.json');
  state.cases = await response.json();
  state.cases.sort((a, b) => a.file - b.file || a.case - b.case);
  state.cases.forEach((c) => {
    if (!state.files.has(c.file)) state.files.set(c.file, []);
    state.files.get(c.file).push(c);
  });
  render();
}

function loadProgress() {
  const fallback = { solvedCases: {}, unlockedFiles: 1, totalSolved: 0, rank: 'Trainee', fails: 0 };
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') }; }
  catch { return fallback; }
}

function loadSettings() {
  try { return { soundOn: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { soundOn: false }; }
}

function saveProgress() {
  state.progress.totalSolved = Object.keys(state.progress.solvedCases).length;
  state.progress.rank = getRank(state.progress.totalSolved);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function getRank(totalSolved) {
  return rankBands.find((band) => totalSolved >= band.min).name;
}

function render() {
  if (state.screen === 'start') return renderStart();
  if (state.screen === 'files') return renderFiles();
  if (state.screen === 'case') return renderCase();
}

function renderStart() {
  app.innerHTML = `<section class="ecf-panel">
    <p class="ecf-pill">Brain Arcade • Light Noir</p>
    <h1 class="ecf-title">Emoji Case Files</h1>
    <p class="ecf-subtitle">Open the dossier. Follow the evidence. Keep your integrity intact.</p>
    <div class="ecf-statline">
      <span class="ecf-pill">Rank: ${state.progress.rank}</span>
      <span class="ecf-pill">Cases Solved: ${state.progress.totalSolved}</span>
      <span class="ecf-pill">Files Unlocked: ${state.progress.unlockedFiles}/3</span>
    </div>
    <div class="ecf-actions">
      <button class="ecf-btn" data-action="start">Start Investigation</button>
      <button class="ecf-btn secondary" data-action="files">Case Files</button>
      <button class="ecf-btn secondary" data-action="howto">How To Play</button>
    </div>
    <p class="helper" id="howto-text"></p>
  </section>`;
  app.querySelector('[data-action="start"]').onclick = () => { state.screen = 'files'; render(); };
  app.querySelector('[data-action="files"]').onclick = () => { state.screen = 'files'; render(); };
  app.querySelector('[data-action="howto"]').onclick = () => {
    app.querySelector('#howto-text').textContent = 'Select a slot, choose evidence, and submit. Wrong tile: -10 integrity. Wrong submit/incomplete: -15. Solve 8/10 to unlock the next file.';
  };
}

function renderFiles() {
  const fileButtons = [1, 2, 3].map((fileNum) => {
    const solved = getSolvedCount(fileNum);
    const unlocked = fileNum <= state.progress.unlockedFiles;
    return `<button class="file-btn ${unlocked ? '' : 'locked'}" data-file="${fileNum}" ${unlocked ? '' : 'disabled'}>
      <p class="ecf-pill">FILE ${fileNum}: ${fileNames[fileNum]}</p>
      <h3>Investigation File ${fileNum}</h3>
      <p>Solved ${solved}/10</p>
      <p>${unlocked ? 'Open File' : 'Locked'}</p>
    </button>`;
  }).join('');

  app.innerHTML = `<section class="ecf-panel">
    <h2 class="ecf-title">Case Files</h2>
    <p class="ecf-subtitle">Choose a file. Close 8 cases to unlock the next dossier.</p>
    <div class="file-grid">${fileButtons}</div>
    <div class="ecf-actions"><button class="ecf-btn secondary" id="back-start">Back</button></div>
  </section>`;

  app.querySelectorAll('.file-btn').forEach((btn) => btn.addEventListener('click', () => {
    const fileNum = Number(btn.dataset.file);
    loadCase(fileNum, 0);
  }));
  app.querySelector('#back-start').onclick = () => { state.screen = 'start'; render(); };
}

function loadCase(fileNum, caseIndex) {
  state.currentFile = fileNum;
  state.currentCaseIndex = caseIndex;
  state.currentCase = state.files.get(fileNum)[caseIndex];
  state.integrity = 100;
  state.moves = 0;
  state.selectedSlotId = null;
  state.placements = {};
  state.history = [];
  state.helperText = '';
  state.removedDecoys = new Set();
  state.shuffledOnce = false;
  state.evidence = shuffle([...new Set(state.currentCase.tiles)]);
  state.screen = 'case';
  render();
}

function renderCase() {
  const c = state.currentCase;
  const slotHTML = c.slots.map((slot) => {
    const p = state.placements[slot.id];
    const isLocked = Boolean(p?.locked);
    return `<button class="slot-btn ${state.selectedSlotId === slot.id ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-slot="${slot.id}" ${isLocked ? 'disabled' : ''}>${p ? p.value : '____'}</button>`;
  }).join('');

  const tiles = state.evidence.filter((emoji) => !state.removedDecoys.has(emoji));
  const tileHTML = tiles.map((emoji) => `<button class="tile-btn" data-tile="${emoji}" aria-label="Evidence ${emoji}">${emoji}</button>`).join('');

  app.innerHTML = `<section>
    <div class="topbar">
      <div class="top-item">Rank: ${state.progress.rank}</div>
      <div class="top-item">CASE #${c.case} • FILE ${c.file}</div>
      <div class="top-item">Integrity ${state.integrity}%<div class="integrity-wrap"><div class="integrity-bar" style="width:${Math.max(0,state.integrity)}%"></div></div></div>
    </div>
    <article class="case-card">
      <p class="case-heading">FILE ${c.file}: ${fileNames[c.file]}</p>
      <h2 class="case-title">${c.title}</h2>
      <p class="case-category">${c.category}</p>
      <div class="slot-row">${slotHTML}</div>
    </article>
    <article class="evidence-card">
      <p class="case-heading">EVIDENCE</p>
      <div class="evidence-row">${tileHTML}</div>
    </article>
    <article class="controls-card">
      <button class="ecf-btn secondary" id="shuffle-btn" ${state.shuffledOnce ? 'disabled' : ''}>Shuffle Evidence</button>
      <button class="ecf-btn secondary" id="undo-btn">Undo</button>
      <button class="ecf-btn secondary" id="clear-btn">Clear Case</button>
      <button class="ecf-btn" id="submit-btn">Submit</button>
      <button class="ecf-btn secondary" id="menu-btn">Case Files</button>
    </article>
    <p class="helper">${state.helperText}</p>
  </section>`;

  app.querySelectorAll('.slot-btn').forEach((b) => b.addEventListener('click', () => {
    state.selectedSlotId = b.dataset.slot;
    state.helperText = `Slot selected. Choose evidence.`;
    render();
  }));
  app.querySelectorAll('.tile-btn').forEach((b) => b.addEventListener('click', () => placeTile(b.dataset.tile, b)));

  app.querySelector('#shuffle-btn').onclick = () => {
    state.evidence = shuffle(state.evidence.slice());
    state.shuffledOnce = true;
    render();
  };
  app.querySelector('#undo-btn').onclick = undoMove;
  app.querySelector('#clear-btn').onclick = () => {
    state.placements = {};
    state.history = [];
    state.selectedSlotId = null;
    state.removedDecoys = new Set();
    state.helperText = 'Case board cleared. Integrity unchanged.';
    render();
  };
  app.querySelector('#submit-btn').onclick = submitCase;
  app.querySelector('#menu-btn').onclick = () => { state.screen = 'files'; render(); };

  app.addEventListener('keydown', handleKeys, { once: true });
}

function placeTile(emoji, tileEl) {
  if (!state.selectedSlotId) {
    state.helperText = 'Select a slot first.';
    return render();
  }
  const slot = state.currentCase.slots.find((s) => s.id === state.selectedSlotId);
  if (!slot) return;
  const mappedValue = state.currentCase.tileMap[emoji];

  if (mappedValue !== slot.answer) {
    state.integrity -= 10;
    state.helperText = 'Evidence mismatch. Integrity -10.';
    shakeSelector(`[data-slot="${slot.id}"]`);
    if (tileEl) tileEl.classList.add('shake');
    checkFail();
    return;
  }

  const previous = state.placements[slot.id] || null;
  state.history.push({ slotId: slot.id, prevPlacement: previous, integrityBefore: state.integrity });
  state.placements[slot.id] = { emoji, value: mappedValue, locked: true };
  state.selectedSlotId = null;
  state.moves += 1;
  removeSafeDecoys();
  state.helperText = 'Correct evidence logged. Slot locked.';
  render();
}

function removeSafeDecoys() {
  const remainingSlots = state.currentCase.slots.filter((slot) => !state.placements[slot.id]);
  const requiredValues = new Set(remainingSlots.map((slot) => slot.answer));
  const decoys = state.evidence.filter((emoji) => {
    const value = state.currentCase.tileMap[emoji];
    if (!value) return true;
    return !requiredValues.has(value);
  }).filter((emoji) => !state.removedDecoys.has(emoji));

  decoys.slice(0, 2).forEach((emoji) => state.removedDecoys.add(emoji));
}

function undoMove() {
  const last = state.history.pop();
  if (!last) {
    state.helperText = 'No move to undo.';
    return render();
  }
  if (last.prevPlacement) {
    state.placements[last.slotId] = last.prevPlacement;
  } else {
    delete state.placements[last.slotId];
  }
  state.helperText = 'Last placement removed. Integrity does not recover.';
  render();
}

function submitCase() {
  const isComplete = state.currentCase.slots.every((slot) => state.placements[slot.id]);
  const isCorrect = isComplete && state.currentCase.slots.every((slot) => state.placements[slot.id]?.value === slot.answer);

  if (!isCorrect) {
    state.integrity -= 15;
    state.helperText = isComplete ? 'Case failed verification. Integrity -15.' : 'Fill all blanks. Integrity -15.';
    checkFail();
    return render();
  }

  const stars = state.integrity >= 90 ? 3 : state.integrity >= 60 ? 2 : 1;
  const caseKey = `${state.currentCase.file}-${state.currentCase.case}`;
  const existing = state.progress.solvedCases[caseKey];
  if (!existing || stars > existing.stars || state.integrity > existing.bestIntegrity) {
    state.progress.solvedCases[caseKey] = { stars, bestIntegrity: state.integrity };
  }
  if (getSolvedCount(state.currentCase.file) >= 8 && state.progress.unlockedFiles < Math.min(3, state.currentCase.file + 1)) {
    state.progress.unlockedFiles = state.currentCase.file + 1;
    showOverlay('FILE UNLOCKED', `File ${state.progress.unlockedFiles} is now open.`);
  }
  saveProgress();
  showOverlay('CASE CLOSED', `Stars earned: ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, true);
}

function checkFail() {
  if (state.integrity > 0) {
    render();
    return false;
  }
  state.progress.fails = (state.progress.fails || 0) + 1;
  saveProgress();
  showOverlay('CASE FAILED', 'Integrity dropped to zero. Retry Investigation.', false, true);
  return true;
}

function showOverlay(title, message, solved = false, failed = false) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="overlay-card">
    <div class="stamp">${title}</div>
    <p>${message}</p>
    <button class="ecf-btn" id="overlay-next">${failed ? 'Retry Investigation' : (solved ? 'Next Case' : 'Continue')}</button>
    <button class="ecf-btn secondary" id="overlay-files">Case Files</button>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#overlay-files').onclick = () => { overlay.remove(); state.screen = 'files'; render(); };
  overlay.querySelector('#overlay-next').onclick = () => {
    overlay.remove();
    if (failed) {
      loadCase(state.currentFile, state.currentCaseIndex);
      return;
    }
    if (solved) {
      const fileCases = state.files.get(state.currentFile);
      const next = state.currentCaseIndex + 1;
      if (next < fileCases.length) loadCase(state.currentFile, next);
      else { state.screen = 'files'; render(); }
    } else render();
  };
}

function getSolvedCount(fileNum) {
  return Object.keys(state.progress.solvedCases).filter((key) => key.startsWith(`${fileNum}-`)).length;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function shakeSelector(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function handleKeys(event) {
  if (event.key === 'Escape') {
    state.selectedSlotId = null;
    render();
  }
}
