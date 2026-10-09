import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {BANK_SETS} from '../public/review-lab/bank-catalog.js';
import {GAMES,setsForGame,loadQuestionSet} from '../public/review-lab/catalog.js';
import {prepareQuestionDeck,categoryClashBoard} from '../public/review-lab/question-decks.js';
const hashes=JSON.parse(await fs.readFile(new URL('../question-bank/source-hashes.json',import.meta.url))),totals={};
for(const metadata of BANK_SETS){
 const bytes=await fs.readFile(new URL('../question-bank/'+metadata.file,import.meta.url));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes['question-bank/'+metadata.file]);
 const served=await fs.readFile(new URL('../public/review-lab/question-sets/library/'+metadata.file,import.meta.url));assert.deepEqual(served,bytes);
 const raw=JSON.parse(bytes),bank=await loadQuestionSet(metadata.id),snapshot=JSON.stringify(bank);
 assert.equal(raw.questions.length,20);assert.equal(bank.questions.length,20);
 for(let seed=0;seed<5;seed++){
  let state=seed+1;const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
  const deck=prepareQuestionDeck(bank,random),board=categoryClashBoard(bank,random);
  assert.equal(deck.length,20);assert.equal(new Set(deck.map(q=>q.id)).size,20);
  for(const q of deck){const original=bank.questions.find(x=>x.id===q.id);assert.equal(q.choices[q.answer],original.choices[original.answer]);}
  const clues=board.categories.flatMap(c=>c.questions);assert.equal(clues.length,20);assert.equal(new Set(clues.map(q=>q.sourceId)).size,20);assert.equal(board.finalEnabled,false);
  for(const q of clues){const original=bank.questions.find(x=>x.id===q.sourceId);assert.equal(q.answer,original.choices[original.answer]);assert.equal(q.choices[q.answerIndex],q.answer);}
 }
 assert.equal(JSON.stringify(bank),snapshot);totals[bank.subject]=(totals[bank.subject]||0)+1;
 for(const game of GAMES)assert(setsForGame(game.id).some(set=>set.id===bank.id));
}
assert.deepEqual(totals,{'Social Studies':75,Science:100,Math:75});
console.log('PASS: 250 source hashes, static copies, 5,000 questions, all-game compatibility, answer remapping across five shuffled decks, immutable sources, and complete Category Clash boards.');
