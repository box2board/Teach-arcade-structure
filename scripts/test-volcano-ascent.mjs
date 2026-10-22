import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped physics and level without replacing movement/collision methods.
const root = new URL('../public/arcade-review-games/', import.meta.url);
let now = 0;
const elements = new Map();
const context = vm.createContext({
  console, performance: { now: () => now }, requestAnimationFrame() {}, addEventListener() {},
  document: {
    getElementById(id) { if (!elements.has(id)) elements.set(id, { textContent: '', style: {}, dataset: {} }); return elements.get(id); },
    addEventListener() {}, querySelectorAll: () => []
  }
});
context.window = context;
for (const file of ['side-scroller-engine/v1.2/physics-presets.js', 'side-scroller-engine/v1.2/level-builder.js', 'science/volcano-ascent/level.js', 'science/volcano-ascent/questions.js', 'side-scroller-engine/v1.2/core.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
}
const TA = context.TASideScroller;
const makeGame = (difficulty = 'easy') => {
  const e = new TA.Engine({ canvas: { width: 960, getContext: () => ({}) }, config: { player: context.TA_PHYSICS_PRESETS.earth }, level: context.TA_VOLCANO_LEVEL, questions: context.TA_VOLCANO_QUESTIONS, theme: {}, difficulty });
  e.start();
  return e;
};
const step = (e, n = 1) => { for (let i = 0; i < n; i++) { now += 1000 / 120; e.update(1 / 120); } };

for (const direction of ['arrowup', 'arrowdown']) {
  for (const side of ['arrowleft', 'arrowright']) {
    const e = makeGame();
    Object.assign(e.player, { x: 539, y: 300 });
    e.keys[direction] = true;
    step(e);
    assert.equal(e.player.climbing, true, `${direction}: attaches to ladder`);
    e.keys[' '] = true;
    e.keys[side] = true;
    step(e);
    assert.equal(e.player.climbing, false, `${direction}: jump detaches`);
    assert.ok(e.player.vy < 0, 'jump lifts the player');
    step(e, 18);
    assert.equal(e.player.climbing, false, 'holding climb does not cancel jump');
    assert.ok(side === 'arrowleft' ? e.player.x < 539 : e.player.x > 539, 'direction steers away');
    e.respawn();
    assert.equal(e.player.climbRegrabTimer, 0, 'respawn resets ladder lock');
  }
}
// A stationary jump stays detached while Space is held, then allows climbing again.
{
  const e = makeGame();
  Object.assign(e.player, { x: 539, y: 300 });
  e.keys.arrowdown = true; step(e); e.keys[' '] = true; step(e, 48);
  assert.equal(e.player.climbing, false);
  e.keys[' '] = false; step(e);
  assert.equal(e.player.climbing, true);
}

// Traverse from the real spawn to the real goal using control inputs only.
// Deliberately mix correct/incorrect answers to verify that mistakes don't block completion.
for (const difficulty of ['easy', 'medium']) {
  const e = makeGame(difficulty);
  let reportCount = 0;
  TA.showResults = () => reportCount++;
  TA.showQuestion = (q, meta, done) => {
    assert.equal(q.choices.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
    done(meta.number % 3 !== 0);
  };
  for (let i = 0; i < 5000 && e.state !== 'won'; i++) {
    e.clearInput();
    const p = e.player, ladder = e.findClimbable();
    e.keys.arrowright = true;
    if (ladder) {
      e.keys.arrowup = true;
      if (p.climbing && p.y < ladder.y + 12) e.keys[' '] = true;
    } else if (p.grounded || p.vy > 0) e.keys[' '] = true;
    step(e, 24);
  }
  assert.equal(e.state, 'won', `${difficulty}: route reaches finish`);
  assert.equal(e.stats.answered, 10);
  assert.equal(e.stats.correct, 7);
  assert.ok(e.stats.collected > 0);
  assert.ok(e.stats.deaths > 0);
  assert.equal(reportCount, 1, 'completion report opens once');
  const score = e.stats.score;
  step(e, 10);
  assert.equal(e.stats.score, score, 'completion bonus applied once');
  console.log(`${difficulty}: completed ${e.stats.answered} questions; ${e.stats.collected} samples; ${e.stats.deaths} respawns; ${Math.round(e.stats.elapsed)}s simulated play`);
}
console.log('PASS: ladder jump/re-grab regressions and full Volcano Ascent physics play-through');
