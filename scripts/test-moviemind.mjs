import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {PUZZLES,getPuzzles} from '../public/brain-arcade/moviemind/puzzles.js';
import * as engine from '../public/brain-arcade/moviemind/engine.js';
const {validateLibrary,normalizeAnswer,isCorrect,createRun,revealClue,submitGuess,selectSession}=engine;
assert.equal((await getPuzzles()).length,500);
validateLibrary(PUZZLES);
const owners=new Map(),allClues=new Set();
for(const p of PUZZLES){
 for(const a of [p.answer,...p.acceptedAnswers]){
  const n=normalizeAnswer(a);
  assert(!owners.has(n)||owners.get(n)===p.id,'Alias collision: '+a);
  owners.set(n,p.id);assert(isCorrect(p,a));
 }
 for(let i=0;i<5;i++){
  assert(!allClues.has(p.clues[i]),'Repeated clue: '+p.answer);allClues.add(p.clues[i]);
  if(i<4)assert(!(' '+normalizeAnswer(p.clues[i])+' ').includes(' '+normalizeAnswer(p.answer)+' '),'Title leak: '+p.answer);
  const r=createRun([p,...PUZZLES.filter(x=>x.id!==p.id).slice(0,4)]);
  for(let j=0;j<i;j++)revealClue(r);
  assert.equal(submitGuess(r,p.answer),'correct');assert.equal(r.results[0].points,5-i);
 }
 const r=createRun([p,...PUZZLES.filter(x=>x.id!==p.id).slice(0,4)]);
 assert.equal(submitGuess(r,''),'ignored');
 for(let i=0;i<5;i++)assert.equal(submitGuess(r,'not a film'),i===4?'exhausted':'incorrect');
 assert.equal(r.results[0].points,0);
}
assert.equal(allClues.size,2500);
let history=[];
for(let cycle=0;cycle<3;cycle++){
 const played=new Set();
 for(let i=0;i<100;i++){
  const picked=selectSession(PUZZLES,history);assert.equal(picked.length,5);
  for(const p of picked){assert(!played.has(p.id));played.add(p.id);}
  const ids=new Set(picked.map(p=>p.id));
  history=[...history.filter(id=>!ids.has(id)),...ids].slice(-500);
 }
 assert.equal(played.size,500);
}
// Run the shipping UI with its real rules and a minimal DOM adapter.
const nodes=new Map(),storage=new Map();let downloaded='';
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',handlers:{},addEventListener(e,h){this.handlers[e]=h},setAttribute(){},focus(){},scrollIntoView(){}});return nodes.get(id);}
let ui=(await readFile(new URL('../public/brain-arcade/moviemind/game.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('validateLibrary(await getPuzzles())','validateLibrary(PUZZLES)');
const runChecks=`
assert($('surface').innerHTML.includes('500 films to discover'));
$('start').onclick();
for(let i=0;i<5;i++){
 $('guess').value=run.puzzles[run.index].answer;
 if(i===1)$('guess').handlers.keydown({key:'Enter',preventDefault(){}});
 else $('check-guess').handlers.click();
 assert.equal(run.results[i].solved,true);$('next').onclick();
}
assert.equal(run.phase,'complete');assert.equal(summarize(run).score,25);
assert($('surface').innerHTML.includes('Download results'));
$('download').onclick();
$('again').onclick();assert.equal(run.phase,'playing');
`;
runInNewContext(ui+runChecks,{...engine,PUZZLES,assert,console,document:{getElementById:node,createElement(){return {click(){}}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:cb=>cb(),Blob,URL:{createObjectURL(blob){downloaded=blob;return 'blob:results'},revokeObjectURL(){}},setTimeout:cb=>cb()});
assert((await downloaded.text()).includes('25 / 25 points'));
const hub=await readFile(new URL('../public/brain-arcade/index.html',import.meta.url),'utf8');
assert(hub.includes('href="/brain-arcade/moviemind/"'));
const page=await readFile(new URL('../public/brain-arcade/moviemind/index.html',import.meta.url),'utf8');
assert(page.includes('500 films to discover'));assert(page.includes('type="module" src="./game.js"'));
console.log('MovieMind passed: 500 films, 2500 clues, aliases, all score levels, exhaustion, three rotations, button/Enter submission, full run, download, replay and hub integration.');
