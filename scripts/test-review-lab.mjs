import assert from 'node:assert/strict';
import {GAMES,QUESTION_SETS,gamesForSet,setsForGame,gameUrl,loadQuestionSet} from '../public/review-lab/catalog.js';
import {CrossingWorld} from '../public/arcade-review-games/crossing-quest/engine.js';
import {buildContentIndex} from '../lib/contentIndex.js';
for(const set of QUESTION_SETS){
 const bank=await loadQuestionSet(set.id);
 assert.equal(bank.questions.length,set.questionCount);
 for(const game of gamesForSet(set.id)){
  assert(setsForGame(game.id).some(s=>s.id===set.id));
  const url=new URL(gameUrl(game.id,set.id),'https://teacharcade.com');assert.equal(url.searchParams.get('set'),set.id);
  const w=new CrossingWorld(bank);assert.equal(w.deck.length,game.questionCount);assert.equal(new Set(w.deck.map(q=>q.id)).size,game.questionCount);
 }
}
assert.equal(GAMES.length,3);assert.equal(QUESTION_SETS.length,1);
assert.throws(()=>gameUrl('acorn-dash','unapproved-topic'));assert.throws(()=>gameUrl('missing-game'));assert.equal(gameUrl('category-clash'),'/review-lab/category-clash/');assert.throws(()=>gameUrl('category-clash','scientific-method'));
await assert.rejects(loadQuestionSet('unapproved-topic'));
const index=await buildContentIndex();assert.equal(index.filter(item=>item.canonicalUrl==='/review-lab/acorn-dash/').length,1);
assert(!index.some(item=>item.canonicalUrl==='/arcade-review-games/crossing-quest/'));
assert.equal(index.filter(item=>item.canonicalUrl==='/review-lab/category-clash/').length,1);
assert.equal(index.filter(item=>item.canonicalUrl==='/review-lab/category-clash/french-revolution/').length,1);
assert(!index.some(item=>item.canonicalUrl.startsWith('/arcade-review-games/category-clash/')));
console.log('PASS: shared approved catalog, topic/game compatibility, deep links, randomized 12-question game decks, and one canonical search entry.');

assert.equal(gameUrl('review-pinball'),'/review-lab/review-pinball/');
assert.equal(index.filter(item=>item.canonicalUrl==='/review-lab/review-pinball/').length,1);
assert(!index.some(item=>item.canonicalUrl.startsWith('/arcade-review-games/review-pinball/')));
