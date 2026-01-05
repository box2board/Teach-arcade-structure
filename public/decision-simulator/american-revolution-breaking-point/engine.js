// Decision Simulator Engine (static web)
// Design rule: BEFORE choice = no outcomes shown. AFTER choice = reveal narrative + why + deltas.

const SCENARIO_URL = "./scenarios/american-revolution.json";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function el(id){ return document.getElementById(id); }

function metricLabel(key){
  const map = {
    unity: "Colonial Unity",
    support: "Public Support",
    pressure: "British Pressure",
    strain: "Economic Strain",
    radicalization: "Radicalization"
  };
  return map[key] || key;
}

function setMeter(fillId, valueId, v){
  const vClamped = clamp(v, 0, 100);
  el(valueId).textContent = String(vClamped);
  el(fillId).style.width = vClamped + "%";
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderParagraphs(textOrArray){
  const arr = Array.isArray(textOrArray) ? textOrArray : [textOrArray];
  return arr.filter(Boolean).map(t => `<p>${escapeHtml(t)}</p>`).join("");
}

function pillDelta(key, val){
  const cls = val > 0 ? "pos" : (val < 0 ? "neg" : "");
  const sign = val > 0 ? "+" : "";
  return `<span class="delta-pill ${cls}">${metricLabel(key)} ${sign}${val}</span>`;
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
  log: [] // {year, nodeTitle, choiceTitle}
};

async function loadScenario(){
  const r = await fetch(SCENARIO_URL, { cache: "no-store" });
  if(!r.ok) throw new Error("Scenario fetch failed: " + r.status);
  return await r.json();
}

function updateHUD(){
  el("yearPill").textContent = `Year: ${state.year}`;
  el("turnPill").textContent = `Decision: ${state.turn}`;

  setMeter("mUnity","vUnity",state.unity);
  setMeter("mSupport","vSupport",state.support);
  setMeter("mPressure","vPressure",state.pressure);
  setMeter("mStrain","vStrain",state.strain);
  setMeter("mRad","vRad",state.radicalization);
}

function getNode(id){
  return scenario.nodes.find(n => n.id === id);
}

function hideReveal(){
  el("revealCard").hidden = true;
  el("endCard").hidden = true;
}

function renderHistory(){
  if (!state.log.length){
    el("historyPanel").innerHTML = "<p><strong>Decision log:</strong> (none yet)</p>";
    return;
  }
  const rows = state.log.map((x, i) =>
    `<div><strong>${i+1}.</strong> ${escapeHtml(String(x.year))} — ${escapeHtml(x.nodeTitle)}<br><span style="color:#94a3b8;">You chose:</span> ${escapeHtml(x.choiceTitle)}</div>`
  ).join("<hr style='border:0;border-top:1px solid rgba(148,163,184,.18);margin:10px 0;'/>");

  el("historyPanel").innerHTML = `<p><strong>Decision log:</strong></p>${rows}`;
}

function showNode(node){
  hideReveal();

  el("nodeTitle").textContent = node.title || "Decision";
  el("nodePrompt").textContent = node.prompt || "";
  el("nodeContext").innerHTML = renderParagraphs(node.context || "");

  // voices / evidence cues
  if (node.voices && node.voices.length){
    el("voicesBlock").hidden = false;
    el("voicesList").innerHTML = node.voices.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  } else {
    el("voicesBlock").hidden = true;
    el("voicesList").innerHTML = "";
  }

  // choices (NO outcomes shown here)
  const list = el("choicesList");
  list.innerHTML = "";

  (node.choices || []).forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.setAttribute("aria-label", `Choice ${idx+1}: ${c.title}`);
    btn.innerHTML = `
      <div class="choice-title">${escapeHtml(c.title)}</div>
      <p class="choice-desc">${escapeHtml(c.description || "")}</p>
    `;
    btn.addEventListener("click", () => choose(node, c));
    list.appendChild(btn);
  });

  el("nodeTitle").scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyEffects(effects){
  const keys = ["unity","support","pressure","strain","radicalization"];
  keys.forEach(k => {
    if (typeof effects?.[k] === "number"){
      state[k] = clamp(state[k] + effects[k], 0, 100);
    }
  });
}

/**
 * Ending logic: multiple outcomes at 1776+ based on current state.
 * This is intentionally interpretive (not “you won/lost”).
 */
function computeEnding(){
  if (state.year < 1776) return null;

  const U = state.unity, S = state.support, P = state.pressure, E = state.strain, R = state.radicalization;

  // Strong unified independence path
  if (U >= 78 && S >= 72 && P >= 55) {
    return {
      title: "A united push toward independence",
      summary:
        "Your choices build broad coordination and public commitment. By 1776, the colonies have the unity and support needed to sustain a political break—closer to the conditions required for independence."
    };
  }

  // Escalation spiral
  if (P >= 82 && R >= 80) {
    return {
      title: "Spiral into confrontation",
      summary:
        "Pressure and radicalization feed each other until moderation collapses. Conflict becomes hard to avoid, and decisions increasingly narrow to force-versus-force. This resembles how escalation cycles can make war feel inevitable."
    };
  }

  // Strain overwhelms politics
  if (E >= 85 && (U < 65 || S < 65)) {
    return {
      title: "Strain fractures momentum",
      summary:
        "Economic hardship rises high enough that communities split on priorities. Even if anger exists, sustained political action becomes difficult when daily survival dominates. Movements can lose coherence under stress."
    };
  }

  // Fragmentation / failure to coordinate
  if (U <= 35 && S <= 45) {
    return {
      title: "Fragmented resistance",
      summary:
        "Grievances exist, but coordination never stabilizes. Local disputes remain local, and no common program holds. Historically, broad coordination was essential to transform resentment into unified political action."
    };
  }

  // Default mixed
  return {
    title: "An uncertain and contested path",
    summary:
      "Your path produces mixed forces: some push toward unity and resistance, others toward strain, pressure, or fragmentation. This is closer to how history feels in real time—uncertain, contested, and shaped by tradeoffs."
  };
}

function showEnding(ending){
  el("revealCard").hidden = true;

  el("endCard").hidden = false;
  el("endTitle").textContent = ending.title || "Your Outcome";
  el("endSummary").textContent = ending.summary || "";

  el("choicesList").innerHTML = "";
  el("nodeTitle").textContent = "Scenario complete";
  el("nodePrompt").textContent = "Compare your path to history and discuss what mattered most.";
  el("nodeContext").innerHTML = "";

  el("endCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function choose(node, choice){
  // lock UI
  [...el("choicesList").querySelectorAll("button")].forEach(b => b.disabled = true);

  // log
  state.turn += 1;
  state.log.push({
    year: state.year,
    nodeTitle: node.title || "Decision",
    choiceTitle: choice.title || "Choice"
  });
  renderHistory();

  // apply effects
  applyEffects(choice.effects || {});

  // advance year: prefer node.advanceYear, then choice.advanceYear
  if (typeof node.advanceYear === "number") state.year = node.advanceYear;
  else if (typeof choice.advanceYear === "number") state.year = choice.advanceYear;

  updateHUD();

  // reveal
  const reveal = el("revealCard");
  reveal.hidden = false;

  el("revealNarrative").textContent = choice.reveal?.narrative || "Your decision shifts the situation.";
  el("revealWhy").textContent = choice.reveal?.why || "In history, outcomes are shaped by incentives, constraints, and reactions from multiple sides.";

  // deltas
  const effects = choice.effects || {};
  const deltas = [];
  Object.keys(effects).forEach(k => {
    const val = effects[k];
    if (typeof val === "number" && val !== 0) deltas.push(pillDelta(k, val));
  });
  el("deltaRow").innerHTML = deltas.length ? deltas.join("") : `<span class="delta-pill">No measurable change</span>`;

  // reflection prompt
  el("reflectPrompt").textContent =
    choice.reveal?.reflectPrompt ||
    "What tradeoff did you accept, and what evidence in the text pushed you toward that choice?";

  el("reflectInput").value = "";

  // copy reflection
  el("btn-copy-reflection").onclick = async () => {
    const txt = el("reflectInput").value.trim();
    if (!txt) return;
    try{
      await navigator.clipboard.writeText(txt);
      el("btn-copy-reflection").textContent = "Copied!";
      setTimeout(() => (el("btn-copy-reflection").textContent = "Copy reflection"), 900);
    } catch {}
  };

  // next
  el("btn-next").onclick = () => {
    const ending = computeEnding();
    if (ending) return showEnding(ending);

    const nextId = choice.next || node.next || null;
    if (!nextId){
      // if scenario ends early, still compute ending-like summary
      return showEnding({ title: "Scenario complete", summary: "The scenario ended without a next node. Add a next id in the JSON to continue." });
    }

    const nextNode = getNode(nextId);
    if (!nextNode){
      return showEnding({ title: "Missing next node", summary: "The scenario referenced a node that does not exist in the JSON." });
    }

    state.nodeId = nextId;
    showNode(nextNode);
  };

  reveal.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset(){
  state = {
    nodeId: "start",
    turn: 0,
    year: 1763,
    unity: 50,
    support: 50,
    pressure: 50,
    strain: 50,
    radicalization: 50,
    log: []
  };

  el("historyPanel").hidden = true;
  el("btn-history").setAttribute("aria-expanded","false");
  el("historyPanel").innerHTML = "";

  updateHUD();

  const startNode = getNode("start");
  if (!startNode){
    el("nodeTitle").textContent = "Scenario error";
    el("nodePrompt").textContent = "Missing 'start' node in scenario JSON.";
    return;
  }
  showNode(startNode);
}

function wireUI(){
  el("btn-restart").addEventListener("click", reset);
  el("btn-restart-2").addEventListener("click", reset);

  el("btn-how").addEventListener("click", () => {
    const panel = el("how-panel");
    const expanded = el("btn-how").getAttribute("aria-expanded") === "true";
    el("btn-how").setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });

  el("btn-history").addEventListener("click", () => {
    const panel = el("historyPanel");
    const expanded = el("btn-history").getAttribute("aria-expanded") === "true";
    el("btn-history").setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
    if (!expanded) renderHistory();
  });
}

(async function init(){
  try{
    scenario = await loadScenario();
    wireUI();
    reset();
  } catch (e){
    console.error(e);
    el("nodeTitle").textContent = "Load failed";
    el("nodePrompt").textContent = "Could not load scenario JSON. Check that the file path is correct.";
  }
})();
