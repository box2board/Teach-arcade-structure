// /assets/scripts/topic.v1.js — fetch live from /api/resources
(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const TOPIC = (page.dataset.tab || page.dataset.topic || "").trim().toLowerCase();
  const listEl = document.getElementById("resource-list");
  const tabsEl = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");

  if (!TOPIC || !listEl) return;

  const BUCKETS = [
    { key: "worksheets",      label: "Worksheets",      match: ["worksheet","handout","practice"] },
    { key: "lessons",         label: "Lessons",         match: ["lesson","teacher","unit","plan"] },
    { key: "primary-sources", label: "Primary Sources", match: ["primary","document","source"] },
    { key: "games",           label: "Games",           match: ["game","interactive","simulation"] },
    { key: "videos",          label: "Videos",          match: ["video","film"] },
    { key: "assessments",     label: "Assessments",     match: ["quiz","assessment","test","dbq"] },
    { key: "presentations",   label: "Presentations",   match: ["presentation","slides"] },
    { key: "projects",        label: "Projects",        match: ["project","performance","inquiry","webquest","stations","jigsaw"] },
    { key: "other",           label: "Other",           match: [] }
  ];

  const safe = v => (v == null ? "" : String(v));
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

  let rows = [];
  let active = "all";

  function buildTabs() {
    const present = new Set(rows.map(r => bucketFor(r.category)));
    const avail = BUCKETS.filter(b => present.has(b.key));
    const parts = [
      `<button class="tab" role="tab" data-tab="all" aria-selected="${active==="all"}">All</button>`,
      ...avail.map(b => `<button class="tab" role="tab" data-tab="${b.key}" aria-selected="${active===b.key}">${b.label}</button>`)
    ];
    if (tabsEl) {
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
  }

  function render() {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r =>
      (active === "all" || bucketFor(r.category) === active) &&
      (!q || (r.title||"").toLowerCase().includes(q) || (r.category||"").toLowerCase().includes(q))
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(r => `
          <div class="card">
            <div style="font-size:24px;margin-bottom:4px;">${iconFor(r.type, r.category)}</div>
            <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
            <p class="meta">
              <span class="${badgeClass(bucketFor(r.category))}">${bucketFor(r.category).replace("-"," ")}</span>
              ${r.type ? `<span class="pill gray">${safe(r.type)}</span>` : ""}
            </p>
            <a class="cta" href="${safe(r.url)}" target="_blank" rel="noopener noreferrer">View Resource</a>
          </div>
        `).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function load() {
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;
    try {
      const res = await fetch(`/api/resources?topic=${encodeURIComponent(TOPIC)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "API error");
      rows = data.items.filter(x => x.title && x.url);
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
