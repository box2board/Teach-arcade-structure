import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { JSDOM } = await import(
  pathToFileURL(path.resolve(process.argv[2])).href
);
const root = fileURLToPath(
  new URL("../public/career-arcade/career-quest/", import.meta.url),
);
const questions = JSON.parse(fs.readFileSync(root + "data/discovery.json"));
const careers = JSON.parse(fs.readFileSync(root + "data/careers.json"));
const interests = JSON.parse(
  fs.readFileSync(root + "data/career-interests.json"),
);
assert.equal(questions.length, 36);
assert.equal(new Set(questions.map((q) => q.id)).size, 36);
for (const k of "RIASEC")
  assert.equal(questions.filter((q) => q.type === k).length, 6);
for (const c of careers)
  assert.equal(Object.keys(interests.profiles[c.socCode]).length, 6);
const dom = new JSDOM(fs.readFileSync(root + "index.html", "utf8"), {
    url: "https://teacharcade.com/career-arcade/career-quest/",
    runScripts: "outside-only",
  }),
  w = dom.window;
const errors = [];
w.addEventListener("error", (e) => errors.push(e.error));
w.HTMLElement.prototype.scrollIntoView = () => {};
w.confirm = () => true;
w.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(fs.readFileSync(root + url.replace("./", ""), "utf8")),
});
w.eval(
  fs.readFileSync(root + "career-quest.js", "utf8") +
    "\nwindow.cq={state,interestProfile,hasInterestSignal,affinityScore,applyChoice,settleYear,pickScenario,snapshot,monthlyBreakdown,yearGross,estimatedWithholding,educationPayment,renderByPhase};",
);
await new Promise((r) => setTimeout(r, 0));
w.document.getElementById("start-run").click();
const api = w.cq,
  base = JSON.parse(JSON.stringify(api.state.run));
// The actual UI supports revisiting an answer without adding it twice.
w.document.querySelector('[data-score="4"]').click();
w.document.getElementById("quiz-back").click();
w.document.querySelector('[data-score="0"]').click();
assert.equal(api.state.run.interestAnswers.R1, 0);
assert.equal(Object.keys(api.state.run.interestAnswers).length, 1);
assert.equal(api.interestProfile().R, 0);
w.document.querySelector('[data-score="skip"]').click();
assert.equal(api.interestProfile().I, null);
const matching = [];
for (const k of "RIASEC") {
  api.state.run.interestAnswers = Object.fromEntries(
    questions.map((q) => [q.id, q.type === k ? 4 : 0]),
  );
  assert(api.hasInterestSignal());
  const ranked = [...api.state.careers].sort(
    (a, b) => api.affinityScore(b) - api.affinityScore(a),
  );
  const scores = ranked.map((c) => api.affinityScore(c));
  assert(scores.every(Number.isFinite));
  assert(
    scores[0] > 0.7,
    "clear pattern should have a corresponding occupation",
  );
  const best = interests.profiles[ranked[0].socCode];
  assert.equal(
    best[k],
    Math.max(...Object.values(best)),
    "top occupation must share the dominant area",
  );
  matching.push({ pattern: k, top: ranked.slice(0, 5).map((c) => c.title) });
}
for (const answer of [0, 2, 4, null]) {
  api.state.run.interestAnswers = Object.fromEntries(
    questions.map((q) => [q.id, answer]),
  );
  assert.equal(
    api.hasInterestSignal(),
    false,
    "flat or skipped answers must not imply career fit",
  );
  assert.equal(api.affinityScore(careers[0]), 0);
}
api.state.run.interestAnswers = Object.fromEntries(
  questions.map((q) => [q.id, q.type === "S" ? 4 : 0]),
);
api.state.run.phase = "career";
api.renderByPhase();
assert(
  w.document.querySelectorAll(".cq-badge").length > 0,
  "clear answers should populate visible interest recommendations",
);
// Reproduce the screenshot: mixed/neutral answers with a clear relative difference.
const screenshotAnswers = {
  R: [2, 2, 2, 2, 2, 2],
  I: [2, 2, 2, 2, 2, 3],
  A: [2, 2, 2, 2, 2, 2],
  S: [2, 2, 2, 2, 3, 3],
  E: [1, 1, 2, 2, 2, 2],
  C: [0, 0, 1, 1, 1, 1],
};
api.state.run.interestAnswers = Object.fromEntries(
  questions.map((q) => [
    q.id,
    screenshotAnswers[q.type][Number(q.id.slice(1)) - 1],
  ]),
);
api.state.run.explorer = {
  query: "",
  cluster: "all",
  recommended: true,
  limit: 12,
};
assert.equal(api.hasInterestSignal(), true);
api.renderByPhase();
assert(
  w.document.querySelectorAll("[data-career]").length > 0,
  "the exact screenshot pattern must produce suggestions",
);
assert(
  !w.document
    .getElementById("screen")
    .textContent.includes("There is no clear pattern"),
);
// Flat and incomplete patterns must have honest starting points, never an empty shortlist.
for (const answer of [0, 2, 4, null]) {
  api.state.run.interestAnswers = Object.fromEntries(
    questions.map((q) => [q.id, answer]),
  );
  api.state.run.explorer = {
    query: "",
    cluster: "all",
    recommended: true,
    limit: 12,
  };
  api.renderByPhase();
  assert(w.document.querySelectorAll("[data-career]").length > 0);
  assert(
    w.document
      .getElementById("screen")
      .textContent.includes("not personalized matches"),
  );
  assert(
    [...w.document.querySelectorAll(".cq-badge")].every(
      (el) => el.textContent === "Starting point",
    ),
  );
}
const shortlist = [...w.document.querySelectorAll("[data-career]")].map((el) =>
  careers.find((c) => c.id === el.dataset.career),
);
const otherCluster = careers.find(
  (c) => !shortlist.some((x) => x.cluster === c.cluster),
).cluster;
const cluster = w.document.getElementById("career-cluster");
cluster.value = otherCluster;
cluster.dispatchEvent(new w.Event("change", { bubbles: true }));
assert(
  w.document.querySelectorAll("[data-career]").length > 0,
  "a field filter must broaden the shortlist when other allowed careers exist",
);
assert.equal(w.document.getElementById("career-filter-note").hidden, false);
assert.equal(w.document.getElementById("recommended-only").checked, false);
const originalSettings = JSON.parse(JSON.stringify(api.state.run.settings));
api.state.run.settings.enabledCareers = ["police-officer"];
api.state.run.explorer = {
  query: "",
  cluster: "all",
  recommended: true,
  limit: 12,
};
api.renderByPhase();
assert.equal(
  w.document.querySelectorAll("[data-career]").length,
  1,
  "fallback must preserve teacher restrictions",
);
assert.equal(
  w.document.querySelector("[data-career]").dataset.career,
  "police-officer",
);
api.state.run.settings = originalSettings;
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function simulate(
  c,
  {
    housing = "shared",
    transport = "car",
    care = "none",
    region = "average",
    policy = 0,
    seed = 1,
  } = {},
) {
  const r = (api.state.run = JSON.parse(JSON.stringify(base)));
  r.careerId = c.id;
  r.educationKey = c.modelPaths[0];
  r.housing = housing;
  r.transport = transport;
  r.care = care;
  r.settings.costOfLiving = region;
  const costs = {
    workforce: 1000,
    trade: 9000,
    cc: 15000,
    college: 36000,
    grad: 62000,
  };
  r.educationDebt = costs[r.educationKey];
  r.initialDebt = r.educationDebt;
  r.consumerDebt = 0;
  r.stats.debt = r.educationDebt;
  const rand = rng(seed);
  w.Math.random = rand;
  for (let year = 1; year <= 5; year++) {
    r.year = year;
    r.stepInYear = 0;
    r.yearStart = api.snapshot(r.stats);
    for (let i = 0; i < 3; i++) {
      const s = api.pickScenario();
      assert(s, "eligible scenario pool must be nonempty");
      const ch =
        s.choices[policy === "random" ? Math.floor(rand() * 3) : policy];
      api.applyChoice(s, ch);
    }
    api.settleYear();
    const l = r.yearLedgers.at(-1);
    assert.equal(
      l.closing.cash,
      l.openingCash +
        l.decisionCash +
        l.gross -
        l.taxes -
        l.living -
        l.retirement -
        l.payment +
        l.newBorrowing,
      "every annual cash flow reconciles",
    );
    assert.equal(r.stats.debt, r.educationDebt + r.consumerDebt);
    assert.equal(r.stats.netWorth, r.stats.cash + r.retirement - r.stats.debt);
    assert(r.stats.debt >= 0);
    assert(
      Object.values(r.stats)
        .filter((x) => typeof x === "number")
        .every(Number.isFinite),
    );
    const cash = r.stats.cash;
    api.settleYear();
    assert.equal(r.stats.cash, cash, "no duplicate year settlement");
  }
  assert.equal(r.history.length, 15);
  assert(
    r.yearLedgers[4].parts.maintenance > r.yearLedgers[0].parts.maintenance,
  );
  return {
    career: c.title,
    region,
    housing,
    transport,
    care,
    policy,
    cash: r.stats.cash,
    educationDebt: r.educationDebt,
    consumerDebt: r.consumerDebt,
    retirement: r.retirement,
    netWorth: r.stats.netWorth,
    newBorrowing: r.yearLedgers.reduce((n, l) => n + l.newBorrowing, 0),
  };
}
const chosen = [
  "registered-nurse",
  "electrician",
  "software-developer",
  "cashier",
  "retail-salesperson",
  "soc-35-2014-00",
]
  .map((id) => careers.find((c) => c.id === id))
  .filter(Boolean);
if (chosen.length < 5)
  chosen.push(
    ...careers.filter((c) => c.salaryStartRange[1] < 35000).slice(0, 3),
  );
const outcomes = [];
for (const c of chosen)
  for (const policy of [0, 1, 2, "random"])
    for (const housing of ["shared", "solo"])
      outcomes.push(
        simulate(c, { policy, housing, seed: outcomes.length + 1 }),
      );
assert(
  outcomes.some((x) => x.newBorrowing > 0),
  "some ordinary paths must face a cash-flow shortfall",
);
assert(
  outcomes.some((x) => x.newBorrowing === 0),
  "not every path should be forced into new borrowing",
);
assert(
  outcomes.some((x) => x.cash < 5000),
  "some outcomes must have little cash buffer",
);
assert(
  outcomes.some((x) => x.cash > 10000),
  "positive outcomes must remain possible",
);
const nurse = careers.find((c) => c.id === "registered-nurse");
const economical = simulate(nurse, {
  transport: "transit",
  housing: "shared",
  seed: 12,
});
const expensive = simulate(nurse, {
  housing: "solo",
  care: "dependent",
  region: "high",
  seed: 12,
});
assert(
  economical.netWorth > expensive.netWorth,
  "household costs must change results",
);
// Continuing obligations, higher-interest borrowing, and follow-ups are model behavior.
const r = (api.state.run = JSON.parse(JSON.stringify(base)));
Object.assign(r, {
  careerId: nurse.id,
  educationKey: "cc",
  housing: "shared",
  transport: "car",
  care: "none",
  educationDebt: 15000,
  initialDebt: 15000,
  consumerDebt: 1000,
  year: 1,
});
r.stats.debt = 16000;
const before = api.monthlyBreakdown().rent;
api.applyChoice(
  { id: "test-recurring", title: "Test" },
  {
    label: "Pay recurring rent",
    text: "",
    feedback: "",
    effects: { monthly: { rent: 120 }, income: -500, flag: "phonePlan" },
  },
);
assert.equal(api.monthlyBreakdown().rent, before + 120);
assert.equal(
  api.yearGross(),
  Math.round(
    ((nurse.salaryStartRange[0] + nurse.salaryStartRange[1]) / 2) * 1.02,
  ) - 500,
);
r.yearStart = api.snapshot(r.stats);
api.settleYear();
assert.equal(r.yearLedgers[0].consumerInterest, 220);
r.year = 2;
r.stepInYear = 1;
r.history = [];
assert.notEqual(
  api.pickScenario().id,
  "v3-money-08",
  "two-year plan must not end after one year",
);
r.year = 3;
assert.equal(
  api.pickScenario().id,
  "v3-money-08",
  "eligible plan follow-up must be selected",
);
assert.equal(errors.length, 0, errors[0]?.stack);
// The year review changes the actual next-year plan and records the moving charge.
const replanned = (api.state.run = JSON.parse(JSON.stringify(base)));
Object.assign(replanned, {
  careerId: nurse.id,
  educationKey: "cc",
  housing: "shared",
  transport: "car",
  care: "none",
  educationDebt: 15000,
  initialDebt: 15000,
  consumerDebt: 0,
});
replanned.stats.debt = 15000;
replanned.yearStart = api.snapshot(replanned.stats);
for (let i = 0; i < 3; i++) {
  const sc = api.pickScenario();
  api.applyChoice(sc, sc.choices[0]);
}
api.settleYear();
replanned.phase = "yearSummary";
api.renderByPhase();
const beforeMove = replanned.stats.cash;
w.document.getElementById("next-home").value = "solo";
w.document.getElementById("next-transport").value = "transit";
w.document.getElementById("next-retirement").value = "0";
w.document.getElementById("next-year").click();
assert.equal(replanned.year, 2);
assert.equal(replanned.stats.cash, beforeMove - 650);
assert.equal(replanned.housing, "solo");
assert.equal(replanned.transport, "transit");
assert.equal(replanned.retirementRate, 0);
assert.equal(replanned.history.at(-1).id, "plan-2");
api.settleYear();
assert.equal(replanned.yearLedgers.at(-1).retirement, 0);
// A credit limit cannot be bypassed by choosing scenario financing.
replanned.consumerDebt = 12000;
const priorCash = replanned.stats.cash;
api.applyChoice(
  { id: "limit", title: "Limit" },
  { label: "Finance", text: "", feedback: "", effects: { debt: 1000 } },
);
assert.equal(replanned.consumerDebt, 12000);
assert.equal(replanned.stats.cash, priorCash - 1000);
// Student copy stays concise, grammatical, and accurate for plural occupation titles.
function visibleWords(element) {
  const copy = element.cloneNode(true);
  for (const details of [
    ...copy.querySelectorAll("details:not([open])"),
  ].reverse())
    details.replaceWith(details.querySelector("summary")?.textContent || "");
  for (const option of copy.querySelectorAll("option:not(:checked)"))
    option.remove();
  return copy.textContent.trim().split(/\s+/).length;
}
const studentRun = (api.state.run = JSON.parse(JSON.stringify(base)));
const astronomer = api.state.careers.find(
  (c) => c.canonicalTitle === "Astronomers",
);
assert(astronomer);
studentRun.careerId = astronomer.id;
studentRun.phase = "education";
api.renderByPhase();
assert.equal(
  w.document.querySelector("#screen h2").textContent,
  "Plan your training",
);
assert(
  w.document
    .getElementById("screen")
    .textContent.includes("Career: Astronomers"),
);
assert(
  w.document
    .querySelector("[data-path] small")
    .textContent.includes("Yearly pay before taxes"),
);
assert(
  visibleWords(w.document.getElementById("screen")) < 65,
  "training should be readable at a glance",
);
const trainingInfo = w.document.querySelector(".cq-more-info");
assert(trainingInfo && !trainingInfo.open);
trainingInfo.open = true;
assert(trainingInfo.textContent.includes("specific degrees"));
w.document.querySelector("[data-path]").click();
assert.equal(
  w.document.querySelectorAll(".cq-budget-choice .cq-more-info").length,
  2,
);
assert([...w.document.querySelectorAll(".cq-more-info")].every((d) => !d.open));
assert(
  w.document
    .querySelector(".cq-budget-margin")
    .textContent.match(/Left each month|Short each month/),
);
assert(
  visibleWords(w.document.getElementById("screen")) < 190,
  "budget should lead with choices, not a rulebook",
);
studentRun.interestAnswers = Object.fromEntries(
  questions.map((q) => [q.id, q.type === "S" ? 4 : q.type === "I" ? 3 : 0]),
);
studentRun.phase = "career";
api.renderByPhase();
assert(
  !w.document
    .getElementById("screen")
    .textContent.includes("Worth exploring for"),
);
assert(
  w.document
    .querySelector(".cq-match-reason")
    .textContent.startsWith("Explore "),
);
// All 500 occupations are also swept with one reproducible shared-home/transit plan.
const sweep = careers.map((c, i) =>
  simulate(c, { transport: "transit", policy: "random", seed: i + 101 }),
);
const sweepSummary = {
  runs: sweep.length,
  withNewBorrowing: sweep.filter((x) => x.newBorrowing > 0).length,
  withoutNewBorrowing: sweep.filter((x) => !x.newBorrowing).length,
  unpaidShortfall: sweep.filter((x) => x.cash < 0).length,
};
assert(
  sweepSummary.withNewBorrowing > 0 && sweepSummary.withoutNewBorrowing > 0,
);
// A mid-journey legacy save retains the original economic rules and scenario bank.
const old = (api.state.run = JSON.parse(JSON.stringify(base)));
delete old.modelVersion;
Object.assign(old, {
  careerId: nurse.id,
  educationKey: "cc",
  housing: "shared",
  initialDebt: 15000,
});
old.stats.debt = 15000;
old.yearStart = api.snapshot(old.stats);
assert(!api.pickScenario().id.startsWith("v3-"));
api.settleYear();
assert.equal(old.yearLedgers[0].living, 1850 * 12);
assert.equal(old.yearLedgers[0].parts, undefined);
const report = {
  sweepSummary,
  method:
    "Deterministic fictional-model checks; not forecasts or validation of questionnaire accuracy",
  matching,
  outcomes,
  economical,
  expensive,
  summary: {
    runs: outcomes.length,
    withNewBorrowing: outcomes.filter((x) => x.newBorrowing > 0).length,
    withoutNewBorrowing: outcomes.filter((x) => !x.newBorrowing).length,
    minCash: Math.min(...outcomes.map((x) => x.cash)),
    maxCash: Math.max(...outcomes.map((x) => x.cash)),
  },
};
if (process.argv.includes("--report"))
  fs.writeFileSync(
    new URL("../reports/career-quest-model-checks.json", import.meta.url),
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(
  "PASS: 36 balanced prompts; source vectors for 500 careers; distinct rankings across six patterns; flat/low/incomplete safeguards; answer editing; " +
    outcomes.length +
    " five-year sensitivity runs; reconciled ledgers; recurring costs; two-rate debt; timed follow-ups.",
);
console.log(JSON.stringify(report.summary));
dom.window.close();
