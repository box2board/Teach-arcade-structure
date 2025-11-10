/* Minimal, API-backed topic loader (trial) */
(function () {
  const root = document.querySelector('.topic-page');
  if (!root) return;

  // 1) Identify the tab (sheet name) to load
  const TAB = (root.dataset.tab || root.dataset.topic || '').trim();
  if (!TAB) {
    console.warn('[topic.one] Missing data-tab on .topic-page');
    return;
  }

  // 2) Grab UI mounts
  const tabsEl = document.getElementById('tabs');
  const listEl = document.getElementById('resource-list');
  const searchEl = document.getElementById('searchInput'); // optional
  if (!listEl || !tabsEl) {
    console.warn('[topic.one] Missing #tabs or #resource-list');
    return;
  }

  // 3) Helpers
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const https = (u) => {
    const s = String(u || '').trim();
    if (!s) return '';
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  };

  const normCat = (c) => {
    const x = String(c || '').trim();
    if (!x) return 'Other';
    // normalize a few common variations without being strict
    const lc = x.toLowerCase();
    if (lc.includes('worksheet')) return 'Worksheets';
    if (lc.includes('lesson') || lc.includes('plan')) return 'Lessons';
    if (lc.includes('primary')) return 'Primary Sources';
    if (lc.includes('game') || lc.includes('interactive')) return 'Games';
    if (lc.includes('video') || lc.includes('film')) return 'Videos';
    if (lc.includes('assessment') || lc.includes('quiz') || lc.includes('test')) return 'Assessments';
    if (lc.includes('slide') || lc.includes('presentation')) return 'Presentations';
    if (lc.includes('project')) return 'Projects';
    return x; // keep original label if none matched
  };

  const iconFor = (r) => {
    const c = (r.category || '').toLowerCase();
    const t = (r.type || '').toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (c.includes('game') || c.includes('interactive')) return '🎮';
    if (t.includes('video') || c.includes('video') || c.includes('film')) return '🎥';
    if (c.includes('primary')) return '📜';
    if (c.includes('lesson') || c.includes('guide')) return '📘';
    return '🔗';
  };

  const cardHTML = (r) => {
    const cat = normCat(r.category);
    return `
      <article class="card">
        <div style="font-size:24px;margin-bottom:4px;">${iconFor(r)}</div>
        <h3 style="margin:0 0 8px;">${esc(r.title)}</h3>
        <p class="meta">
          <span class="pill">${esc(cat)}</span>
          ${r.type ? `<span class="pill gray">${esc(r.type)}</span>` : ''}
        </p>
        ${r.url ? `<a class="cta" href="${https(r.url)}" target="_blank" rel="noopener">View Resource</a>` : ''}
      </article>
    `;
  };

  let ALL = [];            // raw items from API
  let active = 'All';      // active tab name

  // 4) Build category tabs from the data we actually have
  function buildTabs() {
    const cats = new Set(ALL.map((r) => normCat(r.category)));
    const ordered = ['All', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];

    tabsEl.innerHTML = ordered
      .map((name) => {
        const sel = name === active ? 'true' : 'false';
        return `<button class="tab" role="tab" aria-selected="${sel}" data-tab="${esc(name)}">${esc(name)}</button>`;
      })
      .join('');

    tabsEl.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        active = btn.dataset.tab;
        render();
      });
    });
  }

  // 5) Render grid
  function render() {
    const q = String(searchEl?.value || '').toLowerCase().trim();
    const rows = ALL.filter((r) => {
      const inTab = active === 'All' || normCat(r.category) === active;
      const inSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q);
      return inTab && inSearch;
    });

    listEl.innerHTML =
      rows.length > 0
        ? rows.map(cardHTML).join('')
        : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  // 6) Load from your API (sheet tab = TAB)
  async function load() {
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const resp = await fetch(`/api/resources?tab=${encodeURIComponent(TAB)}`, { cache: 'no-store' });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'API error');

      // Expecting { ok:true, items:[{title,url,category,type,...}] }
      ALL = (data.items || []).filter((r) => r.title && r.url);
      buildTabs();
      render();
    } catch (err) {
      console.error('[topic.one] load error:', err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
        Couldn’t load resources. Please try again later.
      </div>`;
    }
  }

  // 7) Wire search + go
  searchEl?.addEventListener('input', render);
  load();
})();
