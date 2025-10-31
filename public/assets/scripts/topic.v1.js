// /assets/scripts/topic.v2.js
// Works with /api/resources that returns { ok, items: [...] }.
// Topic page must have: <main class="container topic-page" data-subject="Social Studies" data-topic="American Revolution">
// and elements: #searchInput, #tabs, #resource-list

(function () {
  const page = document.querySelector('.topic-page');
  if (!page) return;

  // 1) Read subject/topic as human text (NOT sheet/tab)
  const SUBJECT = page.dataset.subject || '';
  const TOPIC   = page.dataset.topic   || '';

  // 2) DOM
  const listEl   = document.getElementById('resource-list');
  const tabsEl   = document.getElementById('tabs');
  const searchEl = document.getElementById('searchInput');

  if (!SUBJECT || !TOPIC || !listEl || !tabsEl) {
    console.warn('[topic] Missing data/DOM', { SUBJECT, TOPIC, listEl, tabsEl });
    return;
  }

  // 3) Buckets / helpers
  const BUCKETS = [
    { key: 'worksheets',      label: 'Worksheets',      match: ['worksheet','handout','practice','activity','guided notes'] },
    { key: 'lessons',         label: 'Lessons',         match: ['lesson','teacher guide','unit','plan','plans','lesson plan'] },
    { key: 'primary-sources', label: 'Primary Sources', match: ['primary','document','source','dbq'] },
    { key: 'games',           label: 'Games',           match: ['game','interactive','simulation'] },
    { key: 'videos',          label: 'Videos',          match: ['video','film'] },
    { key: 'assessments',     label: 'Assessments',     match: ['quiz','assessment','test','exam'] },
    { key: 'presentations',   label: 'Presentations',   match: ['presentation','slides','google slides','ppt'] },
    { key: 'projects',        label: 'Projects',        match: ['project','inquiry','performance task'] },
    { key: 'other',           label: 'Other',           match: [] }
  ];

  const safe = v => (v == null ? '' : String(v));
  const toHttps = u => {
    const s = safe(u).trim();
    return s ? (/^https?:\/\//i.test(s) ? s : 'https://' + s) : '';
  };

  // Decide bucket from category/type/tags
  function bucketFor(r) {
    const cat  = safe(r.category).toLowerCase();
    const type = safe(r.type).toLowerCase();
    const tags = Array.isArray(r.tags) ? r.tags.map(t => String(t).toLowerCase()) : [];

    const hay = [cat, type, ...tags].join(' ');
    for (const b of BUCKETS) {
      if (b.match.some(m => hay.includes(m))) return b.key;
    }
    return 'other';
  }

  const badgeClass = k =>
    ({ games:'pill green', videos:'pill blue', lessons:'pill orange', worksheets:'pill gray', 'primary-sources':'pill' }[k] || 'pill gray');

  const iconFor = (r) => {
    const t = safe(r.type).toLowerCase();
    const c = safe(r.category).toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (c.includes('game') || c.includes('interactive')) return '🎮';
    if (t.includes('video') || c.includes('video')) return '🎥';
    if (c.includes('primary')) return '📜';
    if (c.includes('lesson') || c.includes('guide') || c.includes('unit')) return '📘';
    return '🔗';
  };

  const cardHTML = (r) => {
    const key = bucketFor(r);
    const label = (BUCKETS.find(b => b.key === key) || {}).label || 'Other';
    const meta = [
      `<span class="${badgeClass(key)}">${label}</span>`,
      r.type ? `<span class="pill gray">${safe(r.type)}</span>` : '',
    ].filter(Boolean).join(' ');
    const url = toHttps(r.url);
    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${iconFor(r)}</div>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        ${r.desc ? `<p class="small" style="margin:0 0 8px;color:#475569;">${safe(r.desc)}</p>` : ''}
        <p class="meta">${meta}</p>
        ${url ? `<a class="cta" href="${url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ''}
      </div>
    `;
  };

  let rows = [];
  let active = 'all';

  function buildTabs() {
    const present = new Set(rows.map(r => bucketFor(r)));
    const avail = BUCKETS.filter(b => present.has(b.key));
    const parts = [
      `<button class="tab" role="tab" data-tab="all" aria-selected="${active==='all'}">All</button>`,
      ...avail.map(b => `<button class="tab" role="tab" data-tab="${b.key}" aria-selected="${active===b.key}">${b.label}</button>`)
    ];
    tabsEl.innerHTML = parts.join('');
    tabsEl.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        active = btn.dataset.tab;
        render();
      });
    });
  }

  function render() {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r => {
      const inTab = (active === 'all') || (bucketFor(r) === active);
      const hay = [safe(r.title), safe(r.category), safe(r.type), safe(r.desc)]
        .join(' ')
        .toLowerCase();
      const inSearch = !q || hay.includes(q);
      return inTab && inSearch;
    });

    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join('')
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function load() {
    const url = `/api/resources?subject=${encodeURIComponent(SUBJECT)}&topic=${encodeURIComponent(TOPIC)}`;
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'API error');
      // NOTE: your API returns { ok, count, items }
      rows = (data.items || []).filter(x => x.title && x.url);
      buildTabs();
      render();
    } catch (err) {
      console.error('[topic] Load error:', err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
        Couldn't load resources. Please try again later.
      </div>`;
    }
  }

  searchEl?.addEventListener('input', render);
  load();
})();
