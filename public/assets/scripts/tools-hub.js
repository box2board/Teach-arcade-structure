/* Progressive enhancement: the complete tool directory works without this script. */
(() => {
  const cards = [...document.querySelectorAll('[data-tool]')];
  const catalog = new Map(cards.map(card => [card.dataset.tool, {
    title: card.querySelector('h3').textContent,
    href: card.querySelector('h3 a').getAttribute('href')
  }]));
  const keys = { favorites: 'ta.tools.favorites.v1', recent: 'ta.tools.recent.v1' };
  let storageAvailable = true;
  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? [...new Set(value.filter(id => catalog.has(id)))] : [];
    } catch { return []; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {
      storageAvailable = false;
      document.getElementById('storage-note').textContent = 'Browser storage is unavailable. Favorites and recent tools will only last while this page stays open.';
    }
  }
  let favorites = new Set(read(keys.favorites));
  let recent = read(keys.recent).slice(0, 4);
  let filter = 'all';
  const search = document.getElementById('tool-search');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const favoriteButtons = [...document.querySelectorAll('[data-favorite]')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  const reset = document.getElementById('reset-filters');
  function render() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const text = `${card.textContent} ${card.dataset.search}`.toLowerCase();
      const matches = filter === 'all' || (filter === 'favorites' ? favorites.has(card.dataset.tool) : card.dataset.category === filter);
      card.hidden = !(matches && terms.every(term => text.includes(term)));
      if (!card.hidden) visible++;
    });
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    favoriteButtons.forEach(button => {
      const active = favorites.has(button.dataset.favorite);
      button.setAttribute('aria-pressed', String(active));
      button.firstElementChild.textContent = active ? '★' : '☆';
    });
    count.textContent = `${visible} ${visible === 1 ? 'tool' : 'tools'}${filter === 'favorites' ? ' in favorites' : ' available'}`;
    empty.hidden = visible > 0;
    reset.hidden = filter === 'all' && terms.length === 0;
    const noFavorites = filter === 'favorites' && favorites.size === 0;
    document.getElementById('empty-title').textContent = noFavorites ? 'Your favorites start here' : 'No matching tools';
    document.getElementById('empty-description').textContent = noFavorites ? 'Choose the star on any tool to keep it close for next time.' : 'Try another search or choose a different category.';
  }
  function renderRecent() {
    const container = document.getElementById('recent-tools');
    container.replaceChildren();
    recent.forEach(id => {
      const link = document.createElement('a');
      link.href = catalog.get(id).href;
      link.textContent = catalog.get(id).title;
      link.dataset.open = id;
      container.append(link);
    });
    document.getElementById('recent-section').hidden = !recent.length;
  }
  function resetFilters() { filter = 'all'; search.value = ''; render(); search.focus(); }
  filterButtons.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
  favoriteButtons.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    save(keys.favorites, [...favorites]);
    render();
    if (button.closest('[data-tool]').hidden) document.querySelector('[data-filter="favorites"]').focus();
  }));
  search.addEventListener('input', render);
  reset.addEventListener('click', resetFilters);
  document.getElementById('empty-reset').addEventListener('click', resetFilters);
  document.getElementById('clear-recent').addEventListener('click', () => {
    recent = []; save(keys.recent, recent); renderRecent(); search.focus();
  });
  function recordOpen(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest('a[data-open]');
    if (!link || !catalog.has(link.dataset.open)) return;
    recent = [link.dataset.open, ...recent.filter(id => id !== link.dataset.open)].slice(0, 4);
    save(keys.recent, recent);
  }
  document.addEventListener('click', recordOpen);
  document.addEventListener('auxclick', recordOpen);
  // Restore current preferences after back navigation or changes in another tab.
  function refresh() {
    if (storageAvailable) { favorites = new Set(read(keys.favorites)); recent = read(keys.recent).slice(0, 4); }
    render(); renderRecent();
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if (!event.key || Object.values(keys).includes(event.key)) refresh(); });
  document.getElementById('search-control').hidden = false;
  document.getElementById('tools-filters').hidden = false;
  document.getElementById('storage-note').hidden = false;
  favoriteButtons.forEach(button => { button.hidden = false; });
  document.getElementById('tools-year').textContent = new Date().getFullYear();
  render(); renderRecent();
})();
