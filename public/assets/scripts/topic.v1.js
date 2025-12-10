// /assets/scripts/topic.v1.js — category+format only (no duplicates)
(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const TAB = (page.dataset.tab || page.dataset.topic || "").trim();
  const SHEET_ID = (page.dataset.sheetId || "").trim(); // ✅ NEW: read sheet ID from HTML

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

  // Normalize a single category from messy spreadsheet text
  function normalizeCategory(raw) {
    const s = safe(raw).toLowerCase();
    // Split on common separators and look for the first thing we recognize
    const tokens = s.split(/[/,|;•>-]/g).map(t => t.trim()).filter(Boolean);

    const is = (tok, ...needles) => needles.some(n => tok.includes(n));

    for (const t of tokens) {
      if (is(t,"worksheet","handout","printable")) return "Worksheet";
      if (is(t,"lesson","teacher guide","guide","unit plan","plan")) return "Lesson Plan";
      if (is(t,"primary","document","source")) return "Primary Source";
      if (is(t,"interactive","game","simulation","activity")) return "Interactive/Game";
      if (is(t,"video","film")) return "Video";
      if (is(t,"quiz","assessment","test","exam")) return "Assessment";
      if (is(t,"slides","presentation","ppt","google slides")) return "Slides/Presentation";
      if (is(t,"project","performance","inquiry")) return "Project";
    }
    // If nothing matched, try the whole string once
    if (is(s,"worksheet")) return "Worksheet";
    if (is(s,"lesson","plan","guide")) return "Lesson Plan";
    if (is(s,"primary")) return "Primary Source";
    if (is(s,"interactive","game")) return "Interactive/Game";
    if (is(s,"video")) return "Video";
    if (is(s,"quiz","assessment","test")) return "Assessment";
    if (is(s,"slides","presentation")) return "Slides/Presentation";
    if (is(s,"project")) return "Project";
    return "Other";
  }

  // Format: PDF or Link only
  function formatLabel(url, type) {
    const u = safe(url).toLowerCase();
    const t = safe(type).toLowerCase();
    if (u.endsWith(".pdf") || t.includes("pdf") || t.includes("direct pdf")) return "PDF";
    return "Link";
  }

  const emojiFor = (cat) => {
    const c = safe(cat).toLowerCase();
    if (c === "video") return "🎥";
    if (c === "interactive/game") return "🎮";
    if (c === "worksheet") return "📄";
    if (c === "lesson plan") return "📘";
    if (c === "primary source") return "📜";
    if (c === "slides/presentation") return "🖥️";
    if (c === "assessment") return "📝";
    if (c === "project") return "🧩";
    return "🔗";
  };

  const pillClass = (label) => {
    const l = String(label || "").toLowerCase();
    // a little color variety; both pills remain compact
    if (l === "pdf") return "pill gray";
    if (l === "link") return "pill gray";
    if (l === "video") return "pill blue";
    if (l === "interactive/game") return "pill green";
    if (l === "lesson plan") return "pill orange";
    if (l === "worksheet") return "pill gray";
    if (l === "primary source") return "pill";
    if (l === "slides/presentation") return "pill blue";
    if (l === "assessment") return "pill gray";
    if (l === "project") return "pill";
    return "pill gray";
  };

  const cardHTML = r => {
    const url = toHttps(r.url);
    const category = normalizeCategory(r.category || r.type || "");
    const format = formatLabel(url, r.type);
    const emoji = emojiFor(category);

    return `
      <div class="card">
        <div style="font-size:24px;margin-bottom:4px;">${emoji}</div>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        <p class="meta">
          <span class="${pillClass(category)}">${category}</span>
          <span class="${pillClass(format)}">${format}</span>
        </p>
        ${url ? `<a class="cta" href="${url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  };

  const bucketKey = (cat) => {
    switch ((cat || "").toLowerCase()) {
      case "worksheet": return "worksheets";
      case "lesson plan": return "lessons";
      case "primary source": return "primary-sources";
      case "interactive/game": return "games";
      case "video": return "videos";
      case "assessment": return "assessments";
      case "slides/presentation": return "presentations";
      case "project": return "projects";
      default: return "other";
    }
  };

  function buildTabs(rows) {
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
    const present = new Set(rows.map(r => bucketKey(r._cat)));
    const order = ["all","worksheets","lessons","primary-sources","games","videos","assessments","presentations","projects","other"]
      .filter(k => k === "all" || present.has(k));
    tabsEl.innerHTML = order.map(k =>
      `<button class="tab" role="tab" data-tab="${k}" aria-selected="${k==="all"}">${LABEL[k]}</button>`
    ).join("");
    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
        btn.setAttribute("aria-selected","true");
        render(currentRows, btn.dataset.tab);
      });
    });
  }

  function render(rows, active = "all") {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = rows.filter(r => {
      const matchesTab = active === "all" || bucketKey(r._cat) === active;
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

  // ✅ UPDATED: include sheetId in the API call
  async function fetchAPI(tab) {
    const params = new URLSearchParams();
    if (SHEET_ID) params.set("sheetId", SHEET_ID);
    if (tab) params.set("tab", tab);
    params.set("t", Date.now().toString());

    const url = `/api/resources?${params.toString()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    if (data && data.ok !== false) return data.items || data.data || [];
    throw new Error(data?.error || "API error");
  }

  // ---------- load ----------
  let currentRows = [];
  listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

  (async () => {
    try {
      const raw = await fetchAPI(TAB);

      // enrich with normalized category for tabs & rendering
      currentRows = raw.map(r => ({
        ...r,
        _cat: normalizeCategory(r.category || r.type || "")
      }));

      if (!currentRows.length) {
        listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
        return;
      }
      buildTabs(currentRows);
      render(currentRows);

      if (searchEl) searchEl.addEventListener("input", () => {
        const active = tabsEl?.querySelector('[aria-selected="true"]')?.dataset.tab || "all";
        render(currentRows, active);
      });
    } catch (err) {
      console.error("[topic] load error:", err);
      listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">Error loading resources.</div>`;
    }
  })();
})();
