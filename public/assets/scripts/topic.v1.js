// /assets/scripts/topic.v1.js
// Robust loader for Topic pages.
// Expected HTML on each topic page:
//   <main class="container topic-page"
//         data-sheet-id="..."
//         data-tab="..."             (your old way)
//         data-topic="Colonial America"> (preferred; human-readable topic name)
//   </main>
// And:
//   <input id="searchInput">, <div id="tabs">, <section id="resource-list">

(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  // --- Config from page ---
  const SHEET_ID   = page.dataset.sheetId || "";     // optional
  const SHEET_TAB  = page.dataset.tab || "";         // optional
  const PAGE_TOPIC = (page.dataset.topic || page.dataset.tab || "").trim(); // preferred topic match

  // --- DOM ---
  const listEl   = document.getElementById("resource-list");
  const tabsEl   = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");
  if (!listEl || !tabsEl) {
    console.warn("[topic] Missing list/tabs container.");
    return;
  }

  // --- Buckets ---
  const BUCKETS = [
    { key: "worksheets",      label: "Worksheets",      match: ["worksheet","handout","practice","printable"] },
    { key: "lessons",         label: "Lessons",         match: ["lesson","teacher guide","unit","unit plan","plan","lesson plan","guide","curriculum"] },
    { key: "primary-sources", label: "Primary Sources", match: ["primary","document","source","primary source"] },
    { key: "games",           label: "Games",           match: ["game","interactive","simulation","activity","activities"] },
    { key: "videos",          label: "Videos",          match: ["video","film","youtube","animated map"] },
    { key: "assessments",     label: "Assessments",     match: ["quiz","assessment","test","worksheet packet","packet"] },
    { key: "presentations",   label: "Presentations",   match: ["presentation","slides","ppt","powerpoint"] },
    { key: "projects",        label: "Projects",        match: ["project","performance","inquiry"] },
    { key: "other",           label: "Other",           match: [] }
  ];

  let rows = [];
  let active = "all";

  // --- Helpers ---
  const safe = v => (v == null ? "" : String(v));
  const lower = v => safe(v).toLowerCase();

  // get the first defined/non-empty value among possible column names
  const pick = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== "") return v;
    }
    return "";
  };

  const normalizeRow = (r) => {
    // Your sheet/JSON can have mixed cases: Title vs title, URL vs url, Category vs category, etc.
    const title    = pick(r, ["title","Title","name","Name"]);
    const url      = pick(r, ["url","URL","link","Link"]);
    const category = pick(r, ["category","Category","type","Type","Group","group"]);
    const type     = pick(r, ["type","Type","filetype","Filetype"]);
    const topic    = pick(r, ["topic","Topic","unit","Unit","section","Section"]);

    return {
      title: safe(title).trim(),
      url:   safe(url).trim(),
      // keep both raw and lower for matching
      category,
      type,
      topic
    };
  };

  const toHttps = (u) => {
    const s = safe(u).trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : "https://" + s;
  };

  const bucketFor = (cat, type) => {
    const c = lower(cat);
    const t = lower(type);
    for (const b of BUCKETS) {
      if (b.match.some(m => c.includes(m) || t.includes(m))) return b.key;
    }
    return "other";
  };

  const badgeClass = (k) =>
    ({ games:"pill green", videos:"pill blue", lessons:"pill orange", worksheets:"pill gray", "primary-sources":"pill" }[k] || "pill gray");

  const iconFor = (type, cat) => {
    const t = lower(type);
    const c = lower(cat);
    if (t.includes("pdf")) return "📄";
    if (c.includes("game") || c.includes("interactive")) return "🎮";
    if (t.includes("video") || c.includes("video")) return "🎥";
    if (c.includes("primary")) return "📜";
    if (c.includes("lesson") || c.includes("guide") || c.includes("unit")) return "📘";
    return "🔗";
  };

  const cardHTML = (r) => {
    const key   = bucketFor(r.category, r.type);
    const label = (BUCKETS.find(b => b.key === key) || {}).label || "Other";
    const meta  = [
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

  function buildTabs() {
    const present = new Set(rows.map(r => bucketFor(r.category, r.type)));
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

  function render() {
    const q = lower(searchEl?.value).trim();
    const filtered = rows.filter(r => {
      const inBucket = (active === "all") || (bucketFor(r.category, r.type) === active);
      const textHit  = !q || lower(r.title).includes(q) || lower(r.category).includes(q) || lower(r.type).includes(q);
      return inBucket && textHit;
    });

    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function load() {
    // Prefer API (if present), but be tolerant of shapes.
    // Falls back to raw JSON if needed.
    const apiUrl = `/api/resources${SHEET_ID || SHEET_TAB ? `?sheet=${encodeURIComponent(SHEET_ID)}&tab=${encodeURIComponent(SHEET_TAB)}` : ""}`;

    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

    try {
      const r = await fetch(apiUrl, { cache: "no-store" });
      let data = await r.json();

      // Accept { ok:true, data:[...] } or { ok:true, items:[...] } or raw array
      let rawRows = Array.isArray(data) ? data
                 : Array.isArray(data?.data) ? data.data
                 : Array.isArray(data?.items) ? data.items
                 : [];

      // Normalize rows
      let normalized = rawRows.map(normalizeRow)
                              .filter(x => x.title && x.url);

      // Filter by PAGE_TOPIC when provided
      if (PAGE_TOPIC) {
        const pt = lower(PAGE_TOPIC);
        normalized = normalized.filter(x => {
          // Try topic column first; also allow title to contain the topic name as a fallback
          const t = lower(x.topic);
          const title = lower(x.title);
          return (t && (t.includes(pt) || pt.includes(t))) || title.includes(pt);
        });
      }

      rows = normalized;

      buildTabs();
      render();
    } catch (err) {
      console.error("[topic] Load error:", err);
      // Fallback: try static JSON if API fails
      try {
        const r2 = await fetch("/assets/data/resources.json", { cache: "no-store" });
        const j2 = await r2.json();
        let normalized = (Array.isArray(j2) ? j2 : (Array.isArray(j2?.data) ? j2.data : (Array.isArray(j2?.items) ? j2.items : [])))
          .map(normalizeRow)
          .filter(x => x.title && x.url);

        if (PAGE_TOPIC) {
          const pt = lower(PAGE_TOPIC);
          normalized = normalized.filter(x => {
            const t = lower(x.topic);
            const title = lower(x.title);
            return (t && (t.includes(pt) || pt.includes(t))) || title.includes(pt);
          });
        }

        rows = normalized;
        buildTabs();
        render();
      } catch (err2) {
        console.error("[topic] Fallback load error:", err2);
        listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
          Couldn't load resources. Please try again later.
        </div>`;
      }
    }
  }

  // Wire search
  searchEl?.addEventListener("input", render);

  // Kick off
  load();
})();
