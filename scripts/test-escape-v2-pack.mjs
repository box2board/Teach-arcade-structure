import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../public/escape-v2/', import.meta.url);
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('rooms/french-revolution/data.js', root), 'utf8'), context);
vm.runInContext(fs.readFileSync(new URL('js/validate-pack.js', root), 'utf8'), context);

const validate = context.window.ESCAPE_V2_VALIDATE_PACK;
const source = context.window.ESCAPE_V2_DATA;
const validateRenderers = context.window.ESCAPE_V2_VALIDATE_PUZZLE_RENDERERS;
assert.deepEqual(Array.from(validate(source)), [], 'French Revolution pack should satisfy the engine contract');

const broken = structuredClone(source);
broken.rooms[0].scene.dimensions[1] = 0;
broken.rooms[0].scene.interactables.pop();
broken.rooms[0].hotspots[0].choices = ['only one'];
const errors = Array.from(validate(broken));
assert.ok(errors.some((error) => error.includes('dimensions must be three positive numbers')));
assert.ok(errors.some((error) => error.includes('has no matching scene interactable')));
assert.ok(errors.some((error) => error.includes('at least two options')));

const extension = structuredClone(source);
extension.rooms[0].hotspots[0].type = 'matching';
delete extension.rooms[0].hotspots[0].choices;
delete extension.rooms[0].hotspots[0].answer;
assert.deepEqual(Array.from(validate(extension)), [], 'new puzzle types should pass structural pack validation');

const puzzleContext = {
  window: {},
  document: { createElement: (tag) => ({ tagName: tag, children: [], appendChild(child) { this.children.push(child); }, addEventListener() {}, setAttribute() {} }) },
  requestAnimationFrame: (callback) => callback()
};
vm.createContext(puzzleContext);
vm.runInContext(fs.readFileSync(new URL('js/puzzles.js', root), 'utf8'), puzzleContext);
const puzzles = puzzleContext.window.ESCAPE_V2_PUZZLES;
assert.equal(typeof puzzles.get('choice'), 'function');
assert.equal(typeof puzzles.get('text'), 'function');
assert.deepEqual(Array.from(validateRenderers(source, puzzles)), [], 'all current puzzle types should resolve before gameplay');
assert.ok(Array.from(validateRenderers(extension, puzzles)).some((issue) => issue.includes('without a registered renderer')));
const matchingRenderer = () => {};
puzzles.register('matching', matchingRenderer);
assert.deepEqual(Array.from(validateRenderers(extension, puzzles)), [], 'a registered extension puzzle should pass startup validation');
assert.equal(puzzles.get('matching'), matchingRenderer, 'pack-specific puzzle renderers should register by type');

console.log('PASS: current pack contract, invalid dimensions, clue/interactable mismatches, built-in puzzle validation, and extensible puzzle renderer registration.');
