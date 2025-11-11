// /assets/scripts/topic.one.js — per-topic loader (tab-based)
(function () {
  const root = document.querySelector('.topic-page');
  if (!root) return;

  // Use the page's data-tab as the **sheet tab name**
  const TAB = (root.dataset.tab || '').trim();
  if (!TAB) { console.warn('[topic.one] Missing data-tab'); return; }

  const listEl = document.getElementById('resource-list');
  const tabsEl = document.getElementById('tabs');
  const searchEl = document.getElementById('searchInput');

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const https = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  const normCat = (c) => {
    const x = String(c || '').trim();
    const lc = x.toLowerCase();
    if (lc.includes('worksheet')) return 'Worksheets';
    if (lc.includes('lesson') || lc.includes('plan')) return 'Lessons';
    if (lc.includes('primary')) return 'Primary Sources';
    if (lc.includes('game') || lc.includes('interactive')) return 'Games';
    if (lc.includes('video') || lc.includes('film')) return 'Videos';
    if (lc.includes('assessment') || lc.includes('quiz') || lc.includes('test')) return 'Assessments';
    if (lc.includes('slide') || lc.includes('presentation')) return 'Presentations';
    if (lc.includes('project')) return 'Projects';
    return x || 'Other';
  };

  const iconFor = (r) => {
    const c = (r.category || '').toLowerCase();
    const t = (r.type || '').toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (c.includes('game') || c.includes('interactive')) return '🎮';
    if (t.includes('video') || c.includes('video')) return '🎥';
    if (c.includes('primary')) return '📜';
    if (c.includes('lesson') || c.includes('guide')) return '📘';
    return '🔗';
  };

  const card = (r) => `
    <article class="card">
      <div style="font-size:24px;margin-bottom:4px;">${iconFor(r)}</div>
      <h3 style="margin:0 0 8px;">${esc(r.title)}</h3>
      <p class="meta">
        <span class="pill">${esc(normCat(r.category))}</span>
        ${r.type ? `<span class="pill gray">${esc(r.type)}</span>` : ''}
      </p>
      <a class="cta" href="${https(r.url)}" target="_blank" rel="noopener">View Resource</a>
    </article>`;

  let ALL = [];
  let active = 'All';

  function buildTabs() {
    const cats = new Set(ALL.map(r => normCat(r.category)));
    const names = ['All', ...Array.from(cats).sort((a,b)=>a.localeCompare(b))];
    tabsEl.innerHTML = names.map(n => `<button class="tab" role="tab" aria-selected="${n===active}" data-tab="${esc(n)}">${esc(n)}</button>`).join('');
    tabsEl.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        active = btn.dataset.tab;
        render();
      });
    });
  }

  function render() {
    const q = (searchEl?.value || '').toLowerCase().trim();
    const rows = ALL.filter(r => {
      const inTab = active === 'All' || normCat(r.category) === active;
      const inSearch = !q || r.title.toLowerCase().includes(q) ||
        (r.category||'').toLowerCase().includes(q) ||
        (r.type||'').toLowerCase().includes(q);
      return inTab && inSearch;
    });
    listEl.innerHTML = rows.length
      ? rows.map(card).join('')
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function load() {
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const r = await fetch(`/api/resources?tab=${encodeURIComponent(TAB)}`, { cache: 'no-store' });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'API error');
      ALL = (data.items || []).filter(x => x.title && x.url);
      buildTabs(); render();
    } catch (e) {
      console.error(e);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">Couldn’t load resources.</div>`;
    }
  }

  searchEl?.addEventListener('input', render);
  load();
})();
