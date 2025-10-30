<script>
// /assets/scripts/topic.js
document.addEventListener("DOMContentLoaded", () => {
  // Find the topic container on the page
  const root = document.querySelector("main.topic-page");
  if (!root) {
    console.warn("[topic.js] No <main class='topic-page'> found. Skipping.");
    return;
  }

  // Required elements (already in your page markup)
  const listEl   = root.querySelector("#resource-list");
  const tabsEl   = root.querySelector("#tabs");
  const searchEl = root.querySelector("#searchInput");

  if (!listEl || !tabsEl || !searchEl) {
    console.error("[topic.js] Missing required container(s): #resource-list, #tabs, or #searchInput.");
    return;
  }

  // Sheet config comes from data-* attributes on <main>
  const SHEET_ID   = root.dataset.sheetId?.trim();
  const SHEET_NAME = root.dataset.tab?.trim();

  if (!SHEET_ID || !SHEET_NAME) {
    console.error("[topic.js] data-sheet-id and/or data-tab missing on <main class='topic-page'>.");
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
      Missing sheet configuration. Add data-sheet-id and data-tab to &lt;main&gt;.
    </div>`;
    return;
  }

  const SHEET_URL =
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}` +
    `/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  // Category buckets for the Topic Explorer tabs
  const CATEGORY_BUCKETS = [
    { key: "worksheets",      label: "Worksheets",      includes: ["worksheet","handout","practice"] },
    { key: "lessons",         label: "Lessons",         includes: ["lesson","teacher guide","unit","plan"] },
    { key: "primary-sources", label: "Primary Sources", includes: ["primary","document","source"] },
    { key: "games",           label: "Games",           includes: ["game","interactive","simulation"] },
    { key: "videos",          label: "Videos",          includes: ["video","film"] },
    { key: "assessments",     label: "Assessments",     includes: ["quiz","assessment","test"] },
    { key: "presentations",   label: "Presentations",   includes: ["presentation","slides"] },
    { key: "projects",        label: "Projects",        includes: ["project","performance","inquiry"] },
    { key: "other",           label: "Other",           includes: [] }
  ];

  let allRows = [];
  let activeTab = "all";

  const safe = v => (v == null ? "" : String(v));
  const toUrl = u => {
    const s = safe(u).trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : "https://" + s;
  };

  function bucketFor(category) {
    const cat = safe(category).toLowerCase();
    for (const b of CATEGORY_BUCKETS) {
      if (b.includes.some(t => cat.includes(t))) return b.key;
    }
    return "other";
  }

  function iconFor(item) {
    const t = item.type.toLowerCase();
    const c = item.category.toLowerCase();
    if (t.includes("pdf")) return "📄";
    if (c.includes("game") || c.includes("interactive")) return "🎮";
    if (t.includes("video") || c.includes("video")) return "🎥";
    if (c.includes("primary")) return "📜";
    if (c.includes("lesson") || c.includes("guide")) return "📘";
    return "🔗";
  }

  function badgeClass(bucket) {
    switch (bucket) {
      case "games": return "pill green";
      case "videos": return "pill blue";
      case "lessons": return "pill orange";
      case "worksheets": return "pill gray";
      case "primary-sources": return "pill";
      default: return "pill gray";
    }
  }

  function cardHTML(item) {
    const bucket = bucketFor(item.category);
    const meta = [
      `<span class="${badgeClass(bucket)}">${CATEGORY_BUCKETS.find(b => b.key === bucket)?.label || "Other"}</span>`,
      item.type ? `<span class="pill gray">${safe(item.type)}</span>` : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${iconFor(item)}</div>
        <h3 style="margin:0 0 8px;">${safe(item.title)}</h3>
        <p class="meta">${meta}</p>
        ${item.url ? `<a class="cta" href="${item.url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  }

  function buildTabs(rows) {
    const present = new Set(rows.map(r => bucketFor(r.category)));
    const buckets = CATEGORY_BUCKETS.filter(b => present.has(b.key));

    const html = [
      `<button class="tab" role="tab" data-tab="all" aria-selected="${activeTab === "all"}">All</button>`,
      ...buckets.map(b => `<button class="tab" role="tab" data-tab="${b.key}" aria-selected="${activeTab === b.key}">${b.label}</button>`)
    ].join("");

    tabsEl.innerHTML = html;

    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", "false"));
        btn.setAttribute("aria-selected", "true");
        render();
      });
    });
  }

  function render() {
    const q = safe(searchEl.value).toLowerCase().trim();

    const filtered = allRows.filter(r => {
      if (activeTab !== "all" && bucketFor(r.category) !== activeTab) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    });

    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function load() {
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const res  = await fetch(SHEET_URL, { cache: "no-store" });
      const text = await res.text();

      // Parse Google GViz JSON safely
      const start = text.indexOf("{");
      const end   = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("Unexpected GViz response.");
      const json = JSON.parse(text.slice(start, end + 1));

      const rows = Array.isArray(json?.table?.rows) ? json.table.rows : [];
      allRows = rows.map(r => r?.c || []).map(c => ({
        title:    safe(c[0]?.v),
        type:     safe(c[1]?.v),
        category: safe(c[2]?.v),
        url:      toUrl(c[3]?.v)
      }))
      .filter(r => r.title && r.title.toLowerCase() !== "title" && r.url);

      buildTabs(allRows);
      render();
    } catch (e) {
      console.error("[topic.js] Load error:", e);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
        Couldn't load resources. Check sheet publish/sharing, data-sheet-id, and data-tab.
      </div>`;
    }
  }

  // Live search
  searchEl.addEventListener("input", render);

  // Go!
  load();
});
</script>
