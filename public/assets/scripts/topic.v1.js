<!-- /assets/scripts/topic.v1.js -->
<script>
(async function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const TAB = (page.dataset.tab || page.dataset.topic || "").trim();
  const listEl = document.getElementById("resource-list");
  const tabsEl = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");

  if (!TAB || !listEl) return;

  // Helpers
  const safe = v => (v == null ? "" : String(v));
  const toHttps = u => {
    const s = safe(u).trim();
    return s ? (/^https?:\/\//i.test(s) ? s : "https://" + s) : "";
  };

  const emojiFor = (type, cat) => {
    const t = safe(type).toLowerCase();
    const c = safe(cat).toLowerCase();
    if (c.includes("video") || t.includes("video")) return "🎥";
    if (c.includes("game") || c.includes("interactive")) return "🎮";
    if (c.includes("worksheet") || t.includes("pdf")) return "📄";
    if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "📘";
    if (c.includes("primary")) return "📜";
    if (c.includes("slides") || c.includes("presentation")) return "🖥️";
    if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "📝";
    if (c.includes("project") || c.includes("activity")) return "🧩";
    return "🔗";
  };

  const fileLabel = (url, cat) => {
    const u = safe(url).toLowerCase();
    const c = safe(cat).toLowerCase();
    if (u.endsWith(".pdf")) return "PDF";
    if (c.includes("video") || u.includes("youtube") || u.includes("vimeo")) return "Video";
    if (c.includes("game") || c.includes("interactive")) return "Interactive";
    if (c.includes("primary")) return "Primary Source";
    if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "Lesson Plan";
    if (c.includes("project") || c.includes("activity")) return "Project";
    if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "Assessment";
    if (c.includes("slides") || c.includes("presentation")) return "Slides";
    if (u.startsWith("http")) return "Link";
    return "Resource";
  };

  const pillClassFor = (label) => {
    const l = label.toLowerCase();
    if (l === "pdf") return "pill gray";
    if (l === "video") return "pill blue";
    if (l === "interactive") return "pill green";
    if (l === "lesson plan") return "pill orange";
    if (l === "primary source") return "pill";
    if (l === "slides") return "pill blue";
    if (l === "assessment") return "pill gray";
    return "pill gray";
  };

  function cardHTML(r) {
    const url = toHttps(r.url);
    const cat = r.category || "Resource";
    const type = r.type ? `<span class="pill gray">${safe(r.type)}</span>` : "";
    const emoji = emojiFor(r.type, r.category);
    const kind = fileLabel(url, cat);
    const kindPill = `<span class="${pillClassFor(kind)}">${kind}</span>`;
    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${emoji}</div>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        <p class="meta">
          <span class="pill">${safe(cat)}</span>
          ${type}
          ${kindPill}
        </p>
        ${url ? `<a class="cta" href="${url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  }

  function buildTabsFrom(rows) {
    if (!tabsEl) return;
    const getBucket = (cat) => {
      const c = safe(cat).toLowerCase();
      if (c.includes("worksheet")) return "worksheets";
      if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "lessons";
      if (c.includes("primary")) return "primary-sources";
      if (c.includes("game") || c.includes("interactive")) return "games";
      if (c.includes("video")) return "videos";
      if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "assessments";
      if (c.includes("slides") || c.includes("presentation")) return "presentations";
      if (c.includes("project") || c.includes("activity")) return "projects";
      return "other";
    };

    const LABEL = {
      "worksheets":"Worksheets",
      "lessons":"Lessons",
      "primary-sources":"Primary Sources",
      "games":"Games",
      "videos":"Videos",
      "assessments":"Assessments",
      "presentations":"Presentations",
      "projects":"Projects",
      "other":"Other"
    };

    const present = new Set(rows.map(r => getBucket(r.category)));
    const ordered = ["all","worksheets","lessons","primary-sources","games","videos","assessments","presentations","projects","other"]
      .filter(k => k === "all" || present.has(k));

    tabsEl.innerHTML = ordered
      .map(k => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${k==="all"}">${LABEL[k] || "All"}</button>`)
      .join("");

    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
        btn.setAttribute("aria-selected","true");
        const k = btn.dataset.tab;
        renderList(rows, k);
      });
    });
  }

  function renderList(rows, activeTab = "all") {
    const q = safe(searchEl?.value).toLowerCase().trim();

    const bucket = (cat) => {
      const c = safe(cat).toLowerCase();
      if (c.includes("worksheet")) return "worksheets";
      if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "lessons";
      if (c.includes("primary")) return "primary-sources";
      if (c.includes("game") || c.includes("interactive")) return "games";
      if (c.includes("video")) return "videos";
      if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "assessments";
      if (c.includes("slides") || c.includes("presentation")) return "presentations";
      if (c.includes("project") || c.includes("activity")) return "projects";
      return "other";
    };

    const filtered = rows.filter(r => {
      const matchesTab = (activeTab === "all") || (bucket(r.category) === activeTab);
      const matchesQ = !q ||
        safe(r.title).toLowerCase().includes(q) ||
        safe(r.category).toLowerCase().includes(q) ||
        safe(r.type).toLowerCase().includes(q);
      return matchesTab && matchesQ;
    });

    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  }

  async function fetchAPI(tab) {
    const url = `/api/resources?tab=${encodeURIComponent(tab)}&t=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    if (!data || data.ok === false) throw new Error(data?.error || "API error");
    return data.items || data.data || [];
  }

  async function fetchStaticAndFilter(tab) {
    const r = await fetch("/assets/data/resources.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`static ${r.status}`);
    const all = await r.json();
    // Accept exact match OR contains (to be tolerant of naming)
    const t = tab.toLowerCase();
    return (all || []).filter(
      it => safe(it.topic).toLowerCase() === t || safe(it.topic).toLowerCase().includes(t)
    );
  }

  // ---- Load flow
  listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

  try {
    let items = await fetchAPI(TAB);

    // If API returns nothing, be tolerant and try the static fallback
    if (!items || !items.length) {
      console.warn("[topic] Empty from API, trying static JSON fallback");
      items = await fetchStaticAndFilter(TAB);
    }

    if (!items.length) {
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
      return;
    }

    // Build tabs + initial render
    buildTabsFrom(items);
    renderList(items, "all");

    // Wire search live filter
    if (searchEl) searchEl.addEventListener("input", () => renderList(items, (tabsEl?.querySelector('[aria-selected="true"]')?.dataset.tab) || "all"));

  } catch (err) {
    console.error("[topic] load error:", err);
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">
      Couldn't load resources. Please try again later.
    </div>`;
  }
})();
</script>
