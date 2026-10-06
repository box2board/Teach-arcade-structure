(() => {
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
  const pairsBtn = document.getElementById('pairs');
  const clearBtn = document.getElementById('clear');
  const saveBtn = document.getElementById('save');
  const restoreBtn = document.getElementById('restore');
  const shareBtn = document.getElementById('share');
  const copyGroupsBtn = document.getElementById('copyGroups');
  const fullscreenBtn = document.getElementById('fullscreen');
  const printBtn = document.getElementById('print');
  const recordPairsBtn = document.getElementById('recordPairs');
  const resetHistoryBtn = document.getElementById('resetHistory');
  const groupOutputEl = document.getElementById('groupOutput');
  const groupsEl = document.getElementById('groups');
  const summaryEl = document.getElementById('summary');
  const emptyStateEl = document.getElementById('emptyState');
  const statusEl = document.getElementById('status');

  const STORAGE_KEY = 'ta-group-maker-v1';
  const HISTORY_KEY = 'ta-group-pairs-history';
  let currentGroups = [];

  const setStatus = (message) => {
    statusEl.textContent = 'Status: ' + message;
  };

  const cleanList = (text) => text.split('\n').map((item) => item.trim()).filter(Boolean);

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const pairKey = (a, b) => {
    const [x, y] = [a, b].sort((m, n) => m.localeCompare(n));
    return x + '||' + y;
  };

  const getHistory = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    } catch {
      return new Set();
    }
  };

  const addPairsToHistory = (groups) => {
    const history = getHistory();
    groups.forEach((group) => {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          history.add(pairKey(group[i], group[j]));
        }
      }
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...history]));
  };

  const groupingCost = (groups, history) => {
    let cost = 0;
    groups.forEach((group) => {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          if (history.has(pairKey(group[i], group[j]))) cost += 1;
        }
      }
    });
    return cost;
  };

  // Swap by position instead of mapping by name so duplicate names remain intact.
  const reduceRepeats = (groups, history, tries = 800) => {
    if (!history.size || groups.length < 2) return groups;
    const best = groups.map((group) => group.slice());
    let bestCost = groupingCost(best, history);

    for (let attempt = 0; attempt < tries; attempt += 1) {
      const firstGroupIndex = Math.floor(Math.random() * best.length);
      let secondGroupIndex = Math.floor(Math.random() * best.length);
      while (secondGroupIndex === firstGroupIndex) {
        secondGroupIndex = Math.floor(Math.random() * best.length);
      }

      const firstGroup = best[firstGroupIndex];
      const secondGroup = best[secondGroupIndex];
      if (!firstGroup.length || !secondGroup.length) continue;

      const firstIndex = Math.floor(Math.random() * firstGroup.length);
      const secondIndex = Math.floor(Math.random() * secondGroup.length);
      [firstGroup[firstIndex], secondGroup[secondIndex]] = [secondGroup[secondIndex], firstGroup[firstIndex]];

      const nextCost = groupingCost(best, history);
      if (nextCost <= bestCost) {
        bestCost = nextCost;
      } else {
        [firstGroup[firstIndex], secondGroup[secondIndex]] = [secondGroup[secondIndex], firstGroup[firstIndex]];
      }
    }
    return best;
  };

  const hasDuplicates = (list) => new Set(list).size !== list.length;

  function buildGroups(list) {
    let names = list.slice();
    if (shuffleFirstEl.checked) shuffle(names);

    let groups = [];
    if (modeEl.value === 'size') {
      const size = Math.max(2, parseInt(groupSizeEl.value || '2', 10));
      const count = Math.max(1, Math.ceil(names.length / size));
      if (balanceEl.value === 'roundrobin') {
        groups = Array.from({ length: count }, () => []);
        names.forEach((name, index) => groups[index % count].push(name));
      } else {
        for (let index = 0; index < names.length; index += size) {
          groups.push(names.slice(index, index + size));
        }
      }
    } else {
      const requestedCount = Math.max(2, parseInt(groupCountEl.value || '2', 10));
      const count = Math.min(names.length, requestedCount);
      groups = Array.from({ length: count }, () => []);

      if (balanceEl.value === 'roundrobin') {
        names.forEach((name, index) => groups[index % count].push(name));
      } else if (balanceEl.value === 'pure') {
        names.slice(0, count).forEach((name, index) => groups[index].push(name));
        names.slice(count).forEach((name) => groups[Math.floor(Math.random() * count)].push(name));
      } else {
        const baseSize = Math.floor(names.length / count);
        const remainder = names.length % count;
        let cursor = 0;
        groups = groups.map((group, index) => {
          const take = baseSize + (index < remainder ? 1 : 0);
          const next = names.slice(cursor, cursor + take);
          cursor += take;
          return next;
        });
      }
    }

    if (avoidRepeatsEl.checked) groups = reduceRepeats(groups, getHistory());
    return groups;
  }

  function renderGroups(groups) {
    currentGroups = groups.map((group) => group.slice());
    groupsEl.replaceChildren();
    emptyStateEl.hidden = groups.length > 0;

    groups.forEach((group, index) => {
      const card = document.createElement('article');
      card.className = 'group';

      const heading = document.createElement('h3');
      heading.append(document.createTextNode(`Group ${index + 1} `));
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = String(group.length);
      heading.appendChild(pill);

      const list = document.createElement('ol');
      group.forEach((name) => {
        const item = document.createElement('li');
        item.textContent = name;
        list.appendChild(item);
      });

      card.append(heading, list);
      groupsEl.appendChild(card);
    });

    const total = groups.reduce((sum, group) => sum + group.length, 0);
    summaryEl.textContent = groups.length ? `${groups.length} group${groups.length === 1 ? '' : 's'} • ${total} student${total === 1 ? '' : 's'}` : '';
  }

  const generate = () => {
    const list = cleanList(namesEl.value);
    if (list.length < 2) {
      setStatus('Enter at least 2 names');
      namesEl.focus();
      return;
    }
    renderGroups(buildGroups(list));
    setStatus(hasDuplicates(list) ? 'Groups created. Duplicate names were kept.' : 'Groups created');
  };

  const groupsAsText = () => currentGroups.map((group, index) => `Group ${index + 1}: ${group.join(', ')}`).join('\n');

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
      return true;
    } catch {
      return false;
    }
  };

  modeEl.addEventListener('change', () => {
    const bySize = modeEl.value === 'size';
    sizeField.hidden = !bySize;
    countField.hidden = bySize;
  });

  makeBtn.addEventListener('click', generate);

  pairsBtn.addEventListener('click', () => {
    modeEl.value = 'size';
    groupSizeEl.value = '2';
    balanceEl.value = 'roundrobin';
    shuffleFirstEl.checked = true;
    modeEl.dispatchEvent(new Event('change'));
    generate();
  });

  clearBtn.addEventListener('click', () => {
    namesEl.value = '';
    currentGroups = [];
    groupsEl.replaceChildren();
    summaryEl.textContent = '';
    emptyStateEl.hidden = false;
    setStatus('Cleared');
    namesEl.focus();
  });

  saveBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      names: namesEl.value,
      mode: modeEl.value,
      size: groupSizeEl.value,
      count: groupCountEl.value,
      balance: balanceEl.value,
      shuffle: !!shuffleFirstEl.checked,
      avoid: !!avoidRepeatsEl.checked
    }));
    setStatus('Saved on this device');
  });

  restoreBtn.addEventListener('click', () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!data || !data.names) return setStatus('Nothing saved on this device');
      namesEl.value = data.names || '';
      modeEl.value = data.mode || 'size';
      groupSizeEl.value = data.size || 3;
      groupCountEl.value = data.count || 4;
      balanceEl.value = data.balance || 'roundrobin';
      shuffleFirstEl.checked = data.shuffle !== false;
      avoidRepeatsEl.checked = !!data.avoid;
      modeEl.dispatchEvent(new Event('change'));
      setStatus('Saved list restored');
    } catch {
      setStatus('Could not restore saved list');
    }
  });

  shareBtn.addEventListener('click', async () => {
    const params = new URLSearchParams();
    if (namesEl.value.trim()) params.set('names', namesEl.value.split('\n').map(encodeURIComponent).join('|'));
    params.set('mode', modeEl.value);
    params.set('size', groupSizeEl.value);
    params.set('count', groupCountEl.value);
    params.set('balance', balanceEl.value);
    if (shuffleFirstEl.checked) params.set('shuffle', '1');
    if (avoidRepeatsEl.checked) params.set('avoid', '1');

    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    if (!(await copyText(url, 'Share link copied'))) window.prompt('Copy this link:', url);
  });

  copyGroupsBtn.addEventListener('click', async () => {
    if (!currentGroups.length) return setStatus('Generate groups before copying');
    const text = groupsAsText();
    if (!(await copyText(text, 'Groups copied'))) window.prompt('Copy these groups:', text);
  });

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (groupOutputEl.requestFullscreen) {
        await groupOutputEl.requestFullscreen();
      } else {
        setStatus('Projector View is not supported in this browser');
      }
    } catch {
      setStatus('Could not open Projector View');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = document.fullscreenElement === groupOutputEl ? 'Exit Projector View' : 'Projector View';
  });

  printBtn.addEventListener('click', () => window.print());

  recordPairsBtn.addEventListener('click', () => {
    if (!currentGroups.length) return setStatus('Generate groups before recording pairings');
    addPairsToHistory(currentGroups);
    setStatus('Pairings recorded on this device');
  });

  resetHistoryBtn.addEventListener('click', () => {
    if (window.confirm('Clear the stored pairing history on this device?')) {
      localStorage.removeItem(HISTORY_KEY);
      setStatus('Pairing history cleared');
    }
  });

  (function init() {
    const query = new URLSearchParams(location.search);
    const queryNames = query.get('names');
    if (queryNames) {
      namesEl.value = queryNames.split('|').map(decodeURIComponent).join('\n');
      modeEl.value = query.get('mode') || 'size';
      groupSizeEl.value = query.get('size') || 3;
      groupCountEl.value = query.get('count') || 4;
      balanceEl.value = query.get('balance') || 'roundrobin';
      shuffleFirstEl.checked = query.get('shuffle') !== '0';
      avoidRepeatsEl.checked = query.get('avoid') === '1';
    }
    modeEl.dispatchEvent(new Event('change'));
    emptyStateEl.hidden = false;
    setStatus('Ready');
  })();
})();
