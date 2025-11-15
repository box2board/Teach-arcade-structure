// /assets/scripts/name-picker.js
(function () {
  const textarea       = document.getElementById('names-input');
  const listNameInput  = document.getElementById('list-name');
  const savedSelect    = document.getElementById('saved-lists');

  const btnSaveList    = document.getElementById('btn-save-list');
  const btnLoadList    = document.getElementById('btn-load-list');
  const btnDeleteList  = document.getElementById('btn-delete-list');

  const btnUseList     = document.getElementById('btn-use-list');
  const btnClearInput  = document.getElementById('btn-clear-input');

  const btnPick        = document.getElementById('btn-pick');
  const btnReset       = document.getElementById('btn-reset-round');
  const btnFull        = document.getElementById('btn-fullscreen');

  const currentNameEl  = document.getElementById('current-name');
  const historyEl      = document.getElementById('history');
  const countsEl       = document.getElementById('name-counts');

  if (!textarea || !btnPick) return; // safety

  const STORAGE_KEY = 'ta_name_lists';

  let allNames = [];    // full list for this round
  let remaining = [];   // names not yet drawn
  let history = [];     // drawn names in order

  // ---------- helpers ----------
  function normalizeList(text) {
    return text
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function updateCounts() {
    if (!allNames.length) {
      countsEl.textContent = 'No names loaded yet.';
      return;
    }
    countsEl.textContent = `${history.length} picked • ${remaining.length} remaining • ${allNames.length} total`;
  }

  function renderHistory() {
    if (!history.length) {
      historyEl.innerHTML = '';
      return;
    }
    historyEl.innerHTML = history
      .map((name, idx) => `<li><span>#${idx + 1}</span><span>${name}</span></li>`)
      .join('');
  }

  function setCurrent(name) {
    currentNameEl.textContent = name || '—';
  }

  function loadFromTextarea() {
    const names = normalizeList(textarea.value);
    allNames = names.slice();
    remaining = names.slice();
    history = [];
    setCurrent('—');
    renderHistory();
    updateCounts();
  }

  // ---------- saved rosters in localStorage ----------
  function getSavedLists() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveLists(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('Failed saving lists', e);
    }
  }

  function refreshSavedSelect() {
    const saved = getSavedLists();
    const names = Object.keys(saved).sort((a, b) => a.localeCompare(b));
    savedSelect.innerHTML = `<option value="">Select a saved roster…</option>`;
    for (const name of names) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      savedSelect.appendChild(opt);
    }
  }

  // ---------- event handlers: saved rosters ----------
  btnSaveList.addEventListener('click', () => {
    const rosterName = (listNameInput.value || '').trim();
    if (!rosterName) {
      alert('Please enter a roster name first.');
      return;
    }
    const text = textarea.value || '';
    if (!normalizeList(text).length) {
      alert('Please enter at least one name in the roster textarea.');
      return;
    }
    const saved = getSavedLists();
    saved[rosterName] = text;
    saveLists(saved);
    refreshSavedSelect();
    savedSelect.value = rosterName;
  });

  btnLoadList.addEventListener('click', () => {
    const key = savedSelect.value;
    if (!key) {
      alert('Choose a saved roster first.');
      return;
    }
    const saved = getSavedLists();
    if (!saved[key]) {
      alert('Saved roster not found.');
      return;
    }
    textarea.value = saved[key];
    loadFromTextarea();
  });

  btnDeleteList.addEventListener('click', () => {
    const key = savedSelect.value;
    if (!key) {
      alert('Choose a saved roster to delete.');
      return;
    }
    if (!confirm(`Delete saved roster "${key}"? This cannot be undone.`)) return;
    const saved = getSavedLists();
    delete saved[key];
    saveLists(saved);
    refreshSavedSelect();
    textarea.value = '';
    allNames = [];
    remaining = [];
    history = [];
    setCurrent('—');
    renderHistory();
    updateCounts();
  });

  // ---------- event handlers: main picker ----------
  btnUseList.addEventListener('click', () => {
    loadFromTextarea();
  });

  btnClearInput.addEventListener('click', () => {
    textarea.value = '';
  });

  btnPick.addEventListener('click', () => {
    if (!remaining.length) {
      if (!allNames.length) {
        alert('No names loaded. Click "Use This List" after typing or loading names.');
        return;
      }
      alert('All names have been picked this round. Click "Reset Round" to start over.');
      return;
    }
    const idx = Math.floor(Math.random() * remaining.length);
    const name = remaining.splice(idx, 1)[0];
    history.push(name);
    setCurrent(name);
    renderHistory();
    updateCounts();
  });

  btnReset.addEventListener('click', () => {
    if (!allNames.length) {
      alert('No names loaded yet.');
      return;
    }
    if (!confirm('Reset this round and make everyone available again?')) return;
    remaining = allNames.slice();
    history = [];
    setCurrent('—');
    renderHistory();
    updateCounts();
  });

  // ---------- Fullscreen toggle ----------
  if (btnFull) {
    btnFull.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) {
          // Go full screen (whole page)
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (e) {
        console.error('Fullscreen error:', e);
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        btnFull.textContent = 'Exit Full Screen';
      } else {
        btnFull.textContent = 'Full Screen';
      }
    });
  }

  // ---------- init ----------
  refreshSavedSelect();
  updateCounts();
})();
