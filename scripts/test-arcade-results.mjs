// Test-only dependency: jsdom 26 (npm install --no-save --package-lock=false jsdom@26.1.0).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const helper=fs.readFileSync('public/arcade-review-games/shared/arcade-results.js','utf8');
const sleep=()=>new Promise(resolve=>setTimeout(resolve,12));
async function until(check,label){for(let i=0;i<100;i++){if(check())return;await sleep();}assert.fail(label+' timed out');}
function dom(html,route){
  const d=new JSDOM(html,{url:'https://example.test'+route,runScripts:'outside-only',pretendToBeVisual:true});
  const w=d.window;
  w.HTMLElement.prototype.getClientRects=function(){return [{}]};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false};
  w.Blob=Blob;
  const blobs=new Map();let n=0;
  w.URL.createObjectURL=blob=>{const id='blob:result-'+(++n);blobs.set(id,blob);return id};
  w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){if(this.download)w.lastDownload={name:this.download,blob:blobs.get(this.href)}};
  return d;
}
const initial=dom('<!doctype html><html><head></head><body></body></html>','/preview');
initial.window.eval(helper);
const games=JSON.parse(JSON.stringify(initial.window.TAArcadeResults.games));initial.window.close();
const catalog=fs.readFileSync('public/arcade-review-games/index.html','utf8');
const listed=[...new Set([...catalog.matchAll(/class="play" href="([^"]+)"/g)].map(match=>match[1]).filter(route=>route.startsWith('/arcade-review-games/')))];
assert.equal(listed.length,games.length);
for(const route of listed)assert.ok(games.some(game=>game.route===route||game.route===route+'game.html'),'Missing catalog route '+route);
let modes=0,downloads=0,replays=0;
function fixture(w,game,score){
  const doc=w.document,set=(id,content)=>{const node=doc.querySelector(id);assert.ok(node,game.id+' '+id);node.textContent=content};
  w.TA_ARCADE_PERFORMANCE={score,correct:8,answered:10,total:10,accuracy:80,elapsed:180,stability:85,bestStreak:5,missed:2};
  if(game.kind==='platform'){set('#results-score',String(score));set('#results-accuracy','8 / 10');set('#results-time','3:00');}
  if(game.kind==='territory'){
    set('#winnerTitle','Orbit wins!');set('#winnerReason','Finished with 15 points');
    doc.querySelector('#finalScores').innerHTML='<span>Orbit: 12 territories · '+score+' points</span><span>Comet: 12 territories · 12 points</span>';
  }
  if(game.kind==='survey'){
    set('#winnerTitle','Orbit wins!');set('#winnerText','Lightning team score: 250 of 200 — target reached!');
    doc.querySelector('#finalScores').innerHTML='<div>Orbit<strong>'+score+'</strong></div><div>Comet<strong>200</strong></div>';
  }
  if(game.kind==='cold-war'){set('#finishTitle','Stability Too Low');set('#finishText','Stability dropped below 40.');w.TA_ARCADE_PERFORMANCE.stability=25;w.TA_ARCADE_PERFORMANCE.elapsed=score;}
  if(game.kind==='cells'){set('#gameover-summary',`Final score ${score}. Accuracy 80% with 8/10 correct.`);doc.querySelector('#category-summary').innerHTML='<li>Organelles: 8/10 (80%)</li>';doc.querySelector('#missed-list').innerHTML='<li>Mitochondrion: energy release</li>';}
  if(game.kind==='maze'){set('#endTitle','Experiment Interrupted');set('#endText',`Final score: ${score}.`);}
  if(game.kind==='racer')set('#overlayTitle','Time!');
  if(game.kind==='rush'){set('#sum-score',String(score));set('#sum-acc','80%');set('#sum-streak','5');set('#sum-time','3:00');set('#summary-main','Run complete');}
  if(game.kind==='grammar')set('#endSummary',`Score: ${score} points | Accuracy: 16/20 (80%)`);
  if(game.kind==='rifts'){set('#finalScore',String(score));set('#finalQuestions','13');set('#finalTime','180');set('#finalRank','Rift Guardian');}
}
function setMode(w,game,mode){
  const doc=w.document;
  const choose=(selector,label)=>{const select=doc.querySelector(selector);const option=[...select.options].find(option=>option.textContent.includes(label));assert.ok(option,selector+' '+label);select.value=option.value};
  if(game.kind==='platform')w.TA_ACTIVE_GAME={difficulty:mode.toLowerCase()};
  if(game.kind==='territory'){const [kind,level]=mode.split(' · ');doc.querySelector(`[name=mode][value="${kind.toLowerCase()}"]`).checked=true;choose('#difficulty',level);}
  if(game.kind==='survey')doc.querySelector('#reviewMode').checked=mode==='Classroom review';
  if(game.kind==='cells'){const [tier,speed,mis]=mode.split(' · ');choose('#tier-select',tier);choose('#speed-select',speed);doc.querySelector('#misconception-toggle').checked=mis.endsWith('On');}
  if(game.kind==='racer'){const [kind,level]=mode.split(' · ');choose('#modeSelect',kind==='Mixed'?'Mixed':kind);choose('#difficultySelect',level==='Upper Elementary'?'Upper Elem':level);}
}
for(const game of games){
  const file='public'+game.route+(game.route.endsWith('/')?'index.html':'');
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/shared\/arcade-results\.js\?v=2/,file+' must load current results layer');
  for(const mode of game.modes){
    modes++;
    const d=dom(html,game.route),w=d.window,doc=w.document;
    if(game.kind==='adventure'){
      w.eval(helper);
      w.TAArcadeResults.show({game:game.title,outcome:'Adventure complete',mode,metrics:[{label:'Score',value:'1234'}],reportLines:['QUESTION RECORD','Question 1: complete']},()=>{replays++});
    }else{
      const source=doc.querySelector(game.screen);assert.ok(source,file+' must contain native conclusion');
      source.hidden=true;
      const original=game.replay?doc.querySelector(game.replay):null;
      if(game.replay)assert.ok(original,file+' must preserve native replay');
      original?.addEventListener('click',()=>{replays++;source.hidden=true});
      w.eval(helper);
      assert.equal(doc.querySelectorAll('.ta-results-dialog').length,0,'Results must not appear during setup');
      setMode(w,game,mode);fixture(w,game,1234);
      source.hidden=false;source.classList.remove('hidden');source.style.setProperty('display','block','important');source.style.opacity='1';source.setAttribute('aria-hidden','false');
      await until(()=>doc.querySelector('.ta-results-dialog'),'Initial results '+game.id+' '+mode);
    }
    let card=doc.querySelector('.ta-results-dialog .ta-results-card');assert.ok(card,game.id+' '+mode+' should open results');
    assert.deepEqual([...card.querySelectorAll('.ta-results-actions>*')].map(node=>node.textContent),['Download results','Play Again','Return to Arcade']);
    assert.equal(card.querySelector('.ta-results-actions a').getAttribute('href'),'/arcade-review-games/');
    assert.ok(card.querySelectorAll('.ta-results-metric').length>0);
    assert.ok(!/undefined|NaN/.test(card.textContent),game.id+' no invalid performance values');
    assert.ok(card.querySelector('.ta-results-mode').textContent.length>0);
    card.querySelector('.ta-results-download').click();
    const first=await w.lastDownload.blob.text();downloads++;
    assert.ok(first.includes('Mode: '+card.querySelector('.ta-results-mode').textContent));
    if(game.kind==='adventure')assert.ok(first.includes('QUESTION RECORD'));
    card.querySelector('.ta-results-replay').click();await sleep();
    assert.equal(doc.querySelectorAll('.ta-results-dialog').length,0,'Replay closes common results');
    if(game.kind!=='adventure'){
      const source=doc.querySelector(game.screen);fixture(w,game,9876);source.hidden=false;source.classList.remove('hidden');source.style.setProperty('display','block','important');source.style.opacity='1';source.setAttribute('aria-hidden','false');
      await until(()=>doc.querySelector('.ta-results-dialog'),'Second results '+game.id+' '+mode);
      card=doc.querySelector('.ta-results-dialog .ta-results-card');
      card.querySelector('.ta-results-download').click();const second=await w.lastDownload.blob.text();downloads++;
      assert.ok(second.includes('9876'),game.id+' second download must use new performance');
      assert.ok(!second.includes('1234'),game.id+' old score must not persist');
    }
    d.window.close();
  }
}
assert.equal(modes,80);
const topDown=fs.readFileSync('public/arcade-review-games/shared/top-down/game.js','utf8');
assert.match(topDown,/TAArcadeResults\.show/);assert.match(topDown,/snapshot\.questions\.flatMap/);
const cold=fs.readFileSync('public/arcade-review-games/social-studies/cold-war-shadow-run/game.js','utf8');
assert.match(cold,/answered \+= 1/);assert.match(cold,/answered = 0/);
console.log(`Arcade results passed: ${games.length} catalog games, ${modes} game/mode combinations, ${downloads} downloads, ${replays} native replay callbacks; fresh results verified after replay.`);
