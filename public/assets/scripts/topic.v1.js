// /assets/scripts/topic.v1.js  — robust, cache-busted fetch + visible errors
(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const TAB = (page.dataset.tab || page.dataset.topic || "").trim();
  const listEl = document.getElementById("resource-list");
  const tabsEl = document.getElementById("tabs");
  const searchEl = document.getElementById("searchInput");

  if (!TAB || !listEl) return;

  // ---------- helpers ----------
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
    const l = String(label || "").toLowerCase();
    if (l === "pdf") return "pill gray";
    if (l === "video") return "pill blue";
    if (l === "interactive") return "pill green";
    if (l === "lesson plan") return "pill orange";
    if (l === "primary source") return "pill";
    if (l === "slides") return "pill blue";
    if (l === "assessment") return "pill gray";
    return "pill gray";
  };

  const cardHTML = r => {
    const url = toHttps(r.url);
    const cat = r.category || "Resource";
    const typ = r.type ? `<span class="pill gray">${safe(r.type)}</span>` : "";
    const emoji = emojiFor(r.type, r.category);
    const kind = fileLabel(url, cat);
    const kindPill = `<span class="${pillClassFor(kind)}">${kind}</span>`;

    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${emoji}</div>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        <p class="meta">
          <span class="pill">${safe(cat)}</span>
          ${typ}
          ${kindPill}
        </p>
        ${url ? `<a class="cta" href="${url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  };

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

  function buildTabsFrom(rows) {
    if (!tabsEl) return;
    const LABEL = {
      "all":"All",
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
    const present = new Set(rows.map(r => bucket(r.category)));
    const ordered = ["all","worksheets","lessons","primary-sources","games","videos","assessments","presentations","projects","other"]
      .filter(k => k === "all" || present.has(k));
    tabsEl.innerHTML = ordered
      .map(k => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${k==="all"}">${LABEL[k]}</button>`)
      .join("");
    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
        btn.setAttribute("aria-selected","true");
        renderList(currentRows, btn.dataset.tab);
      });
    });
  }

  function renderList(rows, activeTab = "all") {
    const q = safe(searchEl?.value).toLowerCase().trim();
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
    // cache buster avoids stale CDN/browser caches
    const url = `/api/resources?tab=${encodeURIComponent(tab)}&t=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    if (data && data.ok !== false) return data.items || data.data || [];
    throw new Error(data?.error || "API error");
  }

  async function fetchStaticFallback(tab) {
    const r = await fetch("/assets/data/resources.json?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(`static ${r.status}`);
    const all = await r.json();
    const t = tab.toLowerCase();
    return (all || []).filter(it => {
      const tt = safe(it.topic).toLowerCase();
      return tt === t || tt.includes(t);
    });
  }

  // ---------- load ----------
  let currentRows = [];
  listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

  (async () => {
    try {
      currentRows = await fetchAPI(TAB);
      if (!currentRows.length) {
        console.warn("[topic] API returned 0, trying static fallback");
        currentRows = await fetchStaticFallback(TAB);
      }
      if (!currentRows.length) {
        listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
        return;
      }
      buildTabsFrom(currentRows);
      renderList(currentRows, "all");
      if (searchEl) searchEl.addEventListener("input", () => {
        const active = tabsEl?.querySelector('[aria-selected="true"]')?.dataset.tab || "all";
        renderList(currentRows, active);
      });
    } catch (err) {
      console.error("[topic] load error:", err);
      listEl.innerHTML = `
        <div class="card" style="grid-column:1/-1;color:#b91c1c;">
          Error loading resources: ${safe(err.message)}<br>
          <small>Tab: ${TAB}</small>
        </div>`;
    }
  })();
})();
