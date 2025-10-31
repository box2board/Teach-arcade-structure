// /assets/scripts/topic.v1.js
// Works with either:
//   1) Legacy:  /api/resources?sheet=<id>&tab=<name>  (page carries data-sheet-id / data-tab)
//   2) Current:  /api/resources?subject=<slug>&topic=<slug>  (derived from URL or data attributes)
//
// Expects the page to have:
//   <main class="container topic-page" ...>
//   <input id="searchInput">      (optional)
//   <div id="tabs">               (optional)
//   <section id="resource-list">  (required)

(function () {
  const page   = document.querySelector(".topic-page");
  if (!page) return;

  // DOM
  const listEl   = document.getElementById("resource-list");
  const tabsEl   = document.getElementById("tabs");      // optional
  const searchEl = document.getElementById("searchInput"); // optional
  if (!listEl) return;

  // --- CONFIG SOURCES -------------------------------------------------------
  // Legacy attributes (Google Sheet flow)
  const SHEET_ID  = page.dataset.sheetId || "";
  const SHEET_TAB = page.dataset.tab || "";

  // Subject/topic from data-attrs if present, else infer from URL
  let subject = (page.dataset.subject || "").trim();
  let topic   = (page.dataset.topic   || "").trim();

  if (!subject || !topic) {
    // Try to infer from URL like:
    // /subjects/<subject>/<maybe-subdir>/.../<topic>.html
    const parts = location.pathname.split("/").filter(Boolean);
    // Find 'subjects' segment; next is subject
    const i = parts.indexOf("subjects");
    if (i >= 0 && parts[i + 1]) subject = subject || parts[i + 1];

    // Take last segment (file), strip .html
    const last = parts[parts.length - 1] || "";
    topic = topic || last.replace(/\.html?$/i, "");
  }

  // --- RENDER HELPERS -------------------------------------------------------
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

  const safe = v => (v == null ? "" : String(v));
  const toHttps = u => {
    const s = safe(u).trim();
    return s ? (/^https?:\/\//i.test(s) ? s : "https://" + s) : "";
  };

  // Try to categorize even when your JSON lacks "category"
  function bucketFor(rec) {
    const cat = safe(rec.category).toLowerCase();
    const tags = Array.isArray(rec.tags) ? rec.tags.map(t => safe(t).toLowerCase()) : [];
    const hay = [cat, safe(rec.type).toLowerCase(), safe(rec.title).toLowerCase(), ...tags].join(" ");
    for (const b of BUCKETS) if (b.match.some(m => hay.includes(m))) return b.key;
    return "other";
  }

  const badgeClass = k =>
    ({ games:"pill green", videos:"pill blue", lessons:"pill orange", worksheets:"pill gray", "primary-sources":"pill" }[k] || "pill gray");

  function cardHTML(r) {
    const key   = bucketFor(r);
    const label = (BUCKETS.find(b => b.key === key) || {}).label || "Other";
    const meta  = [
      `<span class="${badgeClass(key)}">${label}</span>`,
      r.grade ? `<span class="pill gray">Grade: ${safe(r.grade)}</span>` : ""
    ].filter(Boolean).join(" ");
    return `
      <div class="card">
        <h3 style="margin:0 0 6px;">${safe(r.title)}</h3>
        <p class="meta">${meta}</p>
        ${r.url ? `<a class="cta" href="${toHttps(r.url)}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  }

  let rows = [];
  let active = "all";

  function buildTabs() {
    if (!tabsEl) return; // tabs optional
    const present = new Set(rows.map(bucketFor));
    const avail = BUCKETS.filter(b => present.has(b.key));
    tabsEl.innerHTML = [
      `<button class="tab" role="tab" data-tab="all" aria-selected="${active==="all"}">All</button>`,
      ...avail.map(b => `<button class="tab" role="tab" data-tab="${b.key}" aria-selected="${active===b.key}">${b.label}</button>`)
    ].join("");
    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
        btn.setAttribute("aria-selected","true");
        active = btn.dataset.tab;
        render();
      });
    });
  }

  function render() {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r =>
      (active === "all" || bucketFor(r) === active) &&
      (!q || safe(r.title).toLowerCase().includes(q))
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  // --- DATA LOAD ------------------------------------------------------------
  async function load() {
    // Prefer legacy sheet/tab when provided; else use subject/topic (new flow)
    const url = (SHEET_ID && SHEET_TAB)
      ? `/api/resources?sheet=${encodeURIComponent(SHEET_ID)}&tab=${encodeURIComponent(SHEET_TAB)}`
      : `/api/resources?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;

    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

    try {
      const r = await fetch(url, { cache: "no-store" });
      const data = await r.json();

      // Support both shapes:
      //  - { ok, items: [...] }
      //  - { ok, data: [...] }
      const items = Array.isArray(data.items) ? data.items :
                    Array.isArray(data.data)  ? data.data  : [];

      if (!data.ok) throw new Error(data.error || "API error");
      rows = items.filter(x => x && x.title && x.url);

      buildTabs();
      render();
    } catch (err) {
      console.error("[topic] Load error:", err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
        Couldn't load resources. Please try again later.
      </div>`;
    }
  }

  searchEl?.addEventListener("input", render);
  load();
})();
