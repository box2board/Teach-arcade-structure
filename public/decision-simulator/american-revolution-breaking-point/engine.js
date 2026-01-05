// /public/decision-simulator/american-revolution-breaking-point/engine.js
// Goal: No outcomes shown BEFORE choice. Reveal deltas + explanation AFTER choice.

const SCENARIO_URL = "./scenarios/american-revolution.json";

let scenario = null;

let state = {
  year: 1763,
  turn: 1,
  nodeId: null,
  metrics: {},   // metricKey -> number (0..100)
  history: []    // stack of previous states for Back button
};

const ORDERED_METRICS = [
  "colonialUnity",
  "publicSupport",
  "britishPressure",
  "economicStrain",
  "radicalization"
];

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function deepCopy(obj){ return JSON.parse(JSON.stringify(obj)); }

function $(id){ return document.getElementById(id); }

function prettyMetricName(key){
  return scenario.metrics[key]?.label || key;
}

function metricColor(key){
  // For bars; keep consistent and neutral
  switch(key){
    case "publicSupport": return "rgba(34,197,94,.75)";
    case "colonialUnity": return "rgba(96,165,250,.75)";
    case "britishPressure": return "rgba(248,113,113,.75)";
    case "economicStrain": return "rgba(253,230,138,.75)";
    case "radicalization": return "rgba(167,139,250,.75)";
    default: return "rgba(96,165,250,.75)";
  }
}

function renderMeters(){
  const meters = $("meters");
  meters.innerHTML = "";

  ORDERED_METRICS.forEach(key => {
    const def = scenario.metrics[key];
    const val = state.metrics[key];

    const meter = document.createElement("div");
    meter.className = "meter";
    meter.innerHTML = `
      <div class="meter-top">
        <div class="meter-name">${def.label}</div>
        <div class="meter-val">${val}</div>
      </div>
      <div class="bar" aria-label="${def.label} meter">
        <div class="fill" style="width:${val}%; background:${metricColor(key)};"></div>
      </div>
    `;
    meters.appendChild(meter);
  });

  $("year").textContent = String(state.year);
}

function renderIntel(list){
  const ul = $("intel");
  ul.innerHTML = "";
  if (!list || !list.length) return;

  list.forEach(item => {
    const li = document.createElement("li");
    // item can be string or {label,text}
    if (typeof item === "string"){
      li.textContent = item;
    } else {
      li.innerHTML = `<strong>${item.label}:</strong> ${item.text}`;
    }
    ul.appendChild(li);
  });
}

function renderChoices(node){
  const mount = $("choices");
  mount.innerHTML = "";

  node.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";

    // IMPORTANT: No effects shown here.
    const tagsHTML = (choice.tags && choice.tags.length)
      ? `<div class="tags">${choice.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>`
      : "";

    btn.innerHTML = `
      <h3>${choice.title}</h3>
      <p>${choice.description}</p>
      ${tagsHTML}
    `;

    btn.addEventListener("click", () => onChoose(node, choice));
    mount.appendChild(btn);
  });
}

function renderOutcome(outcome){
  const mount = $("outcomeMount");
  if (!outcome){
    mount.innerHTML = "";
    return;
  }

  const pills = Object.entries(outcome.effects || {}).map(([k, v]) => {
    const cls = v > 0 ? "pos" : (v < 0 ? "neg" : "");
    const sign = v > 0 ? "+" : "";
    return `<span class="pill ${cls}">${prettyMetricName(k)} ${sign}${v}</span>`;
  }).join("");

  const quoteHTML = outcome.primarySourceQuote
    ? `
      <div class="quote">
        “${outcome.primarySourceQuote.text}”
        <span class="qsrc">${outcome.primarySourceQuote.source}</span>
      </div>
    ` : "";

  const reflectionHTML = outcome.reflectionPrompt
    ? `<p style="margin-top:10px;"><strong>Reflect:</strong> ${outcome.reflectionPrompt}</p>`
    : "";

  mount.innerHTML = `
    <div class="outcome" role="status" aria-live="polite">
      <h3>Outcome Revealed</h3>
      <p>${outcome.outcomeText}</p>

      <div class="pill-row" aria-label="Outcome changes">
        ${pills}
      </div>

      <p><strong>Historian’s Note:</strong> ${outcome.historianNote}</p>

      ${quoteHTML}
      ${reflectionHTML}
    </div>
  `;
  mount.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setTurnInfo(){
  $("turn-info").textContent = `Turn ${state.turn}`;
}

function setPrompt(node){
  $("prompt").textContent = node.prompt;
  $("context").textContent = node.context || "";
}

function enableBack(){
  const b = $("btn-back");
  b.disabled = state.history.length === 0;
}

function findNode(id){
  return scenario.nodes.find(n => n.id === id);
}

function checkForEnding(){
  // Optional: endings can be node.type === "ending" or scenario.endings thresholds
  const node = findNode(state.nodeId);
  if (!node) return null;

  if (node.type === "ending"){
    return {
      title: node.endingTitle || "Ending",
      text: node.endingText || "",
      historian: node.historianNote || "",
      quote: node.primarySourceQuote || null
    };
  }

  return null;
}

function renderEnding(ending){
  const mount = $("choices");
  mount.innerHTML = "";

  const mountOutcome = $("outcomeMount");
  const quoteHTML = ending.quote
    ? `
      <div class="quote">
        “${ending.quote.text}”
        <span class="qsrc">${ending.quote.source}</span>
      </div>
    ` : "";

  mountOutcome.innerHTML = `
    <div class="outcome" role="status" aria-live="polite">
      <h3>${ending.title}</h3>
      <p>${ending.text}</p>
      <p><strong>Historian’s Note:</strong> ${ending.historian}</p>
      ${quoteHTML}
      <p style="margin-top:10px;"><strong>Teacher idea:</strong> Have students write a short paragraph arguing whether this ending was plausible—and what would have to change in history for it to occur.</p>
    </div>
  `;

  // Disable Back? Keep Back enabled so they can explore.
  enableBack();
}

function onChoose(node, choice){
  // Save snapshot for Back button
  state.history.push(deepCopy(state));
  state.turn += 1;

  // Apply effects
  const effects = choice.effects || {};
  Object.keys(effects).forEach(key => {
    const def = scenario.metrics[key];
    if (!def) return;
    const nextVal = clamp(state.metrics[key] + effects[key], def.min, def.max);
    state.metrics[key] = nextVal;
  });

  // Advance year if defined
  if (typeof choice.yearAdvance === "number"){
    state.year += choice.yearAdvance;
  } else if (typeof node.yearAdvance === "number"){
    state.year += node.yearAdvance;
  }

  // Build outcome payload (revealed AFTER)
  const outcome = {
    effects,
    outcomeText: choice.outcomeText || "Consequences ripple outward.",
    historianNote: choice.historianNote || "History often shifts through unintended consequences and competing incentives.",
    primarySourceQuote: choice.primarySourceQuote || null,
    reflectionPrompt: choice.reflectionPrompt || "Which tradeoff did you accept, and why?"
  };

  // Move to next node
  if (choice.next){
    state.nodeId = choice.next;
  }

  // Re-render
  setTurnInfo();
  renderMeters();
  const nextNode = findNode(state.nodeId);

  // If next node is ending, show ending with debrief
  const ending = checkForEnding();
  if (ending){
    setPrompt(nextNode);
    renderIntel(nextNode.intel || []);
    renderOutcome(outcome); // still show last decision outcome
    renderEnding(ending);
    return;
  }

  setPrompt(nextNode);
  renderIntel(nextNode.intel || []);
  renderChoices(nextNode);

  // Reveal the outcome panel (numbers only AFTER click)
  renderOutcome(outcome);

  enableBack();
}

function goBack(){
  if (!state.history.length) return;
  state = state.history.pop();
  const node = findNode(state.nodeId);

  setTurnInfo();
  renderMeters();
  setPrompt(node);
  renderIntel(node.intel || []);
  renderChoices(node);

  // Clear outcome on back (so they can't just fish for deltas)
  renderOutcome(null);

  enableBack();
}

function restart(){
  initScenario(scenario);
}

function initScenario(data){
  scenario = data;

  // Initialize state from scenario
  state = {
    year: scenario.start.year,
    turn: 1,
    nodeId: scenario.start.nodeId,
    metrics: {},
    history: []
  };

  // Set starting metrics
  ORDERED_METRICS.forEach(k => {
    const def = scenario.metrics[k];
    state.metrics[k] = clamp(scenario.start.metrics[k], def.min, def.max);
  });

  $("sim-title").textContent = scenario.title;
  $("sim-subtitle").textContent = scenario.subtitle;

  const node = findNode(state.nodeId);

  setTurnInfo();
  renderMeters();
  setPrompt(node);
  renderIntel(node.intel || []);
  renderChoices(node);
  renderOutcome(null);
  enableBack();

  $("btn-back").onclick = goBack;
  $("btn-restart").onclick = restart;
}

async function boot(){
  try{
    const r = await fetch(SCENARIO_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`Scenario fetch failed: ${r.status}`);
    const data = await r.json();
    initScenario(data);
  }catch(err){
    console.error(err);
    $("prompt").textContent = "Could not load the simulator scenario.";
    $("context").textContent = "Check that the scenario JSON exists at ./scenarios/american-revolution.json";
  }
}

boot();
