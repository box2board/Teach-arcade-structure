// /assets/scripts/topic.v1.js  (simple JSON version)
(function () {
  const page = document.querySelector(".topic-page");
  if (!page) return;

  const TOPIC = (page.dataset.topic || page.dataset.tab || "").trim().toLowerCase();
  const listEl = document.getElementById("resource-list");
  if (!TOPIC || !listEl) return;

  listEl.innerHTML = "<p>Loading resources…</p>";

  fetch("/assets/data/resources.json", { cache: "no-store" })
    .then(r => r.json())
    .then(all => {
      const rows = (all || []).filter(r =>
        r.title && r.url && (r.topic || "").toLowerCase().includes(TOPIC)
      );
      if (!rows.length) {
        listEl.innerHTML = "<p>No matching resources found.</p>";
        return;
      }
      listEl.innerHTML = rows.map(r => `
        <div class="card">
          <h3>${r.title}</h3>
          <p>${r.category || ""}</p>
          <a href="${r.url}" target="_blank">View Resource</a>
        </div>
      `).join("");
    })
    .catch(err => {
      console.error(err);
      listEl.innerHTML = "<p>Error loading resources.</p>";
    });
})();
