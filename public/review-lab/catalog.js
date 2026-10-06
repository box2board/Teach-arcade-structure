import {validateQuestionBank} from './question-banks.js';

// Register approved topics here once; games declare the packs they support.
const packs=[{
  id:'scientific-method',title:'Scientific Method',subject:'Science',
  description:'Variables, experiments, evidence, and scientific reasoning.',
  questionCount:24,load:()=>import('./question-sets/scientific-method.js')
}];
export const QUESTION_SETS=Object.freeze(packs.map(({load,...metadata})=>Object.freeze(metadata)));
export const GAMES=Object.freeze([Object.freeze({
  id:'acorn-dash',title:'Acorn Dash',url:'/review-lab/acorn-dash/',
  description:'Guide a squirrel through three parks. Gather acorns, review at safe stops, and bring your pouch home.',
  image:'/review-lab/acorn-dash-preview.webp',imageAlt:'Acorn Dash’s woodland park with bicycle paths, sprinklers, and a squirrel at home.',
  mode:'Solo',questionCount:12,levels:3,questionSetIds:Object.freeze(['scientific-method'])
}),Object.freeze({
  id:'category-clash',title:'Category Clash',url:'/review-lab/category-clash/',
  description:'Pick questions from a category board. Play with classroom teams or review independently, using the French Revolution edition or your own custom board.',
  image:'/review-lab/category-clash-preview.webp',imageAlt:'Category Clash’s French Revolution board with five categories and five rows of point-value tiles.',
  mode:'Classroom + Individual',facts:Object.freeze(['Classroom teams','Individual review','Custom boards']),
  topicLabel:'French Revolution edition + custom boards',launchLabel:'Open Category Clash',questionSetIds:Object.freeze([])
})]);
export function gamesForSet(id){return GAMES.filter(game=>game.questionSetIds.includes(id));}
export function setsForGame(id){const game=GAMES.find(game=>game.id===id);return QUESTION_SETS.filter(set=>game?.questionSetIds.includes(set.id));}
export function gameUrl(gameId,setId){
  const game=GAMES.find(game=>game.id===gameId);if(!game)throw new Error('Game unavailable.');
  if(setId&&!game.questionSetIds.includes(setId))throw new Error('This topic is not available for that game.');
  return game.url+(setId?`?set=${encodeURIComponent(setId)}`:'');
}
export async function loadQuestionSet(id){
  const pack=packs.find(set=>set.id===id);if(!pack)throw new Error('That question set is not available.');
  const {default:bank}=await pack.load();validateQuestionBank(bank);
  if(bank.id!==id||bank.questions.length!==pack.questionCount)throw new Error('The question set does not match its catalog entry.');
  return bank;
}
