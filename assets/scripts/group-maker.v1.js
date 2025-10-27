(() => {
  // ----- Grab elements (adjust IDs here if your HTML differs) -----
  const $ = sel => document.querySelector(sel);
  const namesEl       = $('#names');
  const modeEl        = $('#mode');        // values: 'size' or 'count'
  const groupSizeEl   = $('#groupSize');   // number when mode = size
  const groupCountEl  = $('#groupCount');  // number when mode = count
  const balancingEl   = $('#balancing');   // values: 'even' (default) | 'by_order'
  const shuffleFirstEl= $('#shuffleFirst');
  const avoidPriorEl  = $('#avoidPrior');
  const makeBtn       = $('#makeBtn');
  const clearBtn      = $('#clearBtn');
  const outEl         = $('#output');
  const statusEl      = $('#status');

  if (!makeBtn) {
    // If IDs don’t match, bail quietly so the page still loads.
    console.warn('[Group Maker] Button not found. Check element IDs.');
    return;
  }

  // ----- Simple local storage for “avoid prior pairings” -----
  const STORAGE_KEY = 'ta-groupmaker-priorPairs-v1';
  function loadPrior() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function savePrior(pairs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  }

  // Utility: canonical pair key (A,B) => 'A|B' (sorted)
  function pairKey(a,b) {
    const [x,y] = [String(a).trim(), String(b).trim()].sort();
    return `${x}|${y}`;
  }

  // ----- Helpers -----
  function setStatus(msg) { if (statusEl) statusEl.textContent = `Status: ${msg}`; }

  function parseNames() {
    return (namesEl.value || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Try to spread “prior pairs” apart by reshuffling a few times
  function deconflict(names, priorPairsSet) {
    if (!priorPairsSet.size) return names;
    let best = names.slice();
    let bestScore = score(best);
    for (let i = 0; i < 100; i++) {
      const cand = shuffle(names.slice());
      const s = score(cand);
      if (s < bestScore) { best = cand; bestScore = s; }
      if (bestScore === 0) break;
    }
    return best;

    function score(list) {
      // Score counts adjacent prior pairs (rough heuristic before grouping)
      let bad = 0;
      for (let i = 0; i < list.length - 1; i++) {
        if (priorPairsSet.has(pairKey(list[i], list[i+1]))) bad++;
      }
      return bad;
    }
  }

  function renderGroups(groups) {
    const frag = document.createDocumentFragment();

    groups.forEach((g, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      const h = document.createElement('h3');
      h.textContent = `Group ${idx + 1}`;
      const ul = document.createElement('ul');
      ul.style.margin = '8px 0 0 18px';
      g.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        ul.appendChild(li);
      });
      card.appendChild(h);
      card.appendChild(ul);
      frag.appendChild(card);
    });

    outEl.innerHTML = '';
    outEl.appendChild(frag);
  }

  function makeGroups() {
    let names = parseNames();
    if (!names.length) { alert('Add at least one name.'); return; }

    // Shuffle first if requested
    if (shuffleFirstEl?.checked) shuffle(names);

    // If we’re avoiding prior pairings, try to move likely pairs apart a bit
    const priorPairs = new Set(loadPrior());
    if (avoidPriorEl?.checked) {
      names = deconflict(names, priorPairs);
    }

    // Determine target group size or count
    const mode = (modeEl?.value || 'size').toLowerCase();
    let groupSize, groupCount;

    if (mode === 'count') {
      groupCount = Math.max(1, parseInt(groupCountEl?.value || '2', 10));
      groupSize  = Math.ceil(names.length / groupCount);
    } else {
      groupSize  = Math.max(1, parseInt(groupSizeEl?.value || '2', 10));
      groupCount = Math.ceil(names.length / groupSize);
    }

    // Balance mode (you can expand later; we keep “even” as default)
    const balancing = (balancingEl?.value || 'even').toLowerCase();

    const groups = Array.from({ length: groupCount }, () => []);
    if (balancing === 'by_order') {
      // Fill groups top-to-bottom before moving to next group
      let gi = 0;
      names.forEach(n => {
        groups[gi].push(n);
        gi = (gi + 1) % groupCount;
      });
    } else {
      // Even (round-robin) — spreads stronger randomness
      let gi = 0, direction = 1;
      names.forEach(n => {
        groups[gi].push(n);
        gi += direction;
        if (gi === groupCount - 1 || gi === 0) direction *= -1; // zig-zag to distribute
      });
    }

    // Trim to requested group size if we’re in size-mode (keep overflow fairly)
    if ((mode !== 'count') && groupSize > 0) {
      let i = 0;
      while (true) {
        const totalOver = groups.reduce((acc, g) => acc + Math.max(0, g.length - groupSize), 0);
        if (!totalOver) break;
        const g = groups[i % groups.length];
        if (g.length > groupSize) {
          // find the shortest group to move into
          const shortestIdx = groups.reduce((minI, g2, j) => g2.length < groups[minI].length ? j : minI, 0);
          const moved = g.pop();
          groups[shortestIdx].push(moved);
        }
        i++;
        if (i > 5000) break; // safety
      }
    }

    renderGroups(groups);
    setStatus('Done');

    // Record today’s pairings for “avoid prior pairings”
    if (avoidPriorEl?.checked) {
      const newPairs = new Set(priorPairs);
      groups.forEach(g => {
        for (let i = 0; i < g.length; i++) {
          for (let j = i + 1; j < g.length; j++) {
            newPairs.add(pairKey(g[i], g[j]));
          }
        }
      });
      savePrior(Array.from(newPairs));
    }
  }

  function clearAll() {
    namesEl.value = '';
    outEl.innerHTML = '';
    setStatus('Cleared');
    setTimeout(() => setStatus('Ready'), 800);
  }

  // ----- Wire up events -----
  makeBtn.type = 'button'; // ensure it doesn't submit a form
  makeBtn.addEventListener('click', makeGroups);
  clearBtn?.addEventListener('click', clearAll);

  setStatus('Ready');
})();
