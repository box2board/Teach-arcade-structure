// /public/assets/scripts/topic.one.js
(function () {
  const page = document.querySelector('.topic-page');
  if (!page) return;

  const TAB = (page.dataset.tab || page.dataset.topic || '').trim();
  const listEl = document.getElementById('resource-list');
  const searchEl = document.getElementById('searchInput');

  if (!TAB || !listEl) return;
  listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading…</div>`;

  const makeCard = r => `
    <div class="card">
      <h3 style="margin:0 0 8px;">${r.title}</h3>
      ${r.category ? `<p class="meta">${r.category}</p>` : ''}
      <a class="cta" href="${/^https?:\/\//i.test(r.url) ? r.url : 'https://' + r.url}" target="_blank" rel="noopener">View Resource</a>
    </div>
  `;

  function render(rows, q = '') {
    const needle = q.toLowerCase();
    const filtered = rows.filter(r =>
      !needle ||
      (r.title||'').toLowerCase().includes(needle) ||
      (r.category||'').toLowerCase().includes(needle) ||
      (r.type||'').toLowerCase().includes(needle)
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(makeCard).join('')
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  fetch(`/api/resources?tab=${encodeURIComponent(TAB)}`, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) throw new Error(data.error || 'API error');
      const rows = data.items || [];
      render(rows);
      searchEl?.addEventListener('input', () => render(rows, searchEl.value));
    })
    .catch(err => {
      console.error('[topic.one] load error:', err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">Error loading resources.</div>`;
    });
})();
