import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {BANK_SETS} from '../public/review-lab/bank-catalog.js';
import {QUESTION_SETS,GAMES,loadQuestionSet,setsForGame,gameUrl} from '../public/review-lab/catalog.js';
import {categoryClashBoard,prepareQuestionDeck} from '../public/review-lab/question-decks.js';
import {isCorrectAnswer} from '../public/review-lab/answers.js';
import {originalCopy} from '../public/teacher/originals.js';
import {matchesSetFields,matchesSetSearch} from '../public/review-lab/set-filters.js';

const dirname = new URL('../question-bank/', import.meta.url);
const read = async url => JSON.parse(await fs.readFile(url, 'utf8'));
const manifest = await read(new URL('elementary/manifest.json', dirname));
const gradeOrder = ['K','1','2','3','4','5'];
const expected = {
  Math:[4,5,5,5,6,5], 'English Language Arts':[4,4,4,4,4,5], Science:[3,3,3,3,4,4],
  'Social Studies':[3,3,3,3,4,4], 'General Knowledge and Life Skills':[1,1,1,1,0,1]
};
const elementary = BANK_SETS.filter(set => set.id.startsWith('elementary--'));
assert.equal(manifest.setCount, 100);
assert.equal(manifest.questionCount, 2000);
assert.equal(elementary.length, 100);
assert.equal(new Set(QUESTION_SETS.map(set => set.id)).size, QUESTION_SETS.length);
assert.deepEqual(Object.fromEntries(Object.keys(expected).map(subject => [subject,
  gradeOrder.map(grade => elementary.filter(set => set.subject === subject && set.primaryGrade === grade).length)
])), expected);
assert.equal(QUESTION_SETS.filter(set => matchesSetFields(set,{gradeBand:'elementary'})).length, 100);
const known = new Set();
const normalize = prompt => prompt.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
for (const entry of QUESTION_SETS.filter(set => !set.id.startsWith('elementary--'))) {
  for (const {question} of (await loadQuestionSet(entry.id)).questions) known.add(normalize(question));
}
const mathSource = await fs.readFile(new URL('elementary-content/math.txt', import.meta.url), 'utf8');
const mathSections = new Map(mathSource.trim().split(/^@/m).filter(Boolean).map(section => {
  const [topic, ...items] = section.trim().split('\n');
  return [topic,items.filter(line => line.includes('|'))];
}));
const value = answer => {
  assert.match(answer,/^[0-9.]+(?:\/[0-9.]+)?$/);
  const [a,b=1]=answer.split('/');
  return Number(a)/Number(b);
};
const near = (a,b) => Math.abs(a-b) <= 1e-10;
let checked = 0, total = 0, longestPrompt = 0, longestChoice = 0;
for (const entry of elementary) {
  const source = new URL(entry.file, dirname);
  const target = new URL('../public/review-lab/question-sets/library/'+entry.file, import.meta.url);
  assert.deepEqual(await fs.readFile(source), await fs.readFile(target));
  const bank = await loadQuestionSet(entry.id);
  assert.equal(bank.questions.length, 20);
  assert.equal(bank.creator, 'Teach Arcade');
  assert.equal(bank.visibility, 'public');
  assert(matchesSetSearch(entry,entry.keywords[0]));
  assert(matchesSetSearch(entry,(entry.primaryGrade==='K'?'grade k':'grade '+entry.primaryGrade)+' '+entry.subject));
  const positions = [0,0,0,0];
  const copy = originalCopy(bank);
  assert.equal(copy.visibility,'private');
  assert.equal(copy.questions.length,20);
  assert(!Object.hasOwn(copy,'owner_id'));
  for (const game of GAMES) {
    assert(setsForGame(game.id).some(set => set.id === bank.id));
    assert.equal(new URL(gameUrl(game.id,bank.id),'https://example.test').searchParams.get('set'),bank.id);
  }
  for (const [i,q] of bank.questions.entries()) {
    const prompt = normalize(q.question);
    assert(!known.has(prompt), 'Duplicate prompt: '+q.question);
    known.add(prompt);
    assert.equal(q.choices.length,4);
    assert.equal(new Set(q.choices.map(c=>c.normalize('NFKC').trim().toLowerCase())).size,4);
    assert(Number.isInteger(q.answer));
    positions[q.answer]++;
    longestPrompt=Math.max(longestPrompt,q.question.length);
    longestChoice=Math.max(longestChoice,...q.choices.map(c=>c.length));
    assert(q.question.length<=360 && q.choices.every(choice=>choice.length<=160),q.question);
    for (const j of [0,1,2,3]) assert.equal(isCorrectAnswer(q,j),j===q.answer);
    assert.deepEqual(copy.questions[i].choices, q.choices);
    if (bank.subject === 'Math') {
      const [rawPrompt,compute] = mathSections.get(bank.topic)[i].split('|');
      assert.equal(rawPrompt.replace(/^[!~]/,''),q.question);
      const [answer,expression]=compute.split('=');
      assert.equal(q.choices[q.answer],answer);
      // Independently evaluate the authored operations in JavaScript. Only numeric
      // literals, arithmetic operators and grouping symbols are admissible.
      assert.match(expression,/^[0-9()+*/.%-]+$/);
      const result=vm.runInNewContext(expression,{}, {timeout:100});
      assert(near(result,value(answer)),q.question);
      assert.equal(q.choices.filter(choice=>near(result,value(choice))).length,1,q.question);
      checked++;
    }
    total++;
  }
  copy.questions[0].choices[0]='Edited copy';
  assert.notEqual(bank.questions[0].choices[0], copy.questions[0].choices[0]);
  assert.deepEqual(positions,[5,5,5,5]);
  for (const seed of [29,71,350]) {
    let state=seed;
    const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
    for (const q of prepareQuestionDeck(bank,random)) {
      const authored=bank.questions.find(original=>original.id===q.id);
      assert.equal(q.choices[q.answer],authored.choices[authored.answer]);
    }
    const clues=categoryClashBoard(bank,random).categories.flatMap(category=>category.questions);
    assert.equal(clues.length,20);
    for (const clue of clues) {
      const authored=bank.questions.find(original=>original.id===clue.sourceId);
      assert.equal(clue.choices[clue.answerIndex],authored.choices[authored.answer]);
    }
  }
}
assert.equal(checked,600);
assert.equal(total,2000);
console.log(`PASS: 100 sets, ${total} unique questions, four choices and five correct answers per position per set, ${checked} JavaScript recomputations, static assets, search, game decks, and independent private-copy payloads. Longest prompt: ${longestPrompt}; longest choice: ${longestChoice}.`);
