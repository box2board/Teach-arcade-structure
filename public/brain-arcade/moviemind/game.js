import {getPuzzles} from './puzzles.js';
import {normalizeAnswer, isCorrect, validateLibrary, selectSession, createRun, revealClue, finishPuzzle, submitGuess, advancePuzzle, summarize} from './engine.js';
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE_KEY = 'teacharcade.moviemind.v1';
let library, run, soundOn = false, audio, view = 'home', feedback = '', skipConfirm = false;
function readSave() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { previous: Array.isArray(saved.previous) ? saved.previous.filter(x => typeof x === 'string') : [],
      best: Number.isInteger(saved.best) && saved.best >= 0 && saved.best <= 25 ? saved.best : 0 };
  } catch { return { previous: [], best: 0 }; }
}
function writeSave(value) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* Play still works without storage. */ } }
function announce(message) { $('announcer').textContent = message; }
function focus(id) { requestAnimationFrame(() => $(id)?.focus({ preventScroll: true })); }
function tone(kind) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const notes = kind === 'correct' ? [523,659,784] : kind === 'wrong' ? [196,165] : kind === 'finish' ? [523,659,784,1047] : [392,523];
    notes.forEach((frequency,i) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .08;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.045,start+.015); gain.gain.exponentialRampToValueAtTime(.001,start+.15);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start+.16);
    });
  } catch { soundOn = false; updateSound(); }
}
function updateSound() { $('sound').textContent = 'Sound: ' + (soundOn ? 'on' : 'off'); $('sound').setAttribute('aria-pressed', String(soundOn)); }
$('sound').addEventListener('click', () => { soundOn = !soundOn; updateSound(); if (soundOn) tone('reveal'); });
function showHome() {
  view = 'home';
  const categories = [...new Set(library.map(p => p.genre || p.category))];
  $('surface').innerHTML = `<section class="intro" aria-labelledby="intro-title"><div class="intro-copy"><div class="pill"><span class="dot"></span> FIVE CLUES. ONE MOVIE.</div><h1 id="intro-title">Guess the movie.<br><em>One clue at a time.</em></h1><p>Try to name each movie in as few guesses as possible. Start with one clue and reveal more when you need them.</p><button class="primary" id="start">Start a run <span aria-hidden="true">→</span></button><div class="intro-note">5 movies per run · ${library.length} films to discover · No timer</div></div><div class="vault-art" aria-hidden="true"><div class="orbit"></div><div class="film-tail"></div><div class="cinema-reel"></div><div class="mystery-card"><span class="question-mark">?</span><span class="card-label">WHAT’S THE TITLE?</span></div><div class="float-tag first">✦ EVERY CLUE COUNTS</div><div class="float-tag last">NAME THE FILM.</div></div></section><section class="how" aria-label="How to play"><div><span class="step">01</span><div><b>Read the first clue</b><p>The first hint is deliberately subtle.</p></div></div><div><span class="step">02</span><div><b>Take your best guess</b><p>A wrong guess opens the next clue.</p></div></div><div><span class="step">03</span><div><b>Reveal another clue</b><p>Skip a guess to see another hint.</p></div></div></section><div class="category-line">${categories.map(c => `<span>${esc(c)}</span>`).join('')}</div>${readSave().best ? `<p class="best-line">Your best: ${readSave().best} / 25</p>` : ''}`;
  $('start').onclick = startRun;
}
function startRun() {
  const saved = readSave();
  run = createRun(selectSession(library, saved.previous));
  const picked = new Set(run.puzzles.map(p => p.id));
  writeSave({ ...saved, previous: [...saved.previous.filter(id => !picked.has(id)), ...picked].slice(-library.length) });
  view = 'run'; feedback = ''; skipConfirm = false; renderPuzzle();
  announce('Run started. Puzzle one of five. ' + run.puzzles[0].category + '. Five points available.');
  $('surface').scrollIntoView({ block:'start', behavior:'instant' });
  focus('guess');
}
function renderPuzzle(animate = false) {
  const p = run.puzzles[run.index], summary = summarize(run), revealed = run.phase === 'reveal';
  const result = run.results.at(-1);
  $('surface').innerHTML = `<div class="hud"><div><div class="hud-title">Mystery</div><strong>${run.index + 1} <small>/ 5</small></strong></div><div class="run-track" aria-label="Puzzle ${run.index+1} of 5">${run.puzzles.map((_,i) => `<span class="${i<run.index?'done':i===run.index?'active':''}"></span>`).join('')}</div><div class="score"><div class="hud-title">Total score</div><strong>${summary.score} <small>/ 25</small></strong></div></div><div class="game-layout"><section class="clue-board" aria-labelledby="category"><div class="board-top"><div><div class="case-id">CASE 0${run.index+1} <span aria-hidden="true">/</span> THE EVIDENCE</div><h1 class="category-name" id="category">${revealed ? esc(p.genre || p.category) : "Name the movie"}</h1></div><span class="clue-count">${run.cluesUsed} of 5 clues</span></div><div class="clues">${p.clues.map((clue,i) => i < run.cluesUsed ? `<div class="clue ${i===run.cluesUsed-1?'latest '+(animate?'animate':''):''}"><span class="clue-number" aria-label="Clue ${i+1}">0${i+1}</span><p>${esc(clue)}</p></div>` : `<div class="clue locked"><span class="clue-number" aria-hidden="true">0${i+1}</span><p>Clue ${i+1} locked <span aria-hidden="true">·</span> ${5-i} ${5-i===1?'point':'points'} available</p></div>`).join('')}</div></section><aside class="deduction-panel" aria-label="Guess and scoring">${revealed ? resolution(result) : guessPanel()}</aside></div><p class="game-tip">${revealed ? 'Continue when you’re ready.' : 'No rush. All revealed clues stay here. Use Enter to submit your guess.'}</p>`;
  if (revealed) {
    $('next').onclick = next;
    focus('next');
  } else {
    // Embedded previews may disallow native form submissions. Both controls call
    // the local game action directly; no form permission or navigation is needed.
    $('check-guess').addEventListener('click', guess);
    $('guess').addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.isComposing || e.repeat) return;
      e.preventDefault();
      guess();
    });
    $('reveal').onclick = () => {
      if (!revealClue(run)) return;
      feedback = ''; skipConfirm = false; tone('reveal'); renderPuzzle(true);
      announce(`Clue ${run.cluesUsed}: ${p.clues[run.cluesUsed-1]} ${6-run.cluesUsed} points available.`);
      focus('guess');
    };
    $('skip').onclick = () => {
      if (!skipConfirm) { skipConfirm = true; $('skip').textContent = 'Confirm: reveal answer for 0 points'; announce('Press confirm to give up this mystery for zero points.'); return; }
      finishPuzzle(run, false); tone('wrong'); renderPuzzle(); announce('Answer revealed. ' + p.answer + '. Zero points.');
    };
  }
}
function guessPanel() {
  const available = 6-run.cluesUsed;
  return `<div class="points-box"><div class="eyebrow">ON THE LINE</div><div class="stars" aria-label="${available} points available">${Array.from({length:5},(_,i)=>`<span ${i>=available?'class="spent"':''} aria-hidden="true">★</span>`).join('')}</div><div class="point-value"><b>${available}</b> ${available===1?'point':'points'} available</div></div><div class="answer-box"><div id="guess-controls" role="group" aria-label="Movie title guess"><label for="guess">Which movie is it? <span class="guess-counter">Guess ${run.guesses.length+1}</span></label><input id="guess" name="guess" placeholder="Enter a movie title…" maxlength="160" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="go" aria-describedby="feedback" ${run.guessed?'disabled':''}><button class="primary" id="check-guess" type="button" ${run.guessed?'disabled':''}>Check answer <span aria-hidden="true">↵</span></button></div><p class="feedback ${feedback?'bad':''}" id="feedback" role="status">${esc(feedback || 'Take a guess, or ask for another clue. Earlier solves earn more points.')}</p><button class="secondary reveal-button" id="reveal" ${run.cluesUsed===5?'disabled':''}>${run.cluesUsed<5?`I don’t know · Clue ${run.cluesUsed+1} <span aria-hidden="true">→</span>`:'Final clue — take your best guess'}</button><p class="answer-note">${run.cluesUsed<5?'Another clue costs one possible point.':'Last clue. Take your best shot, or give up to see the title.'}</p><button class="text-button" id="skip" type="button">${skipConfirm?'Confirm: reveal answer for 0 points':'Give up this mystery'}</button>${guessHistory()}</div>`;
}
function guessHistory() {
  return run.guesses.length ? `<div class="guess-history" aria-label="Your guesses"><span class="eyebrow">YOUR GUESSES</span><ol>${run.guesses.map((g,i)=>`<li><span>${i+1}.</span> ${esc(g.guess)} <small>Clue ${g.clue}</small></li>`).join('')}</ol></div>` : '';
}
function resolution(result) {
  return `<div class="resolution"><div class="eyebrow ${result.solved?'unlocked':'unresolved'}">${result.solved?'✦ MYSTERY SOLVED':'MYSTERY REVEALED'}</div><h2 class="answer-title">${esc(result.answer)}</h2><p>${result.solved ? `Solved in ${result.guesses.length} ${result.guesses.length===1?'guess':'guesses'} using ${result.cluesUsed} ${result.cluesUsed===1?'clue':'clues'}.` : 'The answer is shown above.'}</p><div class="earned">+${result.points} <small>${result.points===1?'point':'points'}</small></div><button class="primary" id="next">${run.index===4?'See my results':'Next mystery'} <span aria-hidden="true">→</span></button></div>`;
}
function guess() {
  const input = $('guess');
  if (!normalizeAnswer(input.value)) { $('feedback').textContent = 'Type an answer before locking in your guess.'; input.focus(); return; }
  const attempted = input.value.trim();
  const outcome = submitGuess(run, attempted);
  if (outcome === 'ignored') return;
  if (outcome === 'incorrect') {
    feedback = `Not “${attempted}”. Here’s clue ${run.cluesUsed} — try another title.`;
    tone('wrong'); renderPuzzle(true); focus('guess');
    announce(feedback + ' ' + run.puzzles[run.index].clues[run.cluesUsed-1]);
  } else {
    tone(outcome === 'correct' ? 'correct' : 'wrong'); renderPuzzle();
    const r = run.results.at(-1);
    announce(`${r.solved?'Correct.':'The answer was'} ${r.answer}. ${r.points} points.`);
  }
}
function next() {
  if (!advancePuzzle(run)) return;
  if (run.phase === 'complete') { renderResults(); tone('finish'); return; }
  feedback = ''; skipConfirm = false; renderPuzzle(true); focus('guess');
  announce(`Puzzle ${run.index+1} of five. ${run.puzzles[run.index].category}. Clue one: ${run.puzzles[run.index].clues[0]}`);
}
function renderResults() {
  view = 'results';
  const result = summarize(run), saved = readSave(), best = Math.max(saved.best,result.score);
  writeSave({ ...saved, best });
  $('surface').innerHTML = `<section aria-labelledby="results-title"><div class="results-hero"><div class="score-ring" aria-label="${result.score} out of 25 points"><b>${result.score}</b><span>OUT OF 25</span></div><div class="results-copy"><div class="eyebrow">✦ MOVIEMIND · RUN COMPLETE</div><h1 id="results-title">${result.rank}</h1><div class="stats"><div class="stat"><b>${result.solved} / 5</b><span>Mysteries solved</span></div><div class="stat"><b>${result.averageClues.toFixed(1)}</b><span>Avg. clues revealed</span></div><div class="stat"><b>${result.totalGuesses}</b><span>Total guesses</span></div></div></div></div><div class="result-list" aria-label="Individual puzzle results">${run.results.map(p=>`<div class="result-row"><span class="result-symbol ${p.solved?'':'missed'}" aria-label="${p.solved?'Solved':'Not solved'}">${p.solved?'✓':'×'}</span><div class="result-name"><small>${esc(p.category)}</small><b>${esc(p.answer)}</b></div><div class="result-detail"><b>${p.points} ${p.points===1?'point':'points'}</b><span>${p.solved?'':'Not solved · '}${p.guesses.length} ${p.guesses.length===1?'guess':'guesses'} · ${p.cluesUsed} ${p.cluesUsed===1?'clue':'clues'}</span></div></div>`).join('')}</div><div class="result-actions"><button class="primary" id="again">Play again <span aria-hidden="true">↻</span></button><button class="secondary" id="download">Download results ↓</button><a class="secondary" href="https://www.teacharcade.com/brain-arcade/">Brain Arcade →</a></div><p class="best-line">Your best: ${best} / 25 · Next run: five different mysteries.</p></section>`;
  $('again').onclick = startRun;
  $('download').onclick = downloadResults;
  announce(`Run complete. ${result.rank}. ${result.score} of 25 points. ${result.solved} mysteries solved.`);
  $('surface').scrollIntoView({ block: 'start', behavior:'instant' }); focus('again');
}
function downloadResults() {
  const result = summarize(run);
  const content = ['MOVIEMIND — TEACH ARCADE', new Date().toLocaleString(), '', `${result.rank} | ${result.score} / 25 points`, `Solved: ${result.solved} / 5`, `Average clues revealed: ${result.averageClues.toFixed(1)}`, `Total guesses: ${result.totalGuesses}`, '', ...run.results.map(p=>`${p.category}: ${p.answer}\n${p.solved?'Solved':'Not solved'} | ${p.guesses.length} guesses | ${p.cluesUsed} clues revealed | ${p.points} points`)].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'moviemind-results.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// A screen-reader user or browser with storage blocked can play the full game.
try { library = validateLibrary(await getPuzzles()); showHome(); }
catch { $('surface').innerHTML = '<p class="loading" role="alert">The mystery vault couldn’t open. Please reload to try again.</p>'; }
