const SETTINGS_KEY = "taCareerQuestSettings";
const RUN_KEY = "taCareerQuestRun";

const defaultSettings = {
  difficulty: "normal",
  costOfLiving: "average",
  randomEvents: true,
  allowOverride: true,
  allowReplay: true,
  careerClusters: [],
  enabledCareers: [],
};

const quizQuestions = [
  {
    q: "I enjoy explaining ideas and helping a group reach a decision.",
    map: { communication: 3, leadership: 2, creativity: 2 },
  },
  {
    q: "You are strongest when deadlines are tight.",
    map: { timeManagement: 3, adaptability: 2, professionalism: 1 },
  },
  {
    q: "You enjoy solving technical problems.",
    map: { techLiteracy: 3, problemSolving: 3 },
  },
  {
    q: "You prefer helping teams stay coordinated.",
    map: { teamwork: 3, communication: 2 },
  },
  {
    q: "You like planning budgets and comparing options.",
    map: { financialLiteracy: 3, problemSolving: 2 },
  },
  {
    q: "You stay calm in changing situations.",
    map: { adaptability: 3, professionalism: 2 },
  },
  {
    q: "You are comfortable presenting to groups.",
    map: { communication: 3, leadership: 2 },
  },
  {
    q: "You like designing something from scratch.",
    map: { creativity: 3, problemSolving: 2 },
  },
  {
    q: "You notice process issues others miss.",
    map: { professionalism: 2, timeManagement: 2, problemSolving: 2 },
  },
  {
    q: "You like coaching peers to improve.",
    map: { teamwork: 2, leadership: 3, communication: 1 },
  },
];

const educationPaths = {
  workforce: {
    label: "Workforce entry model",
    debt: 1000,
    salaryMod: 0.9,
    stress: 8,
    skill: { professionalism: 4, timeManagement: 3 },
  },
  trade: {
    label: "Certificate / trade model",
    debt: 9000,
    salaryMod: 1.0,
    stress: 10,
    skill: { techLiteracy: 4, problemSolving: 2 },
  },
  cc: {
    label: "Two-year study model",
    debt: 15000,
    salaryMod: 1.02,
    stress: 12,
    skill: { communication: 2, teamwork: 2, financialLiteracy: 3 },
  },
  college: {
    label: "Four-year study model",
    debt: 36000,
    salaryMod: 1.1,
    stress: 18,
    skill: { communication: 3, leadership: 2 },
  },
  grad: {
    label: "Graduate study model",
    debt: 62000,
    salaryMod: 1.18,
    stress: 24,
    skill: { professionalism: 2, leadership: 3, problemSolving: 3 },
  },
};

const memoryStore = {};
const storage = {
  available: (() => {
    try {
      localStorage.setItem("__tacq", "1");
      localStorage.removeItem("__tacq");
      return true;
    } catch {
      return false;
    }
  })(),
  get(key) {
    try {
      return this.available
        ? JSON.parse(localStorage.getItem(key) || "null")
        : memoryStore[key] || null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    memoryStore[key] = value;
    try {
      if (this.available) localStorage.setItem(key, JSON.stringify(value));
    } catch {
      this.available = false;
      showStorageWarning();
    }
  },
  remove(key) {
    delete memoryStore[key];
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
const state = { careers: [], scenarios: {}, settings: null, run: null };
const labels = {
  cash: "Cash",
  debt: "Debt",
  netWorth: "Net worth",
  happiness: "Well-being",
  stress: "Stress",
  workLife: "Life balance",
  performance: "Work performance",
  communication: "Communication",
  teamwork: "Teamwork",
  problemSolving: "Problem solving",
  leadership: "Leadership",
  techLiteracy: "Technology",
  financialLiteracy: "Financial literacy",
  timeManagement: "Time management",
  adaptability: "Adaptability",
  professionalism: "Professionalism",
  creativity: "Creativity",
};
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const career = () => state.careers.find((c) => c.id === state.run?.careerId);
const settings = () => state.run?.settings || state.settings;
const screen = () => document.getElementById("screen");
const baseSkills = () =>
  Object.fromEntries(
    [
      "communication",
      "teamwork",
      "problemSolving",
      "leadership",
      "techLiteracy",
      "financialLiteracy",
      "timeManagement",
      "adaptability",
      "professionalism",
      "creativity",
    ].map((k) => [k, 20]),
  );
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
function showStorageWarning() {
  const el = document.getElementById("storage-warning");
  el.hidden = false;
  el.textContent =
    "Device saving is unavailable. Keep this tab open; progress will be lost when you leave.";
}
async function init() {
  const paths = [
    "careers",
    "scenarios-core",
    "scenarios-workplace",
    "scenarios-money",
  ];
  const data = await Promise.all(
    paths.map(async (p) => {
      const r = await fetch(`./data/${p}.json`);
      if (!r.ok) throw new Error("Activity data could not load.");
      return r.json();
    }),
  );
  state.careers = data[0];
  state.scenarios = { core: data[1], workplace: data[2], money: data[3] };
  const saved = storage.get(SETTINGS_KEY) || {};
  state.settings = { ...defaultSettings, ...saved };
  if (!Array.isArray(saved.careerClusters))
    state.settings.careerClusters = [
      ...new Set(state.careers.map((c) => c.cluster)),
    ];
  if (!Array.isArray(saved.enabledCareers))
    state.settings.enabledCareers = state.careers.map((c) => c.id);
  migrateCatalogSettings(state.settings);
  storage.set(SETTINGS_KEY, state.settings);
  renderSettings();
  document
    .getElementById("start-run")
    .addEventListener("click", () => startRun());
  document
    .getElementById("continue-run")
    .addEventListener("click", continueRun);
  document.getElementById("reset-run").addEventListener("click", resetRun);
  if (!storage.available) showStorageWarning();
  updateControls();
  renderIntro();
}
function selectField(id, label, options, value) {
  return `<div class="cq-field"><label for="${id}">${label}</label><select id="${id}">${options.map((o) => `<option value="${o}" ${o === value ? "selected" : ""}>${o[0].toUpperCase() + o.slice(1)}</option>`).join("")}</select></div>`;
}
function toggleField(id, label, value) {
  return `<div class="cq-field"><label for="${id}">${label}</label><select id="${id}"><option value="true" ${value ? "selected" : ""}>On</option><option value="false" ${!value ? "selected" : ""}>Off</option></select></div>`;
}
function checkbox(type, value, checked, label = value) {
  return `<label><input type="checkbox" data-type="${type}" value="${esc(value)}" ${checked ? "checked" : ""}>${esc(label)}</label>`;
}
function renderSettings() {
  const form = document.getElementById("settings-form"),
    s = state.settings;
  form.innerHTML = `${selectField("difficulty", "Decision impact", ["easy", "normal", "hard"], s.difficulty)}${selectField("costOfLiving", "Living costs", ["low", "average", "high"], s.costOfLiving)}${toggleField("randomEvents", "Optional life events", s.randomEvents)}${toggleField("allowOverride", "Explore beyond recommendations", s.allowOverride)}${toggleField("allowReplay", "Allow replay after completion", s.allowReplay)}<div class="cq-field"><label>Career clusters</label><div class="cq-checkboxes">${[...new Set(state.careers.map((c) => c.cluster))].map((c) => checkbox("cluster", c, s.careerClusters.includes(c))).join("")}</div></div><div class="cq-field"><label>Careers</label><div class="cq-checkboxes">${state.careers.map((c) => checkbox("career", c.id, s.enabledCareers.includes(c.id), c.title)).join("")}</div></div>`;
  form.insertAdjacentHTML(
    "beforeend",
    '<p id="settings-status" class="cq-help" role="status"></p>',
  );
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("change", () => {
    for (const k of ["difficulty", "costOfLiving"])
      s[k] = document.getElementById(k).value;
    for (const k of ["randomEvents", "allowOverride", "allowReplay"])
      s[k] = document.getElementById(k).value === "true";
    s.careerClusters = [
      ...form.querySelectorAll("[data-type=cluster]:checked"),
    ].map((e) => e.value);
    s.enabledCareers = [
      ...form.querySelectorAll("[data-type=career]:checked"),
    ].map((e) => e.value);
    storage.set(SETTINGS_KEY, s);
    updateControls();
  });
}
function filteredCareers(s = settings()) {
  return state.careers.filter(
    (c) =>
      s.careerClusters.includes(c.cluster) && s.enabledCareers.includes(c.id),
  );
}
function updateControls() {
  const saved = storage.get(RUN_KEY),
    run = state.run || saved;
  const blocked =
    run?.version === 2 && run.phase === "report" && !run.settings.allowReplay;
  document.getElementById("start-run").disabled =
    blocked || !filteredCareers(state.settings).length;
  const launch = document.getElementById("launch-start");
  if (launch) launch.disabled = document.getElementById("start-run").disabled;
  const status = document.getElementById("settings-status");
  if (status)
    status.textContent = filteredCareers(state.settings).length
      ? "Changes apply to the next journey."
      : "Select at least one career and its cluster to enable a new journey.";
  document.getElementById("continue-run").disabled = !saved;
  document.getElementById("reset-run").disabled = !saved && !state.run;
}
function persistRun() {
  storage.set(RUN_KEY, state.run);
  updateControls();
}
function startRun() {
  if (state.run?.phase === "report" && !state.run.settings.allowReplay) return;
  const saved = storage.get(RUN_KEY);
  if (
    saved?.version === 2 &&
    saved.phase === "report" &&
    !saved.settings.allowReplay
  )
    return;
  if (
    saved &&
    saved.phase !== "report" &&
    !confirm("Start over? This replaces the journey saved on this device.")
  )
    return;
  if (!filteredCareers(state.settings).length) return;
  state.run = {
    version: 2,
    phase: "quiz",
    year: 1,
    stepInYear: 0,
    cardsPlayed: 0,
    quizIndex: 0,
    quizScores: baseSkills(),
    settings: JSON.parse(JSON.stringify(state.settings)),
    careerId: null,
    educationKey: null,
    stats: {
      cash: 2000,
      debt: 0,
      netWorth: 2000,
      happiness: 60,
      stress: 40,
      workLife: 55,
      performance: 50,
      skills: baseSkills(),
    },
    history: [],
    yearLedgers: [],
    reflections: [],
  };
  document.getElementById("teacher-settings").open = false;
  persistRun();
  renderByPhase();
}
function continueRun() {
  const saved = storage.get(RUN_KEY);
  if (!saved) return;
  if (saved.version !== 2) {
    setScreen(
      `<div class="cq-card"><h2>This saved journey uses the previous version</h2><p>Your previous save has been kept. The new five-year model needs a fresh journey. Choose Start new journey when you are ready.</p></div>`,
      "discover",
    );
    return;
  }
  state.run = saved;
  migrateCatalogSettings(state.run.settings);
  persistRun();
  document.getElementById("teacher-settings").open = false;
  renderByPhase();
}
function resetRun() {
  if (!confirm("Clear the journey saved on this device?")) return;
  storage.remove(RUN_KEY);
  state.run = null;
  updateControls();
  renderIntro();
}
function setScreen(html, stage) {
  const stages = ["discover", "explore", "plan", "live", "reflect"],
    active = stages.indexOf(stage);
  document.getElementById("journey-progress").innerHTML = stages
    .map(
      (s, i) =>
        `<span class="cq-step ${i < active ? "done" : ""}" ${i === active ? 'aria-current="step"' : ""}>${i < active ? "✓" : i + 1} ${s[0].toUpperCase() + s.slice(1)}</span>`,
    )
    .join("");
  screen().innerHTML = html;
  if (state.run) {
    screen().focus({ preventScroll: true });
    screen().scrollIntoView({ block: "start", behavior: "instant" });
  }
}
function renderIntro() {
  const cityArt = `<div class="cq-launch-art" aria-hidden="true"><svg viewBox="0 0 520 340" fill="none"><circle cx="278" cy="160" r="145" fill="#436bc1" opacity=".45"/><circle cx="278" cy="160" r="112" stroke="#a2baf3" stroke-dasharray="5 9" opacity=".4"/><path d="M40 287C120 254 169 325 250 278s150-29 224 8" stroke="#9dc5f5" stroke-width="30" opacity=".18"/><path d="M43 287C120 254 169 325 250 278s150-29 224 8" stroke="#e3edff" stroke-width="2" stroke-dasharray="8 10"/><rect x="91" y="151" width="86" height="114" rx="8" fill="#71cbc0"/><path d="M108 164h12v17h-12zm30 0h12v17h-12zm-30 30h12v17h-12zm30 0h12v17h-12z" fill="#d6f5eb"/><rect x="119" y="230" width="29" height="35" rx="4" fill="#215c75"/><rect x="196" y="103" width="108" height="164" rx="8" fill="#e9efff"/><path d="M217 126h17v22h-17zm36 0h17v22h-17zm-36 40h17v22h-17zm36 0h17v22h-17z" fill="#7495dd"/><rect x="234" y="223" width="34" height="44" rx="4" fill="#315baf"/><path d="M250 77l24 15h-48z" fill="#f8cc64"/><path d="M250 78V49l29 9-29 9" stroke="#f8cc64" stroke-width="4" stroke-linejoin="round"/><rect x="329" y="169" width="100" height="96" rx="8" fill="#f2b870"/><path d="M337 169l42-32 42 32z" fill="#ed8e63"/><rect x="348" y="195" width="23" height="23" rx="3" fill="#fff2d1"/><rect x="387" y="195" width="23" height="23" rx="3" fill="#fff2d1"/><path d="M92 267h348" stroke="#172e61" stroke-width="6" stroke-linecap="round"/><rect x="50" y="67" width="131" height="57" rx="13" fill="#fff" transform="rotate(-7 50 67)"/><path d="M68 80h20v20H68zM78 75v30m-15-15h30" stroke="#167d70" stroke-width="3"/><text x="102" y="93" fill="#203963" font-family="system-ui,sans-serif" font-size="12" font-weight="700" transform="rotate(-7 102 93)">HEALTHCARE</text><rect x="338" y="72" width="142" height="55" rx="13" fill="#fff" transform="rotate(8 338 72)"/><path d="M356 89l10-4 10 4v10c0 7-10 12-10 12s-10-5-10-12z" stroke="#315ed6" stroke-width="2.5" transform="rotate(8 366 98)"/><text x="386" y="107" fill="#203963" font-family="system-ui,sans-serif" font-size="11" font-weight="700" transform="rotate(8 386 107)">PUBLIC SAFETY</text><circle cx="465" cy="217" r="21" fill="#a2dfbe"/><path d="M465 215v49" stroke="#294c69" stroke-width="4"/><circle cx="63" cy="229" r="25" fill="#7cc5b7"/><path d="M63 224v43" stroke="#294c69" stroke-width="4"/><circle cx="315" cy="42" r="5" fill="#f8cc64"/><path d="M450 143v12m-6-6h12M88 137v10m-5-5h10" stroke="#c4d9ff" stroke-width="2"/></svg><span class="cq-art-caption">A WORLD OF POSSIBILITIES</span></div>`;
  setScreen(
    `<div class="cq-card cq-launch"><div><p class="cq-eyebrow">FIVE YEARS. YOUR DECISIONS.</p><h2>Your future starts<br>with a possibility.</h2><p>From public safety to skilled trades, healthcare to creative work. Explore ${state.careers.length} careers, choose a direction, and discover where your decisions lead.</p><div class="cq-inline-actions"><button class="btn" id="launch-start" ${document.getElementById("start-run").disabled ? "disabled" : ""}>Start my journey →</button></div><p class="cq-small" style="color:#d1def7">About 20–30 minutes · No account needed</p></div>${cityArt}</div><div class="cq-start-features"><div class="cq-start-feature"><span>01 / DISCOVER</span><b>Find a direction</b><p>Ten quick interest prompts and ${state.careers.length} detailed career profiles to explore.</p></div><div class="cq-start-feature"><span>02 / EXPERIENCE</span><b>See the tradeoffs</b><p>Choose your training and budget. Make work, money, and life decisions over five years.</p></div><div class="cq-start-feature"><span>03 / REFLECT</span><b>Explain your story</b><p>Use your decisions and annual budgets to explain what mattered to you.</p></div></div>`,
    "discover",
  );
  document
    .getElementById("launch-start")
    .addEventListener("click", () => startRun());
}
function renderByPhase() {
  const renderers = {
    quiz: renderQuiz,
    career: renderCareerSelection,
    careerDetail: renderCareerDetail,
    education: renderEducationSelection,
    budget: renderBudget,
    scenario: renderScenario,
    feedback: renderFeedback,
    yearSummary: renderYearSummary,
    report: renderReport,
  };
  (renderers[state.run?.phase] || renderIntro)();
}
function renderQuiz() {
  const run = state.run,
    i = run.quizIndex,
    q = quizQuestions[i];
  setScreen(
    `<div class="cq-card cq-quiz"><p class="cq-eyebrow">DISCOVER · ${i + 1} OF ${quizQuestions.length}</p><div class="cq-meter" role="progressbar" aria-label="Interest questions completed" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${i}"><span style="width:${(i / quizQuestions.length) * 100}%"></span></div><h2>${q.q}</h2><p>How much does this sound like you? Think about what you enjoy, not just what you can already do.</p><div class="cq-option-list">${[
      [3, "Very much like me"],
      [2, "Somewhat like me"],
      [1, "A little like me"],
      [0, "Not like me"],
    ]
      .map(
        ([v, t]) => `<button class="cq-option" data-score="${v}">${t}</button>`,
      )
      .join(
        "",
      )}</div><p class="cq-note">These prompts suggest areas to explore. They are not an aptitude test or a prediction of your future.</p></div>`,
    "discover",
  );
  screen()
    .querySelectorAll("[data-score]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        Object.entries(q.map).forEach(
          ([k, v]) => (run.quizScores[k] += v * Number(btn.dataset.score)),
        );
        run.quizIndex++;
        if (run.quizIndex === quizQuestions.length) run.phase = "career";
        persistRun();
        renderByPhase();
      }),
    );
}
function affinityScore(c, q) {
  const entries = Object.entries(c.skillAffinities);
  return (
    entries.reduce((n, [k, v]) => n + (q[k] - 20) * v, 0) /
    entries.reduce((n, [, v]) => n + v, 0)
  );
}
function topSkillsReason(c) {
  return Object.entries(c.skillAffinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => labels[k])
    .join(", ");
}
const careerThemes = {
  "Health Science": ["health", "#0e7668", "#e2f7ef", "Care & recovery"],
  "Information Technology": [
    "tech",
    "#5046b9",
    "#eeeaff",
    "Build the digital world",
  ],
  Business: ["business", "#20549b", "#e7f0ff", "Make things happen"],
  Finance: ["finance", "#995e16", "#fff1d7", "Make numbers matter"],
  Engineering: [
    "engineering",
    "#32628d",
    "#e5f3fc",
    "Design a better solution",
  ],
  "Education & Training": [
    "education",
    "#ab572b",
    "#fff0df",
    "Help someone grow",
  ],
  "Arts, A/V Technology & Communications": [
    "arts",
    "#a33d75",
    "#ffe9f4",
    "Create something new",
  ],
  "Hospitality & Tourism": [
    "hospitality",
    "#b25d18",
    "#fff0db",
    "Create great experiences",
  ],
  "Human Services": ["people", "#6c4b98", "#f0e9fb", "Support your community"],
  "Government & Public Administration": [
    "government",
    "#3e5e82",
    "#e8eff8",
    "Shape your community",
  ],
  "Public Safety & Law": ["safety", "#245cc0", "#e6eeff", "Serve & protect"],
  "Skilled Trades & Construction": [
    "tools",
    "#a14f16",
    "#ffeddb",
    "Build with your hands",
  ],
  "Transportation & Repair": [
    "transport",
    "#345cb1",
    "#e8efff",
    "Keep the world moving",
  ],
  Manufacturing: [
    "engineering",
    "#4c6877",
    "#e8f1f5",
    "Turn ideas into objects",
  ],
  "Agriculture & Animals": [
    "nature",
    "#487c38",
    "#edf5df",
    "Care for living things",
  ],
  "Personal Care": [
    "arts",
    "#a13e62",
    "#ffe8ef",
    "Help people feel their best",
  ],
};
const iconPaths = {
  health: '<path d="M24 12h16v12h12v16H40v12H24V40H12V24h12z"/>',
  tech: '<rect x="10" y="12" width="44" height="32" rx="4"/><path d="M24 53h16M32 44v9M26 22l-7 6 7 6m12-12 7 6-7 6"/>',
  business:
    '<rect x="10" y="21" width="44" height="31" rx="4"/><path d="M23 21v-8h18v8M10 32q22 14 44 0M29 34h6v7h-6z"/>',
  finance:
    '<path d="M12 53h42M17 44V32h8v12m7 0V23h8v21m7 0V12h8v32M14 23l15-10 9 2 14-10"/>',
  engineering:
    '<path d="M12 49l38-38 7 7-38 38zM31 31l6 6M23 39l6 6M39 23l6 6M12 13l10 10M48 47l7 8M14 11l7 2-8 8-2-7z"/>',
  education:
    '<path d="M32 16q-12-9-24-3v36q12-6 24 3 12-9 24-3V13q-12-6-24 3v36M15 23l10 1m-10 9 10 1m14-10 10-1m-10 11 10-1"/>',
  arts: '<path d="M33 9C18 9 8 20 8 33s10 23 23 23c8 0 9-6 4-10-4-4-1-8 5-8h7c13 0 12-20-1-26-4-2-8-3-13-3z"/><circle cx="20" cy="27" r="3"/><circle cx="31" cy="19" r="3"/><circle cx="43" cy="23" r="3"/><path d="M17 39h1"/>',
  hospitality:
    '<path d="M10 40h44M15 38a17 17 0 0134 0M32 17v4M8 48h48M22 55h20"/>',
  people:
    '<circle cx="32" cy="21" r="8"/><path d="M16 52v-5a16 16 0 0132 0v5M10 23a6 6 0 010 12m44-12a6 6 0 010 12M5 50v-5a9 9 0 0110-9m44 14v-5a9 9 0 00-10-9"/>',
  government:
    '<path d="M8 24L32 9l24 15zM12 53h40M8 58h48M17 29v18m15-18v18m15-18v18"/>',
  safety:
    '<path d="M32 7l22 8v17c0 13-22 25-22 25S10 45 10 32V15zM22 31l7 7 15-16"/>',
  tools:
    '<path d="M39 11a13 13 0 00-16 16L9 41a8 8 0 0012 12l15-15a13 13 0 0016-16l-9 9-10-10z"/><path d="M15 46h1"/>',
  transport:
    '<path d="M9 35l5-17h31l6 17M8 35h46v14h-6m-30 0H8M18 49h24M16 35h30M18 25h21"/><circle cx="17" cy="48" r="5"/><circle cx="45" cy="48" r="5"/>',
  nature:
    '<path d="M16 48c-9-23 6-37 36-38 0 28-13 45-36 38zM10 56l31-31M21 44V29m0 9h14"/>',
};
function careerIcon(cluster) {
  const key = (careerThemes[cluster] || careerThemes.Business)[0];
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[key]}</svg>`;
}
function themeStyle(c) {
  const [, accent, tint] = careerThemes[c.cluster] || careerThemes.Business;
  return `--career-accent:${accent};--career-tint:${tint}`;
}
function normalizeSearch(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function careerSearchScore(c, query) {
  const q = normalizeSearch(query);
  if (!q) return 1;
  const title = normalizeSearch(c.title),
    aliases = (c.aliases || []).map(normalizeSearch),
    tokens = normalizeSearch(
      [c.title, c.cluster, ...(c.aliases || [])].join(" "),
    ).split(" ");
  if (title === q) return 100;
  if (aliases.includes(q)) return 90;
  if (title.startsWith(q)) return 80;
  return q
    .split(" ")
    .every((t) =>
      tokens.some(
        (word) =>
          word === t ||
          word.startsWith(t) ||
          (t.endsWith("s") && word === t.slice(0, -1)),
      ),
    )
    ? 50
    : 0;
}
function migrateCatalogSettings(s) {
  if (s.catalogVersion === 3) return s;
  const legacy = state.careers.filter((c) => !c.catalogAdded),
    oldClusters = [...new Set(legacy.map((c) => c.cluster))];
  if (legacy.every((c) => s.enabledCareers.includes(c.id)))
    s.enabledCareers = state.careers.map((c) => c.id);
  if (oldClusters.every((c) => s.careerClusters.includes(c)))
    s.careerClusters = [...new Set(state.careers.map((c) => c.cluster))];
  s.catalogVersion = 3;
  return s;
}
function renderCareerSelection() {
  const ranked = [...filteredCareers()].sort(
    (a, b) =>
      affinityScore(b, state.run.quizScores) -
      affinityScore(a, state.run.quizScores),
  );
  const recommended = ranked.slice(0, 5),
    pool = settings().allowOverride ? ranked : recommended;
  const view =
    state.run.explorer ||
    (state.run.explorer = {
      query: "",
      cluster: "all",
      recommended: false,
      limit: 12,
    });
  setScreen(
    `<div class="cq-card cq-explore"><header class="cq-explore-heading"><div><p class="cq-eyebrow">EXPLORE YOUR POSSIBILITIES</p><h2>Find work that means<br>something to you.</h2><p>Go beyond the job title. Discover the work, the route in, and the life that comes with it.</p></div><div class="cq-library-count"><strong>${pool.length}</strong><span>careers to explore</span><small>${new Set(pool.map((c) => c.cluster)).size} career fields</small></div></header><div class="cq-search-bar"><label class="cq-search-label" for="career-search">Search careers<input id="career-search" type="search" placeholder="Police officer, mechanic, teacher…" value="${esc(view.query)}"></label><label for="career-cluster">Career field<select id="career-cluster"><option value="all">All career fields</option>${[
      ...new Set(pool.map((c) => c.cluster)),
    ]
      .sort()
      .map(
        (c) =>
          `<option value="${esc(c)}" ${c === view.cluster ? "selected" : ""}>${esc(c)}</option>`,
      )
      .join(
        "",
      )}</select></label></div><div class="cq-explore-toolbar"><label class="cq-match-filter"><input id="recommended-only" type="checkbox" ${view.recommended ? "checked" : ""}> My interest matches</label><span id="career-count" role="status" aria-live="polite"></span></div><div class="cq-suggestions" aria-label="Search ideas"><span>Try a direction:</span>${["Police officer", "Electrician", "Nurse", "Teacher", "Mechanic"].map((q) => `<button type="button" data-search="${q}">${q}</button>`).join("")}</div>${settings().allowOverride ? "" : '<p class="cq-note">Teacher setup limits this journey to your five interest recommendations.</p>'}<div id="career-catalog" class="cq-catalog"></div><div class="cq-more"><button class="btn secondary" id="more-careers">Show more careers</button></div><details class="cq-source-note"><summary>About career information & game income</summary><p>Profiles include excerpts from the U.S. Bureau of Labor Statistics Occupational Outlook Handbook, checked October 15, 2026. Some profiles cover a broader related occupation. National median wages include experienced workers and are not starting salaries. Income used in the simulation remains an illustrative game assumption. Check state, employer, and licensing requirements before making real plans.</p></details></div>`,
    "explore",
  );
  function draw() {
    view.query = document.getElementById("career-search").value;
    view.cluster = document.getElementById("career-cluster").value;
    view.recommended = document.getElementById("recommended-only").checked;
    const matches = pool
      .filter(
        (c) =>
          (view.cluster === "all" || c.cluster === view.cluster) &&
          (!view.recommended || recommended.includes(c)) &&
          careerSearchScore(c, view.query),
      )
      .sort(
        (a, b) =>
          careerSearchScore(b, view.query) - careerSearchScore(a, view.query),
      );
    document.getElementById("career-count").textContent =
      `${matches.length} ${matches.length === 1 ? "career" : "careers"} found`;
    document.getElementById("career-catalog").innerHTML =
      matches
        .slice(0, view.limit)
        .map(
          (c) =>
            `<article class="cq-career cq-profile-card" style="${themeStyle(c)}"><div class="cq-career-art">${careerIcon(c.cluster)}<span>${esc((careerThemes[c.cluster] || careerThemes.Business)[3])}</span>${recommended.includes(c) ? '<span class="cq-badge">Interest match</span>' : ""}</div><div class="cq-career-body"><p class="cq-career-field">${esc(c.cluster)}</p><h3>${esc(c.title)}</h3><p class="cq-career-description">${esc(c.summary)}</p><div class="cq-career-route"><span>Typical entry</span><strong>${esc(c.typicalEducation === "See How to Become One" ? "Academy / requirements vary" : c.typicalEducation)}</strong></div><button class="btn secondary" data-career="${c.id}" aria-label="View ${esc(c.title)} career profile">View career profile <span aria-hidden="true">↗</span></button></div></article>`,
        )
        .join("") ||
      `<div class="cq-empty"><h3>No matching careers in this view</h3><p>Try a broader job name, another career field, or clear the search filters. Teacher settings may also limit which careers are available.</p><button class="btn secondary" id="clear-career-filters">Clear search filters</button></div>`;
    document.getElementById("more-careers").hidden =
      matches.length <= view.limit;
    document
      .getElementById("clear-career-filters")
      ?.addEventListener("click", () => {
        document.getElementById("career-search").value = "";
        document.getElementById("career-cluster").value = "all";
        document.getElementById("recommended-only").checked = false;
        view.limit = 12;
        draw();
      });
    screen()
      .querySelectorAll("[data-career]")
      .forEach((btn) =>
        btn.addEventListener("click", () => {
          state.run.previewCareerId = btn.dataset.career;
          state.run.phase = "careerDetail";
          persistRun();
          renderByPhase();
        }),
      );
    persistRun();
  }
  ["career-search", "career-cluster", "recommended-only"].forEach((id) =>
    document
      .getElementById(id)
      .addEventListener(id === "career-search" ? "input" : "change", () => {
        view.limit = 12;
        draw();
      }),
  );
  screen()
    .querySelectorAll("[data-search]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        document.getElementById("career-search").value = btn.dataset.search;
        document.getElementById("career-cluster").value = "all";
        document.getElementById("recommended-only").checked = false;
        view.limit = 12;
        draw();
      }),
    );
  document.getElementById("more-careers").addEventListener("click", () => {
    view.limit += 12;
    draw();
  });
  draw();
}
function renderCareerDetail() {
  const c = state.careers.find((c) => c.id === state.run.previewCareerId);
  if (!c || !filteredCareers().some((x) => x.id === c.id)) {
    state.run.phase = "career";
    return renderCareerSelection();
  }
  const tasks = c.duties?.length ? c.duties : [c.summary];
  setScreen(
    `<article class="cq-card cq-career-detail" style="${themeStyle(c)}"><button class="btn quiet" id="back-catalog">← Back to career explorer</button><header class="cq-detail-hero"><div class="cq-detail-icon">${careerIcon(c.cluster)}</div><div><p class="cq-eyebrow">${esc(c.cluster)}</p><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p></div></header><div class="cq-detail-grid"><div><section class="cq-profile-section"><h3>A day in this field</h3><ul class="cq-duty-list">${tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section><section class="cq-profile-section"><h3>What the work is like</h3><p>${esc(c.workEnvironment)}</p></section><section class="cq-profile-section"><h3>The route in</h3><p>${esc(c.entryRequirements)}</p><p class="cq-small">Requirements vary by state, employer, and specialty. Check the official source and local training or licensing authority.</p></section><section class="cq-profile-section"><h3>Employment outlook</h3><p>${esc(c.outlook)}</p></section></div><aside class="cq-career-facts"><p class="cq-eyebrow">YOUR FIELD NOTES</p><h3>Before you choose</h3><dl><dt>Typical entry-level education</dt><dd>${esc(c.typicalEducation === "See How to Become One" ? "Requirements vary — read the route in" : c.typicalEducation)}</dd><dt>Skills to explore</dt><dd>${topSkillsReason(c)}</dd><dt>National pay context</dt><dd>${esc(c.payContext)}</dd></dl><p class="cq-small">The pay statement describes the BLS occupation profile, not a guaranteed starting offer.</p><div class="cq-research-task"><h4>Think it through</h4><p>Which daily task appeals to you? What work condition could be challenging? Find one local employer or training program to learn more.</p></div><button class="btn" id="choose-career" data-choose-career="${c.id}">Choose this career →</button><p class="cq-small">Next: compare training cost models.</p></aside></div><footer class="cq-profile-source"><strong>Source: U.S. Bureau of Labor Statistics</strong><span>Research profile: ${esc(c.sourceTitle)} · Checked October 15, 2026.</span><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the full official profile ↗</a><small>This research profile may cover several specialties or related roles. The simulation uses simplified income and training costs.</small></footer></article>`,
    "explore",
  );
  document.getElementById("back-catalog").addEventListener("click", () => {
    state.run.phase = "career";
    persistRun();
    renderByPhase();
  });
  document.getElementById("choose-career").addEventListener("click", () => {
    state.run.careerId = c.id;
    state.run.phase = "education";
    persistRun();
    renderByPhase();
  });
}

// Curated simulation pathways replace the old randomly assigned education options.
// These are broad planning models, not promises of eligibility or licensing.
const pathwayGroups = {
  cc: [
    "registered-nurse",
    "physical-therapist-assistant",
    "radiologic-technologist",
    "dental-hygienist",
    "medical-laboratory-technician",
    "civil-engineering-technician",
    "mechanical-designer",
    "electrical-engineering-technician",
  ],
  college: [
    "environmental-engineer",
    "quality-engineer",
    "elementary-teacher",
    "special-education-teacher",
    "substance-abuse-counselor",
    "childcare-director",
    "case-manager",
    "accountant",
    "financial-analyst",
    "social-worker",
    "public-health-inspector",
    "policy-analyst",
  ],
  grad: ["school-counselor", "city-planner", "instructional-designer"],
  trade: ["chef"],
  workforce: [
    "sales-representative",
    "human-resources-assistant",
    "restaurant-supervisor",
    "emergency-dispatcher",
    "travel-advisor",
    "community-outreach-specialist",
    "career-coach",
    "parks-program-coordinator",
  ],
};
function pathsForCareer(c) {
  if (c.modelPaths?.length) return c.modelPaths;
  const group =
    Object.entries(pathwayGroups).find(([, ids]) => ids.includes(c.id))?.[0] ||
    "flexible";
  return {
    cc: ["cc", "college"],
    college: ["college", "grad"],
    grad: ["grad"],
    trade: ["workforce", "trade", "cc"],
    workforce: ["workforce", "cc"],
    flexible: ["cc", "college"],
  }[group];
}
function renderEducationSelection() {
  const c = career();
  setScreen(
    `<div class="cq-card"><p class="cq-eyebrow">PLAN · TRAINING</p><h2>Your route toward ${esc(c.title)}</h2><p>Choose a training cost model. Five working years begin after this training. Time spent in education is not included in the working-year timeline.</p><div class="cq-option-list cq-paths">${pathsForCareer(
      c,
    )
      .map((k) => {
        const e = educationPaths[k];
        return `<button class="cq-option" data-path="${k}"><strong>${e.label}</strong>Starting education debt: ${money(e.debt)}<small>Example annual gross income after training: ${money(startingSalary(k))}</small></button>`;
      })
      .join(
        "",
      )}</div><p class="cq-note">Training debt and pay differences are simplified game assumptions. A pathway label alone does not qualify someone for a profession. Many careers require specific degrees, supervised practice, exams, or licenses.</p><button class="btn quiet" id="back-careers">Back to careers</button></div>`,
    "plan",
  );
  document.getElementById("back-careers").addEventListener("click", () => {
    state.run.phase = "career";
    persistRun();
    renderByPhase();
  });
  screen()
    .querySelectorAll("[data-path]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        state.run.educationKey = btn.dataset.path;
        state.run.phase = "budget";
        persistRun();
        renderByPhase();
      }),
    );
}
function startingSalary(path = state.run.educationKey) {
  const c = career();
  return Math.round(
    ((c.salaryStartRange[0] + c.salaryStartRange[1]) / 2) *
      educationPaths[path].salaryMod,
  );
}
function monthlyCosts(housing) {
  return (
    { low: 1600, average: 2200, high: 3000 }[settings().costOfLiving] +
    { shared: -350, solo: 350 }[housing]
  );
}
function renderBudget() {
  const run = state.run;
  setScreen(
    `<div class="cq-card"><p class="cq-eyebrow">PLAN · YOUR STARTING BUDGET</p><h2>Make room for the life you want.</h2><p>Your model starts with ${money(2000)} cash and ${money(educationPaths[run.educationKey].debt)} education debt. Set a living arrangement for this journey.</p><div class="cq-option-list cq-paths">${[
      ["shared", "Share a home", "Lower costs, with less privacy."],
      ["solo", "Live on your own", "More independence, with higher costs."],
    ]
      .map(
        ([k, t, d]) =>
          `<button class="cq-option" data-housing="${k}"><strong>${t}</strong>${d}<small>${money(monthlyCosts(k))}/month total living expenses, including housing, food, transportation, and essentials.</small></button>`,
      )
      .join(
        "",
      )}</div><p class="cq-note">Model rules: take-home pay is 78% of gross income; education debt has 5% annual interest and a scheduled annual payment of 10% of its starting balance. Unaffordable payments are limited to available cash; unpaid interest stays in debt. Any negative cash balance signals a funding shortfall.</p><button class="btn quiet" id="back-education">Back to training</button></div>`,
    "plan",
  );
  document.getElementById("back-education").addEventListener("click", () => {
    run.phase = "education";
    persistRun();
    renderByPhase();
  });
  screen()
    .querySelectorAll("[data-housing]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        run.housing = btn.dataset.housing;
        run.stats.debt = educationPaths[run.educationKey].debt;
        run.initialDebt = run.stats.debt;
        run.stats.stress = clamp(
          career().baselineStress + educationPaths[run.educationKey].stress / 2,
        );
        run.stats.workLife =
          career().baselineWorkLife + (run.housing === "shared" ? -3 : 3);
        Object.entries(educationPaths[run.educationKey].skill).forEach(
          ([k, v]) => (run.stats.skills[k] += v),
        );
        run.initialSkills = { ...run.stats.skills };
        updateNetWorth();
        run.yearStart = snapshot(run.stats);
        run.phase = "scenario";
        persistRun();
        renderByPhase();
      }),
    );
}
function dashboard() {
  const r = state.run;
  return `<aside class="cq-dashboard" aria-label="Your current status"><h3>${esc(career().title)}</h3><p>Year ${r.year} of 5 · ${educationPaths[r.educationKey].label}</p><div class="cq-stats">${[
    ["Cash", money(r.stats.cash), "Below zero = funding shortfall"],
    ["Debt", money(r.stats.debt), "Education balance"],
    ["Stress", `${r.stats.stress}/100`, "Lower means less pressure"],
    ["Well-being", `${r.stats.happiness}/100`, "How life feels"],
    ["Life balance", `${r.stats.workLife}/100`, "Time outside work"],
    ["Performance", `${r.stats.performance}/100`, "Progress at work"],
  ]
    .map(
      ([k, v, n]) =>
        `<div class="cq-stat"><strong>${k}</strong><span>${v}</span><small>${n}</small></div>`,
    )
    .join("")}</div></aside>`;
}
function years() {
  return `<div class="cq-years" aria-label="Working years">${[1, 2, 3, 4, 5].map((y) => `<span class="${y === state.run.year ? "current" : ""}">${y < state.run.year ? "✓ " : ""}Year ${y}</span>`).join("")}</div>`;
}
function layout(content) {
  return `<div class="cq-layout"><div class="cq-card">${years()}${content}</div>${dashboard()}</div>`;
}
function pickScenario() {
  const run = state.run,
    mode =
      run.stepInYear === 0
        ? "workplace"
        : run.stepInYear === 1
          ? "money"
          : "core";
  const all = state.scenarios[mode],
    unused = all.filter((s) => !run.history.some((h) => h.id === s.id)),
    pool = unused.length ? unused : all;
  return pool[Math.floor(Math.random() * pool.length)];
}
function renderScenario() {
  const run = state.run;
  if (!run.currentScenario) {
    run.currentScenario = pickScenario();
    persistRun();
  }
  const s = run.currentScenario;
  setScreen(
    layout(
      `<p class="cq-eyebrow">${run.stepInYear === 0 ? "WORK" : run.stepInYear === 1 ? "MONEY" : "LIFE EVENT"} · DECISION ${run.stepInYear + 1}</p><h2>${esc(s.title)}</h2><p>${esc(s.prompt)}</p><div class="cq-option-list">${s.choices.map((c, i) => `<button class="cq-option" data-choice="${i}"><strong>${esc(c.label)}</strong>${esc(c.text)}</button>`).join("")}</div><p class="cq-help">Choose a response. You will see its immediate effects before moving on. Pay and regular bills are settled once at the end of each year.</p>`,
    ),
    "live",
  );
  screen()
    .querySelectorAll("[data-choice]")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        applyChoice(s, s.choices[Number(btn.dataset.choice)]);
        persistRun();
        renderByPhase();
      }),
    );
}
function snapshot(s) {
  return Object.fromEntries(
    [
      "cash",
      "debt",
      "netWorth",
      "happiness",
      "stress",
      "workLife",
      "performance",
    ].map((k) => [k, s[k]]),
  );
}
function updateNetWorth() {
  state.run.stats.netWorth = Math.round(
    state.run.stats.cash - state.run.stats.debt,
  );
}
function applyChoice(s, c) {
  const r = state.run,
    before = snapshot(r.stats),
    effects = {},
    mult = { easy: 0.8, normal: 1, hard: 1.25 }[settings().difficulty];
  Object.entries(c.effects).forEach(([k, v]) => {
    if (k === "extraPayment") {
      const paid = Math.min(v, Math.max(0, r.stats.cash), r.stats.debt);
      r.stats.cash -= paid;
      r.stats.debt -= paid;
      effects.cash = -paid;
      effects.debt = -paid;
      return;
    }
    effects[k] = ["cash", "debt"].includes(k) ? v : Math.round(v * mult);
    if (k in r.stats.skills)
      r.stats.skills[k] = clamp(r.stats.skills[k] + effects[k]);
    else if (k in r.stats && k !== "netWorth")
      r.stats[k] = ["cash", "debt"].includes(k)
        ? r.stats[k] + effects[k]
        : clamp(r.stats[k] + effects[k]);
  });
  r.stats.debt = Math.max(0, r.stats.debt);
  updateNetWorth();
  r.history.push({
    id: s.id,
    title: s.title,
    year: r.year,
    choice: c.label,
    text: c.text,
    feedback: c.feedback,
    effects,
    before,
    after: snapshot(r.stats),
  });
  r.cardsPlayed++;
  r.stepInYear++;
  const chance = { easy: 0.2, normal: 0.4, hard: 0.55 }[settings().difficulty];
  r.afterFeedback =
    r.stepInYear === 1
      ? "scenario"
      : r.stepInYear === 2 && settings().randomEvents && Math.random() < chance
        ? "scenario"
        : "yearSummary";
  r.currentScenario = null;
  r.phase = "feedback";
}
function deltas(before, after) {
  return `<div class="cq-deltas">${
    Object.keys(before)
      .filter((k) => k !== "netWorth" && before[k] !== after[k])
      .map((k) => {
        const d = after[k] - before[k];
        return `<span>${labels[k]} ${d > 0 ? "+" : ""}${["cash", "debt"].includes(k) ? money(d) : d}</span>`;
      })
      .join("") || "<span>No immediate status change</span>"
  }</div>`;
}
function renderFeedback() {
  const r = state.run,
    h = r.history.at(-1);
  setScreen(
    layout(
      `<p class="cq-eyebrow">YOUR DECISION · ${esc(h.choice)}</p><h2>${esc(h.title)}: what changed?</h2><div class="cq-choice-feedback"><p>${esc(h.feedback)}</p></div>${deltas(h.before, h.after)}<p>These are immediate effects of your choice. Regular income and living expenses appear in the year review.</p><div class="cq-inline-actions"><button class="btn" id="continue-decision">${r.afterFeedback === "yearSummary" ? "Review this year" : "Next decision"}</button></div>`,
    ),
    "live",
  );
  document.getElementById("continue-decision").addEventListener("click", () => {
    r.phase = r.afterFeedback;
    if (r.phase === "yearSummary") settleYear();
    persistRun();
    renderByPhase();
  });
}
function settleYear() {
  const r = state.run;
  if (r.yearLedgers.some((l) => l.year === r.year)) return;
  const gross = startingSalary(),
    taxes = Math.round(gross * 0.22),
    living = monthlyCosts(r.housing) * 12,
    interest = Math.round(r.stats.debt * 0.05);
  r.stats.cash += gross - taxes - living;
  r.stats.debt += interest;
  const payment = Math.min(
    r.stats.debt,
    Math.round(r.initialDebt * 0.1),
    Math.max(0, r.stats.cash),
  );
  r.stats.cash -= payment;
  r.stats.debt -= payment;
  updateNetWorth();
  r.yearLedgers.push({
    year: r.year,
    gross,
    taxes,
    living,
    interest,
    payment,
    closing: snapshot(r.stats),
  });
}
function ledgerTable(l) {
  return `<table class="cq-ledger"><caption>Year ${l.year} cash flow</caption><tbody>${[
    ["Gross income", money(l.gross)],
    ["Estimated tax withholding", `−${money(l.taxes)}`],
    ["Living expenses", `−${money(l.living)}`],
    ["Education debt payment", `−${money(l.payment)}`],
    [
      "Cash from regular annual budget",
      money(l.gross - l.taxes - l.living - l.payment),
    ],
    ["Interest added to debt", money(l.interest)],
  ]
    .map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`)
    .join("")}</tbody></table>`;
}
function recap(items) {
  return items
    .map(
      (h) =>
        `<div class="cq-recap"><strong>${esc(h.title)} → ${esc(h.choice)}</strong><p>${esc(h.feedback)}</p></div>`,
    )
    .join("");
}
function renderYearSummary() {
  const r = state.run,
    l = r.yearLedgers.find((x) => x.year === r.year);
  setScreen(
    layout(
      `<p class="cq-eyebrow">PAUSE & REVIEW</p><h2>Year ${r.year}: your choices add up.</h2>${deltas(r.yearStart, r.stats)}${ledgerTable(l)}${r.stats.cash < 0 ? '<p class="cq-note">Your cash is below zero. This is an unresolved funding shortfall, not money available to spend. Which costs or choices would you change?</p>' : ""}<h3>Your decisions this year</h3>${recap(r.history.filter((h) => h.year === r.year))}<p class="cq-note">Discuss: Which choice helped your finances but created another cost? Use a result above as evidence.</p><button class="btn" id="next-year">${r.year === 5 ? "See my five-year story" : `Begin year ${r.year + 1}`}</button>`,
    ),
    "live",
  );
  document.getElementById("next-year").addEventListener("click", () => {
    if (r.year === 5) r.phase = "report";
    else {
      r.year++;
      r.stepInYear = 0;
      r.yearStart = snapshot(r.stats);
      r.phase = "scenario";
    }
    persistRun();
    renderByPhase();
  });
}
function reflectionPrompts() {
  const r = state.run;
  return [
    `Choose one decision from your journey. What did you gain, what did you give up, and what evidence shows the tradeoff?`,
    `Your final cash is ${money(r.stats.cash)} and debt is ${money(r.stats.debt)}. How did training, living costs, and your choices contribute?`,
    `If you explored another path toward ${career().title}, what would you change? Name one real-world requirement or cost you would research first.`,
  ];
}
function renderReport() {
  const r = state.run,
    growth = Object.entries(r.stats.skills)
      .map(([k, v]) => [k, v - (r.initialSkills[k] || 20)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  setScreen(
    `<div class="cq-card cq-report"><p class="cq-eyebrow">REFLECT · FIVE YEARS COMPLETED</p><h2>Your future has more than one score.</h2><p>${esc(career().title)} · ${educationPaths[r.educationKey].label} · ${r.housing === "shared" ? "Shared home" : "Living alone"}</p><div class="cq-report-summary">${[
      ["Cash", money(r.stats.cash)],
      ["Education debt", money(r.stats.debt)],
      ["Net worth", money(r.stats.netWorth)],
    ]
      .map(
        ([k, v]) =>
          `<div class="cq-stat"><strong>${k}</strong><span>${v}</span></div>`,
      )
      .join(
        "",
      )}</div><p>Well-being: <strong>${r.stats.happiness}/100</strong> · Stress: <strong>${r.stats.stress}/100</strong> · Life balance: <strong>${r.stats.workLife}/100</strong> · Work performance: <strong>${r.stats.performance}/100</strong></p><p>Most practiced skills: ${growth.map(([k, v]) => `${labels[k]} (+${v})`).join(", ")}. Changes are measured from the start of your working years.</p><h3>Your decision trail</h3><details><summary>Review all ${r.history.length} decisions</summary>${recap(r.history)}</details><details><summary>Review annual budgets</summary>${r.yearLedgers.map(ledgerTable).join("")}</details><h3>Explain your story</h3><p>Use your decision trail and budgets as evidence. Responses save on this device.</p>${reflectionPrompts()
      .map(
        (p, i) =>
          `<label class="cq-reflection" for="reflection-${i}">${i + 1}. ${esc(p)}<textarea id="reflection-${i}" data-reflection="${i}" placeholder="Explain your thinking…">${esc(r.reflections[i] || "")}</textarea></label>`,
      )
      .join(
        "",
      )}<div class="cq-inline-actions"><button class="btn" id="download-report">Download my report</button><button class="btn secondary" id="print-report">Print report</button>${settings().allowReplay ? '<button class="btn secondary" id="replay">Try another journey</button>' : ""}</div><p class="cq-note">All figures and outcomes are illustrative simulation assumptions. This report stays with you; it has not been submitted to a teacher.</p><p id="download-status" role="status"></p></div>`,
    "reflect",
  );
  screen()
    .querySelectorAll("[data-reflection]")
    .forEach((el) =>
      el.addEventListener("input", () => {
        r.reflections[Number(el.dataset.reflection)] = el.value;
        persistRun();
      }),
    );
  document
    .getElementById("print-report")
    .addEventListener("click", () => window.print());
  document
    .getElementById("download-report")
    .addEventListener("click", downloadReport);
  document
    .getElementById("replay")
    ?.addEventListener("click", () => startRun());
}
function downloadReport() {
  const r = state.run,
    lines = [
      "CAREER QUEST — MY FIVE-YEAR STORY",
      career().title,
      educationPaths[r.educationKey].label,
      `Model settings: ${settings().difficulty} impact, ${settings().costOfLiving} living costs`,
      `Cash: ${money(r.stats.cash)} | Debt: ${money(r.stats.debt)} | Net worth: ${money(r.stats.netWorth)}`,
      `Well-being: ${r.stats.happiness}/100 | Stress: ${r.stats.stress}/100 | Life balance: ${r.stats.workLife}/100 | Performance: ${r.stats.performance}/100`,
      "",
      "DECISION TRAIL",
      ...r.history.map(
        (h) => `Year ${h.year}: ${h.title} — ${h.choice}\n${h.feedback}`,
      ),
      "",
      "ANNUAL BUDGETS",
      ...r.yearLedgers.map(
        (l) =>
          `Year ${l.year}: Gross ${money(l.gross)}, tax ${money(l.taxes)}, living ${money(l.living)}, debt payment ${money(l.payment)}, interest ${money(l.interest)}. Closing cash ${money(l.closing.cash)}, debt ${money(l.closing.debt)}.`,
      ),
      "",
      "MY REFLECTIONS",
      ...reflectionPrompts().map(
        (p, i) => `${i + 1}. ${p}\n${r.reflections[i] || "(No response yet)"}`,
      ),
      "",
      "Illustrative classroom simulation. Not current salary data or financial advice.",
    ];
  const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "career-quest-my-story.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.getElementById("download-status").textContent =
    "Your text report has been downloaded.";
}
init().catch(() => {
  screen().innerHTML =
    '<div class="cq-card"><h2>Career Quest could not load</h2><p>Please refresh to try again. Your saved journey has not been removed.</p></div>';
});
