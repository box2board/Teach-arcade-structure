<!-- /public/assets/scripts/topic.v1.js -->
<script>
(async function () {
  const page   = document.querySelector(".topic-page");
  if (!page) return;

  const TAB    = (page.dataset.tab || page.dataset.topic || "").trim();
  const listEl = document.getElementById("resource-list");
  const searchEl = document.getElementById("searchInput");
  if (!TAB || !listEl) return;

  const safe = v => (v == null ? "" : String(v));
  const toHttps = (u) => {
    const s = safe(u).trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : "https://" + s;
  };

  // ---- File label + emoji helpers -----------------------------------------
  const fileLabel = (url, category) => {
    const u = safe(url).toLowerCase();
    const c = safe(category).toLowerCase();

    if (u.endsWith(".pdf")) return "PDF";
    if (c.includes("video") || u.includes("youtube") || u.includes("vimeo")) return "Video";
    if (c.includes("game") || c.includes("interactive")) return "Interactive";
    if (c.includes("primary")) return "Primary Source";
    if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "Lesson Plan";
    if (c.includes("project") || c.includes("activity")) return "Project";
    if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "Assessment";
    if (c.includes("presentation") || c.includes("slides")) return "Slides";
    if (u.startsWith("http")) return "Link";
    return "Resource";
  };

  const iconFor = (type, category, url) => {
    const t = safe(type).toLowerCase();
    const c = safe(category).toLowerCase();
    const u = safe(url).toLowerCase();

    if (u.endsWith(".pdf")) return "📘";
    if (c.includes("video") || u.includes("youtube") || u.includes("vimeo") || t.includes("video")) return "🎥";
    if (c.includes("game") || c.includes("interactive")) return "🎮";
    if (c.includes("primary")) return "📜";
    if (c.includes("lesson") || c.includes("guide") || c.includes("plan")) return "📚";
    if (c.includes("project") || c.includes("activity")) return "🧩";
    if (c.includes("quiz") || c.includes("assessment") || c.includes("test")) return "📝";
    if (c.includes("presentation") || c.includes("slides")) return "🖼️";
    if (u.startsWith("http")) return "🔗";
    return "📎";
  };

  const badgeClass = (category) => {
    const c = safe(category).toLowerCase();
    if (c.includes("video")) return "pill blue";
    if (c.includes("game") || c.includes("interactive")) return "pill green";
    if (c.includes("lesson") || c.includes("guide")) return "pill orange";
    if (c.includes("worksheet")) return "pill gray";
    if (c.includes("primary")) return "pill";
    return "pill gray";
  };

  const cardHTML = (r) => {
    const url = toHttps(r.url);
    const cat = safe(r.category) || "Resource";
    const type = safe(r.type);
    const icon = iconFor(type, cat, url);
    const fLabel = fileLabel(url, cat);

    return `
      <div class="card">
        <div style="font-size:26px;margin-bottom:4px;">${icon}</div>
        <small style="display:block;color:#475569;font:600 12px Nunito,system-ui;margin:-2px 0 6px;">
          ${fLabel}
        </small>
        <h3 style="margin:0 0 8px;">${safe(r.title)}</h3>
        <p class="meta">
          <span class="${badgeClass(cat)}">${cat}</span>
          ${type ? `<span class="pill gray">${type}</span>` : ""}
        </p>
        ${url ? `<a class="cta" href="${url}" target="_blank" rel="noopener noreferrer">View Resource</a>` : ""}
      </div>
    `;
  };

  // ---- Fetch + render ------------------------------------------------------
  let items = [];
  const render = () => {
    const q = safe(searchEl?.value).toLowerCase().trim();
    const filtered = items.filter(r =>
      !q ||
      safe(r.title).toLowerCase().includes(q) ||
      safe(r.category).toLowerCase().includes(q) ||
      safe(r.type).toLowerCase().includes(q)
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(cardHTML).join("")
      : `<div class="card" style="grid-column:1/-1;">No matching resources yet.</div>`;
  };

  listEl.innerHTML = `<div class="card" style="grid-column:1/-1;">Loading resources…</div>`;

  try {
    const res = await fetch(`/api/resources?tab=${encodeURIComponent(TAB)}`, { cache: "no-store" });
    const data = await res.json();
    const raw = data.items || data.data || [];

    // Normalize a bit to avoid undefineds
    items = raw
      .map(r => ({
        title: safe(r.title),
        url: safe(r.url),
        category: safe(r.category),
        type: safe(r.type)
      }))
      .filter(r => r.title && r.url);

    render();
    if (searchEl) searchEl.addEventListener("input", render);
  } catch (err) {
    console.error("Topic load error:", err);
    listEl.innerHTML = `<div class="card" style="grid-column:1/-1;color:#b91c1c;">Error loading resources.</div>`;
  }
})();
</script>
