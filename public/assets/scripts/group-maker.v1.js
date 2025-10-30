(() => {
  // ----- DOM -----
  const namesEl = document.getElementById('names');
  const modeEl = document.getElementById('mode');
  const sizeField = document.getElementById('sizeField');
  const countField = document.getElementById('countField');
  const groupSizeEl = document.getElementById('groupSize');
  const groupCountEl = document.getElementById('groupCount');
  const balanceEl = document.getElementById('balance');
  const shuffleFirstEl = document.getElementById('shuffleFirst');
  const avoidRepeatsEl = document.getElementById('avoidRepeats');
  const makeBtn = document.getElementById('make');
  const clearBtn = document.getElementById('clear');
  const saveBtn = document.getElementById('save');
  const restoreBtn = document.getElementById('restore');
  const shareBtn = document.getElementById('share');
  const printBtn = document.getElementById('print');
  const recordPairsBtn = document.getElementById('recordPairs');
  const resetHistoryBtn = document.getElementById('resetHistory');
  const groupsEl = document.getElementById('groups');
  const summaryEl = document.getElementById('summary');
  const statusEl = document.getElementById('status');

  const STORAGE_KEY = 'ta-group-maker-v1';
  const HISTORY_KEY = 'ta-group-pairs-history';

  const setStatus = m => statusEl.textContent = 'Status: ' + m;

  // ----- Utils -----
  const cleanList = (txt) =>
    txt.split('\n').map(s => s.trim()).filter(Boolean);

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Pair key (order independent)
  const pairKey = (a,b) => {
    const [x,y] = [a,b].sort((m,n)=>m.localeCompare(n));
    return x + '||' + y;
  };

  const getHistory = () => {
    try { return new Set(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); }
    catch { return new Set(); }
  };
  const addPairsToHistory = (groups) => {
    const hist = getHistory();
    groups.forEach(g => {
      for (let i=0;i<g.length;i++) for (let j=i+1;j<g.length;j++) {
        hist.add(pairKey(g[i], g[j]));
      }
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...hist]));
  };

  // Cost function: count of repeated pairs
  const groupingCost = (groups, histSet) => {
    let cost = 0;
    groups.forEach(g => {
      for (let i=0;i<g.length;i++) for (let j=i+1;j<g.length;j++) {
        if (histSet.has(pairKey(g[i], g[j]))) cost++;
      }
    });
    return cost;
  };

  // Greedy-ish improve: try random swaps to lower cost
  const reduceRepeats = (groups, histSet, tries = 800) => {
    if (!histSet.size) return groups;
    const flat = groups.flat();
    // Map name -> [groupIndex, indexInGroup]
    const loc = new Map();
    groups.forEach((g, gi) => g.forEach((n, gj) => loc.set(n, [gi, gj])));

    let best = groups.map(g => g.slice());
    let bestCost = groupingCost(best, histSet);

    for (let t=0; t<tries; t++){
      const a = flat[Math.floor(Math.random()*flat.length)];
      const b = flat[Math.floor(Math.random()*flat.length)];
      if (a === b) continue;

      const [ga, ia] = loc.get(a);
      const [gb, ib] = loc.get(b);
      if (ga === gb) continue;

      // swap
      [best[ga][ia], best[gb][ib]] = [best[gb][ib], best[ga][ia]];
      const c = groupingCost(best, histSet);

      if (c <= bestCost) {
        // keep
        bestCost = c;
        loc.set(a, [gb, ib]);
        loc.set(b, [ga, ia]);
      } else {
        // undo
        [best[ga][ia], best[gb][ib]] = [best[gb][ib], best[ga][ia]];
      }
    }
    return best;
  };

  function buildGroups(list){
    let names = list.slice();
    if (shuffleFirstEl.checked) shuffle(names);

    let groups = [];
    if (modeEl.value === 'size') {
      const size = Math.max(2, parseInt(groupSizeEl.value || '2', 10));
      const count = Math.ceil(names.length / size);
      if (balanceEl.value === 'roundrobin') {
        groups = Array.from({length: count}, () => []);
        let i = 0;
        names.forEach(n => { groups[i % count].push(n); i++; });
      } else if (balanceEl.value === 'pure') {
        groups = [];
        while (names.length) groups.push(names.splice(0, size));
      } else { // chunk
        groups = [];
        for (let i=0; i<names.length; i+=size) groups.push(names.slice(i, i+size));
      }
    } else {
      const count = Math.max(2, parseInt(groupCountEl.value || '2', 10));
      groups = Array.from({length: count}, () => []);
      if (balanceEl.value === 'roundrobin') {
        let i = 0;
        names.forEach(n => { groups[i % count].push(n); i++; });
      } else if (balanceEl.value === 'pure') {
        names.forEach(n => groups[Math.floor(Math.random()*count)].push(n));
      } else { // chunk
        const size = Math.ceil(names.length / count);
        for (let i=0;i<names.length;i+=size) groups[i/size]?.push(...names.slice(i, i+size));
      }
    }

    if (avoidRepeatsEl.checked) {
      groups = reduceRepeats(groups, getHistory());
    }
    return groups;
  }

  function renderGroups(groups){
    groupsEl.innerHTML = '';
    groups.forEach((g, i) => {
      const card = document.createElement('div');
      card.className = 'group';
      card.innerHTML = `<h3>Group ${i+1}<span class="pill">${g.length}</span></h3>` +
                       `<ol class="small" style="margin:0 0 4px 18px;">${g.map(n=>`<li>${n}</li>`).join('')}</ol>`;
      groupsEl.appendChild(card);
    });
    const total = groups.reduce((a,g)=>a+g.length,0);
    summaryEl.textContent = `${groups.length} group(s), ${total} student(s)`;
  }

  // ----- Events -----
  modeEl.addEventListener('change', () => {
    const bySize = modeEl.value === 'size';
    sizeField.style.display = bySize ? '' : 'none';
    countField.style.display = bySize ? 'none' : '';
  });

  makeBtn.addEventListener('click', () => {
    const list = cleanList(namesEl.value);
    if (list.length < 2) { setStatus('Need at least 2 names'); return; }
    const groups = buildGroups(list);
    renderGroups(groups);
    setStatus('Groups created');
  });

  clearBtn.addEventListener('click', () => {
    namesEl.value = '';
    groupsEl.innerHTML = '';
    summaryEl.textContent = '';
    setStatus('Cleared');
  });

  saveBtn.addEventListener('click', () => {
    const data = {
      names: namesEl.value,
      mode: modeEl.value,
      size: groupSizeEl.value,
      count: groupCountEl.value,
      balance: balanceEl.value,
      shuffle: !!shuffleFirstEl.checked,
      avoid: !!avoidRepeatsEl.checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStatus('Saved');
  });

  restoreBtn.addEventListener('click', () => {
    try{
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!d || !d.names) return setStatus('Nothing saved');
      namesEl.value = d.names || '';
      modeEl.value = d.mode || 'size';
      groupSizeEl.value = d.size || 3;
      groupCountEl.value = d.count || 4;
      balanceEl.value = d.balance || 'roundrobin';
      shuffleFirstEl.checked = !!d.shuffle;
      avoidRepeatsEl.checked = !!d.avoid;
      modeEl.dispatchEvent(new Event('change'));
      setStatus('Restored');
    } catch { setStatus('Restore failed'); }
  });

  shareBtn.addEventListener('click', async () => {
    const p = new URLSearchParams();
    if (namesEl.value.trim()) p.set('names', namesEl.value.split('\n').map(encodeURIComponent).join('|'));
    p.set('mode', modeEl.value);
    p.set('size', groupSizeEl.value);
    p.set('count', groupCountEl.value);
    p.set('balance', balanceEl.value);
    if (shuffleFirstEl.checked) p.set('shuffle','1');
    if (avoidRepeatsEl.checked) p.set('avoid','1');
    const url = `${location.origin}${location.pathname}?${p.toString()}`;
    try { await navigator.clipboard.writeText(url); setStatus('Share link copied'); }
    catch { prompt('Copy this link:', url); }
  });

  printBtn.addEventListener('click', () => window.print());

  recordPairsBtn.addEventListener('click', () => {
    // Read current DOM groups to record
    const cards = [...groupsEl.querySelectorAll('.group ol')];
    if (!cards.length) return setStatus('No groups to record');
    const groups = cards.map(ol => [...ol.querySelectorAll('li')].map(li => li.textContent.trim()));
    addPairsToHistory(groups);
    setStatus('Pairings recorded');
  });

  resetHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear the stored pairing history on this device?')) {
      localStorage.removeItem(HISTORY_KEY);
      setStatus('Pairing history cleared');
    }
  });

  // ----- Init from query or defaults -----
  (function init(){
    const q = new URLSearchParams(location.search);
    const qNames = q.get('names');
    if (qNames) {
      namesEl.value = qNames.split('|').map(decodeURIComponent).join('\n');
      modeEl.value = q.get('mode') || 'size';
      groupSizeEl.value = q.get('size') || 3;
      groupCountEl.value = q.get('count') || 4;
      balanceEl.value = q.get('balance') || 'roundrobin';
      shuffleFirstEl.checked = q.get('shuffle') === '1';
      avoidRepeatsEl.checked = q.get('avoid') === '1';
    } else if (!namesEl.value.trim()) {
      namesEl.value = ['Ash','Jaime','Teddy','Ami','Dave','Charlie','Gary','Naomi'].join('\n');
    }
    modeEl.dispatchEvent(new Event('change'));
    setStatus('Ready');
  })();
})();
