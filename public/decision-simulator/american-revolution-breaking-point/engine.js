// Teach Arcade — Decision Simulator Engine (v2)
// - Better readability handling (no UI changes required)
// - Visual slots (banner, node image, outcome image)
// - Proper end screen with learning summary (no "error" at end)

const SCENARIO_URL =
  "/decision-simulator/american-revolution-breaking-point/scenarios/american-revolution.json";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderParagraphs(textOrArray) {
  const arr = Array.isArray(textOrArray) ? textOrArray : [textOrArray];
  return arr
    .filter(Boolean)
    .map((t) => `<p>${escapeHtml(t)}</p>`)
    .join("");
}

function pillDelta(label, val) {
  const cls = val > 0 ? "pos" : val < 0 ? "neg" : "";
  const sign = val > 0 ? "+" : "";
  return `<span class="delta-pill ${cls}">${escapeHtml(label)} ${sign}${val}</span>`;
}

const metricNames = {
  unity: "Colonial Unity",
  support: "Public Support",
  pressure: "British Pressure",
  strain: "Economic Strain",
  radicalization: "Radicalization",
};

function showFatal(msg) {
  console.error("[Decision Simulator]", msg);
  const target = $("nodeContext") || document.querySelector("main") || document.body;
  target.innerHTML = `
    <div class="card" style="border:1px solid rgba(239,68,68,.35); background: rgba(239,68,68,.12);">
      <h2 style="margin:0 0 8px;">Simulator error</h2>
      <p style="white-space:pre-wrap; margin:0;">${escapeHtml(msg)}</p>
      <p style="opacity:.9; margin-top:10px;">
        Check: scenario JSON is reachable, and IDs exist in index.html.
      </p>
    </div>
  `;
}

function setImage(imgId, placeholderId, wrapId, src, alt) {
  const img = $(imgId);
  const ph = $(placeholderId);
  const wrap = $(wrapId);

  if (!img || !ph || !wrap) return;

  if (src) {
    img.src = src;
    img.alt = alt || "Visual";
    img.hidden = false;
    ph.hidden = true;
    wrap.hidden = false;
  } else {
    img.hidden = true;
    ph.hidden = false;
    wrap.hidden = false;
  }
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
  radicalization: 50,
};

// Store student path for final summary
let history = []; // { nodeTitle, choiceTitle, effects, year }

async function loadScenario() {
  const r = await fetch(SCENARIO_URL, { cache: "no-store" });
  if (!r.ok) throw new Error(`Scenario fetch failed: ${r.status} ${r.statusText}`);
  const data = await r.json();
  if (!data || !Array.isArray(data.nodes)) throw new Error("Scenario JSON is missing a valid 'nodes' array.");
  return data;
}

function getNode(id) {
  return scenario.nodes.find((n) => n.id === id);
}

function applyEffects(effects) {
  const keys = ["unity", "support", "pressure", "strain", "radicalization"];
  for (const k of keys) {
    if (typeof effects?.[k] === "number") {
      state[k] = clamp(state[k] + effects[k], 0, 100);
    }
  }
}

function hide(id) {
  const el = $(id);
  if (el) el.hidden = true;
}
function show(id) {
  const el = $(id);
  if (el) el.hidden = false;
}

function renderNode(node) {
  // Hide end/reveal
  hide("revealCard");
  hide("endCard");

  // Ensure choice card visible
  const choicesCard = $("choicesCard");
  if (choicesCard) choicesCard.hidden = false;

  // Titles/prompts
  $("nodeTitle").textContent = node.title || "Situation";
  $("nodePrompt").textContent = node.prompt || "";
  $("nodeContext").innerHTML = renderParagraphs(node.context || "");

  // Node image slot (optional)
  setImage(
    "nodeImg",
    "nodePlaceholder",
    "nodeImgWrap",
    node.image ? `./${node.image}` : "",
    node.title ? `Scene: ${node.title}` : "Scene visual"
  );

  // Build choices
  const list = $("choicesList");
  list.innerHTML = "";

  (node.choices || []).forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.innerHTML = `
      <div class="choice-title">${escapeHtml(c.title)}</div>
      <p class="choice-desc">${escapeHtml(c.description || "")}</p>
    `;
    btn.addEventListener("click", () => choose(node, c));
    list.appendChild(btn);
  });
}

function disableChoices() {
  const list = $("choicesList");
  if (!list) return;
  [...list.querySelectorAll("button")].forEach((b) => (b.disabled = true));
}

function showReveal(node, choice) {
  disableChoices();

  // Outcome image (optional)
  const outcomeSrc = choice?.reveal?.image ? `./${choice.reveal.image}` : "";
  setImage("outcomeImg", "outcomePlaceholder", "outcomeImgWrap", outcomeSrc, "Outcome visual");

  $("revealTitle").textContent = "Outcome (revealed after commitment)";
  $("revealNarrative").textContent = choice.reveal?.narrative || "Outcome revealed.";
  $("revealWhy").textContent =
    choice.reveal?.why ||
    "Historical consequences emerge from competing interests, limited information, and unpredictable reactions.";

  // Deltas row
  const effects = choice.effects || {};
  const deltas = [];
  for (const k of Object.keys(effects)) {
    const val = effects[k];
    if (typeof val === "number" && val !== 0) {
      deltas.push(pillDelta(metricNames[k] || k, val));
    }
  }
  $("deltaRow").innerHTML = deltas.length ? deltas.join("") : `<span class="delta-pill">No measurable change</span>`;

  $("reflectPrompt").textContent =
    choice.reveal?.reflectPrompt ||
    "In 2–3 sentences: What clue(s) in the situation text most influenced your choice?";

  show("revealCard");

  // Continue handler
  $("btn-next").onclick = () => {
    const nextId = choice.next || node.next || null;
    if (!nextId) {
      showEndScreen(); // ✅ proper ending, not an error
      return;
    }
    const nextNode = getNode(nextId);
    if (!nextNode) {
      showFatal(`Scenario references next node '${nextId}', but it does not exist in the JSON.`);
      return;
    }
    state.nodeId = nextId;
    renderNode(nextNode);
  };
}

function choose(node, choice) {
  state.turn += 1;

  // Track path
  history.push({
    year: state.year,
    nodeTitle: node.title || "Decision",
    choiceTitle: choice.title || "Choice",
    effects: choice.effects || {},
  });

  applyEffects(choice.effects || {});

  // Advance year (node-level advanceYear is simplest and already in your JSON)
  if (typeof node.advanceYear === "number") state.year = node.advanceYear;

  showReveal(node, choice);
}

function describeTrajectory() {
  // Interpret final metrics as narrative (simple but meaningful)
  const { unity, support, pressure, strain, radicalization } = state;

  const hi = (v) => v >= 70;
  const lo = (v) => v <= 35;

  const parts = [];

  // Unity + Support (movement cohesion)
  if (hi(unity) && hi(support)) parts.push("You built a broad, coordinated movement with strong public buy-in.");
  else if (hi(unity) && lo(support)) parts.push("You strengthened coordination among leaders, but public support lagged in key moments.");
  else if (lo(unity) && hi(support)) parts.push("You energized popular support, but unity across colonies and leaders remained fragile.");
  else parts.push("Your path struggled to build both unity and widespread support at the same time.");

  // Pressure + Strain (British response & economic realities)
  if (hi(pressure) && hi(strain)) parts.push("British enforcement intensified while economic strain rose—raising the cost of continued conflict.");
  else if (hi(pressure) && !hi(strain)) parts.push("British pressure rose, but your choices limited the immediate economic damage.");
  else if (!hi(pressure) && hi(strain)) parts.push("Even without maximum enforcement, economic strain still grew—testing resolve and logistics.");
  else parts.push("Pressure and economic strain stayed relatively contained compared to other paths.");

  // Radicalization (tone/escalation)
  if (hi(radicalization)) parts.push("Radicalization climbed—mobilizing action quickly, but increasing the risk of backlash and polarization.");
  else if (lo(radicalization)) parts.push("You kept escalation lower—gaining stability, but risking slower momentum.");
  else parts.push("Escalation rose in some moments but stayed moderate overall.");

  return parts.join(" ");
}

function topTurningPoints() {
  // Pick 3 biggest impact choices by absolute delta sum
  const scored = history.map((h) => {
    const e = h.effects || {};
    const sum =
      Math.abs(e.unity || 0) +
      Math.abs(e.support || 0) +
      Math.abs(e.pressure || 0) +
      Math.abs(e.strain || 0) +
      Math.abs(e.radicalization || 0);
    return { ...h, impact: sum };
  });

  scored.sort((a, b) => b.impact - a.impact);
  return scored.slice(0, 3);
}

function showEndScreen() {
  // Hide choices + reveal
  hide("revealCard");
  const choicesCard = $("choicesCard");
  if (choicesCard) choicesCard.hidden = true;

  // Summary
  const summary = describeTrajectory();
  $("endSummary").textContent =
    `${summary} ` +
    `This isn’t “right vs. wrong”—it’s about tradeoffs, constraints, and how different strategies can push events in different directions.`;

  // Turning points list
  const tp = topTurningPoints();
  const ul = $("turningPoints");
  ul.innerHTML = "";
  tp.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(t.nodeTitle)}</strong> — ${escapeHtml(t.choiceTitle)}`;
    ul.appendChild(li);
  });
  if (!tp.length) {
    const li = document.createElement("li");
    li.textContent = "No turning points recorded (try restarting and making choices).";
    ul.appendChild(li);
  }

  // Reflection prompt
  $("endReflect").textContent =
    "Explain your strategy: Were you prioritizing unity, public pressure, stability, or speed? What evidence from the situations shaped your approach?";

  show("endCard");
}

function reset() {
  state = {
    nodeId: "start",
    turn: 0,
    year: 1763,
    unity: 50,
    support: 50,
    pressure: 50,
    strain: 50,
    radicalization: 50,
  };

  history = [];

  hide("revealCard");
  hide("endCard");

  const start = getNode("start");
  if (!start) throw new Error("Scenario JSON missing node id: 'start'");
  renderNode(start);
}

function wireButtons() {
  const b1 = $("btn-restart");
  const b2 = $("btn-restart-2");
  if (b1) b1.addEventListener("click", reset);
  if (b2) b2.addEventListener("click", reset);
}

(async function init() {
  try {
    scenario = await loadScenario();

    // Optional: populate title/subtitle from JSON
    if (scenario.title && $("simTitle")) $("simTitle").textContent = scenario.title;

    // Optional banner image from JSON: { "bannerImage": "assets/banner.jpg" }
    const bannerSrc = scenario.bannerImage ? `./${scenario.bannerImage}` : "";
    setImage("bannerImg", "bannerPlaceholder", "bannerWrap", bannerSrc, "Simulator banner");

    wireButtons();
    reset();
  } catch (e) {
    showFatal(e?.message || String(e));
  }
})();
