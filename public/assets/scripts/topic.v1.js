// /assets/scripts/topic.v1.js
// Minimal fix version: keep original buckets/UI; only modernize data loading.
// Expects the topic page's <main> to have: data-topic="..." (preferred) or data-tab="...".

(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return; // Not a topic page

  // ----------------------------
  // 1) Topic (prefer data-topic)
  // ----------------------------
  const SHEET_TOPIC = (page.dataset.topic || page.dataset.tab || "").trim();

  // ----------------------------
  // 2) DOM
  // ----------------------------
  const listEl   = document.getElementById("resource-list");
  const tabsEl   = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");

  if (!listEl || !tabsEl) {
    console.warn("[topic] Missing required DOM elements.");
    return;
  }

  // ----------------------------
  // 3) Original buckets (unchanged)
  // ----------------------------
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

  // ----------------------------
  // 4) Helpers (unchanged)
  // ----------------------------
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

  // ----------------------------
  // 5) Tabs (unchanged)
  // ----------------------------
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

  // ----------------------------
  // 6) Render (unchanged)
  // ----------------------------
  function render() {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r =>
      (active === "all" || bucketFor(r.category) === active) &&
      (!q || safe(r.title).toLowerCase().includes(q) || safe(r.category).toLowerCase().includes(q))
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  // ----------------------------
  // 7) Data loading (ONLY PART CHANGED)
  // ----------------------------
  async function fetchJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function load() {
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

    try {
      let data;
      // Try API first (lets Vercel function filter by topic)
      if (SHEET_TOPIC) {
        data = await fetchJSON(`/api/resources?topic=${encodeURIComponent(SHEET_TOPIC)}`);
      } else {
        data = await fetchJSON(`/api/resources`);
      }

      // Accept either {items:[...]} or {data:[...]} or raw array
      let items = (data && (data.items || data.data)) || data || [];
      // If API didn’t/ couldn’t filter by topic, filter on the client:
      if (SHEET_TOPIC) {
        items = items.filter(r => safe(r.topic).trim().toLowerCase() === SHEET_TOPIC.toLowerCase());
      }

      // Keep only rows with title + url (unchanged)
      rows = items.filter(x => x && x.title && x.url);

      buildTabs();
      render();
    } catch (e) {
      // Fallback: static JSON then client-filter by Topic
      try {
        const all = await fetchJSON(`/assets/data/resources.json`);
        let items = (all && (all.items || all.data)) || all || [];
        if (SHEET_TOPIC) {
          items = items.filter(r => safe(r.topic).trim().toLowerCase() === SHEET_TOPIC.toLowerCase());
        }
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
  }

  // ----------------------------
  // 8) Wire up & go (unchanged)
  // ----------------------------
  searchEl?.addEventListener("input", render);
  load();
})();
