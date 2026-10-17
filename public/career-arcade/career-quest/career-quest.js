const SETTINGS_KEY = "taCareerQuestSettings";
const RUN_KEY = "taCareerQuestRun";
const BORROWING_RATE = 0.08; // Classroom assumption, not a current lending rate.

const defaultSettings = {
  difficulty: "normal",
  costOfLiving: "average",
  randomEvents: true,
  allowOverride: true,
  allowReplay: true,
  careerClusters: [],
  enabledCareers: [],
};

let quizQuestions = [];
const interestTypes = {
  R: {
    label: "Build & do",
    name: "Realistic",
    color: "#b64b19",
    icon: "tools",
  },
  I: {
    label: "Investigate",
    name: "Investigative",
    color: "#2861b4",
    icon: "science",
  },
  A: { label: "Create", name: "Artistic", color: "#9c3982", icon: "creative" },
  S: {
    label: "Help & teach",
    name: "Social",
    color: "#08766f",
    icon: "people",
  },
  E: {
    label: "Lead & persuade",
    name: "Enterprising",
    color: "#8a4ab4",
    icon: "business",
  },
  C: {
    label: "Organize",
    name: "Conventional",
    color: "#906311",
    icon: "office",
  },
};

const educationPaths = {
  workforce: {
    label: "Start working",
    debt: 1000,
    salaryMod: 0.9,
    stress: 8,
    skill: { professionalism: 4, timeManagement: 3 },
  },
  trade: {
    label: "Trade or certificate program",
    debt: 9000,
    salaryMod: 1.0,
    stress: 10,
    skill: { techLiteracy: 4, problemSolving: 2 },
  },
  cc: {
    label: "Two-year college",
    debt: 15000,
    salaryMod: 1.02,
    stress: 12,
    skill: { communication: 2, teamwork: 2, financialLiteracy: 3 },
  },
  college: {
    label: "Four-year college",
    debt: 36000,
    salaryMod: 1.1,
    stress: 18,
    skill: { communication: 3, leadership: 2 },
  },
  grad: {
    label: "Graduate or professional school",
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
    "career-interests",
    "discovery",
    "scenarios-v3-workplace",
    "scenarios-v3-money",
    "scenarios-v3-core",
  ];
  const data = await Promise.all(
    paths.map(async (p) => {
      const r = await fetch(`./data/${p}.json`);
      if (!r.ok) throw new Error("Activity data could not load.");
      return r.json();
    }),
  );
  state.careers = data[0];
  state.interestSource = data[4];
  quizQuestions = data[5];
  state.lifeScenarios = { workplace: data[6], money: data[7], core: data[8] };
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
  form.innerHTML = `${selectField("difficulty", "Decision impact", ["easy", "normal", "hard"], s.difficulty)}${selectField("costOfLiving", "Living costs", ["low", "average", "high"], s.costOfLiving)}${toggleField("randomEvents", "Optional life events", s.randomEvents)}${toggleField("allowOverride", "Explore beyond recommendations", s.allowOverride)}${toggleField("allowReplay", "Allow replay after completion", s.allowReplay)}<div class="cq-field"><label>Career clusters</label><div class="cq-checkboxes">${[...new Set(state.careers.map((c) => c.cluster))].map((c) => checkbox("cluster", c, s.careerClusters.includes(c))).join("")}</div></div><div class="cq-field"><label for="teacher-career-search">Careers — search to narrow the list</label><input id="teacher-career-search" type="search" placeholder="Find a career to enable or disable"><div class="cq-checkboxes" id="teacher-career-list">${state.careers.map((c) => checkbox("career", c.id, s.enabledCareers.includes(c.id), c.title)).join("")}</div></div>`;
  form.insertAdjacentHTML(
    "beforeend",
    '<p id="settings-status" class="cq-help" role="status"></p>',
  );
  document
    .getElementById("teacher-career-search")
    .addEventListener("input", (e) => {
      const q = normalizeSearch(e.target.value);
      document
        .querySelectorAll("#teacher-career-list label")
        .forEach((label) => {
          label.hidden = !normalizeSearch(label.textContent).includes(q);
        });
    });
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
    modelVersion: 3,
    interestAnswers: {},
    budgetAdjustments: {},
    flags: {},
    retirement: 0,
    incomeAdjustment: 0,
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
  if (saved.phase === "quiz" && !saved.modelVersion) {
    saved.interestAnswers = {};
    saved.quizIndex = 0;
  }

  for (const key of ["careerId", "previewCareerId"])
    state.run[key] = CAREER_REDIRECTS[state.run[key]] || state.run[key];
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
  screen().dataset.stage = stage;
  screen().innerHTML = html;
  if (state.run) {
    screen().focus({ preventScroll: true });
    screen().scrollIntoView({ block: "start", behavior: "instant" });
  }
}
function renderIntro() {
  const cityArt = `<div class="cq-launch-art" aria-hidden="true"><svg viewBox="0 0 520 340" fill="none"><circle cx="278" cy="160" r="145" fill="#b591ec" opacity=".45"/><circle cx="278" cy="160" r="112" stroke="#8853bf" stroke-dasharray="5 9" opacity=".4"/><path d="M40 287C120 254 169 325 250 278s150-29 224 8" stroke="#eb8e75" stroke-width="30" opacity=".18"/><path d="M43 287C120 254 169 325 250 278s150-29 224 8" stroke="#bc7844" stroke-width="2" stroke-dasharray="8 10"/><rect x="91" y="151" width="86" height="114" rx="8" fill="#5cbba8"/><path d="M108 164h12v17h-12zm30 0h12v17h-12zm-30 30h12v17h-12zm30 0h12v17h-12z" fill="#d6f5eb"/><rect x="119" y="230" width="29" height="35" rx="4" fill="#215c75"/><rect x="196" y="103" width="108" height="164" rx="8" fill="#ffde8d"/><path d="M217 126h17v22h-17zm36 0h17v22h-17zm-36 40h17v22h-17zm36 0h17v22h-17z" fill="#dc9767"/><rect x="234" y="223" width="34" height="44" rx="4" fill="#8150a4"/><path d="M250 77l24 15h-48z" fill="#f8cc64"/><path d="M250 78V49l29 9-29 9" stroke="#f8cc64" stroke-width="4" stroke-linejoin="round"/><rect x="329" y="169" width="100" height="96" rx="8" fill="#eca0ad"/><path d="M337 169l42-32 42 32z" fill="#a6689a"/><rect x="348" y="195" width="23" height="23" rx="3" fill="#fff2d1"/><rect x="387" y="195" width="23" height="23" rx="3" fill="#fff2d1"/><path d="M92 267h348" stroke="#172e61" stroke-width="6" stroke-linecap="round"/><rect x="50" y="67" width="131" height="57" rx="13" fill="#fff" transform="rotate(-7 50 67)"/><path d="M68 80h20v20H68zM78 75v30m-15-15h30" stroke="#167d70" stroke-width="3"/><text x="102" y="93" fill="#203963" font-family="system-ui,sans-serif" font-size="12" font-weight="700" transform="rotate(-7 102 93)">HEALTHCARE</text><rect x="338" y="72" width="142" height="55" rx="13" fill="#fff" transform="rotate(8 338 72)"/><path d="M356 89l10-4 10 4v10c0 7-10 12-10 12s-10-5-10-12z" stroke="#315ed6" stroke-width="2.5" transform="rotate(8 366 98)"/><text x="386" y="107" fill="#203963" font-family="system-ui,sans-serif" font-size="11" font-weight="700" transform="rotate(8 386 107)">PUBLIC SAFETY</text><circle cx="465" cy="217" r="21" fill="#a2dfbe"/><path d="M465 215v49" stroke="#294c69" stroke-width="4"/><circle cx="63" cy="229" r="25" fill="#7cc5b7"/><path d="M63 224v43" stroke="#294c69" stroke-width="4"/><circle cx="315" cy="42" r="5" fill="#f8cc64"/><path d="M450 143v12m-6-6h12M88 137v10m-5-5h10" stroke="#9b70a3" stroke-width="2"/></svg><span class="cq-art-caption">A WORLD OF POSSIBILITIES</span></div>`;
  setScreen(
    `<div class="cq-card cq-launch"><div><p class="cq-eyebrow">FIVE YEARS. YOUR DECISIONS.</p><h2>Your future starts<br>with a possibility.</h2><p>From public safety to skilled trades, healthcare to creative work. Explore ${state.careers.length} careers, choose a direction, and discover where your decisions lead.</p><div class="cq-inline-actions"><button class="btn" id="launch-start" ${document.getElementById("start-run").disabled ? "disabled" : ""}>Start my journey →</button></div><p class="cq-small" style="color:#d1def7">About 35–45 minutes · No account needed</p></div>${cityArt}</div><div class="cq-start-features"><div class="cq-start-feature"><span>01 / DISCOVER</span><b>Find a direction</b><p>36 detailed activity prompts and ${state.careers.length} detailed career profiles to explore.</p></div><div class="cq-start-feature"><span>02 / EXPERIENCE</span><b>See the tradeoffs</b><p>Choose your training and budget. Make work, money, and life decisions over five years.</p></div><div class="cq-start-feature"><span>03 / REFLECT</span><b>Explain your story</b><p>Use your decisions and annual budgets to explain what mattered to you.</p></div></div>`,
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
function interestProfile() {
  const answers = state.run?.interestAnswers || {};
  return Object.fromEntries(
    Object.keys(interestTypes).map((k) => {
      const values = quizQuestions
        .filter((q) => q.type === k)
        .map((q) => answers[q.id])
        .filter((v) => Number.isFinite(v));
      return [
        k,
        values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
      ];
    }),
  );
}
function hasInterestSignal() {
  const a = state.run?.interestAnswers || {},
    p = Object.values(interestProfile());
  return (
    Object.values(a).filter(Number.isFinite).length >= 24 &&
    Object.keys(interestTypes).every(
      (k) =>
        quizQuestions.filter((q) => q.type === k && Number.isFinite(a[q.id]))
          .length >= 3,
    ) &&
    Math.max(...p) - Math.min(...p) >= 0.25
  );
}
function renderQuiz() {
  const run = state.run,
    i = run.quizIndex,
    q = quizQuestions[i];
  const answered = run.interestAnswers || (run.interestAnswers = {});
  setScreen(
    `<div class="cq-card cq-quiz"><div class="cq-quiz-top"><span class="cq-chapter-tag">DISCOVER YOUR DIRECTION</span><strong>${i + 1} / ${quizQuestions.length}</strong></div><div class="cq-meter" role="progressbar" aria-label="Interest questions completed" aria-valuemin="0" aria-valuemax="${quizQuestions.length}" aria-valuenow="${i}"><span style="width:${(i / quizQuestions.length) * 100}%"></span></div><p class="cq-eyebrow">PICTURE YOURSELF DOING THIS</p><h2>${esc(q.q)}</h2><p class="cq-question-detail">${esc(q.detail)}</p><p>How much would you enjoy this activity? Ignore your current skill level, pay, and how much training it takes.</p><div class="cq-option-list cq-interest-options">${[
      [0, "Strongly dislike"],
      [1, "Dislike"],
      [2, "Unsure / neutral"],
      [3, "Like"],
      [4, "Strongly like"],
    ]
      .map(
        ([n, t]) =>
          `<button class="cq-option" data-score="${n}" aria-pressed="${answered[q.id] === n}"><span>${["−−", "−", "~", "+", "++"][n]}</span>${t}</button>`,
      )
      .join(
        "",
      )}</div><div class="cq-inline-actions"><button class="btn quiet" id="quiz-back" ${i === 0 ? "disabled" : ""}>← Previous question</button><button class="btn quiet" data-score="skip">I need more experience to answer</button></div><p class="cq-note">Teach Arcade classroom questions; not the official O*NET Interest Profiler or an aptitude test. Your answers guide exploration, not eligibility.</p></div>`,
    "discover",
  );
  document.getElementById("quiz-back").onclick = () => {
    run.quizIndex--;
    persistRun();
    renderQuiz();
  };
  screen()
    .querySelectorAll("[data-score]")
    .forEach(
      (btn) =>
        (btn.onclick = () => {
          answered[q.id] =
            btn.dataset.score === "skip" ? null : Number(btn.dataset.score);
          run.quizIndex++;
          if (run.quizIndex === quizQuestions.length) run.phase = "career";
          persistRun();
          renderByPhase();
        }),
    );
}
function affinityScore(c) {
  if (!hasInterestSignal()) return 0;
  const p = Object.values(interestProfile()),
    v = Object.keys(interestTypes).map(
      (k) => state.interestSource.profiles[c.socCode]?.[k],
    );
  if (v.some((x) => !Number.isFinite(x))) return -2;
  const pm = p.reduce((a, b) => a + b, 0) / 6,
    vm = v.reduce((a, b) => a + b, 0) / 6;
  const denominator = Math.sqrt(
    p.reduce((n, x) => n + (x - pm) ** 2, 0) *
      v.reduce((n, x) => n + (x - vm) ** 2, 0),
  );
  return denominator
    ? p.reduce((n, x, i) => n + (x - pm) * (v[i] - vm), 0) / denominator
    : -2;
}
function matchReason(c) {
  if (hasInterestSignal() && affinityScore(c) <= 0)
    return "Curious? Read about the daily work.";
  if (!hasInterestSignal())
    return "Try a new direction. See what the work is like.";
  const p = interestProfile(),
    v = state.interestSource.profiles[c.socCode];
  const shared = Object.keys(interestTypes)
    .sort((a, b) => p[b] / 4 + (v[b] - 1) / 6 - (p[a] / 4 + (v[a] - 1) / 6))
    .slice(0, 2);
  const activities = {
    R: "hands-on work",
    I: "solving problems",
    A: "creative work",
    S: "helping people",
    E: "leading others",
    C: "organizing information",
  };
  return `Explore ${shared.map((k) => activities[k]).join(" and ")}.`;
}
function interestSummary(personalized) {
  const p = interestProfile(),
    signal = personalized;
  return `<section class="cq-interest-summary"><div><p class="cq-eyebrow">YOUR INTEREST SNAPSHOT</p><h3>${signal ? "Your career suggestions" : "Careers to try"}</h3><p>${signal ? "Start with these careers based on your answers. Pick one to learn more." : "Not sure yet? Try these different careers. They are starting points, not personalized matches."}</p></div><div class="cq-interest-bars">${Object.entries(
    interestTypes,
  )
    .map(
      ([k, t]) =>
        `<div style="--interest-color:${t.color}"><span>${t.label}</span><meter min="0" max="4" value="${p[k] ?? 0}" aria-label="${t.label}: ${p[k] === null ? "unanswered" : p[k].toFixed(1) + " of 4"}"></meter><small>${p[k] === null ? "—" : p[k].toFixed(1)}</small></div>`,
    )
    .join(
      "",
    )}</div><details><summary>How matching works</summary><p>Six interest areas: Realistic, Investigative, Artistic, Social, Enterprising, Conventional. Six original classroom prompts per area; each is averaged from 0–4, excluding skipped answers. We compare the shape of your six averages with each occupation's six O*NET 1–7 ratings using centered correlation. Equal scores use career name order. No percentage is a probability of success. A relative ranking uses at least 24 answers, three per area, and a difference of 0.25 or more between area averages. No minimum enthusiasm score is required. With too little information to rank, we show varied exploration starting points from the teacher-enabled careers instead. These cutoffs are classroom design choices, not validated assessment thresholds.</p><a href="${esc(state.interestSource.url)}" target="_blank" rel="noopener noreferrer">O*NET 31.0 interest data (USDOL/ETA, CC BY 4.0) ↗</a><p>Teach Arcade selected data and built this ranking. The classroom questions and matching have not been validated as an assessment. For the official assessment, use the <a href="https://www.onetcenter.org/IP.html" target="_blank" rel="noopener noreferrer">O*NET Interest Profiler</a>.</p></details><button class="btn secondary" id="review-interests">Review my answers</button></section>`;
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
Object.assign(careerThemes, {
  "Science & Research": [
    "engineering",
    "#42748b",
    "#e4f3fb",
    "Ask the next question",
  ],
  "Food Service": [
    "hospitality",
    "#a15b17",
    "#fff1dc",
    "Make something delicious",
  ],
  "Facilities & Grounds": [
    "nature",
    "#4c7c37",
    "#edf5e2",
    "Care for shared places",
  ],
  "Sales & Customer Service": [
    "business",
    "#8c4478",
    "#f7e9f4",
    "Connect people & solutions",
  ],
  "Office & Administration": [
    "business",
    "#3a6393",
    "#e9f0fa",
    "Keep work organized",
  ],
});
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
const careerSearchIndex = new WeakMap();
function careerSearchScore(c, query) {
  const q = normalizeSearch(query);
  if (!q) return 1;
  if (!careerSearchIndex.has(c))
    careerSearchIndex.set(c, {
      title: normalizeSearch(c.title),
      aliases: (c.aliases || []).map(normalizeSearch),
      tokens: normalizeSearch(
        [
          c.title,
          c.cluster,
          ...(c.aliases || []),
          ...(c.searchKeywords || []),
        ].join(" "),
      ).split(" "),
    });
  const { title, aliases, tokens } = careerSearchIndex.get(c);
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
const CAREER_REDIRECTS = {
  "career-coach": "school-counselor",
  "soc-25-2021-00": "elementary-teacher",
};
const CATALOG_VERSION = 5;
function migrateCatalogSettings(s) {
  s.enabledCareers = [
    ...new Set(s.enabledCareers.map((id) => CAREER_REDIRECTS[id] || id)),
  ];
  if (s.catalogVersion === CATALOG_VERSION) return s;
  const previousVersion = s.catalogVersion || 2;
  const oldCatalog = state.careers.filter(
    (c) => (c.catalogAdded || 2) <= previousVersion,
  );
  const oldClusters = [...new Set(oldCatalog.map((c) => c.cluster))];
  if (oldCatalog.every((c) => s.enabledCareers.includes(c.id)))
    s.enabledCareers = state.careers.map((c) => c.id);
  if (oldClusters.every((c) => s.careerClusters.includes(c)))
    s.careerClusters = [...new Set(state.careers.map((c) => c.cluster))];
  s.catalogVersion = CATALOG_VERSION;
  return s;
}
function careerSuggestions(ranked) {
  const aligned = hasInterestSignal()
    ? ranked.filter((c) => affinityScore(c) > 0).slice(0, 8)
    : [];
  if (aligned.length) return { careers: aligned, personalized: true };
  const preferred = [
    "registered-nurse",
    "police-officer",
    "electrician",
    "graphic-designer",
    "high-school-teacher",
    "software-developer",
    "accountant",
    "social-worker",
  ];
  const mixed = [],
    fields = new Set();
  const candidates = [
    ...preferred.map((id) => ranked.find((c) => c.id === id)).filter(Boolean),
    ...ranked,
  ];
  for (const c of candidates) {
    if (!fields.has(c.cluster)) {
      mixed.push(c);
      fields.add(c.cluster);
    }
    if (mixed.length === 8) break;
  }
  for (const c of ranked) {
    if (mixed.length === 8) break;
    if (!mixed.includes(c)) mixed.push(c);
  }
  return { careers: mixed, personalized: false };
}
function renderCareerSelection() {
  const ranked = [...filteredCareers()].sort(
    (a, b) =>
      affinityScore(b) - affinityScore(a) || a.title.localeCompare(b.title),
  );
  const suggestions = careerSuggestions(ranked),
    recommended = suggestions.careers;
  if (!suggestions.personalized)
    ranked.sort(
      (a, b) =>
        Number(recommended.includes(b)) - Number(recommended.includes(a)) ||
        a.title.localeCompare(b.title),
    );
  const pool =
    settings().allowOverride || !suggestions.personalized
      ? ranked
      : recommended;
  const view =
    state.run.explorer ||
    (state.run.explorer = {
      query: "",
      cluster: "all",
      recommended: false,
      limit: 12,
    });
  setScreen(
    `<div class="cq-card cq-explore"><header class="cq-explore-heading"><div><p class="cq-eyebrow">EXPLORE YOUR POSSIBILITIES</p><h2>Explore your careers</h2><p>Choose a career to see the work, training, and pay.</p></div><div class="cq-library-count"><strong>${pool.length}</strong><span>careers to explore</span><small>${new Set(pool.map((c) => c.cluster)).size} career fields</small></div></header>${interestSummary(suggestions.personalized)}<div class="cq-search-bar"><label class="cq-search-label" for="career-search">Search careers<input id="career-search" type="search" placeholder="Police officer, mechanic, teacher…" value="${esc(view.query)}"></label><label for="career-cluster">Career field<select id="career-cluster"><option value="all">All career fields</option>${[
      ...new Set(pool.map((c) => c.cluster)),
    ]
      .sort()
      .map(
        (c) =>
          `<option value="${esc(c)}" ${c === view.cluster ? "selected" : ""}>${esc(c)}</option>`,
      )
      .join(
        "",
      )}</select></label></div><div class="cq-explore-toolbar"><label class="cq-match-filter"><input id="recommended-only" type="checkbox" ${view.recommended ? "checked" : ""}> ${suggestions.personalized ? "My interest suggestions" : "My starting points"}</label><div class="cq-sort-controls"><label for="career-sort">Sort<select id="career-sort"><option value="fit">Suggestions first</option><option value="alpha" ${view.sort === "alpha" ? "selected" : ""}>Career name A–Z</option></select></label><span id="career-count" role="status" aria-live="polite"></span></div></div><div class="cq-suggestions" aria-label="Search ideas"><span>Try a direction:</span>${["Police officer", "Electrician", "Nurse", "Teacher", "Mechanic"].map((q) => `<button type="button" data-search="${q}">${q}</button>`).join("")}</div>${settings().allowOverride ? "" : '<p class="cq-note">Your teacher has limited the career choices for this activity.</p>'}<p id="career-filter-note" class="cq-note" hidden></p><div id="career-catalog" class="cq-catalog"></div><div class="cq-more"><button class="btn secondary" id="more-careers">Show more careers</button></div><details class="cq-source-note"><summary>About career information & game income</summary><p>Profiles use the <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">O*NET® 31.0 Database</a> by USDOL/ETA under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>, and U.S. Bureau of Labor Statistics research. Teach Arcade selected excerpts, grouped fields, and added game assumptions; USDOL/ETA has not approved, endorsed, or tested these changes. O*NET® is a trademark of USDOL/ETA. New profiles were added October 16, 2026. Some profiles cover a broader related occupation. National median wages include experienced workers and are not starting salaries. Income used in the simulation remains an illustrative game assumption. Check state, employer, and licensing requirements before making real plans.</p></details></div>`,
    "explore",
  );
  document.getElementById("review-interests").onclick = () => {
    state.run.phase = "quiz";
    state.run.quizIndex = 0;
    persistRun();
    renderQuiz();
  };
  function draw() {
    view.query = document.getElementById("career-search").value;
    view.cluster = document.getElementById("career-cluster").value;
    view.recommended = document.getElementById("recommended-only").checked;
    view.sort = document.getElementById("career-sort").value;
    let matches = pool
      .map((c) => ({ c, score: careerSearchScore(c, view.query) }))
      .filter(
        ({ c, score }) =>
          score &&
          (view.cluster === "all" || c.cluster === view.cluster) &&
          (!view.recommended || recommended.includes(c)),
      )
      .sort(
        (a, b) =>
          (view.query ? b.score - a.score : 0) ||
          (view.sort === "alpha" ? a.c.title.localeCompare(b.c.title) : 0),
      )
      .map(({ c }) => c);
    const filterNote = document.getElementById("career-filter-note");
    filterNote.hidden = true;
    if (!matches.length && view.recommended) {
      const broader = pool
        .map((c) => ({ c, score: careerSearchScore(c, view.query) }))
        .filter(
          ({ c, score }) =>
            score && (view.cluster === "all" || c.cluster === view.cluster),
        )
        .sort(
          (a, b) =>
            (view.query ? b.score - a.score : 0) ||
            (view.sort === "alpha" ? a.c.title.localeCompare(b.c.title) : 0),
        )
        .map(({ c }) => c);
      if (broader.length) {
        matches = broader;
        view.recommended = false;
        document.getElementById("recommended-only").checked = false;
        filterNote.textContent =
          "Here are more careers that match your search.";
        filterNote.hidden = false;
      }
    }
    document.getElementById("career-count").textContent =
      `${matches.length} ${matches.length === 1 ? "career" : "careers"} found`;
    document.getElementById("career-catalog").innerHTML =
      matches
        .slice(0, view.limit)
        .map(
          (c) =>
            `<article class="cq-career cq-profile-card" style="${themeStyle(c)}"><div class="cq-career-art">${careerIcon(c.cluster)}<span>${esc((careerThemes[c.cluster] || careerThemes.Business)[3])}</span>${recommended.includes(c) ? `<span class="cq-badge">${suggestions.personalized ? "Interest suggestion" : "Starting point"}</span>` : ""}</div><div class="cq-career-body"><p class="cq-career-field">${esc(c.cluster)}</p><h3>${esc(c.title)}</h3><p class="cq-career-description">${esc(c.summary)}</p><p class="cq-match-reason">${esc(matchReason(c))}</p><div class="cq-career-route"><span>BLS group entry</span><strong>${esc(c.typicalEducation === "See How to Become One" ? "Academy / requirements vary" : c.typicalEducation)}</strong></div><button class="btn secondary" data-career="${c.id}" aria-label="View ${esc(c.title)} career profile">View career profile <span aria-hidden="true">↗</span></button></div></article>`,
        )
        .join("") ||
      `<div class="cq-empty"><h3>No careers found</h3><p>Try another search or clear the filters.</p><button class="btn secondary" id="clear-career-filters">Clear search filters</button></div>`;
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
  [
    "career-search",
    "career-cluster",
    "recommended-only",
    "career-sort",
  ].forEach((id) =>
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
function workContextPanel(c) {
  if (!c.workContext?.length) return "";
  return `<ul class="cq-context-list">${c.workContext.map((x) => `<li><strong>${esc(x.label)}: ${Number(x.value).toFixed(1)} / 5</strong><small>1 = ${esc(x.low)} · 5 = ${esc(x.high)} · Survey ${esc(x.surveyDate)}</small></li>`).join("")}</ul>`;
}
function factCitation(c, claim) {
  const source = c.evidence.claimSources[claim];
  const url =
    source === "bls"
      ? c.laborSourceUrl
      : source === "handbook"
        ? c.handbookSourceUrl
        : c.sourceUrl;
  const label =
    source === "bls"
      ? "BLS data [2]"
      : source === "handbook"
        ? "BLS Handbook [3]"
        : "O*NET [1]";
  return `<a class="cq-fact-citation" data-claim="${claim}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Source for ${esc(claim)}: ${label}">${label} ↗</a>`;
}
function careerSourcePanel(c) {
  const b = c.evidence.blsRecord;
  return `<footer class="cq-profile-source"><details class="cq-more-info"><summary>Sources and data details</summary><p>Source record: <strong>${esc(c.canonicalTitle)}</strong> · O*NET-SOC ${esc(c.socCode)}. Source records compared ${esc(c.sourceReviewed)}.</p><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">[1] O*NET occupation profile: ${esc(c.canonicalTitle)} ↗</a><a href="${esc(c.laborSourceUrl)}" target="_blank" rel="noopener noreferrer">[2] BLS table 1.2: ${esc(b.title)} (${esc(b.socCode)}) ↗</a><p><strong>Statistics coverage: ${esc(b.scope)}.</strong> Education, pay, and outlook refer to ${esc(b.title)}, including other specialties where applicable. Wage year: 2025. Projection period: 2025–2035.</p>${c.handbookSourceUrl ? `<a href="${esc(c.handbookSourceUrl)}" target="_blank" rel="noopener noreferrer">[3] BLS Handbook: ${esc(c.handbookSourceTitle)} ↗</a><p>Detailed O*NET survey records are unavailable for this code. Duties, work environment, and qualities use the broader Handbook group.</p>` : ""}<details><summary>Evidence records and audit method</summary><p>Definition matched to occupation_data.csv. Core task IDs: ${esc(c.evidence.tasks.map((t) => t.taskId || t.section).join(", "))}. Work context uses item-specific 1–5 survey means; skills use importance ratings where available. Source years vary by survey item.</p><a href="./data/evidence-sources.json" target="_blank" rel="noopener noreferrer">Official dataset download links and SHA-256 checksums</a><p>Each claim group is matched to an official record. This comparison does not certify local licensing or employer eligibility.</p></details><small>Includes information from the <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noopener noreferrer">O*NET® 31.0 Database</a> by USDOL/ETA, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. O*NET® is a trademark of USDOL/ETA. Teach Arcade selected excerpts, grouped fields, and added game assumptions. USDOL/ETA has not approved, endorsed, or tested these changes.</small><small>${esc(c.simulationNote)}</small></details></footer>`;
}
function educationAndTraining(c) {
  const b = c.evidence.blsRecord;
  const training =
    {
      "Short-term on-the-job training": "Short training on the job",
      "Moderate-term on-the-job training": "Training on the job",
      "Long-term on-the-job training": "Extended training on the job",
      "Internship/residency": "Internship or residency",
    }[b.training] || b.training;
  return `${b.scope === "broader occupation" ? `<p class="cq-small">BLS reports these figures for ${esc(b.title)}.</p>` : ""}<ul class="cq-entry-list"><li><strong>Typical education:</strong> ${esc(b.education)}</li><li><strong>Previous work experience:</strong> ${b.experience === "None" ? "Not usually required" : esc(b.experience)}</li>${b.training !== "None" ? `<li><strong>Training after you start:</strong> ${esc(training)}</li>` : ""}</ul><p class="cq-small">You may also need a license or other qualifications. Check the source for details.</p><details class="cq-more-info"><summary>Full source details</summary><p>${esc(c.entryRequirements)}</p></details>`;
}
function renderCareerDetail() {
  const c = state.careers.find((c) => c.id === state.run.previewCareerId);
  if (!c || !filteredCareers().some((x) => x.id === c.id)) {
    state.run.phase = "career";
    return renderCareerSelection();
  }
  const tasks = c.duties?.length ? c.duties : [c.summary];
  setScreen(
    `<article class="cq-card cq-career-detail" style="${themeStyle(c)}"><button class="btn quiet" id="back-catalog">← Back to career explorer</button><header class="cq-detail-hero"><div class="cq-detail-icon">${careerIcon(c.cluster)}</div><div><p class="cq-eyebrow">${esc(c.cluster)}</p><h2>${esc(c.title)}</h2><p>${esc(c.summary)} ${factCitation(c, "summary")}</p><p class="cq-small">Official occupation: ${esc(c.canonicalTitle)} · ${esc(c.socCode)}</p></div></header><div class="cq-detail-grid"><div><section class="cq-profile-section"><h3>A day in this field ${factCitation(c, "duties")}</h3><ul class="cq-duty-list">${tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section><section class="cq-profile-section"><h3>What the work is like ${factCitation(c, "workEnvironment")}</h3><p>${esc(c.workEnvironment)}</p>${workContextPanel(c)}</section><section class="cq-profile-section"><h3>Education and training ${factCitation(c, "entryRequirements")}</h3>${educationAndTraining(c)}</section><section class="cq-profile-section"><h3>Employment outlook ${factCitation(c, "outlook")}</h3><p>${esc(c.outlook)}</p></section></div><aside class="cq-career-facts"><p class="cq-eyebrow">YOUR FIELD NOTES</p><h3>Before you choose</h3><dl><dt>Typical education for the BLS group ${factCitation(c, "typicalEducation")}</dt><dd>${esc(c.typicalEducation === "See How to Become One" ? "Requirements vary — see education and training" : c.typicalEducation)}</dd><dt>Skills and qualities to explore</dt><dd>${c.researchSkills.map((x) => esc(x.label)).join(", ")} ${factCitation(c, "researchSkills")}</dd><dt>National pay context</dt><dd>${esc(c.payContext)} ${factCitation(c, "payContext")}</dd></dl><p class="cq-small">The pay statement describes BLS occupational data, not a guaranteed starting offer.</p><div class="cq-research-task"><h4>Think it through</h4><p>What would you enjoy? What might be hard?</p></div><button class="btn" id="choose-career" data-choose-career="${c.id}">Choose this career →</button><p class="cq-small">Next: choose your training.</p></aside></div>${careerSourcePanel(c)}</article>`,
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
    `<div class="cq-card"><p class="cq-eyebrow">PLAN · TRAINING</p><h2>Plan your training</h2><p class="cq-small">Career: ${esc(c.title)}</p><p>Pick a path. Your five working years start after training.</p><div class="cq-option-list cq-paths">${pathsForCareer(
      c,
    )
      .map((k) => {
        const e = educationPaths[k];
        return `<button class="cq-option" data-path="${k}"><strong>${e.label}</strong>Student debt: ${money(e.debt)}<small>Yearly pay before taxes: ${money(startingSalary(k))}</small></button>`;
      })
      .join(
        "",
      )}</div><p class="cq-small">Debt and pay are game estimates.</p><details class="cq-more-info"><summary>About training and costs</summary><p>These are example costs, not actual tuition or starting pay. Training happens before the five working years. Real careers may require specific degrees, practice, exams, or licenses. Check the career sources for requirements.</p></details><button class="btn quiet" id="back-careers">Back to careers</button></div>`,
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
function renderLegacyBudget() {
  const run = state.run;
  setScreen(
    `<div class="cq-card"><p class="cq-eyebrow">PLAN · YOUR STARTING BUDGET</p><h2>Make room for the life you want.</h2><p>Start with $2,000 cash and ${money(educationPaths[run.educationKey].debt)} in student debt. Choose where to live.</p><div class="cq-option-list cq-paths">${[
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
const expenseLabels = {
  rent: "Housing",
  utilities: "Utilities",
  food: "Groceries",
  transport: "Transport / fuel / payment",
  autoInsurance: "Auto insurance",
  health: "Health-plan premium",
  phone: "Phone & internet",
  household: "Household / personal",
  social: "Social / recreation",
  care: "Family support",
  medical: "Routine medical costs",
  maintenance: "Repairs & replacements",
};
function monthlyBreakdown(
  housing = state.run.housing,
  year = state.run.year,
  transport = state.run.transport || "car",
  care = state.run.care || "none",
) {
  const factor =
    { low: 0.85, average: 1, high: 1.3 }[settings().costOfLiving] *
    1.035 ** (year - 1);
  const base = {
    rent: housing === "shared" ? 850 : 1500,
    utilities: housing === "shared" ? 150 : 220,
    food: 370,
    transport: { car: 430, transit: 130, carpool: 260 }[transport],
    autoInsurance: transport === "car" ? 130 : 0,
    health: 190,
    phone: 100,
    household: 115,
    social: 150,
    care: { none: 0, family: 300, dependent: 750 }[care],
    medical: 60,
    maintenance: 100,
  };
  const adjustments = state.run.budgetAdjustments || {};
  return Object.fromEntries(
    Object.entries(base).map(([k, v]) => [
      k,
      Math.max(0, Math.round((v + (adjustments[k] || 0)) * factor)),
    ]),
  );
}
function livingTotal(parts) {
  return Object.values(parts).reduce((a, b) => a + b, 0);
}
function yearGross(year = state.run.year) {
  const r = state.run;
  return Math.max(
    0,
    Math.round(
      startingSalary() * 1.02 ** (year - 1) +
        (r.incomeAdjustment || 0) +
        (r.annualIncome || 0),
    ),
  );
}
function estimatedWithholding(gross) {
  // Classroom approximation, deliberately not a real federal/state tax calculator.
  return Math.round(
    gross * 0.0765 +
      Math.min(gross, 15000) * 0.04 +
      Math.min(Math.max(0, gross - 15000), 35000) * 0.12 +
      Math.max(0, gross - 50000) * 0.22,
  );
}
function syncDebts() {
  const r = state.run;
  r.stats.debt =
    Math.max(0, r.educationDebt || 0) + Math.max(0, r.consumerDebt || 0);
}
function renderBudget() {
  if (!state.run.modelVersion) return renderLegacyBudget();
  const r = state.run;
  setScreen(
    `<div class="cq-card cq-budget-planner"><p class="cq-eyebrow">PLAN / BUILD YOUR EVERYDAY LIFE</p><h2>Build your budget</h2><p>Start with $2,000 cash and ${money(educationPaths[r.educationKey].debt)} in student debt. Choose how you will live.</p><div class="cq-budget-inputs"><label for="transport-plan">Getting to work<select id="transport-plan"><option value="car">Car: payment/fuel + insurance</option><option value="transit">Transit: lower cost, longer commute</option><option value="carpool">Carpool: shared cost, less flexibility</option></select></label><label for="care-plan">Family costs<select id="care-plan"><option value="none">No regular family contribution</option><option value="family">Contribute $300/month to family</option><option value="dependent">Dependent care/support: $750/month</option></select></label><label for="retirement-plan">Retirement savings<select id="retirement-plan"><option value="0">0% · more cash now</option><option value="0.04" selected>4% · save some for later</option><option value="0.08">8% · save more for later</option></select></label></div><div id="budget-comparison" class="cq-budget-comparison"></div><p class="cq-small">These are game estimates. Real costs and pay vary.</p><details class="cq-more-info"><summary>How the money works</summary><p>Illustrative costs, not local price estimates. Bills rise 3.5% per year; base pay rises 2%. Withholding is a classroom approximation, not a tax calculation. Choose retirement contributions of 0%, 4%, or 8% of gross pay; these are separate from spending cash. Education debt uses 5% annual interest and a ten-year payment schedule; other debt uses 8% annual game interest and a scheduled payment of 30% of the interest-adjusted balance (at least $360/year, capped at the balance). The model caps new consumer credit at a $12,000 balance, excluding later interest. Gaps beyond available credit remain visible as unpaid shortfalls; balances are not forgiven. This is a classroom credit rule, not a lending offer. No investment returns are assumed. Working years begin after training.</p></details><button class="btn quiet" id="back-education">← Back to training</button></div>`,
    "plan",
  );
  function draw() {
    r.transport = document.getElementById("transport-plan").value;
    r.care = document.getElementById("care-plan").value;
    r.retirementRate = Number(document.getElementById("retirement-plan").value);
    document.getElementById("budget-comparison").innerHTML = ["shared", "solo"]
      .map((h) => {
        const parts = monthlyBreakdown(h, 1),
          annual = livingTotal(parts) * 12,
          gross = startingSalary(),
          tax = estimatedWithholding(gross),
          retirement = Math.round(gross * (r.retirementRate ?? 0.04)),
          payment = educationPayment(educationPaths[r.educationKey].debt),
          margin = gross - tax - retirement - annual - payment;
        return `<article class="cq-budget-choice"><p class="cq-eyebrow">${h === "shared" ? "SHARED HOME" : "YOUR OWN PLACE"}</p><h3>${money(livingTotal(parts))}<small> / month in bills</small></h3><details class="cq-more-info"><summary>See monthly bills</summary><dl>${Object.entries(
          parts,
        )
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<div><dt>${expenseLabels[k]}</dt><dd>${money(v)}</dd></div>`,
          )
          .join(
            "",
          )}</dl></details><div class="cq-budget-margin ${margin < 0 ? "is-shortfall" : ""}"><span>${margin < 0 ? "Short each month" : "Left each month"}</span><strong>${money(Math.abs(Math.round(margin / 12)))}</strong><small>After bills, taxes, savings, and student loan payments. Before unexpected costs.</small></div><button class="btn" data-housing="${h}">Choose ${h === "shared" ? "a shared home" : "living alone"} →</button></article>`;
      })
      .join("");
    screen()
      .querySelectorAll("[data-housing]")
      .forEach(
        (btn) =>
          (btn.onclick = () => {
            r.housing = btn.dataset.housing;
            r.educationDebt = educationPaths[r.educationKey].debt;
            r.initialDebt = r.educationDebt;
            r.consumerDebt = 0;
            syncDebts();
            r.stats.stress = clamp(
              career().baselineStress +
                educationPaths[r.educationKey].stress / 2,
            );
            r.stats.workLife = clamp(
              career().baselineWorkLife +
                (r.housing === "shared" ? -3 : 3) -
                (r.transport === "transit" ? 5 : 0) -
                (r.care === "none" ? 0 : 5),
            );
            Object.entries(educationPaths[r.educationKey].skill).forEach(
              ([k, v]) => (r.stats.skills[k] += v),
            );
            r.initialSkills = { ...r.stats.skills };
            updateNetWorth();
            r.yearStart = snapshot(r.stats);
            r.phase = "scenario";
            persistRun();
            renderByPhase();
          }),
      );
  }
  for (const [id, key] of [
    ["transport-plan", "transport"],
    ["care-plan", "care"],
    ["retirement-plan", "retirementRate"],
  ]) {
    document.getElementById(id).value =
      r[key] ??
      (key === "transport" ? "car" : key === "retirementRate" ? 0.04 : "none");
    document.getElementById(id).onchange = () => {
      draw();
      persistRun();
    };
  }
  document.getElementById("back-education").onclick = () => {
    r.phase = "education";
    persistRun();
    renderByPhase();
  };
  draw();
}
function educationPayment(balance) {
  const rate = 0.05 / 12,
    n = 120;
  return balance
    ? Math.round(((balance * rate) / (1 - (1 + rate) ** -n)) * 12)
    : 0;
}
function settleLifeYear() {
  const r = state.run;
  if (r.yearLedgers.some((l) => l.year === r.year)) return;
  const openingCash = r.yearStart.cash,
    gross = yearGross(),
    taxes = estimatedWithholding(gross),
    parts = monthlyBreakdown(),
    living = livingTotal(parts) * 12;
  const retirement = Math.round(gross * (r.retirementRate ?? 0.04)),
    educationInterest = Math.round(r.educationDebt * 0.05),
    consumerInterest = Math.round(r.consumerDebt * BORROWING_RATE),
    interest = educationInterest + consumerInterest;
  r.educationDebt += educationInterest;
  r.consumerDebt += consumerInterest;
  const educationDue = Math.min(
      r.educationDebt,
      educationPayment(r.initialDebt),
    ),
    consumerDue = Math.min(
      r.consumerDebt,
      Math.max(360, Math.round(r.consumerDebt * 0.3)),
    ),
    payment = educationDue + consumerDue;
  // Any unpaid cash-flow gap becomes visible consumer borrowing, rather than free negative cash.
  r.stats.cash += gross - taxes - living - retirement - payment;
  r.educationDebt -= educationDue;
  r.consumerDebt -= consumerDue;
  const newBorrowing = Math.min(
    Math.max(0, -r.stats.cash),
    Math.max(0, 12000 - r.consumerDebt),
  );
  if (newBorrowing) {
    r.consumerDebt += newBorrowing;
    r.stats.cash += newBorrowing;
    r.stats.stress = clamp(r.stats.stress + 10);
    r.stats.happiness = clamp(r.stats.happiness - 4);
  }
  r.retirement += retirement;
  syncDebts();
  updateNetWorth();
  const decisionCash = r.history
    .filter((h) => h.year === r.year)
    .reduce((sum, h) => sum + (h.effects.cash || 0), 0);
  r.yearLedgers.push({
    year: r.year,
    gross,
    taxes,
    living,
    parts,
    retirement,
    payment,
    educationDue,
    consumerDue,
    educationInterest,
    consumerInterest,
    consumerRate: BORROWING_RATE,
    interest,
    newBorrowing,
    openingCash,
    decisionCash,
    incomeAdjustment: r.incomeAdjustment || 0,
    educationBalance: r.educationDebt,
    consumerBalance: r.consumerDebt,
    retirementBalance: r.retirement,
    closing: snapshot(r.stats),
  });
  r.incomeAdjustment = 0;
}

function dashboard() {
  const r = state.run;
  return `<aside class="cq-dashboard" aria-label="Your current status"><h3>${esc(career().title)}</h3><p>Year ${r.year} of 5 · ${educationPaths[r.educationKey].label}</p><div class="cq-stats">${[
    ["Cash", money(r.stats.cash), "Below zero = funding shortfall"],
    [
      "Debt",
      money(r.stats.debt),
      r.modelVersion
        ? `Education ${money(r.educationDebt)} / consumer ${money(r.consumerDebt)}`
        : "Education balance",
    ],
    ...(r.modelVersion
      ? [
          [
            "Retirement",
            money(r.retirement),
            "Restricted savings, not spending cash",
          ],
        ]
      : []),
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
function chapterArt(kind) {
  const key =
    { workplace: "business", money: "finance", core: "people" }[kind] ||
    "business";
  return `<svg class="cq-chapter-art" viewBox="0 0 240 130" fill="none" aria-hidden="true"><circle cx="160" cy="48" r="44" fill="var(--scene-sun)"/><path d="M0 115Q45 77 96 112T240 100V130H0Z" fill="var(--scene-ground)"/><rect x="24" y="37" width="91" height="76" rx="13" fill="white" stroke="var(--scene-ink)" stroke-width="2" transform="rotate(-8 24 37)"/><g transform="translate(37 42) scale(.83)" stroke="var(--scene-ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${iconPaths[key]}</g><path d="M141 87V55h17v32m10 0V38h17v49m10 0V20h17v67" fill="var(--scene-accent)"/><path d="M138 92h81" stroke="var(--scene-ink)" stroke-width="3" stroke-linecap="round"/><circle cx="126" cy="20" r="5" fill="var(--scene-accent)"/><path d="M217 110v-9m-4 4h9M15 17v10m-5-5h10" stroke="var(--scene-ink)" stroke-width="2"/></svg>`;
}
function chapterBanner() {
  const r = state.run,
    kind =
      r.stepInYear === 0 ? "workplace" : r.stepInYear === 1 ? "money" : "core";
  const words = {
    workplace: ["WORK & GROWTH", "A career is more than a paycheck."],
    money: ["MONEY & CHOICES", "Give every dollar a purpose."],
    core: ["LIFE & RESPONSIBILITY", "Plans meet the unexpected."],
  }[kind];
  return `<div class="cq-chapter-banner cq-chapter-${kind}"><div><span class="cq-chapter-tag">YEAR ${r.year} / YOUR NEXT CHAPTER</span><h3>${words[0]}</h3><p>${words[1]}</p></div>${chapterArt(kind)}</div>`;
}
function financialSnapshot() {
  const r = state.run;
  if (!r.modelVersion) return "";
  const bills = livingTotal(monthlyBreakdown()),
    months = Math.max(0, r.stats.cash) / bills;
  return `<div class="cq-financial-snapshot"><div><span>Cash for bills</span><strong>${money(Math.max(0, r.stats.cash))}</strong><small>${r.stats.cash < 0 ? `Unpaid bills: ${money(-r.stats.cash)}` : `About ${months.toFixed(1)} months of bills`}</small></div><div><span>Other debt</span><strong>${money(r.consumerDebt)}</strong><small>${r.consumerDebt > 0 ? `${Math.round(BORROWING_RATE * 100)}% yearly interest in this game` : "No interest on a $0 balance"}</small></div><div><span>Retirement savings</span><strong>${money(r.retirement)}</strong><small>Saved for later, not everyday spending</small></div></div>`;
}
function layout(content) {
  return `<div class="cq-layout"><div class="cq-card cq-live-card">${chapterBanner()}${years()}${content}</div>${dashboard()}</div>`;
}
function pickScenario() {
  const run = state.run,
    mode =
      run.stepInYear === 0
        ? "workplace"
        : run.stepInYear === 1
          ? "money"
          : "core";
  const all = (run.modelVersion ? state.lifeScenarios : state.scenarios)[
      mode
    ].filter(
      (s) =>
        (!s.minYear || run.year >= s.minYear) &&
        (!s.requires ||
          (run.flags?.[s.requires] &&
            run.year - run.flags[s.requires] >= (s.waitYears || 1))),
    ),
    unused = all.filter((s) => !run.history.some((h) => h.id === s.id)),
    pool = unused.length ? unused : all;
  if (run.modelVersion) {
    const follow = pool.find((s) => s.requires);
    if (follow) return follow;
  }
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
      `<p class="cq-eyebrow">${run.stepInYear === 0 ? "WORK" : run.stepInYear === 1 ? "MONEY" : "LIFE EVENT"} · DECISION ${run.stepInYear + 1}</p><h2>${esc(s.title)}</h2><p>${esc(s.prompt)}</p>${run.modelVersion ? `<div class="cq-scenario-context"><strong>Your year</strong><span>${esc(career().title)} · Year ${run.year}</span><span>${money(yearGross())}/year before taxes · ${money(livingTotal(monthlyBreakdown()))}/month in bills</span>${s.context ? `<details class="cq-more-info"><summary>Scenario details</summary><p>${esc(s.context)}</p></details>` : ""}</div>` : ""}<div class="cq-option-list">${s.choices.map((c, i) => `<button class="cq-option" data-choice="${i}"><strong>${esc(c.label)}</strong>${esc(c.text)}</button>`).join("")}</div><p class="cq-help">Choose what to do. You will see what changes next.</p>`,
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
    state.run.stats.cash + (state.run.retirement || 0) - state.run.stats.debt,
  );
}
function applyChoice(s, c) {
  const r = state.run,
    before = snapshot(r.stats),
    effects = {},
    mult = { easy: 0.8, normal: 1, hard: 1.25 }[settings().difficulty];
  Object.entries(c.effects).forEach(([k, v]) => {
    if (
      r.modelVersion &&
      ["income", "annualIncome", "monthly", "flag", "clearFlag"].includes(k)
    ) {
      if (k === "income") {
        r.incomeAdjustment += v;
        effects.income = v;
      }
      if (k === "annualIncome") {
        r.annualIncome = (r.annualIncome || 0) + v;
        effects.annualIncome = v;
      }
      if (k === "monthly") {
        for (const [category, change] of Object.entries(v))
          r.budgetAdjustments[category] =
            (r.budgetAdjustments[category] || 0) + change;
        effects.monthly = v;
      }
      if (k === "flag") r.flags[v] = r.year;
      if (k === "clearFlag") delete r.flags[v];
      return;
    }
    if (k === "extraPayment") {
      const paid = Math.min(v, Math.max(0, r.stats.cash), r.stats.debt);
      r.stats.cash -= paid;
      r.stats.debt -= paid;
      if (r.modelVersion) {
        const consumer = Math.min(paid, r.consumerDebt);
        r.consumerDebt -= consumer;
        r.educationDebt -= paid - consumer;
        syncDebts();
      }
      effects.cash = -paid;
      effects.debt = -paid;
      return;
    }
    if (r.modelVersion && k === "debt") {
      const funded = Math.min(
        Math.max(0, v),
        Math.max(0, 12000 - r.consumerDebt),
      );
      r.consumerDebt += funded;
      const gap = Math.max(0, v - funded);
      r.stats.cash -= gap;
      syncDebts();
      effects.debt = funded;
      if (gap) effects.cash = (effects.cash || 0) - gap;
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
    feedback:
      c.feedback +
      (r.modelVersion && c.effects.debt && effects.debt < c.effects.debt
        ? " The requested borrowing exceeds the model credit limit; the remainder is charged to cash and may create an unpaid shortfall."
        : ""),
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
      : r.stepInYear === 2 &&
          settings().randomEvents &&
          (r.modelVersion || Math.random() < chance)
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
      `<p class="cq-eyebrow">YOUR DECISION · ${esc(h.choice)}</p><h2>${esc(h.title)}: what changed?</h2><div class="cq-choice-feedback"><p>${esc(h.feedback)}</p></div>${deltas(h.before, h.after)}${h.effects.income ? `<p class="cq-note">Pay change this year: ${money(h.effects.income)} before taxes.</p>` : ""}${h.effects.annualIncome ? `<p class="cq-note">Yearly pay change: ${money(h.effects.annualIncome)} before taxes. This continues in later years.</p>` : ""}${
        h.effects.monthly
          ? `<p class="cq-note">Monthly bill change: ${Object.entries(
              h.effects.monthly,
            )
              .map(([k, v]) => `${expenseLabels[k]} ${money(v)}`)
              .join(", ")}. This continues in later years.</p>`
          : ""
      }<p>Pay and regular bills are added at the year review.</p><div class="cq-inline-actions"><button class="btn" id="continue-decision">${r.afterFeedback === "yearSummary" ? "Review this year" : "Next decision"}</button></div>`,
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
  if (state.run.modelVersion) return settleLifeYear();
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
  if (!l.parts) return legacyLedgerTable(l);
  const rows = [
    ["Cash at start of year", money(l.openingCash)],
    ["One-time cash changes from decisions", money(l.decisionCash)],
    ["Pay before taxes", money(l.gross)],
    ["Estimated taxes", `−${money(l.taxes)}`],
    ...Object.entries(l.parts)
      .filter(([, v]) => v)
      .map(([k, v]) => [expenseLabels[k] + " · annual", `−${money(v * 12)}`]),
    ["Retirement savings", `−${money(l.retirement)}`],
    ["Education payment", `−${money(l.educationDue)}`],
    ["Consumer-debt payment", `−${money(l.consumerDue)}`],
    ["New borrowing to cover the shortfall", money(l.newBorrowing)],
    ["Cash at year end", money(l.closing.cash)],
    [
      "Interest added: education / consumer",
      `${money(l.educationInterest)} / ${money(l.consumerInterest)}`,
    ],
    [
      "Debt balance: education / consumer",
      `${money(l.educationBalance)} / ${money(l.consumerBalance)}`,
    ],
    ["Retirement balance (no returns assumed)", money(l.retirementBalance)],
  ];
  return `<table class="cq-ledger"><caption>Year ${l.year} / Where every dollar went</caption><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
}
function legacyLedgerTable(l) {
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
function nextYearPlan() {
  const r = state.run;
  if (!r.modelVersion || r.year === 5) return "";
  return `<section class="cq-next-plan"><h3>Adjust before next year</h3><p>Adjust next year’s plan. Moving costs $650 in this game. Transit is available in this scenario.</p><div class="cq-budget-inputs"><label>Home<select id="next-home">${[
    ["shared", "Shared home"],
    ["solo", "Live alone"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${r.housing === v ? "selected" : ""}>${t}</option>`,
    )
    .join("")}</select></label><label>Travel<select id="next-transport">${[
    ["car", "Car"],
    ["transit", "Transit"],
    ["carpool", "Carpool"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${r.transport === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Retirement savings<select id="next-retirement">${[0, 0.04, 0.08].map((v) => `<option value="${v}" ${(r.retirementRate ?? 0.04) === v ? "selected" : ""}>${Math.round(v * 100)}%</option>`).join("")}</select></label></div></section>`;
}
function renderYearSummary() {
  const r = state.run,
    l = r.yearLedgers.find((x) => x.year === r.year);
  setScreen(
    layout(
      `<p class="cq-eyebrow">PAUSE & REVIEW</p><h2>Year ${r.year}: your choices add up.</h2>${deltas(r.yearStart, r.stats)}${financialSnapshot()}${ledgerTable(l)}${l.newBorrowing ? `<p class="cq-note">You borrowed ${money(l.newBorrowing)} to cover bills. The remaining balance uses ${Math.round(BORROWING_RATE * 100)}% yearly interest in this game.</p>` : ""}${r.stats.cash < 0 ? '<p class="cq-note">You still have unpaid bills. What could you change next year?</p>' : ""}<h3>Your decisions this year</h3>${recap(r.history.filter((h) => h.year === r.year))}<p class="cq-note">Which choice helped your money but cost you time or well-being?</p>${nextYearPlan()}<button class="btn" id="next-year">${r.year === 5 ? "See my five-year story" : `Begin year ${r.year + 1}`}</button>`,
    ),
    "live",
  );
  document.getElementById("next-year").addEventListener("click", () => {
    const nextHome = document.getElementById("next-home")?.value,
      nextTransport = document.getElementById("next-transport")?.value,
      nextRetirement = Number(
        document.getElementById("next-retirement")?.value,
      );
    if (r.year === 5) r.phase = "report";
    else {
      r.year++;
      r.stepInYear = 0;
      r.yearStart = snapshot(r.stats);
      if (
        r.modelVersion &&
        nextHome &&
        (r.housing !== nextHome ||
          r.transport !== nextTransport ||
          (r.retirementRate ?? 0.04) !== nextRetirement)
      ) {
        const before = snapshot(r.stats),
          fee = r.housing !== nextHome ? 650 : 0;
        r.housing = nextHome;
        r.transport = nextTransport;
        r.retirementRate = nextRetirement;
        r.stats.cash -= fee;
        updateNetWorth();
        r.history.push({
          id: `plan-${r.year}`,
          title: "Revised living plan",
          year: r.year,
          choice: `${nextHome} / ${nextTransport} / retirement ${nextRetirement * 100}%`,
          text: "Plan changed at the previous year review",
          feedback: `New costs apply this year. Housing transition cost: ${money(fee)}.`,
          effects: { cash: -fee },
          before,
          after: snapshot(r.stats),
        });
      }
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
    `Would you choose a different path? Name one real cost or career requirement you would research first.`,
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
      [r.modelVersion ? "Total debt" : "Education debt", money(r.stats.debt)],
      ["Net worth", money(r.stats.netWorth)],
    ]
      .map(
        ([k, v]) =>
          `<div class="cq-stat"><strong>${k}</strong><span>${v}</span></div>`,
      )
      .join(
        "",
      )}</div><p>Well-being: <strong>${r.stats.happiness}/100</strong> · Stress: <strong>${r.stats.stress}/100</strong> · Life balance: <strong>${r.stats.workLife}/100</strong> · Work performance: <strong>${r.stats.performance}/100</strong></p><p>Most practiced skills: ${growth.map(([k, v]) => `${labels[k]} (+${v})`).join(", ")}. Changes are measured from the start of your working years.</p>${financialSnapshot()}<h3>Your decision trail</h3><details><summary>Review all ${r.history.length} decisions</summary>${recap(r.history)}</details><details><summary>Review annual budgets</summary>${r.yearLedgers.map(ledgerTable).join("")}</details><h3>Explain your story</h3><p>Use your decision trail and budgets as evidence. Responses save on this device.</p>${reflectionPrompts()
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
          `Year ${l.year}: Gross ${money(l.gross)}, withholding ${money(l.taxes)}, living ${money(l.living)}, debt payment ${money(l.payment)}, interest ${money(l.interest)}, retirement contribution ${money(l.retirement || 0)}, new borrowing ${money(l.newBorrowing || 0)}. Closing cash ${money(l.closing.cash)}, debt ${money(l.closing.debt)}. ${
            l.parts
              ? Object.entries(l.parts)
                  .map(
                    ([k, v]) =>
                      expenseLabels[k] + ": " + money(v * 12) + "/year",
                  )
                  .join("; ")
              : ""
          }`,
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
