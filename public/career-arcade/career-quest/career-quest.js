const SETTINGS_KEY = 'taCareerQuestSettings';
const RUN_KEY = 'taCareerQuestRun';
const HISTORY_KEY = 'taCareerQuestHistory';

const defaultSettings = {
  difficulty: 'normal',
  costOfLiving: 'average',
  randomEvents: true,
  allowOverride: true,
  allowReplay: true,
  careerClusters: [],
  enabledCareers: []
};

const quizQuestions = [
  { q: 'Which task sounds most energizing?', map: { communication: 3, leadership: 2, creativity: 2 } },
  { q: 'You are strongest when deadlines are tight.', map: { timeManagement: 3, adaptability: 2, professionalism: 1 } },
  { q: 'You enjoy solving technical problems.', map: { techLiteracy: 3, problemSolving: 3 } },
  { q: 'You prefer helping teams stay coordinated.', map: { teamwork: 3, communication: 2 } },
  { q: 'You like planning budgets and comparing options.', map: { financialLiteracy: 3, problemSolving: 2 } },
  { q: 'You stay calm in changing situations.', map: { adaptability: 3, professionalism: 2 } },
  { q: 'You are comfortable presenting to groups.', map: { communication: 3, leadership: 2 } },
  { q: 'You like designing something from scratch.', map: { creativity: 3, problemSolving: 2 } },
  { q: 'You notice process issues others miss.', map: { professionalism: 2, timeManagement: 2, problemSolving: 2 } },
  { q: 'You like coaching peers to improve.', map: { teamwork: 2, leadership: 3, communication: 1 } }
];

const educationPaths = {
  workforce: { label: 'HS / Workforce', debt: 1000, salaryMod: 0.9, stress: 8, skill: { professionalism: 4, timeManagement: 3 } },
  trade: { label: 'Trade School', debt: 9000, salaryMod: 1.0, stress: 10, skill: { techLiteracy: 4, problemSolving: 2 } },
  cc: { label: 'Community College', debt: 15000, salaryMod: 1.02, stress: 12, skill: { communication: 2, teamwork: 2, financialLiteracy: 3 } },
  college: { label: '4-Year College', debt: 36000, salaryMod: 1.1, stress: 18, skill: { communication: 3, leadership: 2 } },
  grad: { label: 'Graduate School', debt: 62000, salaryMod: 1.18, stress: 24, skill: { professionalism: 2, leadership: 3, problemSolving: 3 } }
};

const memoryStore = {};
const storage = {
  available: (() => {
    try { localStorage.setItem('__tacq', '1'); localStorage.removeItem('__tacq'); return true; } catch { return false; }
  })(),
  get(key) { return this.available ? JSON.parse(localStorage.getItem(key) || 'null') : memoryStore[key] || null; },
  set(key, value) { if (this.available) localStorage.setItem(key, JSON.stringify(value)); else memoryStore[key] = value; },
  remove(key) { if (this.available) localStorage.removeItem(key); else delete memoryStore[key]; }
};

const state = { careers: [], scenarios: { core: [], workplace: [], money: [] }, settings: null, run: null };

async function init() {
  const [careers, core, workplace, money] = await Promise.all([
    fetch('./data/careers.json').then(r => r.json()),
    fetch('./data/scenarios-core.json').then(r => r.json()),
    fetch('./data/scenarios-workplace.json').then(r => r.json()),
    fetch('./data/scenarios-money.json').then(r => r.json())
  ]);

  state.careers = careers;
  state.scenarios = { core, workplace, money };

  const saved = storage.get(SETTINGS_KEY) || {};
  state.settings = { ...defaultSettings, ...saved };
  if (!state.settings.careerClusters.length) state.settings.careerClusters = [...new Set(careers.map(c => c.cluster))];
  if (!state.settings.enabledCareers.length) state.settings.enabledCareers = careers.map(c => c.id);

  renderSettings();
  bindControls();
  updateContinueButton();
  if (!storage.available) {
    const warning = document.getElementById('storage-warning');
    warning.hidden = false;
    warning.textContent = 'localStorage is unavailable in this browser, so progress is only kept during this tab session.';
  }

  renderIntro();
}

function bindControls() {
  document.getElementById('start-run').addEventListener('click', startRun);
  document.getElementById('continue-run').addEventListener('click', continueRun);
  document.getElementById('reset-run').addEventListener('click', resetRun);
}

function renderSettings() {
  const form = document.getElementById('settings-form');
  const clusters = [...new Set(state.careers.map(c => c.cluster))];
  form.innerHTML = `
    ${selectField('difficulty','Difficulty',['easy','normal','hard'],state.settings.difficulty)}
    ${selectField('costOfLiving','Cost of Living',['low','average','high'],state.settings.costOfLiving)}
    ${toggleField('randomEvents','Random Events',state.settings.randomEvents)}
    ${toggleField('allowOverride','Allow Override',state.settings.allowOverride)}
    ${toggleField('allowReplay','Allow Replay',state.settings.allowReplay)}
    <div class="cq-field"><label>Allowed Clusters</label><div class="cq-checkboxes">${clusters.map(c => checkbox('cluster', c, state.settings.careerClusters.includes(c))).join('')}</div></div>
    <div class="cq-field"><label>Allowed Careers</label><div class="cq-checkboxes">${state.careers.map(c => checkbox('career', c.id, state.settings.enabledCareers.includes(c.id), c.title)).join('')}</div></div>
  `;
  form.addEventListener('change', saveSettingsFromUI);
}

function selectField(id, label, options, value) { return `<div class="cq-field"><label for="${id}">${label}</label><select id="${id}">${options.map(o=>`<option value="${o}" ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`; }
function toggleField(id, label, checked) { return `<div class="cq-field"><label for="${id}">${label}</label><select id="${id}"><option value="true" ${checked?'selected':''}>On</option><option value="false" ${!checked?'selected':''}>Off</option></select></div>`; }
function checkbox(type, value, checked, label) { return `<label><input type="checkbox" data-type="${type}" value="${value}" ${checked?'checked':''}/> ${label || value}</label>`; }

function saveSettingsFromUI() {
  const data = {
    difficulty: document.getElementById('difficulty').value,
    costOfLiving: document.getElementById('costOfLiving').value,
    randomEvents: document.getElementById('randomEvents').value === 'true',
    allowOverride: document.getElementById('allowOverride').value === 'true',
    allowReplay: document.getElementById('allowReplay').value === 'true',
    careerClusters: [...document.querySelectorAll('input[data-type="cluster"]:checked')].map(x => x.value),
    enabledCareers: [...document.querySelectorAll('input[data-type="career"]:checked')].map(x => x.value)
  };
  state.settings = data;
  storage.set(SETTINGS_KEY, data);
}

function filteredCareers() {
  return state.careers.filter(c => state.settings.careerClusters.includes(c.cluster) && state.settings.enabledCareers.includes(c.id));
}

function startRun() {
  const skills = baseSkills();
  state.run = {
    phase: 'quiz',
    year: 1,
    stepInYear: 0,
    cardsPlayed: 0,
    maxCards: 12,
    careerId: null,
    educationKey: null,
    quizScores: skills,
    stats: {
      cash: 2000, debt: 0, netWorth: 2000,
      happiness: 60, stress: 40, workLife: 55, performance: 50,
      skills
    },
    history: [],
    pendingFeedback: ''
  };
  persistRun();
  renderQuiz();
}

function continueRun() {
  const saved = storage.get(RUN_KEY);
  if (!saved) return;
  state.run = saved;
  renderByPhase();
}

function resetRun() {
  if (!confirm('Reset your saved Career Quest run?')) return;
  storage.remove(RUN_KEY);
  state.run = null;
  updateContinueButton();
  renderIntro();
}

function updateContinueButton() {
  document.getElementById('continue-run').disabled = !storage.get(RUN_KEY);
}

function persistRun() { storage.set(RUN_KEY, state.run); updateContinueButton(); }

function renderByPhase() {
  if (!state.run) return renderIntro();
  if (state.run.phase === 'quiz') return renderQuiz();
  if (state.run.phase === 'career') return renderCareerSelection();
  if (state.run.phase === 'education') return renderEducationSelection();
  if (state.run.phase === 'yearSummary') return renderYearSummary();
  if (state.run.phase === 'report') return renderReport();
  renderScenario();
}

function renderIntro() {
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Ready to start?</h2><p>Use <strong>Start New Run</strong> for a fresh simulation. If a saved run is found, <strong>Continue Saved Run</strong> picks up where the student left off.</p></div>`;
}

function renderQuiz() {
  const i = state.run.quizIndex || 0;
  const q = quizQuestions[i];
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Career Fit Quiz (${i + 1}/${quizQuestions.length})</h2><p>${q.q}</p><div class="cq-option-list">
    <button class="cq-option" data-score="3">Strongly Me</button>
    <button class="cq-option" data-score="2">Somewhat Me</button>
    <button class="cq-option" data-score="1">A little bit</button>
  </div></div>`;
  document.querySelectorAll('.cq-option').forEach(btn => btn.addEventListener('click', () => {
    const mult = Number(btn.dataset.score);
    Object.entries(q.map).forEach(([skill, points]) => state.run.quizScores[skill] += points * mult);
    state.run.quizIndex = i + 1;
    if (state.run.quizIndex >= quizQuestions.length) {
      state.run.phase = 'career';
    }
    persistRun();
    renderByPhase();
  }));
}

function renderCareerSelection() {
  const available = filteredCareers();
  const ranked = [...available].sort((a, b) => affinityScore(b, state.run.quizScores) - affinityScore(a, state.run.quizScores));
  const recommended = ranked.slice(0, 5);
  let pool = state.settings.allowOverride ? available : recommended;
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Pick a Career</h2>
  <p>Top recommendations based on your fit quiz:</p>
  <ul>${recommended.map(c => `<li><strong>${c.title}</strong> — Why it fits: ${topSkillsReason(c)}</li>`).join('')}</ul>
  <div class="cq-option-list">${pool.map(c => `<button class="cq-option" data-id="${c.id}">${c.title} <small>(${c.cluster})</small></button>`).join('')}</div></div>`;
  document.querySelectorAll('.cq-option').forEach(btn => btn.addEventListener('click', () => {
    state.run.careerId = btn.dataset.id;
    state.run.phase = 'education';
    persistRun();
    renderEducationSelection();
  }));
}

function renderEducationSelection() {
  const career = state.careers.find(c => c.id === state.run.careerId);
  const options = Object.entries(educationPaths).filter(([k]) => career.educationOptions.includes(k));
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Choose Education Path</h2><p><strong>${career.title}</strong> has these path options.</p>
  <div class="cq-option-list">${options.map(([k, v]) => `<button class="cq-option" data-path="${k}">${v.label}<br><small>Debt +$${v.debt.toLocaleString()} | Salary x${v.salaryMod}</small></button>`).join('')}</div></div>`;
  document.querySelectorAll('.cq-option').forEach(btn => btn.addEventListener('click', () => {
    applyEducation(btn.dataset.path);
    state.run.phase = 'scenario';
    persistRun();
    renderScenario();
  }));
}

function applyEducation(pathKey) {
  state.run.educationKey = pathKey;
  const edu = educationPaths[pathKey];
  state.run.stats.debt += edu.debt;
  state.run.stats.stress = clamp(state.run.stats.stress + edu.stress);
  Object.entries(edu.skill).forEach(([k, v]) => state.run.stats.skills[k] = clamp(state.run.stats.skills[k] + v));
  updateNetWorth();
}

function renderScenario() {
  const run = state.run;
  const scenario = pickScenario();
  run.currentScenario = scenario;
  const stats = run.stats;
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Year ${run.year}: ${scenario.title}</h2>
  <p><em>${scenario.category}</em> — ${scenario.prompt}</p>
  ${statsPanel(stats)}
  <div class="cq-option-list">${scenario.choices.map((c, idx) => `<button class="cq-option" data-idx="${idx}"><strong>${c.label}:</strong> ${c.text}</button>`).join('')}</div>
  ${run.pendingFeedback ? `<div class="cq-choice-feedback">${run.pendingFeedback}</div>` : ''}
  </div>`;

  document.querySelectorAll('.cq-option').forEach(btn => btn.addEventListener('click', () => {
    applyChoice(scenario, scenario.choices[Number(btn.dataset.idx)]);
    persistRun();
    renderByPhase();
  }));
}

function pickScenario() {
  const run = state.run;
  const difficultyChance = { easy: 0.3, normal: 0.45, hard: 0.6 }[state.settings.difficulty];
  const wantRandom = state.settings.randomEvents && Math.random() < difficultyChance;
  const mode = run.stepInYear === 0 ? 'workplace' : run.stepInYear === 1 ? 'money' : 'core';
  const list = state.scenarios[mode];
  const unused = list.filter(s => !run.history.find(h => h.id === s.id));
  return (unused.length ? unused : list)[Math.floor(Math.random() * (unused.length ? unused.length : list.length))];
}

function applyChoice(scenario, choice) {
  const before = snapshotCore(state.run.stats);
  const effects = scaleEffects(choice.effects);
  applyEffects(state.run.stats, effects);
  state.run.cardsPlayed += 1;
  state.run.stepInYear += 1;
  if (state.run.stepInYear >= 2) {
    const randomChance = { easy: 0.2, normal: 0.4, hard: 0.55 }[state.settings.difficulty];
    if (state.settings.randomEvents && Math.random() < randomChance && state.run.cardsPlayed < state.run.maxCards) {
      state.run.stepInYear = 2;
    } else {
      state.run.phase = 'yearSummary';
    }
  }
  if (state.run.stepInYear > 2) state.run.phase = 'yearSummary';
  if (state.run.cardsPlayed >= state.run.maxCards || state.run.year >= 5 && state.run.phase === 'yearSummary') state.run.phase = 'report';

  state.run.pendingFeedback = choice.feedback || 'You made a call under pressure and learned something useful.';
  state.run.history.push({ id: scenario.id, title: scenario.title, year: state.run.year, choice: choice.label, effects, impact: combinedImpact(before, state.run.stats) });
}

function renderYearSummary() {
  const run = state.run;
  const yearItems = run.history.filter(h => h.year === run.year);
  const summaryImpact = yearItems.reduce((acc, item) => acc + Math.abs(item.impact), 0).toFixed(1);
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Year ${run.year} Summary</h2>
  <p>You completed ${yearItems.length} scenario cards this year. Combined core impact score: <strong>${summaryImpact}</strong>.</p>
  ${statsPanel(run.stats)}
  <p>Narrative recap: You balanced performance pressure with personal life tradeoffs, and each decision shaped long-term stability.</p>
  <div class="cq-inline-actions"><button class="btn" id="next-year">${run.year >= 5 || run.cardsPlayed >= run.maxCards ? 'View Report Card' : 'Start Next Year'}</button></div>
  </div>`;
  document.getElementById('next-year').addEventListener('click', () => {
    run.year += 1;
    run.stepInYear = 0;
    run.pendingFeedback = '';
    run.phase = run.year > 5 || run.cardsPlayed >= run.maxCards ? 'report' : 'scenario';
    persistRun();
    renderByPhase();
  });
}

function renderReport() {
  const run = state.run;
  const career = state.careers.find(c => c.id === run.careerId);
  const topSkills = Object.entries(run.stats.skills).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  const turning = [...run.history].sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact))[0];
  const reflections = buildReflection(run, turning);
  const row = (k,v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
  document.getElementById('screen').innerHTML = `<div class="cq-card cq-report"><h2>Report Card</h2>
  <table>
    ${row('Career', career.title)}
    ${row('Education Path', educationPaths[run.educationKey].label)}
    ${row('Difficulty', state.settings.difficulty)}
    ${row('Cost of Living', state.settings.costOfLiving)}
    ${row('Cash', `$${Math.round(run.stats.cash).toLocaleString()}`)}
    ${row('Debt', `$${Math.round(run.stats.debt).toLocaleString()}`)}
    ${row('Net Worth', `$${Math.round(run.stats.netWorth).toLocaleString()}`)}
    ${row('Happiness / Stress / Work-Life', `${run.stats.happiness} / ${run.stats.stress} / ${run.stats.workLife}`)}
    ${row('Performance', run.stats.performance)}
    ${row('Top Improved Skills', topSkills.join(', '))}
    ${row('Biggest Turning Point', turning ? `${turning.title} (${turning.choice})` : 'N/A')}
  </table>
  <h3>Reflection Questions</h3>
  <ol>${reflections.map(r=>`<li>${r}</li>`).join('')}</ol>
  <div class="cq-inline-actions"><button class="btn" id="print-report">Print Report</button>${state.settings.allowReplay ? '<button class="btn secondary" id="replay">Replay</button>' : ''}</div>
  </div>`;

  document.getElementById('print-report').addEventListener('click', () => window.print());
  const replayBtn = document.getElementById('replay');
  if (replayBtn) replayBtn.addEventListener('click', startRun);

  const history = storage.get(HISTORY_KEY) || [];
  history.push({ completedAt: new Date().toISOString(), run });
  storage.set(HISTORY_KEY, history);
  storage.remove(RUN_KEY);
  updateContinueButton();
}

function buildReflection(run, turning) {
  return [
    `Which debt-related decision had the strongest long-term effect on your net worth?`,
    `When did your stress spike the most, and what caused it?`,
    `Describe one opportunity tradeoff you accepted and why.`,
    `Which skill improved most during your run, and where did that growth show up?`,
    `If you replayed with a different education path, what would you change first?`,
    `How did cost-of-living pressure affect your money choices?`,
    `What advice would you give a student entering ${state.careers.find(c => c.id === run.careerId).title}?`,
    `How did the turning point scenario (${turning ? turning.title : 'N/A'}) shape your final report card?`
  ];
}

function statsPanel(stats) {
  return `<div class="cq-stats">
    ${stat('Cash', `$${Math.round(stats.cash).toLocaleString()}`)}
    ${stat('Debt', `$${Math.round(stats.debt).toLocaleString()}`)}
    ${stat('Net Worth', `$${Math.round(stats.netWorth).toLocaleString()}`)}
    ${stat('Happiness', stats.happiness)}
    ${stat('Stress', stats.stress)}
    ${stat('Work-Life', stats.workLife)}
    ${stat('Performance', stats.performance)}
  </div>`;
}

function stat(label, value) { return `<div class="cq-stat"><strong>${label}</strong><span>${value}</span></div>`; }
function baseSkills() { return { communication: 20, teamwork: 20, problemSolving: 20, leadership: 20, techLiteracy: 20, financialLiteracy: 20, timeManagement: 20, adaptability: 20, professionalism: 20, creativity: 20 }; }
function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function updateNetWorth() { state.run.stats.netWorth = Math.round(state.run.stats.cash - state.run.stats.debt); }

function applyEffects(stats, effects) {
  const expense = { low: 450, average: 700, high: 980 }[state.settings.costOfLiving];
  const salary = startingSalary();
  stats.cash += salary / 12 - expense;
  Object.entries(effects).forEach(([k, v]) => {
    if (k in stats.skills) stats.skills[k] = clamp(stats.skills[k] + v);
    else if (k in stats && typeof stats[k] === 'number') stats[k] = k === 'cash' || k === 'debt' ? stats[k] + v : clamp(stats[k] + v);
  });
  updateNetWorth();
}

function scaleEffects(effects) {
  const mult = { easy: 0.8, normal: 1, hard: 1.25 }[state.settings.difficulty];
  const scaled = {};
  Object.entries(effects).forEach(([k,v]) => scaled[k] = Math.round(v * mult));
  return scaled;
}

function startingSalary() {
  const career = state.careers.find(c => c.id === state.run.careerId);
  const midpoint = (career.salaryStartRange[0] + career.salaryStartRange[1]) / 2;
  return midpoint * educationPaths[state.run.educationKey].salaryMod;
}

function affinityScore(career, quiz) {
  return Object.entries(career.skillAffinities).reduce((acc, [k,v]) => acc + (quiz[k] || 0) * v, 0);
}
function topSkillsReason(career) {
  return Object.entries(career.skillAffinities).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join(', ');
}
function snapshotCore(stats) { return { cash: stats.cash, debt: stats.debt, happiness: stats.happiness, stress: stats.stress, workLife: stats.workLife, performance: stats.performance }; }
function combinedImpact(before, after) {
  return (after.cash-before.cash)/1000 - (after.debt-before.debt)/1000 + (after.happiness-before.happiness) - (after.stress-before.stress) + (after.workLife-before.workLife) + (after.performance-before.performance);
}

init().catch(err => {
  document.getElementById('screen').innerHTML = `<div class="cq-card"><h2>Unable to load Career Quest data</h2><p>Please refresh the page. Error: ${err.message}</p></div>`;
});
