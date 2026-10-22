import {BANK_SETS} from './bank-catalog.js';
import {validateQuestionBank} from './question-banks.js';
import {teacherBank,teacherSetId} from '../teacher/set-contract.js';

// Shared banks are available automatically to games declaring supportsQuestionBank.
const packs=[{
  id:'scientific-method',title:'Scientific Method',subject:'Science',
  description:'Variables, experiments, evidence, and scientific reasoning.',
  questionCount:24,load:()=>import('./question-sets/scientific-method.js')
},{
  id:'constitution-basics',title:'U.S. Constitution Basics',subject:'Social Studies',
  description:'Branches, checks and balances, federalism, and constitutional rights.',
  questionCount:20,load:()=>import('./question-sets/constitution-basics.js')
},{
  id:'linear-equations',title:'One-Variable Linear Equations',subject:'Math',
  description:'Inverse operations, two-step equations, and solutions on both sides.',
  questionCount:20,load:()=>import('./question-sets/linear-equations.js')
}];
packs.push(...BANK_SETS.map(set=>({...set,load:()=>loadPortableSet(set)})));
async function loadPortableSet(set){
 const url=new URL('./question-sets/library/'+set.file,import.meta.url);
 let raw;
 if(url.protocol==='file:'){const fs=await import('node:fs/promises');raw=JSON.parse(await fs.readFile(url,'utf8'));}
 else {const response=await fetch(url);if(!response.ok)throw new Error('Question bank could not load.');raw=await response.json();}
 if(raw.id!==set.id||raw.subject!==set.subject||raw.questionCount!==set.questionCount)throw new Error('Question bank metadata mismatch.');
 return {default:{...raw,questions:raw.questions.map(q=>({...q,id:`${raw.id}--${q.id}`,answer:q.correctAnswer,explanation:q.explanation||''}))}};
}
// Resolve only the explicitly requested teacher set, never enumerate private sets.
// An unavailable teacher set stays selected with a load error; it never switches topics silently.
if(typeof window!=='undefined'&&typeof location!=='undefined'){
 const requested=new URLSearchParams(location.search).get('set');
 if(requested?.startsWith('teacher:')){
  const id=requested.slice(8);
  const load=async()=>{
   if(!teacherSetId(id))throw Error('Invalid teacher-set link. Return to My Question Sets.');
   const response=await fetch('/api/teacher-sets?action=detail&id='+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Teacher set unavailable. Return to your Cabinet and sign in if this set is private.');
   return {default:teacherBank(data.set)};
  };
  try{const {default:bank}=await load();packs.push({id:requested,title:bank.title,subject:bank.subject,category:'Teacher-created',questionCount:bank.questions.length,load});}
  catch(error){packs.push({id:requested,title:'Teacher set unavailable · Return to My Question Sets',subject:'Teacher-created',category:'Teacher-created',questionCount:0,load:async()=>{throw error;}});}
 }
}
export const QUESTION_SETS=Object.freeze(packs.map(({load,...metadata})=>Object.freeze(metadata)));
export const GAMES=Object.freeze([Object.freeze({
  id:'raceway-rivals',title:'Raceway Rivals',url:'/review-lab/raceway-rivals/',
  description:'Race three rivals through Canyon Circuit. Steer through bends, collect boosts, and recharge at checkpoints with your chosen review topic.',
  image:'/review-lab/raceway-rivals/canyon-v2.png',imageAlt:'Canyon Circuit desert landscape with red rock cliffs and a winding canyon.',
  mode:'Solo',facts:Object.freeze(['Race against 3 rivals','8, 12 or 16 questions','Repeat topics across laps']),
  supportsQuestionBank:true,questionSetIds:Object.freeze([])
}),Object.freeze({
  id:'acorn-dash',title:'Acorn Dash',url:'/review-lab/acorn-dash/',
  description:'Guide a squirrel through three parks. Gather acorns, review at safe stops, and bring your pouch home.',
  image:'/review-lab/acorn-dash-preview.webp',imageAlt:'Acorn Dash’s woodland park with bicycle paths, sprinklers, and a squirrel at home.',
  mode:'Solo',questionCount:12,levels:3,supportsQuestionBank:true,questionSetIds:Object.freeze(['scientific-method'])
}),Object.freeze({
  id:'category-clash',title:'Category Clash',url:'/review-lab/category-clash/',
  description:'Pick questions from a category board. Play with classroom teams or review independently, using any shared review topic or your own custom board.',
  image:'/review-lab/category-clash-preview.webp',imageAlt:'Category Clash’s French Revolution board with five categories and five rows of point-value tiles.',
  mode:'Classroom + Individual',facts:Object.freeze(['Classroom teams','Individual review','Custom boards']),
  topicLabel:'French Revolution edition + custom boards',launchLabel:'Open Category Clash',supportsQuestionBank:true,questionSetIds:Object.freeze([])
}),Object.freeze({
  id:'review-pinball',title:'Review Pinball',url:'/review-lab/review-pinball/',
  description:'Choose Neon Circuit, Pirate’s Cove, or Cosmic Launch. Work the flippers, chase bonuses, and answer review questions to earn your next ball.',
  image:'/review-lab/review-pinball-preview.webp',imageAlt:'Neon Circuit pinball table with glowing bumpers, a raised ramp, and two flippers.',
  mode:'Solo',facts:Object.freeze(['3 themed tables','Classic + Assisted modes','Manual plunger']),
  topicLabel:'Scientific Method + French Revolution',launchLabel:'Choose a table & play',supportsQuestionBank:true,questionSetIds:Object.freeze([])
}),Object.freeze({
  id:'power-clash',title:'Power Clash',url:'/review-lab/power-clash/',
  description:'Build juice with questions, then battle a computer opponent or challenge a second player on the same keyboard.',
  image:'/review-lab/power-clash-preview.svg',imageAlt:'Two original training-bot fighters face off in the Power Clash arena.',
  mode:'Solo + Local 2-player',facts:Object.freeze(['Choose any shared topic','One-player vs. CPU','Two players on one keyboard']),
  supportsQuestionBank:true,questionSetIds:Object.freeze([])
}),Object.freeze({
  id:'slime-slinger',title:'Slime Slinger',url:'/review-lab/slime-slinger/',
  description:'Answer review questions to load slime, then aim across three depths and splat moving targets before the clock runs out.',
  image:'/review-lab/slime-slinger-preview.svg',imageAlt:'Slime Slinger arcade arena with green slime, a crosshair, and targets at three depths.',
  mode:'Solo',facts:Object.freeze(['Questions earn slime','3 target depths','2, 3 or 5 minute rounds']),
  topicLabel:'Choose any shared review topic',launchLabel:'Load up & play',supportsQuestionBank:true,questionSetIds:Object.freeze([])
}),Object.freeze({
  id:'snow-day-defenders',title:'Snow Day Defenders',url:'/review-lab/snow-day-defenders/',
  description:'Answer review questions to earn snow gear, recruit helpers, and protect your fort.',
  image:'/review-lab/snow-day-defenders-preview.svg',imageAlt:'Illustration of a snow fort, two scarf-wearing helpers, and playful snow creatures.',
  mode:'Solo',facts:Object.freeze(['3 waves','Automatic snowball tossing','Pause to study & upgrade']),
  supportsQuestionBank:true,questionSetIds:Object.freeze(['scientific-method','constitution-basics','linear-equations'])
}),Object.freeze({id:'treasure-trail',title:'Treasure Trail',url:'/review-lab/treasure-trail/',description:'Explore a woodland, earn juice at question chests, and dig for rare jewels before time runs out.',image:'/review-lab/treasure-trail/preview.png',imageAlt:'Treasure Trail woodland clearing with scattered earth patches and treasure chests.',mode:'Solo',facts:Object.freeze(['2–10 minute sessions','Regenerating treasure','All review topics']),supportsQuestionBank:true,questionSetIds:Object.freeze([])})]);
export function gamesForSet(id){return GAMES.filter(game=>QUESTION_SETS.some(set=>set.id===id)&&(game.supportsQuestionBank||game.questionSetIds.includes(id)));}
export function setsForGame(id){const game=GAMES.find(game=>game.id===id);return QUESTION_SETS.filter(set=>game&&(game.supportsQuestionBank||game.questionSetIds.includes(set.id)));}
export function gameUrl(gameId,setId){
  const game=GAMES.find(game=>game.id===gameId);if(!game)throw new Error('Game unavailable.');
  if(setId&&!setsForGame(gameId).some(set=>set.id===setId))throw new Error('This topic is not available for that game.');
  return game.url+(setId?`?set=${encodeURIComponent(setId)}`:'');
}
export async function loadQuestionSet(id){
  const pack=packs.find(set=>set.id===id);if(!pack)throw new Error('That question set is not available.');
  const {default:bank}=await pack.load();validateQuestionBank(bank);
  if(bank.id!==id||bank.questions.length!==pack.questionCount)throw new Error('The question set does not match its catalog entry.');
  return bank;
}

