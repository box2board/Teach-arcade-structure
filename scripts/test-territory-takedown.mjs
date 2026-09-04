import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base = new URL('../public/arcade-review-games/territory-takedown/', import.meta.url);
const html = fs.readFileSync(new URL('index.html', base), 'utf8');
const game = fs.readFileSync(new URL('game.js', base), 'utf8');
const questions = fs.readFileSync(new URL('questions.js', base), 'utf8');
const sandbox = { window: { __TT_TEST__: true }, console, structuredClone };
vm.createContext(sandbox);
vm.runInContext(questions, sandbox);
vm.runInContext(game, sandbox);
const api = sandbox.window.TerritoryTakedownTest;

assert.equal(sandbox.window.TT_SAMPLE_QUESTIONS.length, 20, 'sample set has 20 questions');
assert.equal(Object.keys(api.POWERS).length, 8, 'all eight power-ups are registered');
assert.equal(Object.keys(api.TYPES).length, 7, 'all seven territory types are registered');
for (const teams of [2, 3, 4, 5, 6, 7, 8]) {
  for (const size of [5, 6, 7]) {
    const homes = Array.from(api.balancedHomes(teams, size));
    assert.equal(homes.length, teams);
    assert.equal(new Set(homes).size, teams);
    assert.ok(homes.every(id => id >= 0 && id < size ** 2));
  }
}
assert.equal(api.normalizeQuestion({ question: '', answer: 'x' }), null);
assert.equal(api.normalizeQuestion({ question: '<b>Safe text</b>', answer: 'yes', points: 5000 }).points, 1000);
for (const id of [...game.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1])) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `DOM element #${id} exists`);
}
for (const metadata of ['canonical', 'og:title', 'twitter:title', 'application/ld+json']) assert.ok(html.includes(metadata));
assert.ok(html.includes('/assets/scripts/nav.js?v=5'));
assert.ok(html.includes('aria-live="assertive"'));
console.log('Territory Takedown checks passed: data validation, 2–8 team placement on all map sizes, power/type registries, DOM bindings, metadata, shared navigation, and live-region accessibility.');
