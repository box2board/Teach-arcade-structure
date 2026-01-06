const SCENARIO_URL =
  "/decision-simulator/american-revolution-breaking-point/scenarios/american-revolution.json";

function $(id) { return document.getElementById(id); }

function showFatal(msg) {
  console.error("[Decision Simulator]", msg);

  const target =
    $("nodeContext") ||
    $("nodePrompt") ||
    document.querySelector(".card, main") ||
    document.body;

  const html = `
    <div style="
      margin: 14px 0;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(239,68,68,.35);
      background: rgba(239,68,68,.12);
      color: #fecaca;
      font: 600 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial;
    ">
      <div style="font-weight:800; margin-bottom:6px;">Simulator error</div>
      <div style="white-space:pre-wrap;">${String(msg).replaceAll("<","&lt;").replaceAll(">","&gt;")}</div>
    </div>
  `;

  if (target) target.innerHTML = html;
}

window.addEventListener("error", (e) => {
  showFatal(`JavaScript error: ${e.message}\n${e.filename || ""}:${e.lineno || ""}`);
});
window.addEventListener("unhandledrejection", (e) => {
  showFatal(`Unhandled promise rejection: ${e.reason}`);
});

async function loadScenario() {
  const r = await fetch(SCENARIO_URL, { cache: "no-store" });
  if (!r.ok) throw new Error(`Scenario fetch failed: ${r.status} ${r.statusText}`);
  const data = await r.json();
  if (!data || !Array.isArray(data.nodes)) throw new Error("Scenario JSON missing 'nodes' array.");
  return data;
}

function requireIds(ids) {
  const missing = ids.filter(id => !$(id));
  if (missing.length) {
    throw new Error(
      "index.html is missing required element IDs:\n- " +
      missing.join("\n- ") +
      "\n\nFix: ensure these IDs exist exactly (case-sensitive)."
    );
  }
}

function renderNode(node) {
  // MUST exist in your HTML
  requireIds(["nodeTitle", "nodePrompt", "nodeContext", "choicesList"]);

  $("nodeTitle").textContent = node.title || "Decision";
  $("nodePrompt").textContent = node.prompt || "";
  $("nodeContext").innerHTML = (node.context || [])
    .map(p => `<p>${String(p).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}</p>`)
    .join("");

  const list = $("choicesList");
  list.innerHTML = "";

  (node.choices || []).forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.innerHTML = `
      <div class="choice-title">${c.title}</div>
      <p class="choice-desc">${c.description || ""}</p>
    `;
    btn.addEventListener("click", () => choose(node, c));
    list.appendChild(btn);
  });
}

let scenario = null;

let state = {
  nodeId: "start",
  turn: 0,
  year: 1763,
  unity: 50,
  support: 50,
  pressure: 50,
  strain: 50,
  radicalization: 50
};

function applyEffects(effects) {
  const keys = ["unity","support","pressure","strain","radicalization"];
  keys.forEach(k => {
    if (typeof effects?.[k] === "number") {
      state[k] = Math.max(0, Math.min(100, state[k] + effects[k]));
    }
  });
}

function choose(node, choice) {
  applyEffects(choice.effects || {});
  if (typeof node.advanceYear === "number") state.year = node.advanceYear;

  // Reveal panel is optional for this debug build — you’ll add it back after it renders.
  const nextId = choice.next || node.next;
  if (!nextId) {
    showFatal("Reached end of scenario (no next node). This is okay at the final node.");
    return;
  }

  const next = scenario.nodes.find(n => n.id === nextId);
  if (!next) {
    showFatal(`Next node '${nextId}' not found in JSON.`);
    return;
  }

  renderNode(next);
}

(async function init(){
  try {
    scenario = await loadScenario();
    const start = scenario.nodes.find(n => n.id === "start");
    if (!start) throw new Error("JSON missing node id 'start'");
    renderNode(start);
  } catch (e) {
    showFatal(e?.message || e);
  }
})();
