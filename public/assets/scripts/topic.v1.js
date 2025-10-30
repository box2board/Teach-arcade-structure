// /assets/scripts/topic.v1.js
// Shared loader for all Topic pages.
// Expects each topic page to have:
//   <main class="container topic-page" data-sheet-id="..." data-tab="...">
// And the HTML to contain:
//   <input id="searchInput">, <div id="tabs">, <section id="resource-list">

(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return; // Not a topic page

  // 1) Grab config from data attributes
  const SHEET_ID  = page.dataset.sheetId || "";
  const SHEET_TAB = page.dataset.tab || "";

  // 2) Grab UI elements (fail gracefully if missing)
  const listEl   = document.getElementById("resource-list");
  const tabsEl   = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");

  if (!SHEET_ID || !SHEET_TAB || !listEl || !tabsEl) {
    console.warn("[topic] Missing required data/DOM:", { SHEET_ID, SHEET_TAB, listEl, tabsEl });
    return;
  }

  // 3) Buckets used to build the Topic Explorer tabs
  const BUCKETS = [
    { key: "worksheets",      label: "Worksheets",      match: ["worksheet","handout","practice"] },
    { key: "lessons",         label: "Lessons",         match: ["lesson","teacher guide","unit","plan"] },
    { key: "primary-sources", label: "Primary Sources", match: ["primary","document","source"] },
    { key: "games",           label: "Games",           match: ["game","interactive","simulation"] },
    { key: "videos",          label: "Videos",          match: ["video","film"] },
    { key: "assessments",     label: "Assessments",     match: ["quiz","assessment","test"] },
    { key: "presentations",   label: "Presentations",   match: ["presentation","slides"] },
    { key: "projects",        label: "Projects",        match: ["project","performance","inquiry"] },
    { key: "other",           label: "Other",           match: [] }
  ];

  let rows = [];       // all resources
  let active = "all";  // current tab

  // 4) Helpers
  const safe = v => (v == null ? "" : String(v));
  const toHttps = u => {
    const s = safe(u).trim();
    return s ? (/^https?:\/\//i.test(s) ? s : "https://" + s) : "";
  };
  const bucketFor = cat => {
    const c = safe(cat).toLowerCase();
    for (const b of BUCKETS) if (b.match.some(m => c.includes(m))) return b.key;
    return "other";
  };
  const badgeClass = k =>
    ({ games:"pill green", videos:"pill blue", lessons:"pill orange", worksheets:"pill gray", "primary-sources":"pill" }[k] || "pill gray");

  const iconFor = (type, cat) => {
    const t = safe(type).toLowerCase();
    const c = safe(cat).toLowerCase();
    if (t.includes("pdf")) return "📄";
    if (c.includes("game") || c.includes("interactive")) return "🎮";
    if (t.includes("video") || c.includes("video")) return "🎥";
    if (c.includes("primary")) return "📜";
    if (c.includes("lesson") || c.includes("guide")) return "📘";
    return "🔗";
  };

  const cardHTML = r => {
    const key = bucketFor(r.category);
    const label = (BUCKETS.find(b => b.key === key) || {}).label || "Other";
    const meta = [
      `<span class="${badgeClass(key)}">${label}</span>`,
      r.type ? `<span class="pill gray">${safe(r.type)}</span>` : ""
    ].filter(Boolean).join(" ");
    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${iconFor(r.type, r.category)}</div>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        <p class="meta">${meta}</p>
        ${r.url ? `<a class="cta" href="${toHttps(r.url)}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  };

  // 5) Build tabs based on present categories
  function buildTabs() {
    const present = new Set(rows.map(r => bucketFor(r.category)));
    const avail = BUCKETS.filter(b => present.has(b.key));
    const parts = [
      `<button class="tab" role="tab" data-tab="all" aria-selected="${active==="all"}">All</button>`,
      ...avail.map(b => `<button class="tab" role="tab" data-tab="${b.key}" aria-selected="${active===b.key}">${b.label}</button>`)
    ];
    tabsEl.innerHTML = parts.join("");
    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
        btn.setAttribute("aria-selected","true");
        active = btn.dataset.tab;
        render();
      });
    });
  }

  // 6) Render grid
  function render() {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r =>
      (active === "all" || bucketFor(r.category) === active) &&
      (!q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  // 7) Load data from your API
  async function load() {
    const url = `/api/resources?sheet=${encodeURIComponent(SHEET_ID)}&tab=${encodeURIComponent(SHEET_TAB)}`;
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const r = await fetch(url, { cache: "no-store" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "API error");
      rows = (data.data || []).filter(x => x.title && x.url);
      buildTabs();
      render();
    } catch (err) {
      console.error("[topic] Load error:", err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
        Couldn't load resources. Please try again later.
      </div>`;
    }
  }

  // 8) Wire up search + go
  searchEl?.addEventListener("input", render);
  load();
})();
