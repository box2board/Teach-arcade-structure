// /assets/scripts/topic.v1.js — fixed version (uses API)
(async function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const tab = (page.dataset.tab || "").trim();
  const listEl = document.getElementById("resource-list");
  if (!tab || !listEl) return;

  listEl.innerHTML = `<p>Loading resources…</p>`;

  try {
    const res = await fetch(`/api/resources?tab=${encodeURIComponent(tab)}`);
    const data = await res.json();
    const items = data.items || data.data || [];

    if (!items.length) {
      listEl.innerHTML = `<p>No matching resources yet.</p>`;
      return;
    }

    // Build cards for each item
    listEl.innerHTML = items.map(r => {
      const cat = r.category || "Resource";
      const type = r.type ? `<span class="pill gray">${r.type}</span>` : "";
      const emoji =
        cat.toLowerCase().includes("video") ? "🎥" :
        cat.toLowerCase().includes("game") ? "🎮" :
        cat.toLowerCase().includes("worksheet") ? "📄" :
        cat.toLowerCase().includes("lesson") ? "📘" :
        "🔗";

      return `
        <div class="card">
          <div style="font-size:24px;margin-bottom:4px;">${emoji}</div>
          <h3>${r.title}</h3>
          <p class="meta"><span class="pill">${cat}</span> ${type}</p>
          <a class="cta" href="${r.url}" target="_blank" rel="noopener noreferrer">View Resource</a>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p>Error loading resources.</p>`;
  }
})();
