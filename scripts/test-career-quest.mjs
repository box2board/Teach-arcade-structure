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
  click('[data-career="registered-nurse"]');
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
for (const c of [ctx, report, noEvents, empty, corrupt, legacy, blocked])
  c.dom.window.close();
console.log(
  "PASS: complete five-year flows (10 and 15 decisions), reload/resume, fixed yearly budgets, idempotent settlement, education options, isolated quiz skills, settings snapshot, debt transfer limits, dollar effects, saved reflections/XSS escaping, replay setting, empty filters, corrupt/legacy saves, storage fallback, 18 scenario schemas.",
);
