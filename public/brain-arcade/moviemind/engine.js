// Pure game rules, independent of UI, storage, audio, and content providers.
const SESSION_SIZE = 5;
function normalizeAnswer(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[.'’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function isCorrect(puzzle, guess) {
  const normalized = normalizeAnswer(guess);
  return normalized.length > 0 && [puzzle.answer, ...puzzle.acceptedAnswers]
    .some(answer => normalizeAnswer(answer) === normalized);
}
function validateLibrary(library) {
  if (!Array.isArray(library) || library.length < SESSION_SIZE) throw new Error('At least five puzzles are needed.');
  const ids = new Set(), answers = new Set();
  for (const p of library) {
    if (!p || !['id', 'category', 'answer', 'difficulty'].every(k => typeof p[k] === 'string' && p[k].trim()) ||
      !Array.isArray(p.acceptedAnswers) || !p.acceptedAnswers.every(a => typeof a === 'string' && a.trim()) ||
      !Array.isArray(p.clues) || p.clues.length !== 5 || !p.clues.every(c => typeof c === 'string' && c.trim())) throw new Error('Invalid puzzle content.');
    if (ids.has(p.id) || answers.has(normalizeAnswer(p.answer))) throw new Error('Duplicate puzzle.');
    ids.add(p.id); answers.add(normalizeAnswer(p.answer));
  }
  return library;
}
function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function selectSession(library, previousIds = [], rng = Math.random) {
  validateLibrary(library);
  const recent = new Set(previousIds);
  // All puzzles are movies. Prefer unseen titles, regardless of genre.
  const fresh = shuffle(library.filter(p => !recent.has(p.id)), rng);
  // Previous IDs are oldest-first. Once everything has been played, rotate the oldest.
  const byId = new Map(library.map(p => [p.id, p]));
  const fallback = [...new Set(previousIds)].filter(id => byId.has(id)).map(id => byId.get(id));
  return [...fresh, ...fallback].slice(0, SESSION_SIZE);
}
function createRun(puzzles) {
  if (puzzles.length !== SESSION_SIZE) throw new Error('A run needs five puzzles.');
  return { puzzles, index: 0, cluesUsed: 1, guessed: false, phase: 'playing', results: [], guesses: [] };
}
function revealClue(run) {
  if (run.phase !== 'playing' || run.cluesUsed >= 5) return false;
  run.cluesUsed++; run.guessed = false; return true;
}
function finishPuzzle(run, solved) {
  if (run.phase !== 'playing') return false;
  run.results.push({ id: run.puzzles[run.index].id, category: run.puzzles[run.index].category,
    answer: run.puzzles[run.index].answer, solved, cluesUsed: run.cluesUsed,
    points: solved ? 6 - run.cluesUsed : 0, guesses: [...run.guesses] });
  run.phase = 'reveal'; return true;
}
function submitGuess(run, guess) {
  if (run.phase !== 'playing' || run.guessed || !normalizeAnswer(guess)) return 'ignored';
  run.guessed = true; run.guesses.push({ clue: run.cluesUsed, guess: String(guess).trim() });
  if (isCorrect(run.puzzles[run.index], guess)) { finishPuzzle(run, true); return 'correct'; }
  if (run.cluesUsed === 5) { finishPuzzle(run, false); return 'exhausted'; }
  revealClue(run);
  return 'incorrect';
}
function advancePuzzle(run) {
  if (run.phase !== 'reveal') return false;
  if (run.results.length === SESSION_SIZE) { run.phase = 'complete'; return true; }
  run.index++; run.cluesUsed = 1; run.guessed = false; run.guesses = []; run.phase = 'playing'; return true;
}
function summarize(run) {
  const score = run.results.reduce((sum, p) => sum + p.points, 0);
  const totalGuesses = run.results.reduce((sum,p) => sum + p.guesses.length, 0);
  return { score, totalGuesses, averageGuesses: run.results.length ? totalGuesses / run.results.length : 0, solved: run.results.filter(p => p.solved).length,
    averageClues: run.results.length ? run.results.reduce((sum,p) => sum + p.cluesUsed, 0) / run.results.length : 0,
    rank: score >= 23 ? 'MovieMind Master' : score >= 19 ? 'Brilliant Detective' : score >= 14 ? 'Sharp Thinker' : score >= 8 ? 'Clue Chaser' : 'Warming Up' };
}



export { SESSION_SIZE, normalizeAnswer, isCorrect, validateLibrary, selectSession, createRun, revealClue, finishPuzzle, submitGuess, advancePuzzle, summarize };
