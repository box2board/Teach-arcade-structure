import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
if (!process.argv[2])
  throw new Error(
    "Pass the absolute path to an installed jsdom/lib/api.js. See docs/career-quest.md.",
  );
const { JSDOM } = await import(
  pathToFileURL(path.resolve(process.argv[2])).href
);
import fs from "node:fs";
import assert from "node:assert/strict";
const root = fileURLToPath(
  new URL("../public/career-arcade/career-quest/", import.meta.url),
);
const html = fs.readFileSync(root + "index.html", "utf8");
const js = fs.readFileSync(root + "career-quest.js", "utf8");
async function boot(saved = {}, badStorage = false) {
  const dom = new JSDOM(html, {
      url: "https://teacharcade.com/career-arcade/career-quest/",
      runScripts: "outside-only",
    }),
    w = dom.window;
  const errors = [];
  w.addEventListener("error", (e) => errors.push(e.error));
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => true;
  w.print = () => {};
  for (const [k, v] of Object.entries(saved))
    w.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  if (badStorage)
    w.Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  w.fetch = async (url) => ({
    ok: true,
    json: async () =>
      JSON.parse(fs.readFileSync(root + url.replace("./", ""), "utf8")),
  });
  w.Math.random = () => 0;
  w.eval(
    js +
      "\nwindow.testState=state;window.testFns={settleYear,applyChoice,updateNetWorth,renderByPhase};",
  );
  await new Promise((r) => setTimeout(r, 0));
  const click = (selector) => {
    const el = w.document.querySelector(selector);
    assert(el, `missing ${selector}`);
    assert(!el.disabled, `disabled ${selector}`);
    el.click();
    assert.equal(errors.length, 0, errors[0]?.stack);
  };
  return { dom, w, click, errors };
}
function save(w) {
  return Object.fromEntries(
    Object.keys(w.localStorage).map((k) => [k, w.localStorage.getItem(k)]),
  );
}
async function begin(options = {}) {
  const ctx = await boot(options.saved);
  const { w, click } = ctx;
  click("#start-run");
  for (let i = 0; i < 10; i++) click('[data-score="2"]');
  assert.equal(w.testState.run.phase, "career");
  const search = w.document.getElementById("career-search");
  search.value = "registered nurse";
  search.dispatchEvent(new w.Event("input", { bubbles: true }));
  click('[data-career="registered-nurse"]');
  assert.equal(w.testState.run.phase, "careerDetail");
  click("#choose-career");
  assert.equal(
    w.document.querySelectorAll('[data-path="workforce"]').length,
    0,
  );
  click('[data-path="cc"]');
  click('[data-housing="shared"]');
  return ctx;
}
let ctx = await begin();
let { w, click } = ctx;
assert.notEqual(w.testState.run.quizScores, w.testState.run.stats.skills);
assert.equal(
  w.testState.run.stats.skills.communication,
  22,
  "interest quiz must not award work skills",
);
assert.equal(w.testState.run.stats.debt, 15000);
const scenario = w.testState.run.currentScenario.id;
const reloaded = await boot(save(w));
reloaded.click("#continue-run");
assert.equal(
  reloaded.w.testState.run.currentScenario.id,
  scenario,
  "resume must retain the same scenario",
);
ctx.dom.window.close();
ctx = reloaded;
({ w, click } = ctx);
// Changing setup during a run must not change its rules.
w.document.getElementById("costOfLiving").value = "high";
w.document
  .getElementById("costOfLiving")
  .dispatchEvent(new w.Event("change", { bubbles: true }));
assert.equal(w.testState.run.settings.costOfLiving, "average");
for (let y = 1; y <= 5; y++) {
  for (let d = 0; d < 3; d++) {
    assert.equal(w.testState.run.phase, "scenario");
    click('[data-choice="0"]');
    assert.equal(w.testState.run.phase, "feedback");
    assert(w.document.getElementById("continue-decision"));
    click("#continue-decision");
  }
  assert.equal(w.testState.run.phase, "yearSummary");
  const r = w.testState.run,
    l = r.yearLedgers.at(-1);
  assert.equal(l.year, y);
  assert.equal(l.living, (2200 - 350) * 12);
  assert.equal(
    l.gross - l.taxes - l.living - l.payment,
    l.gross - Math.round(l.gross * 0.22) - l.living - l.payment,
  );
  const balance = r.stats.cash;
  w.testFns.settleYear();
  assert.equal(r.stats.cash, balance, "year settlement must be idempotent");
  click("#next-year");
}
assert.equal(w.testState.run.phase, "report");
assert.equal(w.testState.run.year, 5);
assert.equal(w.testState.run.history.length, 15);
assert.equal(w.testState.run.yearLedgers.length, 5);
assert.equal(new Set(w.testState.run.history.map((h) => h.id)).size, 15);
const text = w.document.getElementById("reflection-0");
text.value = "A tradeoff <script>alert(1)</script>";
text.dispatchEvent(new w.Event("input", { bubbles: true }));
const report = await boot(save(w));
report.click("#continue-run");
assert.equal(
  report.w.document.getElementById("reflection-0").value,
  text.value,
);
assert.equal(report.w.document.querySelectorAll("#screen script").length, 0);
assert(report.w.document.getElementById("replay"));
// Actual transfer is capped by cash and debt; difficulty must not change dollar amounts.
const r = w.testState.run;
r.settings.difficulty = "hard";
r.stats.cash = 100;
r.stats.debt = 50;
w.testFns.applyChoice(
  { id: "test", title: "Test" },
  { label: "Pay", effects: { extraPayment: 700 }, feedback: "Paid" },
);
assert.equal(r.stats.cash, 50);
assert.equal(r.stats.debt, 0);
w.testFns.applyChoice(
  { id: "test2", title: "Test" },
  { label: "Repair", effects: { cash: -900 }, feedback: "Fixed" },
);
assert.equal(r.stats.cash, -850);
const noEvents = await begin({
  saved: { taCareerQuestSettings: { randomEvents: false, allowReplay: false } },
});
for (let y = 1; y <= 5; y++) {
  for (let d = 0; d < 2; d++) {
    noEvents.click('[data-choice="0"]');
    noEvents.click("#continue-decision");
  }
  noEvents.click("#next-year");
}
assert.equal(noEvents.w.testState.run.history.length, 10);
assert.equal(noEvents.w.testState.run.yearLedgers.length, 5);
assert.equal(noEvents.w.document.querySelector("#replay"), null);
assert(noEvents.w.document.querySelector("#start-run").disabled);
const empty = await boot({
  taCareerQuestSettings: { careerClusters: [], enabledCareers: [] },
});
assert(empty.w.document.querySelector("#start-run").disabled);
const corrupt = await boot({ taCareerQuestRun: "not JSON" });
assert(corrupt.w.document.querySelector("#continue-run").disabled);
const legacy = await boot({ taCareerQuestRun: { phase: "scenario", year: 3 } });
legacy.click("#continue-run");
assert(
  legacy.w.document
    .querySelector("#screen")
    .textContent.includes("previous version"),
);
assert.equal(
  JSON.parse(legacy.w.localStorage.getItem("taCareerQuestRun")).year,
  3,
);
const blocked = await boot({}, true);
blocked.click("#start-run");
assert(!blocked.w.document.querySelector("#storage-warning").hidden);
assert(blocked.w.testState.run);
for (const name of ["core", "workplace", "money"]) {
  const bank = JSON.parse(
    fs.readFileSync(root + `data/scenarios-${name}.json`),
  );
  assert.equal(bank.length, 6);
  for (const s of bank) {
    assert.equal(s.choices.length, 3);
    assert(s.prompt.length > 70);
    assert(!/Scenario \d/.test(s.title));
  }
}

// Career explorer regression: actual search, profile, training, and save migration.
const careers = JSON.parse(fs.readFileSync(root + "data/careers.json"));
assert.equal(careers.length, 500);
assert.equal(new Set(careers.map((c) => c.id)).size, 500);
for (const c of careers) {
  for (const k of [
    "summary",
    "workEnvironment",
    "entryRequirements",
    "payContext",
    "outlook",
    "sourceTitle",
    "sourceUrl",
    "sourceReviewed",
    "typicalEducation",
  ])
    assert(c[k], `${c.id}: missing ${k}`);
  assert(
    c.sourceUrl.startsWith("https://www.bls.gov/ooh/") ||
      c.sourceUrl.startsWith("https://www.onetonline.org/link/summary/"),
  );
  assert(c.aliases.length);
  assert(c.educationOptions.length);
}
const original = careers.filter((c) => !c.catalogAdded);
const migrated = await boot({
  taCareerQuestSettings: {
    careerClusters: [...new Set(original.map((c) => c.cluster))],
    enabledCareers: original.map((c) => c.id),
  },
});
assert.equal(
  migrated.w.testState.settings.enabledCareers.length,
  500,
  "the old all-careers selection must include newly added careers",
);
migrated.click("#start-run");
for (let i = 0; i < 10; i++) migrated.click('[data-score="2"]');
function search(ctx, query) {
  const input = ctx.w.document.getElementById("career-search");
  input.value = query;
  input.dispatchEvent(new ctx.w.Event("input", { bubbles: true }));
}
for (const query of [
  "Police Officer",
  "POLICE-OFFICER",
  "cop",
  "law enforcement",
  "police officers",
]) {
  search(migrated, query);
  assert(
    migrated.w.document.querySelector('[data-career="police-officer"]'),
    `${query} should find police officer`,
  );
}
migrated.click('[data-career="police-officer"]');
assert(
  migrated.w.document
    .querySelector("#screen")
    .textContent.includes("training academy"),
);
assert(
  migrated.w.document.querySelector(
    '#screen a[href="https://www.bls.gov/ooh/protective-service/police-and-detectives.htm"]',
  ),
);
const detailReloaded = await boot(save(migrated.w));
detailReloaded.click("#continue-run");
assert.equal(detailReloaded.w.testState.run.phase, "careerDetail");
assert(detailReloaded.w.document.getElementById("choose-career"));
migrated.click("#back-catalog");
assert.equal(
  migrated.w.document.getElementById("career-search").value,
  "police officers",
);
for (const [q, id] of [
  ["doctor", "physician"],
  ["vet", "veterinarian"],
  ["hvac", "hvac-technician"],
  ["car mechanic", "auto-mechanic"],
  ["RN", "registered-nurse"],
]) {
  search(migrated, q);
  assert(migrated.w.document.querySelector(`[data-career="${id}"]`));
}
search(migrated, "not a real job");
assert(migrated.w.document.getElementById("clear-career-filters"));
migrated.click("#clear-career-filters");
assert.equal(migrated.w.document.getElementById("career-search").value, "");
assert.equal(migrated.w.document.querySelectorAll("[data-career]").length, 12);
migrated.click("#more-careers");
assert.equal(migrated.w.document.querySelectorAll("[data-career]").length, 24);
const field = migrated.w.document.getElementById("career-cluster");
field.value = "Public Safety & Law";
field.dispatchEvent(new migrated.w.Event("change", { bubbles: true }));
assert.equal(migrated.w.document.querySelectorAll("[data-career]").length, 12);
search(migrated, "police");
migrated.click('[data-career="police-officer"]');
migrated.click("#choose-career");
assert(migrated.w.document.querySelector('[data-path="trade"]'));
migrated.click('[data-path="trade"]');
migrated.click('[data-housing="shared"]');
assert.equal(migrated.w.testState.run.phase, "scenario");
const restricted = await boot({
  taCareerQuestSettings: {
    careerClusters: ["Health Science"],
    enabledCareers: ["registered-nurse"],
  },
});
restricted.click("#start-run");
for (let i = 0; i < 10; i++) restricted.click('[data-score="2"]');
search(restricted, "police");
assert(!restricted.w.document.querySelector('[data-career="police-officer"]'));
assert.equal(
  restricted.w.testState.run.settings.enabledCareers.length,
  1,
  "custom teacher restrictions must survive migration",
);

// Current unrestricted saves expand from 80 entries; custom restrictions never expand.
const previous80 = careers.filter((c) => (c.catalogAdded || 2) <= 3);
const upgraded80 = await boot({
  taCareerQuestSettings: {
    catalogVersion: 3,
    enabledCareers: previous80.map((c) => c.id),
    careerClusters: [...new Set(previous80.map((c) => c.cluster))],
  },
});
assert.equal(upgraded80.w.testState.settings.enabledCareers.length, 500);
assert.equal(upgraded80.w.testState.settings.catalogVersion, 4);
assert.equal(
  new Set(careers.filter((c) => c.catalogAdded === 4).map((c) => c.socCode))
    .size,
  420,
);
// Search + sort must keep the DOM bounded with the full library loaded.
const full = await boot();
full.click("#start-run");
for (let i = 0; i < 10; i++) full.click('[data-score="2"]');
assert.equal(full.w.document.querySelectorAll("[data-career]").length, 12);
for (const q of [
  "astronomer",
  "baker",
  "game designer",
  "forensic",
  "marine engineer",
  "librarian",
]) {
  search(full, q);
  assert(
    full.w.document.querySelector("[data-career]"),
    q + " must return a real profile",
  );
}
search(full, "");
const sort = full.w.document.getElementById("career-sort");
sort.value = "alpha";
sort.dispatchEvent(new full.w.Event("change", { bubbles: true }));
const titles = [...full.w.document.querySelectorAll(".cq-career-body h3")].map(
  (x) => x.textContent,
);
assert.deepEqual(
  titles,
  [...titles].sort((a, b) => a.localeCompare(b)),
);
const teacherSearch = full.w.document.getElementById("teacher-career-search");
teacherSearch.value = "police";
teacherSearch.dispatchEvent(new full.w.Event("input", { bubbles: true }));
assert(
  [...full.w.document.querySelectorAll("#teacher-career-list label")].filter(
    (x) => !x.hidden,
  ).length > 0,
);
assert(
  [...full.w.document.querySelectorAll("#teacher-career-list label")].filter(
    (x) => !x.hidden,
  ).length < 500,
);
assert.equal(
  full.w.testState.settings.enabledCareers.length,
  500,
  "searching teacher controls must not disable hidden careers",
);
const template = JSON.parse(JSON.stringify(full.w.testState.run));
for (const [i, c] of careers.entries()) {
  full.w.testState.run = JSON.parse(JSON.stringify(template));
  full.w.testState.run.previewCareerId = c.id;
  full.w.testState.run.phase = "careerDetail";
  full.w.testFns.renderByPhase();
  assert.equal(full.w.document.querySelector("h2").textContent, c.title);
  if (c.sourceLicense) {
    assert(
      full.w.document.querySelector(
        'a[href="https://creativecommons.org/licenses/by/4.0/"]',
      ),
    );
    assert(full.w.document.querySelector(".cq-context-list"));
  }
  full.click("#choose-career");
  assert(
    full.w.document.querySelector("[data-path]"),
    c.title + " needs an education model",
  );
  full.click("[data-path]");
  full.click('[data-housing="shared"]');
  assert.equal(full.w.testState.run.phase, "scenario");
  assert(Number.isFinite(full.w.testState.run.stats.cash));
  assert(full.w.document.querySelector("[data-choice]"));
  if ((i + 1) % 100 === 0)
    console.log("Verified profile → training → play:", i + 1);
}
for (const c of [
  ctx,
  report,
  noEvents,
  empty,
  corrupt,
  legacy,
  blocked,
  migrated,
  detailReloaded,
  restricted,
  upgraded80,
  full,
])
  c.dom.window.close();
console.log(
  "PASS: 500 complete profiles and all 500 profile/training/play paths; 420 new distinct occupation codes; 50/80-to-500 migration; custom teacher restrictions; aliases; sort; bounded rendering; teacher search; source/license/context panels; full five-year regressions.",
);
