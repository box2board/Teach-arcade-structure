// /assets/scripts/store.js
(function () {
  const PRODUCTS = Array.isArray(window.TA_PRODUCTS) ? window.TA_PRODUCTS : [];

  const tabsEl = document.getElementById("store-tabs");
  const gridEl = document.getElementById("store-grid");
  const statusEl = document.getElementById("store-status");

  if (!tabsEl || !gridEl) return;

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uniqCategories(items) {
    const set = new Set();
    items.forEach(p => {
      const c = (p.category || "").trim();
      if (c) set.add(c);
    });
    return Array.from(set);
  }

  function getParam(name) {
    const u = new URL(window.location.href);
    return (u.searchParams.get(name) || "").trim();
  }

  function setParam(name, value) {
    const u = new URL(window.location.href);
    if (!value) u.searchParams.delete(name);
    else u.searchParams.set(name, value);
    history.replaceState(null, "", u.toString());
  }

  function normalizeCategory(c) {
    return (c || "").trim();
  }

  function renderTabs(categories, active) {
    const all = "All";
    const tabs = [all, ...categories];

    tabsEl.innerHTML = tabs
      .map(cat => {
        const isActive = cat === active || (!active && cat === all);
        return `
          <button
            type="button"
            class="tab ${isActive ? "active" : ""}"
            data-cat="${escapeHtml(cat)}"
            aria-pressed="${isActive ? "true" : "false"}"
          >
            ${escapeHtml(cat)}
          </button>
        `;
      })
      .join("");

    tabsEl.querySelectorAll("button.tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-cat") || "All";
        const use = cat === "All" ? "" : cat;
        setParam("cat", use);
        update();
      });
    });
  }

  function productCard(p) {
    const title = escapeHtml(p.title);
    const desc = escapeHtml(p.desc);
    const url = escapeHtml(p.url);
    const image = escapeHtml(p.image);
    const badge = (p.badge || "").trim();
    const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];

    const badgeHtml = badge ? `<span class="badge">${escapeHtml(badge)}</span>` : "";
    const tagsHtml = tags.length
      ? `<div class="tags">${tags.slice(0, 4).map(t => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
      : "";

    return `
      <article class="card">
        <a class="imglink" href="${url}" target="_blank" rel="noopener" data-track="merch-product">
          <img src="${image}" alt="${title}" loading="lazy" />
        </a>

        <div class="pad">
          <div class="topline">
            <h3>${title}</h3>
            ${badgeHtml}
          </div>

          <p>${desc}</p>
          ${tagsHtml}

          <a class="shopbtn" href="${url}" target="_blank" rel="noopener" data-track="merch-product">
            View on TeePublic
          </a>
        </div>
      </article>
    `;
  }

  function updateStatus(count, cat) {
    if (!statusEl) return;
    const label = cat ? `in “${cat}”` : "in “All”";
    statusEl.textContent = `${count} product${count === 1 ? "" : "s"} ${label}.`;
  }

  function update() {
    const catParam = normalizeCategory(getParam("cat"));
    const categories = uniqCategories(PRODUCTS).sort((a, b) => a.localeCompare(b));

    const active = categories.includes(catParam) ? catParam : "";

    renderTabs(categories, active || "All");

    const filtered = active
      ? PRODUCTS.filter(p => normalizeCategory(p.category) === active)
      : PRODUCTS.slice();

    gridEl.innerHTML = filtered.map(productCard).join("");

    updateStatus(filtered.length, active);

    // Optional GA tracking (safe if GA exists)
    document.querySelectorAll('[data-track="merch-product"]').forEach(link => {
      link.addEventListener("click", () => {
        if (window.gtag) {
          window.gtag("event", "merch_click", {
            event_category: "store",
            event_label: link.href
          });
        }
      });
    });
  }

  update();
})();
