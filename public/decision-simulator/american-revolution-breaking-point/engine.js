const SCENARIO_URL = "./scenarios/american-revolution.json";

const $ = (id) => document.getElementById(id);

const ui = {
  start: $("screenStart"),
  game: $("screenGame"),
  end: $("screenEnd"),

  btnStart: $("btnStart"),
  btnReset: $("btnReset"),
  btnReplay: $("btnReplay"),
  btnHow: $("btnHow"),
  btnCloseHow: $("btnCloseHow"),

  chkGuided: $("chkGuided"),

  turnNum: $("turnNum"),
  turnTotal: $("turnTotal"),
  eraYear: $("eraYear"),
  eraTitle: $("eraTitle"),

  statsList: $("statsList"),
  constraintBox: $("constraintBox"),

  contextText: $("contextText"),
  signalsRow: $("signalsRow"),
  choicesList: $("choicesList"),

  // outcome modal
  backdrop: $("modalBackdrop"),
  modalHow: $("modalHow"),
  modalOutcome: $("modalOutcome"),
  modalPause: $("modalPause"),
  outcomeText: $("outcomeText"),
  outcomeDeltas: $("outcomeDeltas"),
  sourceNote: $("sourceNote"),
  btnContinue: $("btnContinue"),

  // pause
  btnPause: $("btnPause"),
  btnResume: $("btnResume"),
  btnQuit: $("btnQuit"),

  // end
  endingHeadline: $("endingHeadline"),
  endingBody: $("endingBody"),
  priorityList: $("priorityList"),
  reflectionList: $("reflectionList"),
  btnCopyEnd: $("btnCopyEnd"),

  btnCopyReflection: $("btnCopyReflection")
};

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }
function openModal(modal){
  show(ui.backdrop);
  show(modal);
}
function closeModal(modal){
  hide(modal);
  hide(ui.backdrop);
}

// Game state
let scenario = null;
let guided = true;
let turnIndex = 0;
let stats = {};
let history = []; // {turn, year, title, choiceId, choiceLabel, effects}
let choicesMade = {}; // key: choiceId count
let paused = false;

async function loadScenario(){
  const r = await fetch(SCENARIO_URL, { cache: "no-store" });
  if(!r.ok) throw new Error("Failed to load scenario JSON");
  scenario = await r.json();
}

function initRun(){
  guided = !!ui.chkGuided.checked;
  turnIndex = 0;
  paused = false;
  history = [];
  choicesMade = {};

  stats = {};
  for(const s of scenario.stats){
    stats[s.key] = s.start;
  }

  ui.turnTotal.textContent = String(scenario.turns.length);
}

function renderConstraints(){
  const lines = scenario.constraints.map((c) => `• ${c}`).join("<br/>");
  ui.constraintBox.innerHTML = `<strong>Constraints</strong><br/><br/>${lines}`;
}

function renderStats(){
  ui.statsList.innerHTML = "";
  for(const s of scenario.stats){
    const val = stats[s.key];
    const statEl = document.createElement("div");
    statEl.className = "stat";
    statEl.innerHTML = `
      <div class="stat-top">
        <div class="stat-name">${escapeHtml(s.name)}</div>
        <div class="stat-val">${val}</div>
      </div>
      <div class="bar" aria-hidden="true">
        <div class="fill" style="width:${val}%"></div>
      </div>
    `;
    ui.statsList.appendChild(statEl);
  }
}

function renderTurn(){
  const t = scenario.turns[turnIndex];
  ui.turnNum.textContent = String(turnIndex + 1);
  ui.eraYear.textContent = String(t.year);
  ui.eraTitle.textContent = t.title;
  ui.contextText.textContent = t.context;

  // signals
  ui.signalsRow.innerHTML = "";
  (t.signals || []).forEach((sig) => {
    const el = document.createElement("span");
    el.className = "signal";
    el.textContent = sig;
    ui.signalsRow.appendChild(el);
  });

  // choices
  ui.choicesList.innerHTML = "";
  t.choices.forEach((c) => {
    const choice = document.createElement("div");
    choice.className = "choice";
    choice.setAttribute("role", "listitem");
    choice.tabIndex = 0;

    const tagsHtml = (c.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const effectsHtml = guided ? renderEffectsPills(c.effects) : "";

    choice.innerHTML = `
      <div class="choice-top">
        <h3 class="choice-title">${escapeHtml(c.label)}</h3>
        <div class="choice-tags">${tagsHtml}</div>
      </div>
      <p class="choice-body">${escapeHtml(c.description || "")}</p>
      ${guided ? `<div class="choice-effects" aria-label="Likely effects">${effectsHtml}</div>` : ""}
    `;

    const activate = () => selectChoice(c);
    choice.addEventListener("click", activate);
    choice.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        activate();
      }
    });

    ui.choicesList.appendChild(choice);
  });

  renderStats();
}

function renderEffectsPills(effects){
  const map = scenario.stats.reduce((acc, s) => (acc[s.key]=s.name, acc), {});
  const pills = [];

  for(const key of Object.keys(effects || {})){
    const delta = effects[key];
    if(delta === 0) continue;

    let cls = "warn";
    if(delta > 0) cls = "good";
    if(delta < 0) cls = "bad";

    const sign = delta > 0 ? "+" : "";
    pills.push(`<span class="effect ${cls}">${escapeHtml(map[key] || key)} ${sign}${delta}</span>`);
  }

  if(pills.length === 0) return `<span class="effect warn">No immediate change</span>`;
  return pills.join("");
}

function selectChoice(choice){
  if(paused) return;

  const t = scenario.turns[turnIndex];

  // apply effects
  const deltas = [];
  for(const key of Object.keys(choice.effects || {})){
    const before = stats[key];
    const delta = choice.effects[key];
    const after = clamp(before + delta);
    stats[key] = after;
    deltas.push({ key, delta });
  }

  // record
  history.push({
    turn: turnIndex + 1,
    year: t.year,
    title: t.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    effects: choice.effects || {}
  });
  choicesMade[choice.id] = (choicesMade[choice.id] || 0) + 1;

  // outcome modal
  ui.outcomeText.textContent = choice.outcome || "Your decision changes the situation.";
  ui.sourceNote.textContent = choice.sourceNote ? `Historical grounding: ${choice.sourceNote}` : "";

  ui.outcomeDeltas.innerHTML = renderEffectsPills(choice.effects || {});
  openModal(ui.modalOutcome);
}

function continueAfterOutcome(){
  closeModal(ui.modalOutcome);

  // next turn or end
  turnIndex++;
  if(turnIndex >= scenario.turns.length){
    endRun();
  } else {
    renderTurn();
  }
}

function endRun(){
  hide(ui.game);
  show(ui.end);

  // pick ending
  const ending = pickEnding();

  ui.endingHeadline.textContent = ending.headline;
  ui.endingBody.textContent = ending.body;

  // priorities: infer from net changes vs starting
  const priorities = derivePriorities();
  ui.priorityList.innerHTML = "";
  priorities.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    ui.priorityList.appendChild(li);
  });

  // reflection
  ui.reflectionList.innerHTML = "";
  (ending.reflection || []).forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    ui.reflectionList.appendChild(li);
  });
}

function pickEnding(){
  // check endings in order provided; first match wins
  for(const e of scenario.endings || []){
    if(matchesCondition(e.condition)) return e;
  }
  return scenario.defaultEnding;
}

function matchesCondition(cond){
  if(!cond) return false;

  // cond supports: unityMin, unityMax, supportMin, supportMax, pressureMin, pressureMax, strainMin/Max, radMin/Max
  const keys = ["unity","support","pressure","strain","rad"];
  for(const k of keys){
    const minKey = `${k}Min`;
    const maxKey = `${k}Max`;
    if(cond[minKey] != null && stats[k] < cond[minKey]) return false;
    if(cond[maxKey] != null && stats[k] > cond[maxKey]) return false;
  }
  return true;
}

function derivePriorities(){
  const startMap = scenario.stats.reduce((acc,s)=>(acc[s.key]=s.start, acc), {});
  const diffs = scenario.stats.map((s) => ({
    key: s.key,
    name: s.name,
    diff: stats[s.key] - startMap[s.key]
  }));

  // top 2 positive and 1 negative (if any)
  const positives = [...diffs].sort((a,b)=> b.diff - a.diff).filter(d=> d.diff > 0);
  const negatives = [...diffs].sort((a,b)=> a.diff - b.diff).filter(d=> d.diff < 0);

  const lines = [];

  if(positives[0]) lines.push(`You increased ${positives[0].name} the most (${formatDiff(positives[0].diff)}).`);
  if(positives[1]) lines.push(`You also emphasized ${positives[1].name} (${formatDiff(positives[1].diff)}).`);
  if(negatives[0]) lines.push(`Your biggest cost was ${negatives[0].name} (${formatDiff(negatives[0].diff)}).`);

  if(lines.length === 0){
    lines.push("Your choices balanced the variables with minimal net change.");
  }
  return lines;
}

function formatDiff(n){
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function copyReflectionFromScenario(){
  const base = [
    "Reflection Prompts — American Revolution: The Breaking Point",
    "",
    "1) What variable did you prioritize most (Unity, Support, British Pressure, Economic Strain, Radicalization)? Why?",
    "2) Which decision created the biggest unintended consequence?",
    "3) Where did you choose legitimacy over speed—or speed over legitimacy?",
    "4) If you replayed, what would you change and what outcome do you predict?"
  ];
  navigator.clipboard?.writeText(base.join("\n"));
}

function copyReflectionFromEnd(){
  const items = Array.from(ui.reflectionList.querySelectorAll("li")).map(li => li.textContent);
  const text = ["Reflection Prompts — Your Run", "", ...items.map((q,i)=>`${i+1}) ${q}`)].join("\n");
  navigator.clipboard?.writeText(text);
}

function resetToStart(){
  closeModal(ui.modalOutcome);
  closeModal(ui.modalHow);
  closeModal(ui.modalPause);

  hide(ui.end);
  hide(ui.game);
  show(ui.start);
}

function startGame(){
  initRun();
  renderConstraints();

  hide(ui.start);
  hide(ui.end);
  show(ui.game);

  renderTurn();
}

// Pause controls
function pauseGame(){
  paused = true;
  openModal(ui.modalPause);
}
function resumeGame(){
  paused = false;
  closeModal(ui.modalPause);
}
function quitToStart(){
  paused = false;
  closeModal(ui.modalPause);
  resetToStart();
}

function wireUI(){
  ui.btnHow.addEventListener("click", () => openModal(ui.modalHow));
  ui.btnCloseHow.addEventListener("click", () => closeModal(ui.modalHow));

  ui.btnStart.addEventListener("click", startGame);
  ui.btnReset.addEventListener("click", resetToStart);
  ui.btnReplay?.addEventListener("click", () => { resetToStart(); startGame(); });

  ui.btnContinue.addEventListener("click", continueAfterOutcome);

  ui.btnPause.addEventListener("click", pauseGame);
  ui.btnResume.addEventListener("click", resumeGame);
  ui.btnQuit.addEventListener("click", quitToStart);

  ui.btnCopyReflection.addEventListener("click", copyReflectionFromScenario);
  ui.btnCopyEnd.addEventListener("click", copyReflectionFromEnd);

  // close modal by clicking backdrop
  ui.backdrop.addEventListener("click", () => {
    [ui.modalHow, ui.modalOutcome, ui.modalPause].forEach(m => {
      if(!m.classList.contains("hidden")) closeModal(m);
    });
    paused = false; // only matters if pause modal closed
  });

  // keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      // close any modal
      [ui.modalHow, ui.modalOutcome, ui.modalPause].forEach(m => {
        if(!m.classList.contains("hidden")) closeModal(m);
      });
      paused = false;
    }
    if(e.key.toLowerCase() === "p"){
      if(!ui.game.classList.contains("hidden")){
        if(paused) resumeGame();
        else pauseGame();
      }
    }
  });
}

(async function boot(){
  await loadScenario();
  wireUI();
})();
